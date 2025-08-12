const { ConfigSchema } = require('./schema');

/**
 * Configuration Validator
 * 
 * Validates RAGE configuration against schema rules and provides
 * type coercion, range checking, and format validation.
 */
class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validates configuration object against schema
   * @param {Object} config - Raw configuration object
   * @returns {Object} Validation result with valid config or errors
   */
  validate(config) {
    this.errors = [];
    this.warnings = [];

    const validatedConfig = {};
    const schema = ConfigSchema;

    // Check required fields
    for (const [key, spec] of Object.entries(schema)) {
      const value = config[key];
      
      if (spec.required && (value === undefined || value === null || value === '')) {
        this.errors.push(`Required configuration missing: ${key}`);
        continue;
      }

      // Apply default if value is missing
      if (value === undefined || value === null || value === '') {
        if (spec.default !== undefined) {
          validatedConfig[key] = spec.default;
        }
        continue;
      }

      // Validate and coerce value
      const validatedValue = this.validateField(key, value, spec);
      if (validatedValue !== null) {
        validatedConfig[key] = validatedValue;
      }
    }

    return {
      isValid: this.errors.length === 0,
      config: validatedConfig,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Validates a single configuration field
   * @param {string} key - Configuration key
   * @param {any} value - Raw value
   * @param {Object} spec - Schema specification
   * @returns {any} Validated and coerced value or null if invalid
   */
  validateField(key, value, spec) {
    try {
      // Type coercion
      let coercedValue = this.coerceType(value, spec.type);
      
      if (coercedValue === null) {
        this.errors.push(`Invalid type for ${key}: expected ${spec.type}, got ${typeof value}`);
        return null;
      }

      // Type-specific validation
      switch (spec.type) {
        case 'string':
          coercedValue = this.validateString(key, coercedValue, spec);
          break;
        case 'number':
          coercedValue = this.validateNumber(key, coercedValue, spec);
          break;
        case 'boolean':
          // Boolean coercion is sufficient
          break;
        default:
          this.warnings.push(`Unknown type specification for ${key}: ${spec.type}`);
      }

      return coercedValue;
    } catch (error) {
      this.errors.push(`Validation error for ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Coerces value to specified type
   * @param {any} value - Raw value
   * @param {string} type - Target type
   * @returns {any} Coerced value or null if coercion fails
   */
  coerceType(value, type) {
    switch (type) {
      case 'string':
        return String(value);
        
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
        
      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on') return true;
          if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'off') return false;
        }
        if (typeof value === 'number') {
          return value !== 0;
        }
        return null;
        
      default:
        return value;
    }
  }

  /**
   * Validates string values
   * @param {string} key - Configuration key
   * @param {string} value - String value
   * @param {Object} spec - Field specification
   * @returns {string} Validated string
   */
  validateString(key, value, spec) {
    // Length validation
    if (spec.minLength && value.length < spec.minLength) {
      this.errors.push(`${key} too short: minimum ${spec.minLength} characters`);
      return null;
    }
    
    if (spec.maxLength && value.length > spec.maxLength) {
      this.errors.push(`${key} too long: maximum ${spec.maxLength} characters`);
      return null;
    }

    // Enum validation
    if (spec.enum && !spec.enum.includes(value)) {
      this.errors.push(`${key} invalid value: must be one of [${spec.enum.join(', ')}]`);
      return null;
    }

    // Format validation
    if (spec.validation) {
      if (!this.validateFormat(key, value, spec.validation)) {
        return null;
      }
    }

    return value;
  }

  /**
   * Validates number values
   * @param {string} key - Configuration key
   * @param {number} value - Number value
   * @param {Object} spec - Field specification
   * @returns {number} Validated number
   */
  validateNumber(key, value, spec) {
    // Range validation
    if (spec.min !== undefined && value < spec.min) {
      this.errors.push(`${key} too small: minimum value is ${spec.min}`);
      return null;
    }
    
    if (spec.max !== undefined && value > spec.max) {
      this.errors.push(`${key} too large: maximum value is ${spec.max}`);
      return null;
    }

    // Integer validation
    if (spec.integer && !Number.isInteger(value)) {
      this.errors.push(`${key} must be an integer`);
      return null;
    }

    return value;
  }

  /**
   * Validates string formats
   * @param {string} key - Configuration key
   * @param {string} value - String value
   * @param {string} format - Format type
   * @returns {boolean} Whether format is valid
   */
  validateFormat(key, value, format) {
    switch (format) {
      case 'url':
        return this.validateUrl(key, value);
        
      case 'uuid':
        return this.validateUuid(key, value);
        
      case 'jwt':
        return this.validateJwt(key, value);
        
      case 'alphanumeric':
        return this.validateAlphanumeric(key, value);
        
      default:
        this.warnings.push(`Unknown validation format for ${key}: ${format}`);
        return true;
    }
  }

  /**
   * Validates URL format
   * @param {string} key - Configuration key
   * @param {string} value - URL value
   * @returns {boolean} Whether URL is valid
   */
  validateUrl(key, value) {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        this.errors.push(`${key} must use HTTP or HTTPS protocol`);
        return false;
      }
      return true;
    } catch (error) {
      this.errors.push(`${key} is not a valid URL: ${error.message}`);
      return false;
    }
  }

  /**
   * Validates UUID format
   * @param {string} key - Configuration key
   * @param {string} value - UUID value
   * @returns {boolean} Whether UUID is valid
   */
  validateUuid(key, value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      this.errors.push(`${key} is not a valid UUID format`);
      return false;
    }
    return true;
  }

  /**
   * Validates JWT token format
   * @param {string} key - Configuration key
   * @param {string} value - JWT value
   * @returns {boolean} Whether JWT format is valid
   */
  validateJwt(key, value) {
    const jwtParts = value.split('.');
    if (jwtParts.length !== 3) {
      this.errors.push(`${key} is not a valid JWT format (must have 3 parts separated by dots)`);
      return false;
    }

    // Basic base64 validation for each part
    for (let i = 0; i < jwtParts.length; i++) {
      if (!/^[A-Za-z0-9_-]+$/.test(jwtParts[i])) {
        this.errors.push(`${key} contains invalid characters in JWT part ${i + 1}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Validates alphanumeric format
   * @param {string} key - Configuration key
   * @param {string} value - Alphanumeric value
   * @returns {boolean} Whether value is alphanumeric
   */
  validateAlphanumeric(key, value) {
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      this.errors.push(`${key} must contain only letters, numbers, underscores, and hyphens`);
      return false;
    }
    return true;
  }

  /**
   * Validates that RAGE is properly configured when enabled
   * @param {Object} config - Validated configuration
   * @returns {Object} Additional validation result
   */
  validateRageEnabled(config) {
    if (!config.RAGE_ENABLED) {
      return { isValid: true, warnings: ['RAGE is disabled'] };
    }

    const requiredForEnabled = [
      'RAGE_VECTORIZE_URI',
      'RAGE_VECTORIZE_ORGANIZATION_ID',
      'RAGE_VECTORIZE_PIPELINE_ID',
      'RAGE_VECTORIZE_API_KEY'
    ];

    const missingRequired = requiredForEnabled.filter(key => !config[key]);
    
    if (missingRequired.length > 0) {
      return {
        isValid: false,
        errors: [`RAGE is enabled but missing required configuration: ${missingRequired.join(', ')}`]
      };
    }

    return { isValid: true };
  }

  /**
   * Gets human-readable error summary
   * @returns {string} Error summary
   */
  getErrorSummary() {
    if (this.errors.length === 0) {
      return 'Configuration is valid';
    }

    const summary = [
      `Found ${this.errors.length} configuration error(s):`,
      ...this.errors.map(err => `  - ${err}`)
    ];

    if (this.warnings.length > 0) {
      summary.push('');
      summary.push(`Warnings (${this.warnings.length}):`);
      summary.push(...this.warnings.map(warn => `  - ${warn}`));
    }

    return summary.join('\\n');
  }
}

module.exports = {
  ConfigValidator
};