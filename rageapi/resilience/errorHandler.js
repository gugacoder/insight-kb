const { ErrorFactory } = require('../errors/RageError');
const { CircuitBreaker } = require('./circuitBreaker');
const { RetryManager } = require('./retryManager');
const { TimeoutManager } = require('./timeoutManager');
const { rageLogger } = require('../logging/logger');
const { metricsCollector } = require('../logging/metrics');
const { configManager } = require('../config');

/**
 * Central Error Handler
 * 
 * Coordinates all resilience mechanisms including circuit breakers,
 * retry logic, timeouts, and fallback strategies.
 */
class ErrorHandler {
  constructor(options = {}) {
    const config = configManager.getConfig();
    
    this.timeoutManager = new TimeoutManager({
      defaultTimeout: config.RAGE_TIMEOUT_MS || 5000,
      maxTimeout: 30000,
      minTimeout: 100
    });
    
    this.retryManager = new RetryManager({
      maxAttempts: config.RAGE_RETRY_ATTEMPTS || 2,
      baseDelay: config.RAGE_RETRY_DELAY_MS || 1000,
      maxDelay: 10000
    });
    
    this.circuitBreaker = new CircuitBreaker({
      name: 'rage_vectorize',
      failureThreshold: 5,
      resetTimeout: 60000,
      minimumRequests: 10
    });
    
    this.fallbackEnabled = config.RAGE_ENABLE_FALLBACK !== false;
    this.gracefulDegradation = true;
    
    rageLogger.info('Error Handler initialized', {
      fallbackEnabled: this.fallbackEnabled,
      gracefulDegradation: this.gracefulDegradation,
      timeout: config.RAGE_TIMEOUT_MS,
      retryAttempts: config.RAGE_RETRY_ATTEMPTS
    });
  }

  /**
   * Executes an operation with full resilience protection
   * @param {Function} operation - Operation to execute
   * @param {Object} context - Execution context
   * @returns {Promise} Operation result or fallback
   */
  async executeWithResilience(operation, context = {}) {
    const correlationId = context.correlationId || rageLogger.generateCorrelationId();
    const operationName = context.operation || 'unknown';
    
    rageLogger.debug('Starting resilient execution', {
      operation: operationName,
      fallbackEnabled: this.fallbackEnabled
    }, correlationId);

    try {
      // Execute with timeout, retry, and circuit breaker protection
      const result = await this.timeoutManager.execute(
        this.retryManager.executeWithCircuitBreaker(
          operation,
          this.circuitBreaker,
          { ...context, correlationId },
          context
        ),
        context.timeout,
        { ...context, correlationId, operation: operationName }
      );

      rageLogger.debug('Resilient execution succeeded', {
        operation: operationName
      }, correlationId);

      return result;

    } catch (error) {
      return this.handleOperationFailure(error, context, correlationId);
    }
  }

  /**
   * Handles operation failures with fallback strategies
   * @param {Error} error - The error that occurred
   * @param {Object} context - Execution context
   * @param {string} correlationId - Request correlation ID
   * @returns {any} Fallback result or null
   */
  async handleOperationFailure(error, context, correlationId) {
    const rageError = ErrorFactory.create(error, null, { correlationId });
    const operationName = context.operation || 'unknown';

    rageLogger.error('Operation failed after all resilience attempts', {
      operation: operationName,
      errorType: rageError.type,
      error: rageError.message,
      retryable: rageError.retryable
    }, correlationId);

    // Record failure metrics
    metricsCollector.recordError(rageError.type, operationName, {
      message: rageError.message,
      correlationId
    });

    // Apply fallback strategy
    if (this.fallbackEnabled) {
      const fallbackResult = await this.executeFallback(rageError, context, correlationId);
      if (fallbackResult !== undefined) {
        return fallbackResult;
      }
    }

    // Graceful degradation - return null for RAGE operations
    if (this.gracefulDegradation && this.isRageOperation(operationName)) {
      rageLogger.info('Applying graceful degradation for RAGE operation', {
        operation: operationName,
        errorType: rageError.type
      }, correlationId);
      
      return null;
    }

    // For non-RAGE operations or when degradation is disabled, throw the error
    throw rageError;
  }

  /**
   * Executes fallback strategies based on error type
   * @param {Error} error - The error that occurred
   * @param {Object} context - Execution context
   * @param {string} correlationId - Request correlation ID
   * @returns {any} Fallback result or undefined
   */
  async executeFallback(error, context, correlationId) {
    const operationName = context.operation || 'unknown';
    
    rageLogger.debug('Attempting fallback strategy', {
      operation: operationName,
      errorType: error.type
    }, correlationId);

    try {
      switch (error.type) {
        case 'timeout_error':
          return this.handleTimeoutFallback(error, context, correlationId);
          
        case 'network_error':
          return this.handleNetworkFallback(error, context, correlationId);
          
        case 'rate_limit':
          return this.handleRateLimitFallback(error, context, correlationId);
          
        case 'server_error':
          return this.handleServerErrorFallback(error, context, correlationId);
          
        case 'circuit_breaker':
          return this.handleCircuitBreakerFallback(error, context, correlationId);
          
        default:
          return this.handleGenericFallback(error, context, correlationId);
      }
    } catch (fallbackError) {
      rageLogger.warn('Fallback strategy failed', {
        operation: operationName,
        originalError: error.type,
        fallbackError: fallbackError.message
      }, correlationId);
      
      return undefined;
    }
  }

  /**
   * Handles timeout fallbacks
   */
  async handleTimeoutFallback(error, context, correlationId) {
    rageLogger.debug('Applying timeout fallback', {}, correlationId);
    
    // For context enrichment, return cached result if available
    if (context.operation === 'enrichMessage' && context.cache) {
      const cached = await context.cache.get(context.cacheKey);
      if (cached) {
        rageLogger.info('Using cached context for timeout fallback', {}, correlationId);
        return cached;
      }
    }
    
    return null; // Graceful degradation
  }

  /**
   * Handles network error fallbacks
   */
  async handleNetworkFallback(error, context, correlationId) {
    rageLogger.debug('Applying network error fallback', {}, correlationId);
    
    // Could implement offline mode or cached responses
    return null; // Graceful degradation
  }

  /**
   * Handles rate limit fallbacks
   */
  async handleRateLimitFallback(error, context, correlationId) {
    rageLogger.debug('Applying rate limit fallback', {
      retryAfter: error.retryAfter
    }, correlationId);
    
    // For rate limits, we could implement queuing or return cached data
    return null; // Graceful degradation
  }

  /**
   * Handles server error fallbacks
   */
  async handleServerErrorFallback(error, context, correlationId) {
    rageLogger.debug('Applying server error fallback', {
      statusCode: error.statusCode
    }, correlationId);
    
    return null; // Graceful degradation
  }

  /**
   * Handles circuit breaker fallbacks
   */
  async handleCircuitBreakerFallback(error, context, correlationId) {
    rageLogger.debug('Applying circuit breaker fallback', {}, correlationId);
    
    // Circuit breaker is open, service is likely down
    return null; // Graceful degradation
  }

  /**
   * Handles generic fallbacks
   */
  async handleGenericFallback(error, context, correlationId) {
    rageLogger.debug('Applying generic fallback', {
      errorType: error.type
    }, correlationId);
    
    return null; // Graceful degradation
  }

  /**
   * Determines if an operation is a RAGE operation
   * @param {string} operationName - Operation name
   * @returns {boolean} Whether it's a RAGE operation
   */
  isRageOperation(operationName) {
    const rageOperations = [
      'enrichMessage',
      'retrieveDocuments',
      'formatContext',
      'vectorizeApi',
      'contextEnrichment'
    ];
    
    return rageOperations.some(op => operationName.includes(op));
  }

  /**
   * Gets comprehensive health status
   * @returns {Object} Health status of all resilience components
   */
  getHealthStatus() {
    return {
      timestamp: new Date().toISOString(),
      overall: this.getOverallHealth(),
      components: {
        circuitBreaker: this.circuitBreaker.getStats(),
        retryManager: this.retryManager.getStats(),
        timeoutManager: this.timeoutManager.getHealthMetrics()
      },
      configuration: {
        fallbackEnabled: this.fallbackEnabled,
        gracefulDegradation: this.gracefulDegradation
      }
    };
  }

  /**
   * Determines overall health status
   * @returns {string} Health status
   */
  getOverallHealth() {
    const circuitStats = this.circuitBreaker.getStats();
    const timeoutHealth = this.timeoutManager.getHealthMetrics();
    
    if (!circuitStats.isHealthy) {
      return 'unhealthy';
    }
    
    if (!timeoutHealth.isHealthy) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Resets all resilience components
   */
  reset() {
    this.circuitBreaker.reset();
    this.timeoutManager.cancelAllTimeouts('Reset requested');
    
    rageLogger.info('Error Handler reset completed');
  }

  /**
   * Cleanup method for shutdown
   */
  cleanup() {
    this.timeoutManager.cleanup();
    
    rageLogger.info('Error Handler cleanup completed');
  }

  /**
   * Updates error handler configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    if (config.timeout) {
      this.timeoutManager.updateConfig({ defaultTimeout: config.timeout });
    }
    
    if (config.retryAttempts !== undefined) {
      this.retryManager.updateConfig({ maxAttempts: config.retryAttempts });
    }
    
    if (config.fallbackEnabled !== undefined) {
      this.fallbackEnabled = config.fallbackEnabled;
    }
    
    if (config.gracefulDegradation !== undefined) {
      this.gracefulDegradation = config.gracefulDegradation;
    }
    
    rageLogger.info('Error Handler configuration updated', {
      fallbackEnabled: this.fallbackEnabled,
      gracefulDegradation: this.gracefulDegradation
    });
  }
}

// Export class and factory function
module.exports = {
  ErrorHandler,
  createErrorHandler: () => new ErrorHandler()
};