/**
 * RAGE Configuration Defaults
 * 
 * Provides sensible default values for RAGE configuration parameters.
 * These defaults ensure the system works out-of-the-box while maintaining
 * good performance and security characteristics.
 */

const ConfigDefaults = {
  // Core Settings
  RAGE_ENABLED: false,

  // Retrieval Settings
  RAGE_NUM_RESULTS: 5,
  RAGE_RERANK: true,
  RAGE_MIN_RELEVANCE_SCORE: 0.7,
  RAGE_MIN_SIMILARITY_SCORE: 0.3,
  RAGE_SCORE_FIELD: 'auto',

  // Performance Settings
  RAGE_TIMEOUT_MS: 5000,
  RAGE_RETRY_ATTEMPTS: 2,
  RAGE_RETRY_DELAY_MS: 1000,
  RAGE_CACHE_TTL: 300,

  // Debug and Logging Settings
  RAGE_LOG_LEVEL: 'info',
  RAGE_DEBUG: false,

  // Advanced Settings
  RAGE_METRICS_ENABLED: true,
  RAGE_CORRELATION_ID_PREFIX: 'rage',
  RAGE_USER_AGENT: 'LibreChat-RAGE/1.0',

  // Feature Flags
  RAGE_ENABLE_CACHING: true,
  RAGE_ENABLE_METRICS: true,
  RAGE_ENABLE_AUDIT_LOG: false
};

/**
 * Environment-specific default overrides
 */
const EnvironmentDefaults = {
  development: {
    RAGE_DEBUG: true,
    RAGE_LOG_LEVEL: 'debug',
    RAGE_ENABLE_AUDIT_LOG: true
  },

  test: {
    RAGE_ENABLED: false,
    RAGE_DEBUG: false,
    RAGE_LOG_LEVEL: 'error',
    RAGE_TIMEOUT_MS: 1000,
    RAGE_ENABLE_CACHING: false,
    RAGE_ENABLE_METRICS: false
  },

  production: {
    RAGE_DEBUG: false,
    RAGE_LOG_LEVEL: 'info',
    RAGE_ENABLE_AUDIT_LOG: true,
    RAGE_ENABLE_METRICS: true
  }
};

/**
 * Gets default configuration for specified environment
 * @param {string} environment - Environment name (development, test, production)
 * @returns {Object} Default configuration object
 */
function getDefaults(environment = 'production') {
  const baseDefaults = { ...ConfigDefaults };
  const envDefaults = EnvironmentDefaults[environment] || {};
  
  return {
    ...baseDefaults,
    ...envDefaults
  };
}

/**
 * Performance-optimized defaults for high-load environments
 */
const PerformanceDefaults = {
  RAGE_TIMEOUT_MS: 3000,      // Faster timeout
  RAGE_RETRY_ATTEMPTS: 1,     // Fewer retries
  RAGE_NUM_RESULTS: 3,        // Fewer results
  RAGE_CACHE_TTL: 600,        // Longer cache
  RAGE_ENABLE_METRICS: false  // Disable metrics overhead
};

/**
 * Security-focused defaults for compliance environments
 */
const SecurityDefaults = {
  RAGE_DEBUG: false,
  RAGE_LOG_LEVEL: 'warn',
  RAGE_ENABLE_AUDIT_LOG: true,
  RAGE_ENABLE_METRICS: true
};

/**
 * Applies profile-specific defaults
 * @param {string} profile - Configuration profile (performance, security)
 * @param {Object} baseConfig - Base configuration
 * @returns {Object} Configuration with profile defaults applied
 */
function applyProfile(profile, baseConfig = {}) {
  let profileDefaults = {};
  
  switch (profile) {
    case 'performance':
      profileDefaults = PerformanceDefaults;
      break;
    case 'security':
      profileDefaults = SecurityDefaults;
      break;
    default:
      return baseConfig;
  }

  return {
    ...baseConfig,
    ...profileDefaults
  };
}

/**
 * Validates and provides recommendations for configuration values
 * @param {Object} config - Current configuration
 * @returns {Array} Array of recommendation objects
 */
function getRecommendations(config) {
  const recommendations = [];

  // Performance recommendations
  if (config.RAGE_TIMEOUT_MS > 10000) {
    recommendations.push({
      type: 'performance',
      field: 'RAGE_TIMEOUT_MS',
      message: 'Consider reducing timeout below 10 seconds to avoid blocking conversations',
      suggestion: 5000
    });
  }

  if (config.RAGE_NUM_RESULTS > 10) {
    recommendations.push({
      type: 'performance',
      field: 'RAGE_NUM_RESULTS',
      message: 'Large result sets may impact response time and token usage',
      suggestion: 5
    });
  }

  // Security recommendations
  if (config.RAGE_DEBUG && process.env.NODE_ENV === 'production') {
    recommendations.push({
      type: 'security',
      field: 'RAGE_DEBUG',
      message: 'Debug mode should be disabled in production environments',
      suggestion: false
    });
  }

  if (!config.RAGE_ENABLE_AUDIT_LOG && process.env.NODE_ENV === 'production') {
    recommendations.push({
      type: 'security',
      field: 'RAGE_ENABLE_AUDIT_LOG',
      message: 'Audit logging recommended for production compliance',
      suggestion: true
    });
  }

  // Functionality recommendations
  if (config.RAGE_MIN_RELEVANCE_SCORE < 0.5) {
    recommendations.push({
      type: 'quality',
      field: 'RAGE_MIN_RELEVANCE_SCORE',
      message: 'Low relevance threshold may include irrelevant results',
      suggestion: 0.7
    });
  }

  if (config.RAGE_CACHE_TTL === 0 && config.RAGE_ENABLED) {
    recommendations.push({
      type: 'performance',
      field: 'RAGE_CACHE_TTL',
      message: 'Caching disabled - consider enabling for better performance',
      suggestion: 300
    });
  }

  return recommendations;
}

module.exports = {
  ConfigDefaults,
  EnvironmentDefaults,
  PerformanceDefaults,
  SecurityDefaults,
  getDefaults,
  applyProfile,
  getRecommendations
};