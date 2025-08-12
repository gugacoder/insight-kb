const { rageLogger } = require('../logging/logger');
const { configManager } = require('../config');

/**
 * Context Formatter
 * 
 * Formats retrieved documents into optimal context strings for LLM consumption.
 * Handles multiple document types, source attribution, and formatting optimization.
 */
class ContextFormatter {
  constructor(options = {}) {
    this.config = configManager.getConfig();
    this.templates = {
      standard: this.getStandardTemplate(),
      detailed: this.getDetailedTemplate(),
      compact: this.getCompactTemplate()
    };
    
    this.maxContextLength = options.maxContextLength || this.config.RAGE_MAX_CONTEXT_LENGTH || 4000;
    this.includeMetadata = options.includeMetadata !== false;
    this.formatStyle = options.formatStyle || this.config.RAGE_FORMAT_STYLE || 'standard';
  }

  /**
   * Formats documents into context string
   * @param {Array} documents - Retrieved documents
   * @param {Object} options - Formatting options
   * @returns {Object} Formatted context with metadata
   */
  formatDocuments(documents, options = {}) {
    const correlationId = options.correlationId || rageLogger.generateCorrelationId();
    
    if (!documents || documents.length === 0) {
      return {
        context: '',
        tokenCount: 0,
        sources: [],
        relevanceScore: 0
      };
    }

    rageLogger.debug('Formatting documents', {
      documentCount: documents.length,
      formatStyle: this.formatStyle,
      maxLength: this.maxContextLength
    }, correlationId);

    try {
      // Sort documents by relevance score
      const sortedDocs = this.sortByRelevance(documents);
      
      // Apply template formatting
      const formattedSections = this.applyTemplate(sortedDocs, correlationId);
      
      // Combine sections
      const fullContext = this.combineFormattedSections(formattedSections);
      
      // Calculate metadata
      const metadata = this.calculateMetadata(sortedDocs, fullContext);
      
      rageLogger.debug('Context formatting completed', {
        originalDocs: documents.length,
        contextLength: fullContext.length,
        estimatedTokens: metadata.tokenCount
      }, correlationId);

      return {
        context: fullContext,
        tokenCount: metadata.tokenCount,
        sources: metadata.sources,
        relevanceScore: metadata.averageRelevance,
        documentCount: sortedDocs.length
      };

    } catch (error) {
      rageLogger.error('Context formatting failed', {
        error: error.message,
        documentCount: documents.length
      }, correlationId);
      
      // Fallback to simple formatting
      return this.formatSimple(documents);
    }
  }

  /**
   * Sorts documents by relevance score
   * @param {Array} documents - Documents to sort
   * @returns {Array} Sorted documents
   */
  sortByRelevance(documents) {
    return documents
      .slice() // Create copy to avoid mutation
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  /**
   * Applies formatting template to documents
   * @param {Array} documents - Sorted documents
   * @param {string} correlationId - Request correlation ID
   * @returns {Array} Formatted sections
   */
  applyTemplate(documents, correlationId) {
    const template = this.templates[this.formatStyle] || this.templates.standard;
    const sections = [];

    documents.forEach((doc, index) => {
      try {
        const section = this.formatSingleDocument(doc, index, template);
        if (section && section.trim()) {
          sections.push(section);
        }
      } catch (error) {
        rageLogger.warn('Failed to format document', {
          index,
          error: error.message,
          source: doc.metadata?.source
        }, correlationId);
      }
    });

    return sections;
  }

  /**
   * Formats a single document using the template
   * @param {Object} doc - Document to format
   * @param {number} index - Document index
   * @param {Object} template - Formatting template
   * @returns {string} Formatted document section
   */
  formatSingleDocument(doc, index, template) {
    const context = {
      index: index + 1,
      score: doc.score || 0,
      scorePercent: ((doc.score || 0) * 100).toFixed(1),
      text: this.sanitizeText(doc.text || ''),
      source: this.formatSource(doc.metadata),
      metadata: doc.metadata || {}
    };

    // Apply template replacements
    let formatted = template.documentFormat;
    
    Object.keys(context).forEach(key => {
      const placeholder = `{${key}}`;
      const value = typeof context[key] === 'object' 
        ? JSON.stringify(context[key]) 
        : String(context[key]);
      
      formatted = formatted.replace(new RegExp(placeholder, 'g'), value);
    });

    return formatted;
  }

  /**
   * Combines formatted sections into final context
   * @param {Array} sections - Formatted document sections
   * @returns {string} Complete context string
   */
  combineFormattedSections(sections) {
    if (sections.length === 0) {
      return '';
    }

    const template = this.templates[this.formatStyle] || this.templates.standard;
    
    // Build context with header and footer
    const contextParts = [
      template.header,
      ...sections,
      template.footer
    ].filter(part => part && part.trim());

    return contextParts.join('\n\n');
  }

  /**
   * Calculates metadata for the formatted context
   * @param {Array} documents - Original documents
   * @param {string} context - Formatted context
   * @returns {Object} Context metadata
   */
  calculateMetadata(documents, context) {
    const sources = [...new Set(
      documents
        .map(doc => doc.metadata?.source || 'Unknown')
        .filter(source => source !== 'Unknown')
    )];

    const averageRelevance = documents.length > 0
      ? documents.reduce((sum, doc) => sum + (doc.score || 0), 0) / documents.length
      : 0;

    // Rough token estimation (1 token ≈ 4 characters for English)
    const estimatedTokens = Math.ceil(context.length / 4);

    return {
      sources,
      averageRelevance,
      tokenCount: estimatedTokens
    };
  }

  /**
   * Sanitizes document text for safe inclusion
   * @param {string} text - Raw document text
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
      .replace(/\t/g, ' ')  // Replace tabs with spaces
      .replace(/[ ]{2,}/g, ' ')  // Collapse multiple spaces
      .trim();
  }

  /**
   * Formats source information from metadata
   * @param {Object} metadata - Document metadata
   * @returns {string} Formatted source string
   */
  formatSource(metadata) {
    if (!metadata) {
      return 'Unknown Source';
    }

    const parts = [];
    
    if (metadata.source) {
      parts.push(metadata.source);
    }
    
    if (metadata.page) {
      parts.push(`p. ${metadata.page}`);
    }
    
    if (metadata.section) {
      parts.push(`§ ${metadata.section}`);
    }

    if (metadata.timestamp) {
      const date = new Date(metadata.timestamp);
      if (!isNaN(date.getTime())) {
        parts.push(date.toLocaleDateString());
      }
    }

    return parts.length > 0 ? parts.join(' | ') : 'Unknown Source';
  }

  /**
   * Fallback simple formatting
   * @param {Array} documents - Documents to format
   * @returns {Object} Simple formatted result
   */
  formatSimple(documents) {
    const contextParts = ['**Relevant Context:**\n'];
    
    documents.forEach((doc, index) => {
      const source = doc.metadata?.source || 'Unknown';
      const score = ((doc.score || 0) * 100).toFixed(1);
      
      contextParts.push(`**${index + 1}. ${source}** (${score}%)`);
      contextParts.push((doc.text || '').trim());
      contextParts.push('');
    });

    const context = contextParts.join('\n');
    
    return {
      context,
      tokenCount: Math.ceil(context.length / 4),
      sources: [...new Set(documents.map(d => d.metadata?.source).filter(Boolean))],
      relevanceScore: documents.length > 0 
        ? documents.reduce((sum, d) => sum + (d.score || 0), 0) / documents.length 
        : 0
    };
  }

  /**
   * Gets standard formatting template
   * @returns {Object} Standard template
   */
  getStandardTemplate() {
    return {
      header: '# Relevant Context\n\nThe following information was retrieved from the knowledge base to help answer your question:',
      documentFormat: '## {index}. {source}\n**Relevance:** {scorePercent}%\n\n{text}',
      footer: '---\n\n*Please use the above context to inform your response when relevant. If the context doesn\'t contain sufficient information, please indicate that additional research may be needed.*'
    };
  }

  /**
   * Gets detailed formatting template
   * @returns {Object} Detailed template
   */
  getDetailedTemplate() {
    return {
      header: '# Knowledge Base Context\n\nRetrieved information to assist with your query:',
      documentFormat: '## Document {index}: {source}\n- **Relevance Score:** {scorePercent}%\n- **Metadata:** {metadata}\n\n### Content:\n{text}\n\n---',
      footer: '### Usage Instructions\nThe above context has been retrieved from verified knowledge sources. Please:\n1. Use this information to enhance your response accuracy\n2. Cite sources when directly referencing content\n3. Indicate if additional information beyond this context is needed'
    };
  }

  /**
   * Gets compact formatting template
   * @returns {Object} Compact template
   */
  getCompactTemplate() {
    return {
      header: '**Context:**',
      documentFormat: '[{index}] {source} ({scorePercent}%): {text}',
      footer: '*End of context*'
    };
  }

  /**
   * Updates formatter configuration
   * @param {Object} options - New configuration options
   */
  updateConfig(options) {
    if (options.maxContextLength !== undefined) {
      this.maxContextLength = options.maxContextLength;
    }
    
    if (options.formatStyle !== undefined) {
      this.formatStyle = options.formatStyle;
    }
    
    if (options.includeMetadata !== undefined) {
      this.includeMetadata = options.includeMetadata;
    }
    
    rageLogger.debug('Context formatter configuration updated', options);
  }

  /**
   * Gets current formatting statistics
   * @returns {Object} Formatter statistics
   */
  getStats() {
    return {
      maxContextLength: this.maxContextLength,
      formatStyle: this.formatStyle,
      includeMetadata: this.includeMetadata,
      availableTemplates: Object.keys(this.templates)
    };
  }
}

module.exports = {
  ContextFormatter
};