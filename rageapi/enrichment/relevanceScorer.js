const { rageLogger } = require('../logging/logger');
const { configManager } = require('../config');

/**
 * Relevance Scorer
 * 
 * Enhances and refines relevance scores from vector database results.
 * Applies additional scoring algorithms and filtering logic.
 */
class RelevanceScorer {
  constructor(options = {}) {
    this.config = configManager.getConfig();
    
    this.minRelevanceScore = options.minRelevanceScore || this.config.RAGE_MIN_RELEVANCE_SCORE || 0.7;
    this.scoreBoosts = options.scoreBoosts || {
      recency: 0.1,        // Boost for recent documents
      exactMatch: 0.15,    // Boost for exact keyword matches
      sourceQuality: 0.1,  // Boost for high-quality sources
      completeness: 0.05   // Boost for complete documents
    };
    
    this.qualitySources = options.qualitySources || [
      'documentation',
      'official',
      'manual',
      'specification',
      'guide'
    ];
  }

  /**
   * Scores and filters documents based on relevance
   * @param {Array} documents - Documents from vector search
   * @param {string} originalQuery - Original search query
   * @param {Object} options - Scoring options
   * @returns {Array} Scored and filtered documents
   */
  scoreAndFilter(documents, originalQuery, options = {}) {
    const correlationId = options.correlationId || rageLogger.generateCorrelationId();
    
    if (!documents || documents.length === 0) {
      return [];
    }

    rageLogger.debug('Starting relevance scoring', {
      documentCount: documents.length,
      originalQuery: originalQuery?.substring(0, 100),
      minScore: this.minRelevanceScore
    }, correlationId);

    try {
      // Apply enhanced scoring
      const scoredDocuments = documents.map(doc => this.enhanceScore(doc, originalQuery, correlationId));
      
      // Filter by minimum relevance score
      const filteredDocuments = scoredDocuments.filter(doc => 
        doc.enhancedScore >= this.minRelevanceScore
      );
      
      // Sort by enhanced score
      const sortedDocuments = filteredDocuments.sort((a, b) => b.enhancedScore - a.enhancedScore);
      
      // Apply diversity filtering to avoid too many similar results
      const diversifiedDocuments = this.applyDiversityFilter(sortedDocuments, correlationId);
      
      rageLogger.debug('Relevance scoring completed', {
        originalCount: documents.length,
        scoredCount: scoredDocuments.length,
        filteredCount: filteredDocuments.length,
        finalCount: diversifiedDocuments.length
      }, correlationId);

      return diversifiedDocuments;

    } catch (error) {
      rageLogger.error('Relevance scoring failed', {
        error: error.message,
        documentCount: documents.length
      }, correlationId);
      
      // Fallback to original filtering
      return documents.filter(doc => (doc.score || 0) >= this.minRelevanceScore);
    }
  }

  /**
   * Enhances the relevance score of a document
   * @param {Object} doc - Document to score
   * @param {string} query - Original search query
   * @param {string} correlationId - Request correlation ID
   * @returns {Object} Document with enhanced score
   */
  enhanceScore(doc, query, correlationId) {
    const originalScore = doc.score || 0;
    let enhancedScore = originalScore;
    const boostDetails = {};

    try {
      // Apply recency boost
      const recencyBoost = this.calculateRecencyBoost(doc.metadata);
      enhancedScore += recencyBoost;
      boostDetails.recency = recencyBoost;

      // Apply exact match boost
      const exactMatchBoost = this.calculateExactMatchBoost(doc.text, query);
      enhancedScore += exactMatchBoost;
      boostDetails.exactMatch = exactMatchBoost;

      // Apply source quality boost
      const sourceQualityBoost = this.calculateSourceQualityBoost(doc.metadata);
      enhancedScore += sourceQualityBoost;
      boostDetails.sourceQuality = sourceQualityBoost;

      // Apply completeness boost
      const completenessBoost = this.calculateCompletenessBoost(doc);
      enhancedScore += completenessBoost;
      boostDetails.completeness = completenessBoost;

      // Ensure score doesn't exceed 1.0
      enhancedScore = Math.min(enhancedScore, 1.0);

      return {
        ...doc,
        enhancedScore,
        originalScore,
        scoreBoosts: boostDetails,
        scoreImprovement: enhancedScore - originalScore
      };

    } catch (error) {
      rageLogger.warn('Score enhancement failed for document', {
        error: error.message,
        originalScore,
        source: doc.metadata?.source
      }, correlationId);
      
      return {
        ...doc,
        enhancedScore: originalScore,
        originalScore,
        scoreBoosts: {},
        scoreImprovement: 0
      };
    }
  }

  /**
   * Calculates recency boost based on document timestamp
   * @param {Object} metadata - Document metadata
   * @returns {number} Recency boost value
   */
  calculateRecencyBoost(metadata) {
    if (!metadata?.timestamp) {
      return 0;
    }

    try {
      const docDate = new Date(metadata.timestamp);
      const now = new Date();
      const ageInDays = (now - docDate) / (1000 * 60 * 60 * 24);
      
      // Documents less than 30 days old get full boost
      if (ageInDays <= 30) {
        return this.scoreBoosts.recency;
      }
      
      // Documents less than 90 days old get partial boost
      if (ageInDays <= 90) {
        return this.scoreBoosts.recency * 0.5;
      }
      
      // Documents less than 180 days old get minimal boost
      if (ageInDays <= 180) {
        return this.scoreBoosts.recency * 0.2;
      }
      
      return 0;
      
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculates exact match boost based on keyword presence
   * @param {string} text - Document text
   * @param {string} query - Search query
   * @returns {number} Exact match boost value
   */
  calculateExactMatchBoost(text, query) {
    if (!text || !query) {
      return 0;
    }

    try {
      const normalizedText = text.toLowerCase();
      const normalizedQuery = query.toLowerCase();
      
      // Check for exact phrase match
      if (normalizedText.includes(normalizedQuery)) {
        return this.scoreBoosts.exactMatch;
      }
      
      // Check for keyword matches
      const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 2);
      const matchedWords = queryWords.filter(word => normalizedText.includes(word));
      
      if (matchedWords.length === 0) {
        return 0;
      }
      
      // Partial boost based on word match percentage
      const matchRatio = matchedWords.length / queryWords.length;
      return this.scoreBoosts.exactMatch * matchRatio * 0.7; // 70% of full boost for partial matches
      
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculates source quality boost
   * @param {Object} metadata - Document metadata
   * @returns {number} Source quality boost value
   */
  calculateSourceQualityBoost(metadata) {
    if (!metadata?.source) {
      return 0;
    }

    try {
      const source = metadata.source.toLowerCase();
      
      // Check if source contains quality indicators
      const hasQualityIndicator = this.qualitySources.some(indicator => 
        source.includes(indicator)
      );
      
      if (hasQualityIndicator) {
        return this.scoreBoosts.sourceQuality;
      }
      
      // Check for file extensions that indicate structured content
      if (source.match(/\.(pdf|docx?|md|txt)$/i)) {
        return this.scoreBoosts.sourceQuality * 0.5;
      }
      
      return 0;
      
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculates completeness boost based on document length and structure
   * @param {Object} doc - Document object
   * @returns {number} Completeness boost value
   */
  calculateCompletenessBoost(doc) {
    if (!doc.text) {
      return 0;
    }

    try {
      const textLength = doc.text.length;
      
      // Very short snippets get no boost
      if (textLength < 50) {
        return 0;
      }
      
      // Documents with good length get boost
      if (textLength >= 200 && textLength <= 2000) {
        return this.scoreBoosts.completeness;
      }
      
      // Partial boost for shorter but substantial content
      if (textLength >= 100) {
        return this.scoreBoosts.completeness * 0.5;
      }
      
      return 0;
      
    } catch (error) {
      return 0;
    }
  }

  /**
   * Applies diversity filter to avoid too many similar results
   * @param {Array} documents - Sorted documents
   * @param {string} correlationId - Request correlation ID
   * @returns {Array} Diversified documents
   */
  applyDiversityFilter(documents, correlationId) {
    if (documents.length <= 3) {
      return documents; // No need to diversify small result sets
    }

    try {
      const diversified = [];
      const usedSources = new Set();
      const maxPerSource = 2; // Maximum documents per source
      
      for (const doc of documents) {
        const source = doc.metadata?.source || 'unknown';
        const sourceCount = Array.from(usedSources).filter(s => s === source).length;
        
        if (sourceCount < maxPerSource) {
          diversified.push(doc);
          usedSources.add(source);
          
          // Stop when we have enough diverse results
          if (diversified.length >= this.config.RAGE_NUM_RESULTS) {
            break;
          }
        }
      }
      
      // If we don't have enough diverse results, fill with remaining high-scoring docs
      if (diversified.length < this.config.RAGE_NUM_RESULTS) {
        for (const doc of documents) {
          if (!diversified.includes(doc) && diversified.length < this.config.RAGE_NUM_RESULTS) {
            diversified.push(doc);
          }
        }
      }
      
      rageLogger.debug('Applied diversity filter', {
        originalCount: documents.length,
        diversifiedCount: diversified.length,
        uniqueSources: new Set(diversified.map(d => d.metadata?.source)).size
      }, correlationId);
      
      return diversified;
      
    } catch (error) {
      rageLogger.warn('Diversity filtering failed', {
        error: error.message
      }, correlationId);
      
      // Fallback to taking top N results
      return documents.slice(0, this.config.RAGE_NUM_RESULTS);
    }
  }

  /**
   * Updates scorer configuration
   * @param {Object} options - New configuration options
   */
  updateConfig(options) {
    if (options.minRelevanceScore !== undefined) {
      this.minRelevanceScore = options.minRelevanceScore;
    }
    
    if (options.scoreBoosts) {
      this.scoreBoosts = { ...this.scoreBoosts, ...options.scoreBoosts };
    }
    
    if (options.qualitySources) {
      this.qualitySources = options.qualitySources;
    }
    
    rageLogger.debug('Relevance scorer configuration updated', options);
  }

  /**
   * Gets scorer statistics
   * @returns {Object} Scorer statistics
   */
  getStats() {
    return {
      minRelevanceScore: this.minRelevanceScore,
      scoreBoosts: this.scoreBoosts,
      qualitySources: this.qualitySources
    };
  }

  /**
   * Analyzes scoring performance for a set of results
   * @param {Array} documents - Scored documents
   * @returns {Object} Scoring analysis
   */
  analyzeScoring(documents) {
    if (!documents || documents.length === 0) {
      return {
        averageOriginalScore: 0,
        averageEnhancedScore: 0,
        averageImprovement: 0,
        boostDistribution: {}
      };
    }

    const originalScores = documents.map(d => d.originalScore || d.score || 0);
    const enhancedScores = documents.map(d => d.enhancedScore || d.score || 0);
    const improvements = documents.map(d => d.scoreImprovement || 0);

    const boostDistribution = {};
    documents.forEach(doc => {
      if (doc.scoreBoosts) {
        Object.keys(doc.scoreBoosts).forEach(boostType => {
          if (!boostDistribution[boostType]) {
            boostDistribution[boostType] = [];
          }
          boostDistribution[boostType].push(doc.scoreBoosts[boostType]);
        });
      }
    });

    // Calculate averages for boost distribution
    Object.keys(boostDistribution).forEach(boostType => {
      const values = boostDistribution[boostType];
      boostDistribution[boostType] = {
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        count: values.length,
        max: Math.max(...values)
      };
    });

    return {
      averageOriginalScore: originalScores.reduce((sum, score) => sum + score, 0) / originalScores.length,
      averageEnhancedScore: enhancedScores.reduce((sum, score) => sum + score, 0) / enhancedScores.length,
      averageImprovement: improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length,
      boostDistribution
    };
  }
}

module.exports = {
  RelevanceScorer
};