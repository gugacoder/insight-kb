/**
 * RAGE API Client Wrapper for Testing
 * 
 * Simplified client for testing RAGE queries without full LibreChat integration.
 */

const fetch = require('node-fetch');

class RageClient {
  constructor(config) {
    this.config = config;
    this.apiUrl = config.apiUrl;
    this.jwtToken = config.jwtToken;
    this.orgId = config.orgId;
    this.pipelineId = config.pipelineId;
    this.timeout = config.timeout;
    this.mock = config.mock;
  }

  async query(queryText) {
    if (this.mock) {
      return this._getMockResponse(queryText);
    }


    const url = `${this.apiUrl}/org/${this.orgId}/pipelines/${this.pipelineId}/retrieval`;
    
    const requestBody = {
      question: queryText,
      numResults: this.config.maxResults || 5,
      rerank: true
    };

    // Generate correlation ID for request tracking
    const correlationId = `rage-tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwtToken}`,
        'User-Agent': 'LibreChat-RAGE/1.0',
        'X-Correlation-ID': correlationId
      },
      body: JSON.stringify(requestBody),
      timeout: this.timeout
    };

    if (this.config.debug) {
      console.log('Request Details:');
      console.log(`  URL: ${url}`);
      console.log(`  Method: POST`);
      console.log(`  Headers: ${JSON.stringify({
        ...requestOptions.headers,
        'Authorization': '[REDACTED]'
      }, null, 4)}`);
      console.log(`  Body: ${JSON.stringify(requestBody, null, 4)}`);
      console.log();
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
        error.status = response.status;
        error.response = errorData;
        throw error;
      }

      const data = await response.json();
      
      if (this.config.debug) {
        console.log('Response Details:');
        console.log(`  Status: ${response.status}`);
        console.log(`  Data: ${JSON.stringify(data, null, 4)}`);
        console.log();
      }

      return this._normalizeResponse(data);
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const connectionError = new Error('Connection failed: Unable to reach RAGE API');
        connectionError.code = 'CONNECTION_FAILED';
        connectionError.originalError = error;
        throw connectionError;
      }
      
      if (error.type === 'request-timeout') {
        const timeoutError = new Error(`Request timeout: Query took longer than ${this.timeout}ms`);
        timeoutError.code = 'TIMEOUT';
        timeoutError.originalError = error;
        throw timeoutError;
      }
      
      throw error;
    }
  }

  _normalizeResponse(data) {
    // Handle Vectorize.io response format with 'documents' array
    if (data.documents) {
      return {
        query: data.question,
        results: data.documents.map(doc => ({
          id: doc.id,
          score: doc.similarity,
          relevancy: doc.relevancy,
          metadata: {
            source: doc.source_display_name || doc.filename,
            chunk_id: doc.chunk_id,
            total_chunks: doc.total_chunks,
            origin: doc.origin
          },
          text: doc.text,
          source: doc.filename
        })),
        count: data.documents.length,
        total: data.documents.length,
        averageRelevancy: data.average_relevancy,
        ndcg: data.ndcg
      };
    }
    
    // Fallback for other formats
    if (data.results) {
      return {
        query: data.query,
        results: data.results.map(result => ({
          id: result.id,
          score: result.score || result.distance,
          metadata: result.metadata || {},
          text: result.text || result.content || result.payload?.text,
          source: result.metadata?.source || result.source
        })),
        count: data.results.length,
        total: data.total || data.results.length,
        processingTime: data.processing_time || data.elapsed_time
      };
    }
    
    // Handle different response structures
    if (Array.isArray(data)) {
      return {
        results: data.map(result => ({
          id: result.id,
          score: result.score || result.distance,
          metadata: result.metadata || {},
          text: result.text || result.content,
          source: result.metadata?.source
        })),
        count: data.length,
        total: data.length
      };
    }
    
    return data;
  }

  async _healthCheck() {
    const url = `${this.apiUrl}/health`;
    const correlationId = `rage-health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const requestOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.jwtToken}`,
        'User-Agent': 'LibreChat-RAGE/1.0',
        'X-Correlation-ID': correlationId
      },
      timeout: this.timeout
    };

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  _getMockResponse(query) {
    // Mock response for testing
    const mockResults = [
      {
        id: 'doc_1',
        score: 0.95,
        text: 'This is a mock response for testing RAGE queries. The system is working correctly.',
        metadata: {
          source: 'test-document-1.txt',
          section: 'Introduction',
          timestamp: '2025-01-01T00:00:00Z'
        }
      },
      {
        id: 'doc_2', 
        score: 0.87,
        text: 'Another mock result with relevant context for the query. This demonstrates multiple results.',
        metadata: {
          source: 'test-document-2.txt',
          section: 'Details',
          timestamp: '2025-01-01T00:01:00Z'
        }
      }
    ];

    return Promise.resolve({
      query,
      results: mockResults,
      count: mockResults.length,
      total: mockResults.length,
      processingTime: 150,
      mock: true
    });
  }
}

module.exports = RageClient;