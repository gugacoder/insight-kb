const { ErrorFactory } = require('../errors/RageError');
const { rageLogger } = require('../logging/logger');
const { metricsCollector } = require('../logging/metrics');

/**
 * Retry Manager Implementation
 * 
 * Provides intelligent retry logic with exponential backoff,
 * jitter, and error-specific retry strategies.
 */
class RetryManager {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 10000; // 10 seconds
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.jitterMax = options.jitterMax || 0.1; // 10% jitter
    this.retryableErrors = options.retryableErrors || [
      'network_error',
      'timeout_error', 
      'rate_limit',
      'server_error'
    ];
    
    rageLogger.info('Retry Manager initialized', {
      maxAttempts: this.maxAttempts,
      baseDelay: this.baseDelay,
      maxDelay: this.maxDelay
    });
  }

  /**
   * Executes a function with retry logic
   * @param {Function} fn - Function to execute
   * @param {Object} context - Execution context
   * @param {Array} args - Function arguments
   * @returns {Promise} Function result
   */
  async execute(fn, context = {}, ...args) {
    const correlationId = context.correlationId || 'unknown';
    let lastError = null;
    let attempt = 0;

    rageLogger.debug('Starting retry execution', {
      maxAttempts: this.maxAttempts,
      operation: context.operation || 'unknown'
    }, correlationId);

    while (attempt < this.maxAttempts) {
      attempt++;
      const startTime = Date.now();

      try {
        rageLogger.debug('Retry attempt started', {
          attempt,
          maxAttempts: this.maxAttempts,
          operation: context.operation
        }, correlationId);

        const result = await fn(...args);
        
        const duration = Date.now() - startTime;
        
        if (attempt > 1) {
          rageLogger.info('Retry succeeded', {
            attempt,
            duration,
            operation: context.operation
          }, correlationId);
          
          metricsCollector.recordOperation('retry_success', duration, 'success', {
            attempts: attempt,
            operation: context.operation
          });
        }

        return result;

      } catch (error) {
        const duration = Date.now() - startTime;
        lastError = ErrorFactory.create(error, null, { correlationId, attempt });
        
        rageLogger.warn('Retry attempt failed', {
          attempt,
          maxAttempts: this.maxAttempts,
          error: lastError.message,
          errorType: lastError.type,
          retryable: lastError.retryable,
          duration
        }, correlationId);

        // Check if error is retryable
        if (!this.shouldRetry(lastError, attempt)) {
          rageLogger.info('Error not retryable, stopping retry attempts', {
            errorType: lastError.type,
            attempt,
            operation: context.operation
          }, correlationId);
          
          metricsCollector.recordOperation('retry_abort', duration, 'error', {
            attempts: attempt,
            errorType: lastError.type,
            operation: context.operation
          });
          
          throw lastError;
        }

        // If this was the last attempt, throw the error
        if (attempt >= this.maxAttempts) {
          rageLogger.error('All retry attempts exhausted', {
            totalAttempts: attempt,
            operation: context.operation,
            finalError: lastError.message
          }, correlationId);
          
          metricsCollector.recordOperation('retry_exhausted', duration, 'error', {
            attempts: attempt,
            errorType: lastError.type,
            operation: context.operation
          });
          
          throw lastError;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, lastError);
        
        rageLogger.debug('Waiting before next retry attempt', {
          attempt,
          delay,
          nextAttempt: attempt + 1
        }, correlationId);

        await this.sleep(delay);
      }
    }

    // This should never be reached, but just in case
    throw lastError;
  }

  /**
   * Determines if an error should be retried
   * @param {Error} error - The error that occurred
   * @param {number} attempt - Current attempt number
   * @returns {boolean} Whether to retry
   */
  shouldRetry(error, attempt) {
    // Don't retry if we've reached max attempts
    if (attempt >= this.maxAttempts) {
      return false;
    }

    // Check if error type is retryable
    if (!error.retryable && !this.retryableErrors.includes(error.type)) {
      return false;
    }

    // Special handling for specific error types
    switch (error.type) {
      case 'rate_limit':
        // Always retry rate limit errors (with backoff)
        return true;
        
      case 'timeout_error':
        // Retry timeouts, but be more conservative
        return attempt <= Math.floor(this.maxAttempts / 2);
        
      case 'auth_error':
        // Don't retry authentication errors
        return false;
        
      case 'validation_error':
        // Don't retry validation errors
        return false;
        
      case 'configuration_error':
        // Don't retry configuration errors
        return false;
        
      case 'circuit_breaker':
        // Don't retry circuit breaker errors
        return false;
        
      case 'network_error':
        // Retry network errors
        return true;
        
      case 'server_error':
        // Retry 5xx server errors
        return true;
        
      default:
        // For unknown errors, be conservative
        return attempt <= 1;
    }
  }

  /**
   * Calculates delay before next retry attempt
   * @param {number} attempt - Current attempt number
   * @param {Error} error - The error that occurred
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(attempt, error) {
    let delay;

    // Special handling for rate limit errors
    if (error.type === 'rate_limit' && error.retryAfter) {
      delay = error.retryAfter * 1000; // Convert to milliseconds
    } else {
      // Exponential backoff with jitter
      delay = Math.min(
        this.baseDelay * Math.pow(this.backoffMultiplier, attempt - 1),
        this.maxDelay
      );
    }

    // Add jitter to prevent thundering herd
    const jitter = delay * this.jitterMax * Math.random();
    delay += jitter;

    return Math.floor(delay);
  }

  /**
   * Sleep utility for delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Executes a function with retry and circuit breaker
   * @param {Function} fn - Function to execute
   * @param {Object} circuitBreaker - Circuit breaker instance
   * @param {Object} context - Execution context
   * @param {Array} args - Function arguments
   * @returns {Promise} Function result
   */
  async executeWithCircuitBreaker(fn, circuitBreaker, context = {}, ...args) {
    return this.execute(
      async (...executeArgs) => {
        return circuitBreaker.execute(fn, ...executeArgs);
      },
      context,
      ...args
    );
  }

  /**
   * Creates a retryable wrapper for a function
   * @param {Function} fn - Function to wrap
   * @param {Object} options - Retry options
   * @returns {Function} Wrapped function
   */
  wrap(fn, options = {}) {
    const retryOptions = { ...this, ...options };
    const retryManager = new RetryManager(retryOptions);
    
    return async (...args) => {
      return retryManager.execute(fn, {}, ...args);
    };
  }

  /**
   * Gets retry manager statistics
   * @returns {Object} Retry statistics
   */
  getStats() {
    return {
      maxAttempts: this.maxAttempts,
      baseDelay: this.baseDelay,
      maxDelay: this.maxDelay,
      backoffMultiplier: this.backoffMultiplier,
      jitterMax: this.jitterMax,
      retryableErrors: this.retryableErrors
    };
  }

  /**
   * Updates retry configuration
   * @param {Object} options - New configuration options
   */
  updateConfig(options) {
    Object.assign(this, options);
    
    rageLogger.info('Retry Manager configuration updated', {
      maxAttempts: this.maxAttempts,
      baseDelay: this.baseDelay,
      maxDelay: this.maxDelay
    });
  }

  /**
   * Creates a retry manager with predefined strategies
   * @param {string} strategy - Strategy name
   * @returns {RetryManager} Configured retry manager
   */
  static createStrategy(strategy) {
    const strategies = {
      // Conservative strategy for critical operations
      conservative: {
        maxAttempts: 2,
        baseDelay: 2000,
        maxDelay: 5000,
        backoffMultiplier: 1.5,
        jitterMax: 0.05
      },
      
      // Standard strategy for normal operations
      standard: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitterMax: 0.1
      },
      
      // Aggressive strategy for non-critical operations
      aggressive: {
        maxAttempts: 5,
        baseDelay: 500,
        maxDelay: 15000,
        backoffMultiplier: 2.5,
        jitterMax: 0.2
      },
      
      // Fast strategy for quick operations
      fast: {
        maxAttempts: 2,
        baseDelay: 200,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitterMax: 0.1
      }
    };

    const config = strategies[strategy] || strategies.standard;
    return new RetryManager(config);
  }
}

module.exports = {
  RetryManager
};