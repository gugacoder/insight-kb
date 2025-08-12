const { rageLogger } = require('../logging/logger');
const { configManager } = require('../config');

/**
 * Token Optimizer
 * 
 * Manages context size and token usage to fit within LLM limits.
 * Provides intelligent truncation and optimization strategies.
 */
class TokenOptimizer {
  constructor(options = {}) {
    this.config = configManager.getConfig();
    
    this.maxTokens = options.maxTokens || this.config.RAGE_MAX_TOKENS || 3000;
    this.bufferTokens = options.bufferTokens || this.config.RAGE_TOKEN_BUFFER || 200;
    this.targetTokens = this.maxTokens - this.bufferTokens;
    
    // Token estimation ratios for different languages
    this.tokenRatios = {
      english: 4.0,    // ~4 characters per token
      spanish: 4.2,    // Slightly higher for Spanish
      portuguese: 4.3, // Portuguese tends to be longer
      french: 4.1,     // French is between English and Spanish
      default: 4.2     // Conservative default
    };
    
    this.preservePriority = {
      high: ['title', 'summary', 'introduction', 'conclusion'],
      medium: ['description', 'overview', 'definition'],
      low: ['example', 'note', 'detail', 'appendix']
    };
  }

  /**
   * Optimizes context to fit within token limits
   * @param {string} context - Full context string
   * @param {Array} documents - Original documents
   * @param {Object} options - Optimization options
   * @returns {Object} Optimized context result
   */
  optimizeContext(context, documents = [], options = {}) {
    const correlationId = options.correlationId || rageLogger.generateCorrelationId();
    
    if (!context) {
      return {
        optimizedContext: '',
        tokenCount: 0,
        compressionRatio: 0,
        truncated: false
      };
    }

    const originalTokens = this.estimateTokens(context, options.language);
    
    rageLogger.debug('Starting token optimization', {
      originalLength: context.length,
      estimatedTokens: originalTokens,
      targetTokens: this.targetTokens,
      maxTokens: this.maxTokens
    }, correlationId);

    try {
      // If already within limits, return as-is
      if (originalTokens <= this.targetTokens) {
        return {
          optimizedContext: context,
          tokenCount: originalTokens,
          compressionRatio: 1.0,
          truncated: false,
          documentsIncluded: documents.length
        };
      }

      // Apply optimization strategies
      let optimizedContext = context;
      let strategy = 'none';

      // Strategy 1: Smart truncation by documents
      if (documents.length > 0) {
        const result = this.optimizeByDocuments(documents, options);
        optimizedContext = result.context;
        strategy = 'document_selection';
      } else {
        // Strategy 2: Intelligent text truncation
        optimizedContext = this.optimizeByTextTruncation(context, options);
        strategy = 'text_truncation';
      }

      const finalTokens = this.estimateTokens(optimizedContext, options.language);
      const compressionRatio = originalTokens > 0 ? finalTokens / originalTokens : 1.0;

      rageLogger.debug('Token optimization completed', {
        strategy,
        originalTokens,
        finalTokens,
        compressionRatio: compressionRatio.toFixed(3),
        truncated: finalTokens < originalTokens
      }, correlationId);

      return {
        optimizedContext,
        tokenCount: finalTokens,
        compressionRatio,
        truncated: finalTokens < originalTokens,
        strategy,
        documentsIncluded: this.countDocumentsInContext(optimizedContext)
      };

    } catch (error) {
      rageLogger.error('Token optimization failed', {
        error: error.message,
        originalLength: context.length
      }, correlationId);
      
      // Fallback: simple truncation
      return this.fallbackTruncation(context, options);
    }
  }

  /**
   * Optimizes by selecting and formatting documents that fit within limits
   * @param {Array} documents - Documents to optimize
   * @param {Object} options - Optimization options
   * @returns {Object} Optimization result
   */
  optimizeByDocuments(documents, options) {
    const correlationId = options.correlationId;
    const sortedDocs = documents.sort((a, b) => (b.enhancedScore || b.score || 0) - (a.enhancedScore || a.score || 0));
    
    let includedDocs = [];
    let runningTokens = 0;
    
    // Estimate overhead for headers and formatting
    const overheadTokens = this.estimateFormattingOverhead();
    runningTokens += overheadTokens;

    for (const doc of sortedDocs) {
      const docText = this.extractOptimalText(doc);
      const docTokens = this.estimateTokens(docText, options.language);
      
      if (runningTokens + docTokens <= this.targetTokens) {
        includedDocs.push({
          ...doc,
          optimizedText: docText,
          estimatedTokens: docTokens
        });
        runningTokens += docTokens;
      } else {
        // Try to fit a truncated version
        const maxAvailableTokens = this.targetTokens - runningTokens;
        if (maxAvailableTokens > 100) { // Only if there's meaningful space
          const truncatedText = this.truncateToTokenLimit(docText, maxAvailableTokens, options.language);
          if (truncatedText.length > 50) { // Only if meaningful content remains
            includedDocs.push({
              ...doc,
              optimizedText: truncatedText,
              estimatedTokens: this.estimateTokens(truncatedText, options.language),
              truncated: true
            });
            break; // This was the last document we could fit
          }
        }
      }
    }

    rageLogger.debug('Document-based optimization', {
      originalDocs: documents.length,
      includedDocs: includedDocs.length,
      estimatedTokens: runningTokens
    }, correlationId);

    // Format the included documents
    const context = this.formatOptimizedDocuments(includedDocs);
    
    return {
      context,
      documentsIncluded: includedDocs.length,
      documentsDropped: documents.length - includedDocs.length
    };
  }

  /**
   * Optimizes by intelligently truncating text
   * @param {string} context - Context to truncate
   * @param {Object} options - Optimization options
   * @returns {string} Truncated context
   */
  optimizeByTextTruncation(context, options) {
    // Split context into logical sections
    const sections = this.splitIntoSections(context);
    
    let optimizedSections = [];
    let runningTokens = 0;

    for (const section of sections) {
      const sectionTokens = this.estimateTokens(section.text, options.language);
      
      if (runningTokens + sectionTokens <= this.targetTokens) {
        optimizedSections.push(section);
        runningTokens += sectionTokens;
      } else {
        // Try to fit a truncated version of this section
        const maxAvailableTokens = this.targetTokens - runningTokens;
        if (maxAvailableTokens > 50) {
          const truncatedText = this.truncateToTokenLimit(section.text, maxAvailableTokens, options.language);
          if (truncatedText.length > 0) {
            optimizedSections.push({
              ...section,
              text: truncatedText,
              truncated: true
            });
          }
        }
        break;
      }
    }

    return optimizedSections.map(s => s.text).join('\n\n');
  }

  /**
   * Estimates token count for text
   * @param {string} text - Text to analyze
   * @param {string} language - Language hint
   * @returns {number} Estimated token count
   */
  estimateTokens(text, language = 'default') {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    const ratio = this.tokenRatios[language] || this.tokenRatios.default;
    return Math.ceil(text.length / ratio);
  }

  /**
   * Truncates text to fit within token limit
   * @param {string} text - Text to truncate
   * @param {number} maxTokens - Maximum tokens allowed
   * @param {string} language - Language hint
   * @returns {string} Truncated text
   */
  truncateToTokenLimit(text, maxTokens, language = 'default') {
    if (!text) return '';
    
    const ratio = this.tokenRatios[language] || this.tokenRatios.default;
    const maxChars = Math.floor(maxTokens * ratio);
    
    if (text.length <= maxChars) {
      return text;
    }

    // Truncate at sentence boundary if possible
    const truncated = text.substring(0, maxChars);
    const lastSentence = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    
    const cutPoint = Math.max(lastSentence, lastNewline);
    
    if (cutPoint > maxChars * 0.8) { // Only if we're not losing too much content
      return truncated.substring(0, cutPoint + 1).trim() + '...';
    }
    
    return truncated.trim() + '...';
  }

  /**
   * Extracts optimal text from a document
   * @param {Object} doc - Document object
   * @returns {string} Optimal text for inclusion
   */
  extractOptimalText(doc) {
    if (!doc.text) return '';
    
    // For now, return the full text
    // Future enhancement: extract key sentences, remove redundancy
    return doc.text.trim();
  }

  /**
   * Estimates formatting overhead tokens
   * @returns {number} Overhead token estimate
   */
  estimateFormattingOverhead() {
    // Headers, separators, instructions
    return 100;
  }

  /**
   * Splits context into logical sections
   * @param {string} context - Context to split
   * @returns {Array} Array of section objects
   */
  splitIntoSections(context) {
    const sections = [];
    
    // Split by headers (## or **) and paragraphs
    const parts = context.split(/(?=^##|^\*\*|^\n\n)/m);
    
    parts.forEach((part, index) => {
      if (part.trim()) {
        sections.push({
          index,
          text: part.trim(),
          priority: this.getSectionPriority(part),
          type: this.getSectionType(part)
        });
      }
    });
    
    return sections;
  }

  /**
   * Gets section priority based on content
   * @param {string} text - Section text
   * @returns {string} Priority level
   */
  getSectionPriority(text) {
    const lowerText = text.toLowerCase();
    
    for (const keyword of this.preservePriority.high) {
      if (lowerText.includes(keyword)) {
        return 'high';
      }
    }
    
    for (const keyword of this.preservePriority.medium) {
      if (lowerText.includes(keyword)) {
        return 'medium';
      }
    }
    
    return 'low';
  }

  /**
   * Gets section type
   * @param {string} text - Section text
   * @returns {string} Section type
   */
  getSectionType(text) {
    if (text.startsWith('##')) return 'header';
    if (text.startsWith('**')) return 'emphasis';
    return 'content';
  }

  /**
   * Formats optimized documents
   * @param {Array} documents - Optimized documents
   * @returns {string} Formatted context
   */
  formatOptimizedDocuments(documents) {
    if (!documents || documents.length === 0) {
      return '';
    }

    const parts = ['# Relevant Context\n'];
    
    documents.forEach((doc, index) => {
      const source = doc.metadata?.source || 'Unknown Source';
      const score = ((doc.enhancedScore || doc.score || 0) * 100).toFixed(1);
      
      parts.push(`## ${index + 1}. ${source}`);
      parts.push(`**Relevance:** ${score}%`);
      
      if (doc.truncated) {
        parts.push('*(Content truncated for space)*');
      }
      
      parts.push('');
      parts.push(doc.optimizedText || doc.text || '');
      parts.push('');
    });
    
    parts.push('---');
    parts.push('*Use the above context to inform your response.*');
    
    return parts.join('\n');
  }

  /**
   * Counts documents in formatted context
   * @param {string} context - Formatted context
   * @returns {number} Document count
   */
  countDocumentsInContext(context) {
    if (!context) return 0;
    
    // Count document headers (##)
    const matches = context.match(/^## \d+\./gm);
    return matches ? matches.length : 0;
  }

  /**
   * Fallback truncation when optimization fails
   * @param {string} context - Context to truncate
   * @param {Object} options - Options
   * @returns {Object} Fallback result
   */
  fallbackTruncation(context, options) {
    const maxChars = Math.floor(this.targetTokens * (this.tokenRatios[options.language] || this.tokenRatios.default));
    const truncated = context.length > maxChars 
      ? context.substring(0, maxChars).trim() + '...' 
      : context;
    
    return {
      optimizedContext: truncated,
      tokenCount: this.estimateTokens(truncated, options.language),
      compressionRatio: context.length > 0 ? truncated.length / context.length : 1.0,
      truncated: truncated.length < context.length,
      strategy: 'fallback_truncation'
    };
  }

  /**
   * Updates optimizer configuration
   * @param {Object} options - New configuration
   */
  updateConfig(options) {
    if (options.maxTokens !== undefined) {
      this.maxTokens = options.maxTokens;
      this.targetTokens = this.maxTokens - this.bufferTokens;
    }
    
    if (options.bufferTokens !== undefined) {
      this.bufferTokens = options.bufferTokens;
      this.targetTokens = this.maxTokens - this.bufferTokens;
    }
    
    if (options.tokenRatios) {
      this.tokenRatios = { ...this.tokenRatios, ...options.tokenRatios };
    }
    
    rageLogger.debug('Token optimizer configuration updated', {
      maxTokens: this.maxTokens,
      targetTokens: this.targetTokens,
      bufferTokens: this.bufferTokens
    });
  }

  /**
   * Gets optimizer statistics
   * @returns {Object} Optimizer stats
   */
  getStats() {
    return {
      maxTokens: this.maxTokens,
      targetTokens: this.targetTokens,
      bufferTokens: this.bufferTokens,
      tokenRatios: this.tokenRatios
    };
  }

  /**
   * Analyzes token usage for a context
   * @param {string} context - Context to analyze
   * @param {string} language - Language hint
   * @returns {Object} Token analysis
   */
  analyzeTokenUsage(context, language = 'default') {
    if (!context) {
      return {
        characterCount: 0,
        estimatedTokens: 0,
        utilizationRatio: 0,
        fitsInLimit: true
      };
    }

    const characterCount = context.length;
    const estimatedTokens = this.estimateTokens(context, language);
    const utilizationRatio = estimatedTokens / this.targetTokens;
    const fitsInLimit = estimatedTokens <= this.targetTokens;

    return {
      characterCount,
      estimatedTokens,
      utilizationRatio,
      fitsInLimit,
      tokensOverLimit: Math.max(0, estimatedTokens - this.targetTokens),
      compressionNeeded: !fitsInLimit ? (estimatedTokens - this.targetTokens) / estimatedTokens : 0
    };
  }
}

module.exports = {
  TokenOptimizer
};