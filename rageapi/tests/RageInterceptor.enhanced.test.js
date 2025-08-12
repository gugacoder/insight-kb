const RageInterceptor = require('../interceptors/RageInterceptor');
const { configManager } = require('../config');
const { rageLogger } = require('../logging/logger');
const { metricsCollector } = require('../logging/metrics');

// Mock dependencies
jest.mock('../config');
jest.mock('../logging/logger');
jest.mock('../logging/metrics');
jest.mock('../utils/vectorizeClient');
jest.mock('../enrichment/contextFormatter');
jest.mock('../enrichment/relevanceScorer');
jest.mock('../enrichment/tokenOptimizer');
jest.mock('../resilience/errorHandler');

describe('RageInterceptor - Enhanced Tests', () => {
  let rageInterceptor;
  let mockConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock configuration
    mockConfig = {
      RAGE_ENABLED: true,
      RAGE_VECTORIZE_ORGANIZATION_ID: 'test-org',
      RAGE_VECTORIZE_PIPELINE_ID: 'test-pipeline',
      RAGE_TIMEOUT_MS: 5000,
      RAGE_ENABLE_CACHING: true,
      RAGE_ENABLE_METRICS: true,
      RAGE_ENABLE_AUDIT_LOG: true,
      RAGE_NUM_RESULTS: 5,
      RAGE_MIN_RELEVANCE_SCORE: 0.7,
      RAGE_RERANK: true,
      RAGE_MAX_CONTEXT_LENGTH: 4000,
      RAGE_FORMAT_STYLE: 'standard',
      RAGE_MAX_TOKENS: 3000,
      RAGE_TOKEN_BUFFER: 200
    };

    configManager.isInitialized = false;
    configManager.initialize = jest.fn();
    configManager.getConfig = jest.fn().mockReturnValue(mockConfig);
    configManager.isRageEnabled = jest.fn().mockReturnValue(true);
    configManager.getSummary = jest.fn().mockReturnValue({ enabled: true });
    configManager.get = jest.fn((key, defaultValue) => mockConfig[key] || defaultValue);

    rageLogger.initialize = jest.fn();
    rageLogger.generateCorrelationId = jest.fn().mockReturnValue('test-correlation-id');
    rageLogger.setContext = jest.fn();
    rageLogger.clearContext = jest.fn();
    rageLogger.info = jest.fn();
    rageLogger.debug = jest.fn();
    rageLogger.warn = jest.fn();
    rageLogger.error = jest.fn();
    rageLogger.enrichment = jest.fn();
    rageLogger.audit = jest.fn();
    rageLogger.timer = jest.fn().mockReturnValue(jest.fn().mockReturnValue(100));

    metricsCollector.initialize = jest.fn();
    metricsCollector.recordOperation = jest.fn();
    metricsCollector.recordContextEnrichment = jest.fn();
    metricsCollector.recordError = jest.fn();
    metricsCollector.getMetrics = jest.fn().mockReturnValue({});
    metricsCollector.getPerformanceSummary = jest.fn().mockReturnValue({});

    // Create new instance for each test
    rageInterceptor = new RageInterceptor();
  });

  describe('Constructor', () => {
    it('should initialize successfully with valid configuration', () => {
      expect(configManager.initialize).toHaveBeenCalled();
      expect(rageLogger.initialize).toHaveBeenCalled();
      expect(metricsCollector.initialize).toHaveBeenCalledWith(true);
      expect(rageInterceptor.config).toEqual(mockConfig);
    });

    it('should log initialization success when RAGE is enabled', () => {
      expect(rageLogger.info).toHaveBeenCalledWith(
        'RAGE Interceptor initialized successfully',
        expect.objectContaining({
          orgId: 'test-org',
          pipelineId: 'test-pipeline',
          timeout: 5000,
          features: expect.objectContaining({
            caching: true,
            metrics: true,
            auditLog: true,
            enhancedScoring: true,
            tokenOptimization: true,
            smartFormatting: true
          })
        })
      );
    });

    it('should handle configuration manager already initialized', () => {
      configManager.isInitialized = true;
      configManager.initialize.mockClear();
      
      new RageInterceptor();
      
      expect(configManager.initialize).not.toHaveBeenCalled();
    });

    it('should initialize enrichment components', () => {
      expect(rageInterceptor.contextFormatter).toBeDefined();
      expect(rageInterceptor.relevanceScorer).toBeDefined();
      expect(rageInterceptor.tokenOptimizer).toBeDefined();
    });
  });

  describe('isEnabled', () => {
    it('should return true when RAGE is enabled', () => {
      configManager.isRageEnabled.mockReturnValue(true);
      
      expect(rageInterceptor.isEnabled()).toBe(true);
    });

    it('should return false when RAGE is disabled', () => {
      configManager.isRageEnabled.mockReturnValue(false);
      
      expect(rageInterceptor.isEnabled()).toBe(false);
    });
  });

  describe('enrichMessage - Enhanced Pipeline', () => {
    const testMessage = 'What is machine learning?';
    const testOptions = {
      userId: 'user123',
      conversationId: 'conv456',
      correlationId: 'corr789'
    };

    beforeEach(() => {
      // Mock the enrichment pipeline components
      rageInterceptor.vectorizeClient = {
        retrieve: jest.fn()
      };
      rageInterceptor.relevanceScorer = {
        scoreAndFilter: jest.fn()
      };
      rageInterceptor.contextFormatter = {
        formatDocuments: jest.fn()
      };
      rageInterceptor.tokenOptimizer = {
        optimizeContext: jest.fn()
      };
    });

    it('should return null when RAGE is disabled', async () => {
      configManager.isRageEnabled.mockReturnValue(false);
      
      const result = await rageInterceptor.enrichMessage(testMessage, testOptions);
      
      expect(result).toBeNull();
    });

    it('should return null for messages that are too short', async () => {
      const shortMessage = 'Hi';
      
      const result = await rageInterceptor.enrichMessage(shortMessage, testOptions);
      
      expect(result).toBeNull();
      expect(rageLogger.debug).toHaveBeenCalledWith(
        'Query too short for RAGE enrichment',
        expect.objectContaining({
          originalLength: 2,
          sanitizedLength: 2
        }),
        'test-correlation-id'
      );
    });

    it('should return null when no documents are retrieved', async () => {
      rageInterceptor.vectorizeClient.retrieve.mockResolvedValue({
        results: []
      });
      
      const result = await rageInterceptor.enrichMessage(testMessage, testOptions);
      
      expect(result).toBeNull();
      expect(rageLogger.enrichment).toHaveBeenCalledWith('no_results', {}, 'test-correlation-id');
    });

    it('should return null when no documents pass relevance filtering', async () => {
      rageInterceptor.vectorizeClient.retrieve.mockResolvedValue({
        results: [
          { text: 'Document 1', score: 0.5 },
          { text: 'Document 2', score: 0.6 }
        ]
      });
      rageInterceptor.relevanceScorer.scoreAndFilter.mockReturnValue([]);
      
      const result = await rageInterceptor.enrichMessage(testMessage, testOptions);
      
      expect(result).toBeNull();
      expect(rageLogger.enrichment).toHaveBeenCalledWith(
        'filtered_out',
        expect.objectContaining({
          totalResults: 2,
          filteredResults: 0
        }),
        'test-correlation-id'
      );
    });

    it('should successfully enrich message with valid documents', async () => {
      const mockDocs = [
        { text: 'ML is AI subset', score: 0.9, enhancedScore: 0.95 },
        { text: 'AI algorithms learn', score: 0.8, enhancedScore: 0.85 }
      ];
      const mockFormattedResult = {
        context: 'Formatted context...',
        tokenCount: 150,
        sources: ['source1.pdf'],
        relevanceScore: 0.9
      };
      const mockOptimizedResult = {
        optimizedContext: 'Optimized context...',
        tokenCount: 140,
        compressionRatio: 0.93,
        truncated: false,
        strategy: 'none',
        documentsIncluded: 2
      };

      rageInterceptor.vectorizeClient.retrieve.mockResolvedValue({
        results: mockDocs
      });
      rageInterceptor.relevanceScorer.scoreAndFilter.mockReturnValue(mockDocs);
      rageInterceptor.contextFormatter.formatDocuments.mockReturnValue(mockFormattedResult);
      rageInterceptor.tokenOptimizer.optimizeContext.mockReturnValue(mockOptimizedResult);

      const result = await rageInterceptor.enrichMessage(testMessage, testOptions);

      expect(result).toBe('Optimized context...');
      expect(rageLogger.enrichment).toHaveBeenCalledWith('start', expect.objectContaining({
        messageLength: testMessage.length,
        userId: 'user123',
        enhancedPipeline: true
      }), 'test-correlation-id');
      expect(rageLogger.enrichment).toHaveBeenCalledWith('complete', expect.objectContaining({
        documentsRetrieved: 2,
        documentsIncluded: 2,
        contextLength: 'Optimized context...'.length
      }), 'test-correlation-id');
      expect(rageLogger.audit).toHaveBeenCalledWith('context_enrichment', expect.objectContaining({
        userId: 'user123'
      }), 'test-correlation-id');
    });

    it('should record enhanced metrics with optimization details', async () => {
      const mockDocs = [{ text: 'Test doc', score: 0.9, enhancedScore: 0.95 }];
      const mockFormattedResult = {
        context: 'Formatted context...',
        tokenCount: 150,
        sources: ['source1.pdf'],
        relevanceScore: 0.9
      };
      const mockOptimizedResult = {
        optimizedContext: 'Optimized context...',
        tokenCount: 140,
        compressionRatio: 0.93,
        truncated: false,
        strategy: 'token_optimization',
        documentsIncluded: 1
      };

      rageInterceptor.vectorizeClient.retrieve.mockResolvedValue({ results: mockDocs });
      rageInterceptor.relevanceScorer.scoreAndFilter.mockReturnValue(mockDocs);
      rageInterceptor.contextFormatter.formatDocuments.mockReturnValue(mockFormattedResult);
      rageInterceptor.tokenOptimizer.optimizeContext.mockReturnValue(mockOptimizedResult);

      await rageInterceptor.enrichMessage(testMessage, testOptions);

      expect(metricsCollector.recordContextEnrichment).toHaveBeenCalledWith(
        1, // documentsIncluded
        'Optimized context...'.length, // context length
        0.9, // relevance score
        0, // duration (set by timer)
        expect.objectContaining({
          tokenCount: 140,
          compressionRatio: 0.93,
          truncated: false,
          optimizationStrategy: 'token_optimization'
        })
      );
    });

    it('should sanitize query input correctly', async () => {
      const maliciousMessage = '<script>alert("xss")</script>What is ML?';
      rageInterceptor.vectorizeClient.retrieve.mockResolvedValue({ results: [] });

      await rageInterceptor.enrichMessage(maliciousMessage, testOptions);

      expect(rageInterceptor.vectorizeClient.retrieve).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'scriptalert(xss)/scriptWhat is ML?'
        }),
        'test-correlation-id'
      );
    });

    it('should handle graceful degradation on errors', async () => {
      const error = new Error('API timeout');
      rageInterceptor.vectorizeClient.retrieve.mockRejectedValue(error);

      const result = await rageInterceptor.enrichMessage(testMessage, testOptions);

      expect(result).toBeNull();
      expect(rageLogger.error).toHaveBeenCalledWith(
        'RAGE enrichment failed',
        expect.objectContaining({
          error: 'API timeout'
        }),
        'test-correlation-id'
      );
      expect(metricsCollector.recordOperation).toHaveBeenCalledWith('enrichMessage', 100, 'error');
    });

    it('should set and clear context properly', async () => {
      rageInterceptor.vectorizeClient.retrieve.mockResolvedValue({ results: [] });

      await rageInterceptor.enrichMessage(testMessage, testOptions);

      expect(rageLogger.setContext).toHaveBeenCalledWith('test-correlation-id', {
        userId: 'user123',
        messageLength: testMessage.length,
        operation: 'enrichMessage'
      });
      expect(rageLogger.clearContext).toHaveBeenCalledWith('test-correlation-id');
    });
  });

  describe('sanitizeQuery', () => {
    it('should remove HTML and script characters', () => {
      const maliciousInput = '<script>alert("test")</script>What is AI?';
      const result = rageInterceptor.sanitizeQuery(maliciousInput);
      
      expect(result).toBe('scriptalert(test)/scriptWhat is AI?');
    });

    it('should normalize whitespace', () => {
      const messyInput = 'What   is\t\tmachine\n\nlearning?';
      const result = rageInterceptor.sanitizeQuery(messyInput);
      
      expect(result).toBe('What is machine learning?');
    });

    it('should truncate long queries', () => {
      const longInput = 'a'.repeat(600);
      const result = rageInterceptor.sanitizeQuery(longInput);
      
      expect(result.length).toBe(500);
    });

    it('should handle null and undefined inputs', () => {
      expect(rageInterceptor.sanitizeQuery(null)).toBe('');
      expect(rageInterceptor.sanitizeQuery(undefined)).toBe('');
      expect(rageInterceptor.sanitizeQuery('')).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(rageInterceptor.sanitizeQuery(123)).toBe('');
      expect(rageInterceptor.sanitizeQuery({})).toBe('');
      expect(rageInterceptor.sanitizeQuery([])).toBe('');
    });
  });

  describe('healthCheck', () => {
    beforeEach(() => {
      rageInterceptor.vectorizeClient = {
        healthCheck: jest.fn()
      };
    });

    it('should return disabled status when RAGE is not enabled', async () => {
      configManager.isRageEnabled.mockReturnValue(false);
      
      const result = await rageInterceptor.healthCheck();
      
      expect(result).toEqual({
        status: 'disabled',
        message: 'RAGE interceptor is disabled',
        config: { enabled: true }
      });
    });

    it('should return healthy status when vectorize client is healthy', async () => {
      rageInterceptor.vectorizeClient.healthCheck.mockResolvedValue({
        status: 'healthy',
        duration: 150
      });
      
      const result = await rageInterceptor.healthCheck();
      
      expect(result).toEqual({
        status: 'healthy',
        duration: 150,
        config: { enabled: true },
        metrics: {},
        logging: undefined
      });
    });

    it('should return unhealthy status when vectorize client fails', async () => {
      const error = new Error('Connection failed');
      rageInterceptor.vectorizeClient.healthCheck.mockRejectedValue(error);
      
      const result = await rageInterceptor.healthCheck();
      
      expect(result).toEqual({
        status: 'unhealthy',
        error: 'Connection failed',
        config: { enabled: true }
      });
    });
  });

  describe('Configuration Methods', () => {
    it('should return sanitized configuration', () => {
      configManager.getConfig.mockReturnValue({ sanitized: 'config' });
      
      const result = rageInterceptor.getConfig();
      
      expect(result).toEqual({ sanitized: 'config' });
      expect(configManager.getConfig).toHaveBeenCalledWith(false);
    });

    it('should return current metrics', () => {
      const mockMetrics = { operations: 5, errors: 1 };
      metricsCollector.getMetrics.mockReturnValue(mockMetrics);
      
      const result = rageInterceptor.getMetrics();
      
      expect(result).toEqual(mockMetrics);
    });

    it('should return performance summary', () => {
      const mockSummary = { avgDuration: 120, successRate: 0.95 };
      metricsCollector.getPerformanceSummary.mockReturnValue(mockSummary);
      
      const result = rageInterceptor.getPerformanceSummary();
      
      expect(result).toEqual(mockSummary);
    });
  });

  describe('getEnrichmentStats', () => {
    beforeEach(() => {
      rageInterceptor.contextFormatter = {
        getStats: jest.fn().mockReturnValue({ formatStyle: 'standard' })
      };
      rageInterceptor.relevanceScorer = {
        getStats: jest.fn().mockReturnValue({ minScore: 0.7 })
      };
      rageInterceptor.tokenOptimizer = {
        getStats: jest.fn().mockReturnValue({ maxTokens: 3000 })
      };
    });

    it('should return stats from all enrichment components', () => {
      const result = rageInterceptor.getEnrichmentStats();
      
      expect(result).toEqual({
        contextFormatter: { formatStyle: 'standard' },
        relevanceScorer: { minScore: 0.7 },
        tokenOptimizer: { maxTokens: 3000 }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty message gracefully', async () => {
      const result = await rageInterceptor.enrichMessage('');
      expect(result).toBeNull();
    });

    it('should handle missing options gracefully', async () => {
      rageInterceptor.vectorizeClient = {
        retrieve: jest.fn().mockResolvedValue({ results: [] })
      };

      const result = await rageInterceptor.enrichMessage('test message');
      expect(result).toBeNull();
    });

    it('should generate correlation ID when not provided', async () => {
      rageInterceptor.vectorizeClient = {
        retrieve: jest.fn().mockResolvedValue({ results: [] })
      };

      const optionsWithoutCorrelationId = { userId: 'user123' };
      await rageInterceptor.enrichMessage('test message', optionsWithoutCorrelationId);

      expect(rageLogger.generateCorrelationId).toHaveBeenCalled();
    });
  });

  describe('Performance and Metrics', () => {
    it('should record successful operations with detailed metrics', async () => {
      rageInterceptor.vectorizeClient = {
        retrieve: jest.fn().mockResolvedValue({ results: [] })
      };

      await rageInterceptor.enrichMessage('test message', { userId: 'user123' });

      expect(metricsCollector.recordOperation).toHaveBeenCalledWith(
        'enrichMessage',
        100,
        'success',
        expect.objectContaining({
          documentsFound: 0,
          contextSize: 0
        })
      );
    });

    it('should record failed operations with error details', async () => {
      rageInterceptor.vectorizeClient = {
        retrieve: jest.fn().mockRejectedValue(new Error('Test error'))
      };

      await rageInterceptor.enrichMessage('test message', { userId: 'user123' });

      expect(metricsCollector.recordOperation).toHaveBeenCalledWith('enrichMessage', 100, 'error');
      expect(metricsCollector.recordError).toHaveBeenCalled();
    });
  });
});