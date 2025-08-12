const fetch = require('node-fetch');
const { configManager } = require('../config');
const { rageLogger } = require('../logging/logger');
const { metricsCollector } = require('../logging/metrics');
const { VectorizeClient } = require('../utils/vectorizeClient');
const { ErrorHandler } = require('../resilience/errorHandler');
const { ContextFormatter } = require('../enrichment/contextFormatter');
const { RelevanceScorer } = require('../enrichment/relevanceScorer');
const { TokenOptimizer } = require('../enrichment/tokenOptimizer');

/**
 * RAGE (Retrieval Augmented Generation Enhancement) Interceptor
 * 
 * Provides intelligent context enrichment for LibreChat conversations
 * by retrieving relevant information from Vectorize.io vector databases.
 */
class RageInterceptor {
  constructor(config = {}) {
    // Initialize error handler property first (outside try-catch)
    this._errorHandler = null;
    
    try {
      // Initialize configuration management
      if (!configManager.isInitialized) {
        configManager.initialize();
      }
      
      // Initialize logging and metrics
      rageLogger.initialize();
      metricsCollector.initialize(configManager.get('RAGE_ENABLE_METRICS', true));
      
      this.config = configManager.getConfig();
      
      // Create vectorize client config with mapped properties
      const vectorizeConfig = {
        apiUrl: this.config.RAGE_VECTORIZE_URI,
        orgId: this.config.RAGE_VECTORIZE_ORGANIZATION_ID,
        pipelineId: this.config.RAGE_VECTORIZE_PIPELINE_ID,
        jwtToken: this.config.RAGE_VECTORIZE_API_KEY,
        timeout: this.config.RAGE_TIMEOUT_MS || 5000,
        retryAttempts: this.config.RAGE_RETRY_ATTEMPTS || 2,
        retryDelay: this.config.RAGE_RETRY_DELAY_MS || 1000,
        debug: this.config.RAGE_DEBUG || false,
        userAgent: this.config.RAGE_USER_AGENT || 'LibreChat-RAGE/1.0'
      };
      
      this.vectorizeClient = new VectorizeClient(vectorizeConfig);
    
    // Initialize enrichment components
    this.contextFormatter = new ContextFormatter({
      maxContextLength: this.config.RAGE_MAX_CONTEXT_LENGTH,
      formatStyle: this.config.RAGE_FORMAT_STYLE
    });
    
    this.relevanceScorer = new RelevanceScorer({
      minRelevanceScore: this.config.RAGE_MIN_RELEVANCE_SCORE
    });
    
    this.tokenOptimizer = new TokenOptimizer({
      maxTokens: this.config.RAGE_MAX_TOKENS,
      bufferTokens: this.config.RAGE_TOKEN_BUFFER
    });
    
    // Initialize ErrorHandler eagerly (fixes timing issue)
    this.errorHandler = new ErrorHandler();
    
    if (this.config.RAGE_ENABLED) {
      rageLogger.info('RAGE Interceptor initialized successfully', {
        orgId: this.config.RAGE_VECTORIZE_ORGANIZATION_ID,
        pipelineId: this.config.RAGE_VECTORIZE_PIPELINE_ID,
        timeout: this.config.RAGE_TIMEOUT_MS,
        features: {
          caching: this.config.RAGE_ENABLE_CACHING,
          metrics: this.config.RAGE_ENABLE_METRICS,
          auditLog: this.config.RAGE_ENABLE_AUDIT_LOG,
          enhancedScoring: true,
          tokenOptimization: true,
          smartFormatting: true
        }
      });
    }
    } catch (error) {
      // If initialization fails, log and create a disabled instance
      console.warn('[RageInterceptor] Failed to initialize:', error.message);
      this.config = { RAGE_ENABLED: false };
      this.vectorizeClient = null;
      this.contextFormatter = null;
      this.relevanceScorer = null;
      this.tokenOptimizer = null;
      this.errorHandler = null;
    }
  }


  /**
   * Validates that RAGE is properly configured
   * @returns {boolean} Whether RAGE is ready to use
   */
  isEnabled() {
    return configManager.isRageEnabled();
  }

  /**
   * Enriches a message with relevant context from vector database
   * @param {string} message - The user message to enrich
   * @param {Object} options - Additional options (conversationId, userId, etc.)
   * @returns {Promise<string|null>} Enriched context or null if unavailable
   */
  async enrichMessage(message, options = {}) {
    if (!this.isEnabled()) {
      return null;
    }

    const correlationId = options.correlationId || rageLogger.generateCorrelationId();
    const timer = rageLogger.timer('enrichMessage', correlationId);
    
    // Set context for this operation
    rageLogger.setContext(correlationId, {
      userId: options.userId,
      messageLength: message.length,
      operation: 'enrichMessage'
    });

    const operation = async () => {
      rageLogger.enrichment('start', {
        messageLength: message.length,
        userId: options.userId,
        enhancedPipeline: true
      }, correlationId);

      // Sanitize and prepare search query
      const searchQuery = this.sanitizeQuery(message);
      if (!searchQuery || searchQuery.length < 3) {
        rageLogger.debug('Query too short for RAGE enrichment', { 
          originalLength: message.length,
          sanitizedLength: searchQuery.length 
        }, correlationId);
        return null;
      }

      rageLogger.enrichment('retrieve', {
        queryLength: searchQuery.length
      }, correlationId);

      // Retrieve relevant documents using VectorizeClient with resilience
      const retrievalResult = await this.vectorizeClient.retrieve({
        question: searchQuery,
        numResults: this.config.RAGE_NUM_RESULTS,
        rerank: this.config.RAGE_RERANK
      }, correlationId);
      
      if (!retrievalResult.results || retrievalResult.results.length === 0) {
        rageLogger.enrichment('no_results', {}, correlationId);
        return null;
      }

      rageLogger.enrichment('score', {
        originalResults: retrievalResult.results.length
      }, correlationId);

      // Enhanced relevance scoring and filtering
      const scoredDocuments = this.relevanceScorer.scoreAndFilter(
        retrievalResult.results, 
        searchQuery, 
        { correlationId }
      );

      if (scoredDocuments.length === 0) {
        rageLogger.enrichment('filtered_out', {
          totalResults: retrievalResult.results.length,
          filteredResults: 0,
          minScore: this.config.RAGE_MIN_RELEVANCE_SCORE
        }, correlationId);
        return null;
      }

      rageLogger.enrichment('format', {
        documentsFound: scoredDocuments.length,
        averageScore: scoredDocuments.reduce((sum, doc) => sum + (doc.enhancedScore || doc.score), 0) / scoredDocuments.length
      }, correlationId);

      // Format context using the enhanced formatter
      const formattingResult = this.contextFormatter.formatDocuments(scoredDocuments, {
        correlationId,
        language: options.language || 'english'
      });

      rageLogger.enrichment('optimize', {
        preOptimizationTokens: formattingResult.tokenCount,
        preOptimizationLength: formattingResult.context.length
      }, correlationId);

      // Optimize context for token limits
      const optimizationResult = this.tokenOptimizer.optimizeContext(
        formattingResult.context,
        scoredDocuments,
        {
          correlationId,
          language: options.language || 'english'
        }
      );

      const finalContext = optimizationResult.optimizedContext;
      const contextMetadata = {
        documentsRetrieved: retrievalResult.results.length,
        documentsScored: scoredDocuments.length,
        documentsIncluded: optimizationResult.documentsIncluded || scoredDocuments.length,
        tokenCount: optimizationResult.tokenCount,
        compressionRatio: optimizationResult.compressionRatio,
        truncated: optimizationResult.truncated,
        sources: formattingResult.sources,
        averageRelevance: formattingResult.relevanceScore,
        optimizationStrategy: optimizationResult.strategy
      };

      rageLogger.enrichment('complete', {
        ...contextMetadata,
        contextLength: finalContext.length
      }, correlationId);

      // Record enhanced metrics
      metricsCollector.recordContextEnrichment(
        contextMetadata.documentsIncluded,
        finalContext.length,
        contextMetadata.averageRelevance,
        0, // duration will be set by timer
        {
          tokenCount: contextMetadata.tokenCount,
          compressionRatio: contextMetadata.compressionRatio,
          truncated: contextMetadata.truncated,
          optimizationStrategy: contextMetadata.optimizationStrategy
        }
      );

      // Audit log with enhanced details
      rageLogger.audit('context_enrichment', {
        userId: options.userId,
        ...contextMetadata
      }, correlationId);

      return finalContext;
    };

    try {
      // Execute with resilience patterns
      const result = await this.errorHandler.executeWithResilience(operation, {
        operation: 'enrichMessage',
        correlationId,
        timeout: this.config.RAGE_TIMEOUT_MS
      });

      const duration = timer();
      
      if (result) {
        metricsCollector.recordOperation('enrichMessage', duration, 'success');
        return result;
      } else {
        metricsCollector.recordOperation('enrichMessage', duration, 'success', {
          documentsFound: 0,
          contextSize: 0
        });
        return null;
      }

    } catch (error) {
      const duration = timer();
      
      rageLogger.error('RAGE enrichment failed', {
        error: error.message,
        stack: this.config.RAGE_DEBUG ? error.stack : undefined
      }, correlationId);

      metricsCollector.recordOperation('enrichMessage', duration, 'error');
      metricsCollector.recordError(error.name || 'UnknownError', 'enrichMessage', {
        message: error.message
      });
      
      // Graceful degradation - return null to continue without context
      return null;
    } finally {
      rageLogger.clearContext(correlationId);
    }
  }


  /**
   * Gets enrichment component statistics
   * @returns {Object} Statistics from all enrichment components
   */
  getEnrichmentStats() {
    return {
      contextFormatter: this.contextFormatter.getStats(),
      relevanceScorer: this.relevanceScorer.getStats(),
      tokenOptimizer: this.tokenOptimizer.getStats()
    };
  }

  /**
   * Sanitizes user input to create safe search queries
   * @param {string} message - Raw user message
   * @returns {string} Sanitized query string
   */
  sanitizeQuery(message) {
    if (!message || typeof message !== 'string') {
      return '';
    }

    // Remove potentially harmful characters and normalize
    let sanitized = message
      .replace(/[<>\"'`]/g, '') // Remove HTML/script chars
      .replace(/\\s+/g, ' ')     // Normalize whitespace
      .trim();

    // Truncate if too long (Vectorize.io has query limits)
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500).trim();
    }

    return sanitized;
  }


  /**
   * Health check for RAGE interceptor and dependencies
   * @returns {Promise<Object>} Health status object
   */
  async healthCheck() {
    const correlationId = rageLogger.generateCorrelationId();
    
    if (!this.isEnabled()) {
      return {
        status: 'disabled',
        message: 'RAGE interceptor is disabled',
        config: configManager.getSummary()
      };
    }

    try {
      rageLogger.debug('Starting RAGE health check', {}, correlationId);
      
      // Test connectivity using VectorizeClient
      const healthResult = await this.vectorizeClient.healthCheck(correlationId);
      
      rageLogger.info('RAGE health check completed', {
        status: healthResult.status,
        duration: healthResult.duration
      }, correlationId);
      
      return {
        status: healthResult.status,
        duration: healthResult.duration,
        config: configManager.getSummary(),
        metrics: metricsCollector.getPerformanceSummary(),
        logging: rageLogger.getLoggingConfig()
      };
    } catch (error) {
      rageLogger.error('RAGE health check failed', {
        error: error.message
      }, correlationId);
      
      return {
        status: 'unhealthy',
        error: error.message,
        config: configManager.getSummary()
      };
    }
  }

  /**
   * Gets current configuration (sanitized)
   * @returns {Object} Current configuration without sensitive data
   */
  getConfig() {
    return configManager.getConfig(false); // false = don't include secrets
  }

  /**
   * Gets performance metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return metricsCollector.getMetrics();
  }

  /**
   * Gets performance summary
   * @returns {Object} Performance summary
   */
  getPerformanceSummary() {
    return metricsCollector.getPerformanceSummary();
  }
}

module.exports = RageInterceptor;