const { CircuitBreakerError } = require('../errors/RageError');
const { rageLogger } = require('../logging/logger');
const { metricsCollector } = require('../logging/metrics');

/**
 * Circuit Breaker Implementation
 * 
 * Implements the circuit breaker pattern to prevent cascading failures
 * and provide fast failure when downstream services are unavailable.
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringWindow = options.monitoringWindow || 300000; // 5 minutes
    this.minimumRequests = options.minimumRequests || 10;
    
    // Circuit states
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.recentRequests = [];
    
    // Metrics
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    
    rageLogger.info('Circuit breaker initialized', {
      name: this.name,
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout
    });
  }

  /**
   * Executes a function with circuit breaker protection
   * @param {Function} fn - Function to execute
   * @param {Array} args - Arguments for the function
   * @returns {Promise} Function result or circuit breaker error
   */
  async execute(fn, ...args) {
    const canExecute = this.canExecute();
    const correlationId = args.find(arg => typeof arg === 'object' && arg?.correlationId)?.correlationId;
    
    if (!canExecute) {
      const error = new CircuitBreakerError(
        `Circuit breaker '${this.name}' is OPEN. Service unavailable.`,
        { 
          circuitName: this.name,
          state: this.state,
          correlationId 
        }
      );
      
      rageLogger.warn('Circuit breaker blocked request', {
        circuitName: this.name,
        state: this.state,
        failureCount: this.failureCount
      }, correlationId);
      
      throw error;
    }

    const startTime = Date.now();
    this.totalRequests++;
    
    try {
      const result = await fn(...args);
      this.onSuccess(startTime, correlationId);
      return result;
    } catch (error) {
      this.onFailure(error, startTime, correlationId);
      throw error;
    }
  }

  /**
   * Determines if the circuit breaker allows execution
   * @returns {boolean} Whether execution is allowed
   */
  canExecute() {
    const now = Date.now();
    
    switch (this.state) {
      case 'CLOSED':
        return true;
        
      case 'OPEN':
        if (this.nextAttemptTime && now >= this.nextAttemptTime) {
          this.state = 'HALF_OPEN';
          rageLogger.info('Circuit breaker transitioning to HALF_OPEN', {
            circuitName: this.name,
            failureCount: this.failureCount
          });
          return true;
        }
        return false;
        
      case 'HALF_OPEN':
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Handles successful execution
   * @param {number} startTime - Execution start time
   * @param {string} correlationId - Request correlation ID
   */
  onSuccess(startTime, correlationId) {
    const duration = Date.now() - startTime;
    this.successCount++;
    this.totalSuccesses++;
    
    this.addRequest({
      success: true,
      timestamp: Date.now(),
      duration
    });

    if (this.state === 'HALF_OPEN') {
      // Successful request in HALF_OPEN state - close the circuit
      this.state = 'CLOSED';
      this.failureCount = 0;
      this.successCount = 0;
      this.lastFailureTime = null;
      this.nextAttemptTime = null;
      
      rageLogger.info('Circuit breaker closed after successful recovery', {
        circuitName: this.name,
        duration
      }, correlationId);
    }

    metricsCollector.recordOperation(`circuit_${this.name}`, duration, 'success');
    
    rageLogger.debug('Circuit breaker request succeeded', {
      circuitName: this.name,
      state: this.state,
      duration
    }, correlationId);
  }

  /**
   * Handles failed execution
   * @param {Error} error - The error that occurred
   * @param {number} startTime - Execution start time
   * @param {string} correlationId - Request correlation ID
   */
  onFailure(error, startTime, correlationId) {
    const duration = Date.now() - startTime;
    this.failureCount++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    
    this.addRequest({
      success: false,
      timestamp: Date.now(),
      duration,
      error: error.type || error.name
    });

    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
      this.openCircuit();
    }

    metricsCollector.recordOperation(`circuit_${this.name}`, duration, 'error');
    metricsCollector.recordError('CircuitBreakerFailure', `circuit_${this.name}`, {
      state: this.state,
      failureCount: this.failureCount,
      errorType: error.type || error.name
    });
    
    rageLogger.warn('Circuit breaker request failed', {
      circuitName: this.name,
      state: this.state,
      failureCount: this.failureCount,
      error: error.message,
      duration
    }, correlationId);
  }

  /**
   * Determines if the circuit should be opened
   * @returns {boolean} Whether to open the circuit
   */
  shouldOpenCircuit() {
    // Don't open if we're already open
    if (this.state === 'OPEN') {
      return false;
    }

    // Must have minimum requests to consider opening
    if (this.totalRequests < this.minimumRequests) {
      return false;
    }

    // Check failure threshold
    if (this.failureCount >= this.failureThreshold) {
      return true;
    }

    // Check failure rate in recent window
    const recentFailureRate = this.getRecentFailureRate();
    return recentFailureRate >= 0.5; // 50% failure rate
  }

  /**
   * Opens the circuit breaker
   */
  openCircuit() {
    this.state = 'OPEN';
    this.nextAttemptTime = Date.now() + this.resetTimeout;
    
    rageLogger.error('Circuit breaker opened due to excessive failures', {
      circuitName: this.name,
      failureCount: this.failureCount,
      totalRequests: this.totalRequests,
      resetTimeout: this.resetTimeout,
      nextAttemptTime: new Date(this.nextAttemptTime).toISOString()
    });
    
    metricsCollector.recordError('CircuitBreakerOpened', `circuit_${this.name}`, {
      failureCount: this.failureCount,
      totalRequests: this.totalRequests
    });
  }

  /**
   * Manually closes the circuit breaker
   */
  forceClose() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    
    rageLogger.info('Circuit breaker manually closed', {
      circuitName: this.name
    });
  }

  /**
   * Manually opens the circuit breaker
   */
  forceOpen() {
    this.state = 'OPEN';
    this.nextAttemptTime = Date.now() + this.resetTimeout;
    
    rageLogger.warn('Circuit breaker manually opened', {
      circuitName: this.name,
      nextAttemptTime: new Date(this.nextAttemptTime).toISOString()
    });
  }

  /**
   * Adds a request to the monitoring window
   * @param {Object} request - Request details
   */
  addRequest(request) {
    this.recentRequests.push(request);
    
    // Clean old requests outside monitoring window
    const cutoff = Date.now() - this.monitoringWindow;
    this.recentRequests = this.recentRequests.filter(req => req.timestamp > cutoff);
  }

  /**
   * Gets the recent failure rate
   * @returns {number} Failure rate (0-1)
   */
  getRecentFailureRate() {
    if (this.recentRequests.length === 0) {
      return 0;
    }

    const failures = this.recentRequests.filter(req => !req.success).length;
    return failures / this.recentRequests.length;
  }

  /**
   * Gets circuit breaker statistics
   * @returns {Object} Circuit breaker stats
   */
  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout,
      
      // Current state
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      nextAttemptTime: this.nextAttemptTime ? new Date(this.nextAttemptTime).toISOString() : null,
      
      // Overall metrics
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      
      // Recent metrics
      recentRequests: this.recentRequests.length,
      recentFailureRate: this.getRecentFailureRate(),
      
      // Health indicators
      isHealthy: this.state === 'CLOSED',
      canAcceptRequests: this.canExecute()
    };
  }

  /**
   * Resets all circuit breaker metrics
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.recentRequests = [];
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    
    rageLogger.info('Circuit breaker reset', {
      circuitName: this.name
    });
  }
}

module.exports = {
  CircuitBreaker
};