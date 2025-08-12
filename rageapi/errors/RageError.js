/**
 * Base RAGE Error Class
 * 
 * Provides structured error handling for the RAGE Interceptor system
 * with categorization, correlation IDs, and context preservation.
 */
class RageError extends Error {
  constructor(message, type = 'unknown_error', context = {}) {
    super(message);
    this.name = 'RageError';
    this.type = type;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.correlationId = context.correlationId || null;
    this.retryable = this.determineRetryability(type);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RageError);
    }
  }

  /**
   * Determines if the error is retryable
   * @param {string} type - Error type
   * @returns {boolean} Whether the error should be retried
   */
  determineRetryability(type) {
    const retryableTypes = [
      'network_error',
      'timeout_error',
      'rate_limit',
      'server_error'
    ];
    
    return retryableTypes.includes(type);
  }

  /**
   * Converts error to JSON for logging
   * @returns {Object} Serializable error object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      retryable: this.retryable,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      context: this.context,
      stack: this.stack
    };
  }

  /**
   * Creates a sanitized version for external logging
   * @returns {Object} Safe error object
   */
  toSafeJSON() {
    return {
      type: this.type,
      retryable: this.retryable,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      message: this.getSafeMessage()
    };
  }

  /**
   * Gets a safe error message without sensitive information
   * @returns {string} Safe error message
   */
  getSafeMessage() {
    // Remove potentially sensitive information
    return this.message
      .replace(/Bearer\s+[A-Za-z0-9\-_\.]+/g, 'Bearer ***')
      .replace(/token[\"']?\s*:\s*[\"'][^\"']+[\"']/gi, 'token: "***"')
      .replace(/key[\"']?\s*:\s*[\"'][^\"']+[\"']/gi, 'key: "***"')
      .replace(/password[\"']?\s*:\s*[\"'][^\"']+[\"']/gi, 'password: "***"');
  }
}

/**
 * Network-related errors (timeouts, connection failures, DNS issues)
 */
class NetworkError extends RageError {
  constructor(message, context = {}) {
    super(message, 'network_error', context);
    this.name = 'NetworkError';
  }
}

/**
 * Timeout-related errors
 */
class TimeoutError extends RageError {
  constructor(message, context = {}) {
    super(message, 'timeout_error', context);
    this.name = 'TimeoutError';
    this.retryable = false; // Timeouts usually indicate system overload
  }
}

/**
 * Authentication and authorization errors
 */
class AuthenticationError extends RageError {
  constructor(message, context = {}) {
    super(message, 'auth_error', context);
    this.name = 'AuthenticationError';
    this.retryable = false; // Auth errors need manual intervention
  }
}

/**
 * Rate limiting errors
 */
class RateLimitError extends RageError {
  constructor(message, context = {}) {
    super(message, 'rate_limit', context);
    this.name = 'RateLimitError';
    this.retryable = true;
    this.backoffRequired = true;
    this.retryAfter = context.retryAfter || 60; // seconds
  }
}

/**
 * Validation and input errors
 */
class ValidationError extends RageError {
  constructor(message, context = {}) {
    super(message, 'validation_error', context);
    this.name = 'ValidationError';
    this.retryable = false; // Validation errors need code fixes
  }
}

/**
 * API and server errors
 */
class ServerError extends RageError {
  constructor(message, statusCode, context = {}) {
    super(message, 'server_error', context);
    this.name = 'ServerError';
    this.statusCode = statusCode;
    this.retryable = statusCode >= 500; // 5xx errors are retryable
  }
}

/**
 * Configuration errors
 */
class ConfigurationError extends RageError {
  constructor(message, context = {}) {
    super(message, 'configuration_error', context);
    this.name = 'ConfigurationError';
    this.retryable = false; // Config errors need manual fixes
  }
}

/**
 * Circuit breaker errors
 */
class CircuitBreakerError extends RageError {
  constructor(message, context = {}) {
    super(message, 'circuit_breaker', context);
    this.name = 'CircuitBreakerError';
    this.retryable = false; // Circuit breaker prevents retries
  }
}

/**
 * Error factory for creating appropriate error types
 */
class ErrorFactory {
  /**
   * Creates an appropriate error based on the type and context
   * @param {string|Error} error - Error message or error object
   * @param {string} type - Error type
   * @param {Object} context - Error context
   * @returns {RageError} Appropriate error instance
   */
  static create(error, type = null, context = {}) {
    // If already a RageError, return as is
    if (error instanceof RageError) {
      return error;
    }

    // Extract message and detect type if not provided
    const message = error.message || error.toString();
    const detectedType = type || ErrorFactory.detectErrorType(error, message);

    switch (detectedType) {
      case 'network_error':
        return new NetworkError(message, context);
      case 'timeout_error':
        return new TimeoutError(message, context);
      case 'auth_error':
        return new AuthenticationError(message, context);
      case 'rate_limit':
        return new RateLimitError(message, context);
      case 'validation_error':
        return new ValidationError(message, context);
      case 'server_error':
        return new ServerError(message, context.statusCode || 500, context);
      case 'configuration_error':
        return new ConfigurationError(message, context);
      case 'circuit_breaker':
        return new CircuitBreakerError(message, context);
      default:
        return new RageError(message, detectedType, context);
    }
  }

  /**
   * Detects error type from error object and message
   * @param {Error} error - Original error
   * @param {string} message - Error message
   * @returns {string} Detected error type
   */
  static detectErrorType(error, message) {
    // Network and timeout patterns
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || 
        error.code === 'ECONNRESET' || message.includes('network')) {
      return 'network_error';
    }

    if (error.code === 'ETIMEDOUT' || message.includes('timeout') || 
        message.includes('timed out')) {
      return 'timeout_error';
    }

    // HTTP status code patterns
    if (error.status === 401 || error.status === 403 || 
        message.includes('unauthorized') || message.includes('forbidden')) {
      return 'auth_error';
    }

    if (error.status === 429 || message.includes('rate limit') || 
        message.includes('too many requests')) {
      return 'rate_limit';
    }

    if (error.status >= 500 || message.includes('server error')) {
      return 'server_error';
    }

    if (error.status >= 400 && error.status < 500) {
      return 'validation_error';
    }

    // Configuration patterns
    if (message.includes('configuration') || message.includes('config') ||
        message.includes('missing') || message.includes('invalid')) {
      return 'configuration_error';
    }

    return 'unknown_error';
  }

  /**
   * Wraps a promise with error handling
   * @param {Promise} promise - Promise to wrap
   * @param {Object} context - Error context
   * @returns {Promise} Wrapped promise
   */
  static async wrap(promise, context = {}) {
    try {
      return await promise;
    } catch (error) {
      throw ErrorFactory.create(error, null, context);
    }
  }
}

module.exports = {
  RageError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  ServerError,
  ConfigurationError,
  CircuitBreakerError,
  ErrorFactory
};