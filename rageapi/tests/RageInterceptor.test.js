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

describe('RageInterceptor', () => {
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
    it('should initialize with valid configuration', () => {
      const interceptor = new RageInterceptor();
      
      expect(interceptor.config.enabled).toBe(true);
      expect(interceptor.config.orgId).toBe('test-org');
      expect(interceptor.config.pipelineId).toBe('test-pipeline');
      expect(interceptor.config.timeout).toBe(5000);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        timeout: 3000,
        maxResults: 10
      };
      
      const interceptor = new RageInterceptor(customConfig);
      
      expect(interceptor.config.timeout).toBe(3000);
      expect(interceptor.config.maxResults).toBe(10);
    });

    it('should handle disabled configuration', () => {
      process.env.RAGE_ENABLED = 'false';
      
      const interceptor = new RageInterceptor();
      
      expect(interceptor.config.enabled).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('RAGE Interceptor disabled via configuration');
    });

    it('should throw error for missing required configuration', () => {
      delete process.env.RAGE_VECTORIZE_ORGANIZATION_ID;
      
      expect(() => new RageInterceptor()).toThrow('RAGE configuration missing: orgId');
    });

    it('should throw error for invalid JWT token', () => {
      process.env.RAGE_VECTORIZE_API_KEY = 'invalid-token';
      
      expect(() => new RageInterceptor()).toThrow('Invalid JWT token format');
    });

    it('should throw error for invalid API URL', () => {
      process.env.RAGE_VECTORIZE_URI = 'not-a-url';
      
      expect(() => new RageInterceptor()).toThrow('Invalid Vectorize API URL');
    });
  });

  describe('enrichMessage', () => {
    let interceptor;

    beforeEach(() => {
      interceptor = new RageInterceptor();
    });

    it('should return null when disabled', async () => {
      interceptor.config.enabled = false;
      
      const result = await interceptor.enrichMessage('test message');
      
      expect(result).toBeNull();
    });

    it('should return null for empty or short messages', async () => {
      const result1 = await interceptor.enrichMessage('');
      const result2 = await interceptor.enrichMessage('hi');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should successfully enrich message with context', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          results: [
            {
              text: 'This is relevant context',
              source: 'test-doc.pdf',
              score: 0.85,
              metadata: { source: 'test-doc.pdf' }
            }
          ]
        })
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await interceptor.enrichMessage('What is the company policy?');
      
      expect(result).toContain('Relevant Context');
      expect(result).toContain('test-doc.pdf');
      expect(result).toContain('This is relevant context');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/retrieval'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should return null when no relevant documents found', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          results: []
        })
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await interceptor.enrichMessage('test query');
      
      expect(result).toBeNull();
    });

    it('should filter results by relevance score', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          results: [
            { text: 'High relevance', score: 0.85, metadata: { source: 'doc1' } },
            { text: 'Low relevance', score: 0.5, metadata: { source: 'doc2' } }
          ]
        })
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await interceptor.enrichMessage('test query');
      
      expect(result).toContain('High relevance');
      expect(result).not.toContain('Low relevance');
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      const result = await interceptor.enrichMessage('test query');
      
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'RAGE enrichment failed',
        expect.objectContaining({
          error: 'Network error'
        })
      );
    });

    it('should handle API timeout gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';
      
      fetch.mockRejectedValue(timeoutError);
      
      const result = await interceptor.enrichMessage('test query');
      
      expect(result).toBeNull();
    });

    it('should handle non-ok API responses', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await interceptor.enrichMessage('test query');
      
      expect(result).toBeNull();
    });
  });

  describe('sanitizeQuery', () => {
    let interceptor;

    beforeEach(() => {
      interceptor = new RageInterceptor();
    });

    it('should remove harmful characters', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = interceptor.sanitizeQuery(maliciousInput);
      
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
    });

    it('should normalize whitespace', () => {
      const input = 'hello    world\\n\\ttabs';
      const result = interceptor.sanitizeQuery(input);
      
      expect(result).toBe('hello world tabs');
    });

    it('should truncate long queries', () => {
      const longInput = 'a'.repeat(600);
      const result = interceptor.sanitizeQuery(longInput);
      
      expect(result.length).toBeLessThanOrEqual(500);
    });

    it('should handle null and undefined input', () => {
      expect(interceptor.sanitizeQuery(null)).toBe('');
      expect(interceptor.sanitizeQuery(undefined)).toBe('');
      expect(interceptor.sanitizeQuery('')).toBe('');
    });
  });

  describe('formatContext', () => {
    let interceptor;

    beforeEach(() => {
      interceptor = new RageInterceptor();
    });

    it('should format multiple documents correctly', () => {
      const documents = [
        {
          text: 'First document content',
          score: 0.9,
          metadata: { source: 'doc1.pdf' }
        },
        {
          text: 'Second document content',
          score: 0.8,
          metadata: { source: 'doc2.pdf' }
        }
      ];
      
      const result = interceptor.formatContext(documents);
      
      expect(result).toContain('**Relevant Context:**');
      expect(result).toContain('**1. doc1.pdf** (Relevance: 90.0%)');
      expect(result).toContain('**2. doc2.pdf** (Relevance: 80.0%)');
      expect(result).toContain('First document content');
      expect(result).toContain('Second document content');
      expect(result).toContain('**End of Context**');
    });

    it('should handle documents without metadata', () => {
      const documents = [
        {
          text: 'Content without metadata',
          score: 0.8
        }
      ];
      
      const result = interceptor.formatContext(documents);
      
      expect(result).toContain('Unknown Source');
      expect(result).toContain('Content without metadata');
    });

    it('should return empty string for no documents', () => {
      const result = interceptor.formatContext([]);
      
      expect(result).toBe('');
    });
  });

  describe('healthCheck', () => {
    let interceptor;

    beforeEach(() => {
      interceptor = new RageInterceptor();
    });

    it('should return disabled status when RAGE is disabled', async () => {
      interceptor.config.enabled = false;
      
      const result = await interceptor.healthCheck();
      
      expect(result.status).toBe('disabled');
    });

    it('should return healthy status on successful API call', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ results: [] })
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await interceptor.healthCheck();
      
      expect(result.status).toBe('healthy');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.config).toMatchObject({
        orgId: 'test-org',
        pipelineId: 'test-pipeline'
      });
    });

    it('should return unhealthy status on API failure', async () => {
      fetch.mockRejectedValue(new Error('Connection failed'));
      
      const result = await interceptor.healthCheck();
      
      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('Configuration Management', () => {
    let interceptor;

    beforeEach(() => {
      interceptor = new RageInterceptor();
    });

    it('should disable and enable correctly', () => {
      interceptor.disable();
      expect(interceptor.config.enabled).toBe(false);
      
      interceptor.enable();
      expect(interceptor.config.enabled).toBe(true);
    });

    it('should return sanitized configuration', () => {
      const config = interceptor.getConfig();
      
      expect(config.jwtToken).toBe('***masked***');
      expect(config.orgId).toBe('test-org');
      expect(config.pipelineId).toBe('test-pipeline');
    });
  });

  describe('Correlation ID Generation', () => {
    let interceptor;

    beforeEach(() => {
      interceptor = new RageInterceptor();
    });

    it('should generate unique correlation IDs', () => {
      const id1 = interceptor.generateCorrelationId();
      const id2 = interceptor.generateCorrelationId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^rage_\\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^rage_\\d+_[a-z0-9]+$/);
    });
  });
});