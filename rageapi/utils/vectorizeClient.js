const fetch = require('node-fetch');
const { errorHandler } = require('../resilience/errorHandler');
const { ErrorFactory } = require('../errors/RageError');
const { rageLogger } = require('../logging/logger');
const { metricsCollector } = require('../logging/metrics');

/**
 * Vectorize.io API Client Utility
 * 
 * Handles HTTP communication with Vectorize.io API including:
 * - Authentication
 * - Request formatting
 * - Response parsing
 * - Error handling
 * - Retry logic
 */
class VectorizeClient {
  constructor(config) {
    this.config = {
      apiUrl: config.apiUrl,
      orgId: config.orgId,
      pipelineId: config.pipelineId,
      jwtToken: config.jwtToken,
      timeout: config.timeout || 5000,
      retryAttempts: config.retryAttempts || 2,
      retryDelay: config.retryDelay || 1000,
      debug: config.debug || false
    };
  }

  /**
   * Executes a retrieval query against the vector database
   * @param {Object} queryParams - Query parameters
   * @param {string} correlationId - Request correlation ID
   * @returns {Promise<Object>} API response data
   */
  async retrieve(queryParams, correlationId) {
    const operation = async () => {
      const url = `${this.config.apiUrl}/org/${this.config.orgId}/pipelines/${this.config.pipelineId}/retrieval`;
      
      const requestBody = {
        question: queryParams.question,
        numResults: queryParams.numResults || 5,
        rerank: queryParams.rerank !== false,
        'metadata-filters': queryParams.metadataFilters || {}
      };

      return this.executeRequest('POST', url, requestBody, correlationId);
    };

    return errorHandler.executeWithResilience(operation, {
      operation: 'vectorizeApi',
      correlationId,
      timeout: this.config.timeout
    });
  }

  /**
   * Executes HTTP request with retry logic and error handling
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} body - Request body
   * @param {string} correlationId - Request correlation ID
   * @returns {Promise<Object>} Response data
   */
  async executeRequest(method, url, body, correlationId) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts + 1; attempt++) {
      try {
        if (this.config.debug) {
          logger.debug('VectorizeClient request attempt', {
            correlationId,
            attempt,
            method,
            url: this.sanitizeUrlForLogging(url)
          });
        }

        const response = await this.makeHttpRequest(method, url, body, correlationId);
        
        if (this.config.debug) {
          logger.debug('VectorizeClient request successful', {
            correlationId,
            attempt,
            status: response.status
          });
        }

        return response;
      } catch (error) {
        lastError = error;
        
        if (this.shouldRetry(error, attempt)) {
          const delay = this.calculateRetryDelay(attempt);
          
          logger.warn('VectorizeClient request failed, retrying', {
            correlationId,
            attempt,
            error: error.message,
            retryDelay: delay
          });
          
          await this.sleep(delay);
          continue;
        }
        
        // Don't retry, throw the error
        logger.error('VectorizeClient request failed permanently', {
          correlationId,
          attempt,
          error: error.message,
          stack: this.config.debug ? error.stack : undefined
        });
        
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Makes the actual HTTP request
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} body - Request body
   * @param {string} correlationId - Request correlation ID
   * @returns {Promise<Object>} Parsed response data
   */
  async makeHttpRequest(method, url, body, correlationId) {
    const requestOptions = {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.jwtToken}`,
        'Content-Type': 'application/json',
        'User-Agent': this.config.userAgent || 'LibreChat-RAGE/1.0',
        'X-Correlation-ID': correlationId
      },
      timeout: this.config.timeout
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    rageLogger.apiOperation('request_start', 'started', {
      method,
      url: this.sanitizeUrlForLogging(url)
    }, correlationId);

    const startTime = Date.now();
    const response = await fetch(url, requestOptions);
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      
      rageLogger.apiOperation('request_failed', 'error', {
        method,
        status: response.status,
        statusText: response.statusText,
        duration
      }, correlationId);

      metricsCollector.recordApiCall(
        this.sanitizeUrlForLogging(url),
        duration,
        response.status,
        0
      );

      throw ErrorFactory.create(
        new Error(`API request failed: ${response.status} ${response.statusText}`),
        this.getErrorTypeFromStatus(response.status),
        { 
          statusCode: response.status,
          correlationId,
          responseText: errorText
        }
      );
    }

    const data = await response.json();
    const responseSize = JSON.stringify(data).length;
    
    rageLogger.apiOperation('request_success', 'success', {
      method,
      status: response.status,
      duration,
      responseSize
    }, correlationId);

    metricsCollector.recordApiCall(
      this.sanitizeUrlForLogging(url),
      duration,
      response.status,
      responseSize
    );

    return data;
  }

  /**
   * Determines if a request should be retried based on the error
   * @param {Error} error - The error that occurred
   * @param {number} attempt - Current attempt number
   * @returns {boolean} Whether to retry
   */
  shouldRetry(error, attempt) {
    // Don't retry if we've exceeded max attempts
    if (attempt >= this.config.retryAttempts + 1) {
      return false;
    }

    // Don't retry authentication errors
    if (error instanceof VectorizeApiError && error.status === 401) {
      return false;
    }

    // Don't retry bad request errors
    if (error instanceof VectorizeApiError && error.status === 400) {
      return false;
    }

    // Retry on network errors, timeouts, and 5xx server errors
    if (error.code === 'ECONNRESET' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.message.includes('timeout') ||
        (error instanceof VectorizeApiError && error.status >= 500)) {
      return true;
    }

    // Retry on rate limiting
    if (error instanceof VectorizeApiError && error.status === 429) {
      return true;
    }

    return false;
  }

  /**
   * Calculates retry delay with exponential backoff
   * @param {number} attempt - Current attempt number
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay(attempt) {
    const baseDelay = this.config.retryDelay;
    const backoffMultiplier = Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1; // Add 10% jitter
    
    return Math.floor(baseDelay * backoffMultiplier * (1 + jitter));
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Sanitizes URL for logging (removes sensitive path parameters)
   * @param {string} url - Original URL
   * @returns {string} Sanitized URL
   */
  sanitizeUrlForLogging(url) {
    try {
      const urlObj = new URL(url);
      // Replace org and pipeline IDs with placeholders
      return urlObj.pathname
        .replace(/\/org\/[^/]+/, '/org/***')
        .replace(/\/pipelines\/[^/]+/, '/pipelines/***') + 
        urlObj.search;
    } catch {
      return '[invalid-url]';
    }
  }

  /**
   * Gets error type from HTTP status code
   * @param {number} status - HTTP status code
   * @returns {string} Error type
   */
  getErrorTypeFromStatus(status) {
    if (status === 401 || status === 403) {
      return 'auth_error';
    }
    if (status === 429) {
      return 'rate_limit';
    }
    if (status >= 500) {
      return 'server_error';
    }
    if (status >= 400) {
      return 'validation_error';
    }
    return 'unknown_error';
  }

  /**
   * Tests connectivity to Vectorize.io API
   * @param {string} correlationId - Request correlation ID
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck(correlationId) {
    try {
      const testQuery = {
        question: 'health check test query',
        numResults: 1,
        rerank: false
      };

      const startTime = Date.now();
      await this.retrieve(testQuery, correlationId);
      const duration = Date.now() - startTime;

      return {
        status: 'healthy',
        duration,
        endpoint: this.sanitizeUrlForLogging(`${this.config.apiUrl}/org/${this.config.orgId}/pipelines/${this.config.pipelineId}`)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        errorType: error.constructor.name,
        endpoint: this.sanitizeUrlForLogging(`${this.config.apiUrl}/org/${this.config.orgId}/pipelines/${this.config.pipelineId}`)
      };
    }
  }
}

/**
 * Custom error class for Vectorize API errors
 */
class VectorizeApiError extends Error {
  constructor(message, status, response, correlationId) {
    super(message);
    this.name = 'VectorizeApiError';
    this.status = status;
    this.response = response;
    this.correlationId = correlationId;
  }
}

module.exports = {
  VectorizeClient,
  VectorizeApiError
};