const { ConfigValidator } = require('./validator');
const { getDefaults, applyProfile, getRecommendations } = require('./defaults');
// Use local logger instead of LibreChat's winston
const { rageLogger } = require('../logging/logger');

/**
 * RAGE Configuration Manager
 * 
 * Central configuration management system for RAGE Interceptor.
 * Handles loading, validation, and processing of environment variables.
 */
class ConfigManager {
  constructor() {
    this.config = null;
    this.validator = new ConfigValidator();
    this.isInitialized = false;
  }

  /**
   * Initializes configuration from environment variables
   * @param {Object} options - Initialization options
   * @returns {Object} Initialized configuration
   */
  initialize(options = {}) {
    const {
      environment = process.env.NODE_ENV || 'production',
      profile = process.env.RAGE_CONFIG_PROFILE,
      validateOnly = false
    } = options;

    try {
      // Load raw environment variables
      const rawConfig = this.loadEnvironmentVariables();
      
      // Apply defaults
      const defaultConfig = getDefaults(environment);
      const configWithDefaults = { ...defaultConfig, ...rawConfig };
      
      // Apply profile if specified
      const profileConfig = profile ? 
        applyProfile(profile, configWithDefaults) : 
        configWithDefaults;

      // Validate configuration
      const validation = this.validator.validate(profileConfig);
      
      if (!validation.isValid) {
        const errorSummary = this.validator.getErrorSummary();
        rageLogger.error('RAGE configuration validation failed', {
          errors: validation.errors,
          warnings: validation.warnings
        });
        throw new Error(`Configuration validation failed:\\n${errorSummary}`);
      }

      // Additional RAGE-specific validation
      const rageValidation = this.validator.validateRageEnabled(validation.config);
      if (!rageValidation.isValid) {
        rageLogger.error('RAGE enabled validation failed', {
          errors: rageValidation.errors
        });
        throw new Error(`RAGE configuration invalid: ${rageValidation.errors.join(', ')}`);
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        rageLogger.warn('RAGE configuration warnings', {
          warnings: validation.warnings
        });
      }

      // Provide recommendations
      const recommendations = getRecommendations(validation.config);
      if (recommendations.length > 0) {
        rageLogger.info('RAGE configuration recommendations', {
          recommendations: recommendations.map(r => ({
            type: r.type,
            field: r.field,
            message: r.message
          }))
        });
      }

      if (!validateOnly) {
        this.config = validation.config;
        this.isInitialized = true;
        
        // Inject configuration into logger to avoid circular dependency
        rageLogger.updateConfig(this.config);
        
        rageLogger.info('RAGE configuration initialized successfully', {
          environment,
          profile,
          enabled: this.config.RAGE_ENABLED,
          features: {
            caching: this.config.RAGE_ENABLE_CACHING,
            metrics: this.config.RAGE_ENABLE_METRICS,
            auditLog: this.config.RAGE_ENABLE_AUDIT_LOG
          }
        });
      }

      return validation.config;

    } catch (error) {
      rageLogger.error('Failed to initialize RAGE configuration', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Loads configuration from environment variables
   * @returns {Object} Raw configuration object
   */
  loadEnvironmentVariables() {
    const envConfig = {};
    const envPrefix = 'RAGE_';
    
    // Special handling for non-prefixed required variables
    const specialVariables = {
      'VECTORIZE_API_URL': 'RAGE_VECTORIZE_URI',
      'VECTORIZE_ORG_ID': 'RAGE_VECTORIZE_ORGANIZATION_ID',
      'VECTORIZE_PIPELINE_ID': 'RAGE_VECTORIZE_PIPELINE_ID',
      'VECTORIZE_JWT_TOKEN': 'RAGE_VECTORIZE_API_KEY'
    };

    // Load RAGE-prefixed variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith(envPrefix)) {
        envConfig[key] = process.env[key];
      }
    });

    // Load special variables with mapping
    Object.entries(specialVariables).forEach(([envKey, configKey]) => {
      if (process.env[envKey] && !envConfig[configKey]) {
        envConfig[configKey] = process.env[envKey];
      }
    });

    return envConfig;
  }

  /**
   * Gets current configuration
   * @param {boolean} includeSecrets - Whether to include sensitive values
   * @returns {Object} Current configuration
   */
  getConfig(includeSecrets = false) {
    if (!this.isInitialized) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }

    if (includeSecrets) {
      return { ...this.config };
    }

    // Return sanitized configuration
    const sanitized = { ...this.config };
    
    // Mask sensitive values
    if (sanitized.RAGE_VECTORIZE_API_KEY) {
      sanitized.RAGE_VECTORIZE_API_KEY = this.maskSecret(sanitized.RAGE_VECTORIZE_API_KEY);
    }

    return sanitized;
  }

  /**
   * Gets a specific configuration value
   * @param {string} key - Configuration key
   * @param {any} defaultValue - Default value if key not found
   * @returns {any} Configuration value
   */
  get(key, defaultValue = undefined) {
    if (!this.isInitialized) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }

    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  /**
   * Checks if RAGE is enabled and properly configured
   * @returns {boolean} Whether RAGE is ready to use
   */
  isRageEnabled() {
    if (!this.isInitialized) {
      return false;
    }

    return this.config.RAGE_ENABLED === true;
  }

  /**
   * Validates configuration without initializing
   * @param {string} environment - Environment to validate for
   * @returns {Object} Validation result
   */
  validateConfiguration(environment = 'production') {
    try {
      this.initialize({ environment, validateOnly: true });
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Reloads configuration from environment
   * @param {Object} options - Reload options
   * @returns {Object} New configuration
   */
  reload(options = {}) {
    rageLogger.info('Reloading RAGE configuration');
    this.isInitialized = false;
    this.config = null;
    return this.initialize(options);
  }

  /**
   * Gets configuration summary for diagnostics
   * @returns {Object} Configuration summary
   */
  getSummary() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' };
    }

    return {
      status: 'initialized',
      enabled: this.config.RAGE_ENABLED,
      environment: process.env.NODE_ENV || 'unknown',
      features: {
        caching: this.config.RAGE_ENABLE_CACHING,
        metrics: this.config.RAGE_ENABLE_METRICS,
        auditLog: this.config.RAGE_ENABLE_AUDIT_LOG,
        debug: this.config.RAGE_DEBUG
      },
      performance: {
        timeout: this.config.RAGE_TIMEOUT_MS,
        maxResults: this.config.RAGE_NUM_RESULTS,
        retryAttempts: this.config.RAGE_RETRY_ATTEMPTS,
        cacheTtl: this.config.RAGE_CACHE_TTL
      },
      api: {
        hasApiKey: !!this.config.RAGE_VECTORIZE_API_KEY,
        hasOrgId: !!this.config.RAGE_VECTORIZE_ORGANIZATION_ID,
        hasPipelineId: !!this.config.RAGE_VECTORIZE_PIPELINE_ID,
        hasUri: !!this.config.RAGE_VECTORIZE_URI
      }
    };
  }

  /**
   * Masks sensitive configuration values for logging
   * @param {string} secret - Secret value to mask
   * @returns {string} Masked secret
   */
  maskSecret(secret) {
    if (!secret || typeof secret !== 'string') {
      return '[invalid]';
    }

    if (secret.length <= 8) {
      return '***';
    }

    return secret.substring(0, 4) + '***' + secret.substring(secret.length - 4);
  }

  /**
   * Exports configuration as environment variables
   * @param {boolean} includeSecrets - Whether to include sensitive values
   * @returns {Object} Environment variables object
   */
  exportEnv(includeSecrets = false) {
    const config = this.getConfig(includeSecrets);
    const envVars = {};

    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        envVars[key] = String(value);
      }
    });

    return envVars;
  }
}

// Create singleton instance
const configManager = new ConfigManager();

module.exports = {
  ConfigManager,
  configManager
};