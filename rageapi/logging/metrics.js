const { rageLogger } = require('./logger');

/**
 * RAGE Metrics Collector
 * 
 * Collects and tracks performance metrics, usage statistics,
 * and operational data for the RAGE Interceptor system.
 */
class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = false;
    this.resetTimestamp = Date.now();
  }

  /**
   * Initializes metrics collection
   * @param {boolean} enabled - Whether metrics collection is enabled
   */
  initialize(enabled = true) {
    this.isEnabled = enabled;
    this.resetMetrics();
    
    if (enabled) {
      rageLogger.info('RAGE Metrics Collector initialized', {
        resetTimestamp: new Date(this.resetTimestamp).toISOString()
      });
    }
  }

  /**
   * Records an operation timing metric
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {string} status - Operation status (success, error, timeout)
   * @param {Object} metadata - Additional metadata
   */
  recordOperation(operation, duration, status = 'success', metadata = {}) {
    if (!this.isEnabled) return;

    const metricKey = `operation.${operation}`;
    const metric = this.getOrCreateMetric(metricKey, {
      type: 'operation',
      operation,
      totalCount: 0,
      successCount: 0,
      errorCount: 0,
      timeoutCount: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      durations: []
    });

    // Update counts
    metric.totalCount++;
    switch (status) {
      case 'success':
        metric.successCount++;
        break;
      case 'error':
        metric.errorCount++;
        break;
      case 'timeout':
        metric.timeoutCount++;
        break;
    }

    // Update timing statistics
    if (typeof duration === 'number' && duration >= 0) {
      metric.totalDuration += duration;
      metric.minDuration = Math.min(metric.minDuration, duration);
      metric.maxDuration = Math.max(metric.maxDuration, duration);
      
      // Keep last 100 durations for percentile calculations
      metric.durations.push(duration);
      if (metric.durations.length > 100) {
        metric.durations.shift();
      }
    }

    // Store additional metadata
    metric.lastExecuted = Date.now();
    metric.lastStatus = status;
    metric.lastMetadata = metadata;

    this.metrics.set(metricKey, metric);
  }

  /**
   * Records API call metrics
   * @param {string} endpoint - API endpoint
   * @param {number} responseTime - Response time in milliseconds
   * @param {number} statusCode - HTTP status code
   * @param {number} responseSize - Response size in bytes
   */
  recordApiCall(endpoint, responseTime, statusCode, responseSize = 0) {
    if (!this.isEnabled) return;

    const metricKey = `api.${endpoint}`;
    const metric = this.getOrCreateMetric(metricKey, {
      type: 'api',
      endpoint,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalResponseTime: 0,
      totalResponseSize: 0,
      statusCodes: new Map(),
      responseTimes: []
    });

    metric.totalCalls++;
    metric.totalResponseTime += responseTime;
    metric.totalResponseSize += responseSize;

    if (statusCode >= 200 && statusCode < 300) {
      metric.successfulCalls++;
    } else {
      metric.failedCalls++;
    }

    // Track status code distribution
    const statusKey = Math.floor(statusCode / 100) * 100; // Group by 2xx, 4xx, 5xx
    metric.statusCodes.set(statusKey, (metric.statusCodes.get(statusKey) || 0) + 1);

    // Keep response times for percentile calculations
    metric.responseTimes.push(responseTime);
    if (metric.responseTimes.length > 100) {
      metric.responseTimes.shift();
    }

    metric.lastCall = Date.now();
    metric.lastStatusCode = statusCode;

    this.metrics.set(metricKey, metric);
  }

  /**
   * Records context enrichment metrics
   * @param {number} documentsRetrieved - Number of documents retrieved
   * @param {number} contextSize - Size of formatted context in characters
   * @param {number} relevanceScore - Average relevance score
   * @param {number} processingTime - Time to process context
   */
  recordContextEnrichment(documentsRetrieved, contextSize, relevanceScore, processingTime) {
    if (!this.isEnabled) return;

    const metricKey = 'context.enrichment';
    const metric = this.getOrCreateMetric(metricKey, {
      type: 'context',
      totalEnrichments: 0,
      totalDocuments: 0,
      totalContextSize: 0,
      totalRelevanceScore: 0,
      totalProcessingTime: 0,
      documentCounts: [],
      contextSizes: [],
      relevanceScores: [],
      processingTimes: []
    });

    metric.totalEnrichments++;
    metric.totalDocuments += documentsRetrieved;
    metric.totalContextSize += contextSize;
    metric.totalRelevanceScore += relevanceScore;
    metric.totalProcessingTime += processingTime;

    // Keep arrays for percentile calculations
    metric.documentCounts.push(documentsRetrieved);
    metric.contextSizes.push(contextSize);
    metric.relevanceScores.push(relevanceScore);
    metric.processingTimes.push(processingTime);

    // Limit array sizes
    [metric.documentCounts, metric.contextSizes, metric.relevanceScores, metric.processingTimes]
      .forEach(arr => {
        if (arr.length > 100) arr.shift();
      });

    metric.lastEnrichment = Date.now();

    this.metrics.set(metricKey, metric);
  }

  /**
   * Records error metrics
   * @param {string} errorType - Type of error
   * @param {string} operation - Operation where error occurred
   * @param {Object} errorDetails - Error details
   */
  recordError(errorType, operation, errorDetails = {}) {
    if (!this.isEnabled) return;

    const metricKey = `error.${errorType}`;
    const metric = this.getOrCreateMetric(metricKey, {
      type: 'error',
      errorType,
      totalOccurrences: 0,
      operations: new Map(),
      recentErrors: []
    });

    metric.totalOccurrences++;
    metric.operations.set(operation, (metric.operations.get(operation) || 0) + 1);

    // Keep recent errors for analysis
    metric.recentErrors.push({
      timestamp: Date.now(),
      operation,
      details: errorDetails
    });

    if (metric.recentErrors.length > 50) {
      metric.recentErrors.shift();
    }

    metric.lastOccurrence = Date.now();

    this.metrics.set(metricKey, metric);
  }

  /**
   * Records cache performance metrics
   * @param {string} operation - Cache operation (hit, miss, set, evict)
   * @param {string} key - Cache key (sanitized)
   */
  recordCacheMetric(operation, key = null) {
    if (!this.isEnabled) return;

    const metricKey = 'cache.performance';
    const metric = this.getOrCreateMetric(metricKey, {
      type: 'cache',
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      totalOperations: 0
    });

    metric.totalOperations++;
    switch (operation) {
      case 'hit':
        metric.hits++;
        break;
      case 'miss':
        metric.misses++;
        break;
      case 'set':
        metric.sets++;
        break;
      case 'evict':
        metric.evictions++;
        break;
    }

    metric.lastOperation = Date.now();
    metric.lastOperationType = operation;

    this.metrics.set(metricKey, metric);
  }

  /**
   * Gets a metric or creates it if it doesn't exist
   * @param {string} key - Metric key
   * @param {Object} defaultValue - Default metric structure
   * @returns {Object} Metric object
   */
  getOrCreateMetric(key, defaultValue) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, { ...defaultValue, createdAt: Date.now() });
    }
    return this.metrics.get(key);
  }

  /**
   * Gets all metrics with calculated statistics
   * @returns {Object} Complete metrics summary
   */
  getMetrics() {
    const summary = {
      collectionEnabled: this.isEnabled,
      resetTimestamp: new Date(this.resetTimestamp).toISOString(),
      totalMetrics: this.metrics.size,
      metrics: {}
    };

    for (const [key, metric] of this.metrics) {
      summary.metrics[key] = this.calculateMetricStats(metric);
    }

    return summary;
  }

  /**
   * Calculates statistical summaries for a metric
   * @param {Object} metric - Raw metric data
   * @returns {Object} Metric with calculated statistics
   */
  calculateMetricStats(metric) {
    const stats = { ...metric };

    // Calculate operation statistics
    if (metric.type === 'operation' && metric.durations?.length > 0) {
      stats.averageDuration = metric.totalDuration / metric.durations.length;
      stats.percentile95 = this.calculatePercentile(metric.durations, 95);
      stats.percentile99 = this.calculatePercentile(metric.durations, 99);
      stats.successRate = (metric.successCount / metric.totalCount) * 100;
      stats.errorRate = (metric.errorCount / metric.totalCount) * 100;
    }

    // Calculate API statistics
    if (metric.type === 'api' && metric.responseTimes?.length > 0) {
      stats.averageResponseTime = metric.totalResponseTime / metric.responseTimes.length;
      stats.responseTimeP95 = this.calculatePercentile(metric.responseTimes, 95);
      stats.responseTimeP99 = this.calculatePercentile(metric.responseTimes, 99);
      stats.successRate = (metric.successfulCalls / metric.totalCalls) * 100;
      stats.averageResponseSize = metric.totalResponseSize / metric.totalCalls;
    }

    // Calculate context statistics
    if (metric.type === 'context' && metric.totalEnrichments > 0) {
      stats.averageDocuments = metric.totalDocuments / metric.totalEnrichments;
      stats.averageContextSize = metric.totalContextSize / metric.totalEnrichments;
      stats.averageRelevanceScore = metric.totalRelevanceScore / metric.totalEnrichments;
      stats.averageProcessingTime = metric.totalProcessingTime / metric.totalEnrichments;
    }

    // Calculate cache statistics
    if (metric.type === 'cache' && metric.totalOperations > 0) {
      stats.hitRate = (metric.hits / (metric.hits + metric.misses)) * 100;
      stats.missRate = (metric.misses / (metric.hits + metric.misses)) * 100;
    }

    return stats;
  }

  /**
   * Calculates percentile value from array of numbers
   * @param {Array<number>} values - Array of values
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  calculatePercentile(values, percentile) {
    if (!values || values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Gets performance summary for dashboard display
   * @returns {Object} Performance summary
   */
  getPerformanceSummary() {
    const metrics = this.getMetrics();
    const now = Date.now();
    const hour = 60 * 60 * 1000;

    return {
      timestamp: new Date().toISOString(),
      uptime: now - this.resetTimestamp,
      summary: {
        totalOperations: this.getTotalOperations(),
        errorRate: this.getOverallErrorRate(),
        averageResponseTime: this.getAverageResponseTime(),
        cacheHitRate: this.getCacheHitRate()
      },
      recentActivity: {
        operationsLastHour: this.getOperationsInTimeframe(hour),
        errorsLastHour: this.getErrorsInTimeframe(hour)
      }
    };
  }

  /**
   * Gets total operations across all metrics
   * @returns {number} Total operation count
   */
  getTotalOperations() {
    let total = 0;
    for (const metric of this.metrics.values()) {
      if (metric.type === 'operation') {
        total += metric.totalCount || 0;
      }
    }
    return total;
  }

  /**
   * Gets overall error rate
   * @returns {number} Error rate percentage
   */
  getOverallErrorRate() {
    let totalOps = 0;
    let totalErrors = 0;

    for (const metric of this.metrics.values()) {
      if (metric.type === 'operation') {
        totalOps += metric.totalCount || 0;
        totalErrors += (metric.errorCount || 0) + (metric.timeoutCount || 0);
      }
    }

    return totalOps > 0 ? (totalErrors / totalOps) * 100 : 0;
  }

  /**
   * Gets average response time across all operations
   * @returns {number} Average response time in milliseconds
   */
  getAverageResponseTime() {
    let totalTime = 0;
    let totalCount = 0;

    for (const metric of this.metrics.values()) {
      if (metric.type === 'operation' && metric.totalDuration) {
        totalTime += metric.totalDuration;
        totalCount += metric.totalCount || 0;
      }
    }

    return totalCount > 0 ? totalTime / totalCount : 0;
  }

  /**
   * Gets cache hit rate
   * @returns {number} Cache hit rate percentage
   */
  getCacheHitRate() {
    const cacheMetric = this.metrics.get('cache.performance');
    if (!cacheMetric) return 0;

    const total = cacheMetric.hits + cacheMetric.misses;
    return total > 0 ? (cacheMetric.hits / total) * 100 : 0;
  }

  /**
   * Gets operations count in a timeframe
   * @param {number} timeframeMs - Timeframe in milliseconds
   * @returns {number} Operations count
   */
  getOperationsInTimeframe(timeframeMs) {
    const cutoff = Date.now() - timeframeMs;
    let count = 0;

    for (const metric of this.metrics.values()) {
      if (metric.type === 'operation' && metric.lastExecuted >= cutoff) {
        count += metric.totalCount || 0;
      }
    }

    return count;
  }

  /**
   * Gets errors count in a timeframe
   * @param {number} timeframeMs - Timeframe in milliseconds
   * @returns {number} Errors count
   */
  getErrorsInTimeframe(timeframeMs) {
    const cutoff = Date.now() - timeframeMs;
    let count = 0;

    for (const metric of this.metrics.values()) {
      if (metric.type === 'error' && metric.lastOccurrence >= cutoff) {
        count += metric.totalOccurrences || 0;
      }
    }

    return count;
  }

  /**
   * Resets all metrics
   */
  resetMetrics() {
    this.metrics.clear();
    this.resetTimestamp = Date.now();
    
    if (this.isEnabled) {
      rageLogger.info('RAGE Metrics reset', {
        resetTimestamp: new Date(this.resetTimestamp).toISOString()
      });
    }
  }

  /**
   * Enables metrics collection
   */
  enable() {
    this.isEnabled = true;
    rageLogger.info('RAGE Metrics collection enabled');
  }

  /**
   * Disables metrics collection
   */
  disable() {
    this.isEnabled = false;
    rageLogger.info('RAGE Metrics collection disabled');
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

module.exports = {
  MetricsCollector,
  metricsCollector
};