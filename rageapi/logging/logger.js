// Create a basic logger fallback for RAGE operations
// This avoids dependency on LibreChat's winston configuration
const logger = console;

/**
 * RAGE Logger - Centralized logging interface for RAGE operations
 * 
 * Provides structured logging with correlation IDs, performance tracking,
 * and sensitive data sanitization for the RAGE Interceptor system.
 */
class RageLogger {
  constructor() {
    this.config = null;
    this.isInitialized = false;
    this.contextMetadata = new Map();
  }

  /**
   * Initializes the RAGE logger with fallback configuration
   * Configuration will be injected later by ConfigManager to avoid circular dependency
   */
  initialize() {
    // Always start with fallback configuration to avoid circular dependency
    this.config = { 
      RAGE_LOG_LEVEL: 'info', 
      RAGE_DEBUG: false,
      RAGE_ENABLE_AUDIT_LOG: false
    };
    this.isInitialized = true;
    
    logger.warn('RAGE Logger initialized with fallback configuration', {
      reason: 'Avoiding circular dependency - config will be injected later'
    });
  }

  /**
   * Updates logger configuration (called by ConfigManager after initialization)
   * @param {Object} config - RAGE configuration object
   */
  updateConfig(config) {
    if (config && typeof config === 'object') {
      this.config = {
        RAGE_LOG_LEVEL: config.RAGE_LOG_LEVEL || 'info',
        RAGE_DEBUG: config.RAGE_DEBUG || false,
        RAGE_ENABLE_AUDIT_LOG: config.RAGE_ENABLE_AUDIT_LOG || false
      };
      
      this.info('RAGE Logger configuration updated', {
        logLevel: this.config.RAGE_LOG_LEVEL,
        debugEnabled: this.config.RAGE_DEBUG,
        auditEnabled: this.config.RAGE_ENABLE_AUDIT_LOG
      });
    }
  }

  /**
   * Logs debug information (detailed diagnostic info)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional context
   * @param {string} correlationId - Request correlation ID
   */
  debug(message, metadata = {}, correlationId = null) {
    if (!this.shouldLog('debug')) return;
    
    this.writeLog('debug', message, metadata, correlationId);
  }

  /**
   * Logs informational messages (general operational events)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional context
   * @param {string} correlationId - Request correlation ID
   */
  info(message, metadata = {}, correlationId = null) {
    if (!this.shouldLog('info')) return;
    
    this.writeLog('info', message, metadata, correlationId);
  }

  /**
   * Logs warning messages (potential issues)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional context
   * @param {string} correlationId - Request correlation ID
   */
  warn(message, metadata = {}, correlationId = null) {
    if (!this.shouldLog('warn')) return;
    
    this.writeLog('warn', message, metadata, correlationId);
  }

  /**
   * Logs error messages (error conditions)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional context
   * @param {string} correlationId - Request correlation ID
   */
  error(message, metadata = {}, correlationId = null) {
    if (!this.shouldLog('error')) return;
    
    this.writeLog('error', message, metadata, correlationId);
  }

  /**
   * Logs performance metrics for operations
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metrics - Performance metrics
   * @param {string} correlationId - Request correlation ID
   */
  performance(operation, duration, metrics = {}, correlationId = null) {
    if (!this.shouldLog('info')) return;

    const perfData = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...this.sanitizeMetadata(metrics)
    };

    this.writeLog('info', `Performance: ${operation}`, {
      type: 'performance',
      performance: perfData
    }, correlationId);
  }

  /**
   * Logs audit events for compliance
   * @param {string} event - Audit event type
   * @param {Object} details - Event details
   * @param {string} correlationId - Request correlation ID
   */
  audit(event, details = {}, correlationId = null) {
    if (!this.config?.RAGE_ENABLE_AUDIT_LOG) return;

    const auditData = {
      event,
      timestamp: new Date().toISOString(),
      userId: details.userId || 'unknown',
      ...this.sanitizeMetadata(details)
    };

    this.writeLog('info', `Audit: ${event}`, {
      type: 'audit',
      audit: auditData
    }, correlationId);
  }

  /**
   * Logs API operations with standardized format
   * @param {string} operation - API operation name
   * @param {string} status - Operation status (success, error, timeout)
   * @param {Object} details - Operation details
   * @param {string} correlationId - Request correlation ID
   */
  apiOperation(operation, status, details = {}, correlationId = null) {
    const level = status === 'success' ? 'info' : 'error';
    const message = `API Operation: ${operation} - ${status}`;
    
    const apiData = {
      operation,
      status,
      timestamp: new Date().toISOString(),
      ...this.sanitizeMetadata(details)
    };

    this.writeLog(level, message, {
      type: 'api_operation',
      api: apiData
    }, correlationId);
  }

  /**
   * Logs context enrichment operations
   * @param {string} phase - Enrichment phase (start, retrieve, format, complete)
   * @param {Object} details - Phase details
   * @param {string} correlationId - Request correlation ID
   */
  enrichment(phase, details = {}, correlationId = null) {
    if (!this.shouldLog('debug')) return;

    const enrichmentData = {
      phase,
      timestamp: new Date().toISOString(),
      ...this.sanitizeMetadata(details)
    };

    this.writeLog('debug', `Context Enrichment: ${phase}`, {
      type: 'enrichment',
      enrichment: enrichmentData
    }, correlationId);
  }

  /**
   * Writes structured log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   * @param {string} correlationId - Request correlation ID
   */
  writeLog(level, message, metadata = {}, correlationId = null) {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        service: 'rage-interceptor',
        message,
        correlationId: correlationId || this.generateCorrelationId(),
        ...this.sanitizeMetadata(metadata)
      };

      // Add context metadata if available
      if (correlationId && this.contextMetadata.has(correlationId)) {
        logEntry.context = this.contextMetadata.get(correlationId);
      }

      logger[level](logEntry);

    } catch (error) {
      // Fallback logging if structured logging fails
      logger.error('RAGE Logger: Failed to write structured log', {
        originalLevel: level,
        originalMessage: message,
        error: error.message
      });
    }
  }

  /**
   * Sets context metadata for a correlation ID
   * @param {string} correlationId - Request correlation ID
   * @param {Object} context - Context metadata
   */
  setContext(correlationId, context) {
    this.contextMetadata.set(correlationId, this.sanitizeMetadata(context));
    
    // Clean up old contexts (prevent memory leaks)
    if (this.contextMetadata.size > 1000) {
      const oldestKey = this.contextMetadata.keys().next().value;
      this.contextMetadata.delete(oldestKey);
    }
  }

  /**
   * Clears context metadata for a correlation ID
   * @param {string} correlationId - Request correlation ID
   */
  clearContext(correlationId) {
    this.contextMetadata.delete(correlationId);
  }

  /**
   * Sanitizes metadata to remove sensitive information
   * @param {Object} metadata - Raw metadata
   * @returns {Object} Sanitized metadata
   */
  sanitizeMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
      return metadata;
    }

    const sanitized = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Skip sensitive keys
      if (this.isSensitiveKey(key)) {
        sanitized[key] = this.maskSensitiveValue(value);
        continue;
      }

      // Recursively sanitize nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'object' ? this.sanitizeMetadata(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Checks if a key contains sensitive information
   * @param {string} key - Object key
   * @returns {boolean} True if key is sensitive
   */
  isSensitiveKey(key) {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /key/i,
      /secret/i,
      /auth/i,
      /credential/i,
      /jwt/i,
      /bearer/i,
      /email/i,
      /phone/i,
      /ssn/i,
      /credit/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(key));
  }

  /**
   * Masks sensitive values
   * @param {any} value - Value to mask
   * @returns {string} Masked value
   */
  maskSensitiveValue(value) {
    if (!value || typeof value !== 'string') {
      return '[REDACTED]';
    }

    if (value.length <= 8) {
      return '***';
    }

    return value.substring(0, 4) + '***' + value.substring(value.length - 4);
  }

  /**
   * Determines if a log level should be written
   * @param {string} level - Log level to check
   * @returns {boolean} True if level should be logged
   */
  shouldLog(level) {
    if (!this.config) {
      return level === 'error' || level === 'warn';
    }

    const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
    const configLevel = this.config.RAGE_LOG_LEVEL || 'info';
    const currentLevelIndex = levels.indexOf(level);
    const configLevelIndex = levels.indexOf(configLevel);

    return currentLevelIndex <= configLevelIndex;
  }

  /**
   * Generates a correlation ID
   * @returns {string} Unique correlation ID
   */
  generateCorrelationId() {
    const prefix = this.config?.RAGE_CORRELATION_ID_PREFIX || 'rage';
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Creates a timer for performance measurement
   * @param {string} operation - Operation name
   * @param {string} correlationId - Request correlation ID
   * @returns {Function} Timer end function
   */
  timer(operation, correlationId = null) {
    const startTime = Date.now();
    const corrId = correlationId || this.generateCorrelationId();
    
    this.debug(`Timer started: ${operation}`, { operation }, corrId);

    return (additionalMetrics = {}) => {
      const duration = Date.now() - startTime;
      this.performance(operation, duration, additionalMetrics, corrId);
      return duration;
    };
  }

  /**
   * Gets current logging configuration
   * @returns {Object} Logging configuration
   */
  getLoggingConfig() {
    return {
      isInitialized: this.isInitialized,
      logLevel: this.config?.RAGE_LOG_LEVEL || 'unknown',
      debugEnabled: this.config?.RAGE_DEBUG || false,
      auditEnabled: this.config?.RAGE_ENABLE_AUDIT_LOG || false,
      contextCacheSize: this.contextMetadata.size
    };
  }
}

// Create singleton instance
const rageLogger = new RageLogger();

module.exports = {
  RageLogger,
  rageLogger
};