const { TimeoutError } = require('../errors/RageError');
const { rageLogger } = require('../logging/logger');
const { metricsCollector } = require('../logging/metrics');

/**
 * Timeout Manager Implementation
 * 
 * Provides timeout management for async operations with
 * configurable timeouts, cleanup, and monitoring.
 */
class TimeoutManager {
  constructor(options = {}) {
    this.defaultTimeout = options.defaultTimeout || 5000; // 5 seconds
    this.maxTimeout = options.maxTimeout || 30000; // 30 seconds
    this.minTimeout = options.minTimeout || 100; // 100ms
    this.timeoutAccuracy = options.timeoutAccuracy || 50; // ±50ms acceptable
    
    // Active timeouts tracking
    this.activeTimeouts = new Map();
    this.timeoutCounter = 0;
    
    rageLogger.info('Timeout Manager initialized', {
      defaultTimeout: this.defaultTimeout,
      maxTimeout: this.maxTimeout,
      minTimeout: this.minTimeout
    });
  }

  /**
   * Executes a promise with timeout protection
   * @param {Promise} promise - Promise to execute
   * @param {number} timeout - Timeout in milliseconds
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves or times out
   */
  async execute(promise, timeout = null, context = {}) {
    const timeoutMs = this.validateTimeout(timeout || this.defaultTimeout);
    const correlationId = context.correlationId || 'unknown';
    const operation = context.operation || 'unknown';
    const timeoutId = ++this.timeoutCounter;
    
    rageLogger.debug('Starting timeout-protected execution', {
      timeoutMs,
      operation,
      timeoutId
    }, correlationId);

    const startTime = Date.now();
    let timeoutHandle = null;
    let isResolved = false;

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          if (!isResolved) {
            const duration = Date.now() - startTime;
            const error = new TimeoutError(
              `Operation '${operation}' timed out after ${timeoutMs}ms (actual: ${duration}ms)`,
              { 
                timeoutMs, 
                actualDuration: duration,
                operation,
                correlationId,
                timeoutId
              }
            );
            
            rageLogger.warn('Operation timed out', {
              operation,
              timeoutMs,
              actualDuration: duration,
              timeoutId
            }, correlationId);
            
            metricsCollector.recordOperation(`timeout_${operation}`, duration, 'timeout', {
              configuredTimeout: timeoutMs,
              actualDuration: duration
            });
            
            this.activeTimeouts.delete(timeoutId);
            reject(error);
          }
        }, timeoutMs);
        
        // Track active timeout
        this.activeTimeouts.set(timeoutId, {
          operation,
          startTime,
          timeoutMs,
          correlationId,
          handle: timeoutHandle
        });
      });

      // Race the original promise against the timeout
      const result = await Promise.race([promise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      isResolved = true;
      
      // Clear timeout
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.activeTimeouts.delete(timeoutId);
      }
      
      rageLogger.debug('Operation completed within timeout', {
        operation,
        duration,
        timeoutMs,
        timeoutId
      }, correlationId);

      metricsCollector.recordOperation(`timeout_${operation}`, duration, 'success', {
        configuredTimeout: timeoutMs,
        actualDuration: duration,
        timeoutUtilization: (duration / timeoutMs) * 100
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      isResolved = true;
      
      // Clear timeout
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.activeTimeouts.delete(timeoutId);
      }

      // If it's not a timeout error, log it
      if (!(error instanceof TimeoutError)) {
        rageLogger.debug('Operation failed before timeout', {
          operation,
          duration,
          timeoutMs,
          error: error.message,
          timeoutId
        }, correlationId);
        
        metricsCollector.recordOperation(`timeout_${operation}`, duration, 'error', {
          configuredTimeout: timeoutMs,
          actualDuration: duration,
          errorType: error.type || error.name
        });
      }
      
      throw error;
    }
  }

  /**
   * Validates and normalizes timeout value
   * @param {number} timeout - Timeout value to validate
   * @returns {number} Validated timeout value
   */
  validateTimeout(timeout) {
    if (typeof timeout !== 'number' || isNaN(timeout) || timeout <= 0) {
      rageLogger.warn('Invalid timeout value, using default', {
        provided: timeout,
        default: this.defaultTimeout
      });
      return this.defaultTimeout;
    }

    if (timeout < this.minTimeout) {
      rageLogger.warn('Timeout too small, using minimum', {
        provided: timeout,
        minimum: this.minTimeout
      });
      return this.minTimeout;
    }

    if (timeout > this.maxTimeout) {
      rageLogger.warn('Timeout too large, using maximum', {
        provided: timeout,
        maximum: this.maxTimeout
      });
      return this.maxTimeout;
    }

    return timeout;
  }

  /**
   * Creates a timeout wrapper for a function
   * @param {Function} fn - Function to wrap
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Function} Wrapped function
   */
  wrap(fn, timeout = null) {
    const timeoutMs = this.validateTimeout(timeout || this.defaultTimeout);
    
    return async (...args) => {
      const context = args.find(arg => typeof arg === 'object' && arg?.correlationId) || {};
      return this.execute(fn(...args), timeoutMs, context);
    };
  }

  /**
   * Creates a timeout for multiple concurrent operations
   * @param {Array} promises - Array of promises
   * @param {number} timeout - Timeout for all operations
   * @param {Object} context - Execution context
   * @returns {Promise} Promise.all with timeout
   */
  async executeAll(promises, timeout = null, context = {}) {
    const operation = `${context.operation || 'concurrent'}_all`;
    return this.execute(
      Promise.all(promises),
      timeout,
      { ...context, operation }
    );
  }

  /**
   * Creates a timeout for the first successful operation
   * @param {Array} promises - Array of promises
   * @param {number} timeout - Timeout for first success
   * @param {Object} context - Execution context
   * @returns {Promise} Promise.race with timeout
   */
  async executeRace(promises, timeout = null, context = {}) {
    const operation = `${context.operation || 'concurrent'}_race`;
    return this.execute(
      Promise.race(promises),
      timeout,
      { ...context, operation }
    );
  }

  /**
   * Gets active timeout information
   * @returns {Object} Active timeouts summary
   */
  getActiveTimeouts() {
    const now = Date.now();
    const activeList = [];
    
    for (const [timeoutId, info] of this.activeTimeouts) {
      const elapsed = now - info.startTime;
      const remaining = Math.max(0, info.timeoutMs - elapsed);
      
      activeList.push({
        timeoutId,
        operation: info.operation,
        correlationId: info.correlationId,
        elapsed,
        remaining,
        timeoutMs: info.timeoutMs,
        startTime: new Date(info.startTime).toISOString()
      });
    }
    
    return {
      count: this.activeTimeouts.size,
      timeouts: activeList
    };
  }

  /**
   * Cancels all active timeouts
   * @param {string} reason - Reason for cancellation
   */
  cancelAllTimeouts(reason = 'Manual cancellation') {
    let cancelledCount = 0;
    
    for (const [timeoutId, info] of this.activeTimeouts) {
      clearTimeout(info.handle);
      cancelledCount++;
      
      rageLogger.info('Timeout cancelled', {
        timeoutId,
        operation: info.operation,
        reason
      }, info.correlationId);
    }
    
    this.activeTimeouts.clear();
    
    rageLogger.info('All active timeouts cancelled', {
      cancelledCount,
      reason
    });
    
    return cancelledCount;
  }

  /**
   * Gets timeout manager statistics
   * @returns {Object} Timeout statistics
   */
  getStats() {
    return {
      defaultTimeout: this.defaultTimeout,
      maxTimeout: this.maxTimeout,
      minTimeout: this.minTimeout,
      timeoutAccuracy: this.timeoutAccuracy,
      activeTimeouts: this.activeTimeouts.size,
      totalTimeoutsCreated: this.timeoutCounter
    };
  }

  /**
   * Updates timeout configuration
   * @param {Object} options - New configuration options
   */
  updateConfig(options) {
    const oldConfig = { ...this.getStats() };
    
    Object.assign(this, options);
    
    rageLogger.info('Timeout Manager configuration updated', {
      old: oldConfig,
      new: this.getStats()
    });
  }

  /**
   * Monitors timeout health and performance
   * @returns {Object} Health metrics
   */
  getHealthMetrics() {
    const active = this.getActiveTimeouts();
    const now = Date.now();
    
    // Calculate timeout utilization
    let totalUtilization = 0;
    let timeoutsNearExpiry = 0;
    
    for (const timeout of active.timeouts) {
      const utilization = (timeout.elapsed / timeout.timeoutMs) * 100;
      totalUtilization += utilization;
      
      if (utilization > 80) {
        timeoutsNearExpiry++;
      }
    }
    
    const avgUtilization = active.count > 0 ? totalUtilization / active.count : 0;
    
    return {
      activeCount: active.count,
      averageUtilization: avgUtilization,
      timeoutsNearExpiry,
      isHealthy: active.count < 100 && timeoutsNearExpiry < 5,
      timestamp: new Date(now).toISOString()
    };
  }

  /**
   * Cleanup method for shutdown
   */
  cleanup() {
    const cancelledCount = this.cancelAllTimeouts('System shutdown');
    
    rageLogger.info('Timeout Manager cleanup completed', {
      cancelledTimeouts: cancelledCount
    });
  }
}

module.exports = {
  TimeoutManager
};