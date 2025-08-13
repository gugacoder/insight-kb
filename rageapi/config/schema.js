/**
 * RAGE Configuration Schema
 * 
 * Defines the structure and validation rules for all RAGE configuration parameters.
 * Follows LibreChat naming conventions and 12-factor app principles.
 */

const ConfigSchema = {
  // Core Settings
  RAGE_ENABLED: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Master switch to enable/disable RAGE functionality',
    example: 'true'
  },

  // Vectorize.io API Settings
  RAGE_VECTORIZE_URI: {
    type: 'string',
    required: true,
    validation: 'url',
    description: 'Vectorize.io API endpoint URL',
    example: 'https://api.vectorize.io/v1'
  },

  RAGE_VECTORIZE_ORGANIZATION_ID: {
    type: 'string',
    required: true,
    validation: 'uuid',
    description: 'Vectorize.io organization identifier (GUID)',
    example: '550e8400-e29b-41d4-a716-446655440000'
  },

  RAGE_VECTORIZE_PIPELINE_ID: {
    type: 'string',
    required: true,
    validation: 'uuid',
    description: 'Vectorize.io pipeline identifier (GUID)',
    example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
  },

  RAGE_VECTORIZE_API_KEY: {
    type: 'string',
    required: true,
    validation: 'jwt',
    sensitive: true,
    description: 'JWT token for Vectorize.io API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },

  // Retrieval Settings
  RAGE_NUM_RESULTS: {
    type: 'number',
    required: false,
    default: 5,
    min: 1,
    max: 20,
    description: 'Maximum number of documents to retrieve per query',
    example: '5'
  },

  RAGE_RERANK: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Enable result reranking for improved relevance',
    example: 'true'
  },

  RAGE_MIN_RELEVANCE_SCORE: {
    type: 'number',
    required: false,
    default: 0.7,
    min: 0.0,
    max: 1.0,
    description: 'Minimum relevance score threshold for including results',
    example: '0.7'
  },

  RAGE_MIN_SIMILARITY_SCORE: {
    type: 'number',
    required: false,
    default: 0.3,
    min: 0.0,
    max: 1.0,
    description: 'Minimum similarity score threshold for vector similarity-based filtering',
    example: '0.3'
  },

  RAGE_SCORE_FIELD: {
    type: 'string',
    required: false,
    default: 'auto',
    enum: ['similarity', 'relevancy', 'auto'],
    description: 'Score field to use for filtering: similarity, relevancy, or auto-detect',
    example: 'auto'
  },

  // Performance Settings
  RAGE_TIMEOUT_MS: {
    type: 'number',
    required: false,
    default: 5000,
    min: 1000,
    max: 30000,
    description: 'API request timeout in milliseconds',
    example: '5000'
  },

  RAGE_RETRY_ATTEMPTS: {
    type: 'number',
    required: false,
    default: 2,
    min: 0,
    max: 5,
    description: 'Number of retry attempts for failed API calls',
    example: '2'
  },

  RAGE_RETRY_DELAY_MS: {
    type: 'number',
    required: false,
    default: 1000,
    min: 100,
    max: 10000,
    description: 'Base delay between retry attempts in milliseconds',
    example: '1000'
  },

  RAGE_CACHE_TTL: {
    type: 'number',
    required: false,
    default: 300,
    min: 0,
    max: 3600,
    description: 'Cache time-to-live in seconds (0 to disable)',
    example: '300'
  },

  // Debug and Logging Settings
  RAGE_LOG_LEVEL: {
    type: 'string',
    required: false,
    default: 'info',
    enum: ['error', 'warn', 'info', 'debug', 'verbose'],
    description: 'Logging verbosity level for RAGE operations',
    example: 'info'
  },

  RAGE_DEBUG: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Enable debug mode with verbose logging',
    example: 'false'
  },

  // Advanced Settings
  RAGE_METRICS_ENABLED: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Enable performance metrics collection',
    example: 'true'
  },

  RAGE_CORRELATION_ID_PREFIX: {
    type: 'string',
    required: false,
    default: 'rage',
    maxLength: 20,
    validation: 'alphanumeric',
    description: 'Prefix for request correlation IDs',
    example: 'rage'
  },

  RAGE_USER_AGENT: {
    type: 'string',
    required: false,
    default: 'LibreChat-RAGE/1.0',
    maxLength: 100,
    description: 'User agent string for API requests',
    example: 'LibreChat-RAGE/1.0'
  },

  // Feature Flags
  RAGE_ENABLE_CACHING: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Enable response caching to improve performance',
    example: 'true'
  },

  RAGE_ENABLE_METRICS: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Enable performance and usage metrics collection',
    example: 'true'
  },

  RAGE_ENABLE_AUDIT_LOG: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Enable audit logging for compliance requirements',
    example: 'false'
  }
};

module.exports = {
  ConfigSchema
};