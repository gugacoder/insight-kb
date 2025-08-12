const { CircuitBreaker } = require('../resilience/circuitBreaker');
const { RetryManager } = require('../resilience/retryManager');
const { TimeoutManager } = require('../resilience/timeoutManager');
const { ErrorHandler } = require('../resilience/errorHandler');
const { ErrorFactory } = require('../errors/RageError');

// Mock dependencies
jest.mock('../logging/logger');
jest.mock('../logging/metrics');
jest.mock('../config');

describe('Resilience System Tests', () => {
  describe('CircuitBreaker', () => {
    let circuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        name: 'test_circuit',
        failureThreshold: 3,
        resetTimeout: 1000,
        minimumRequests: 2
      });
    });

    it('should allow operations when circuit is closed', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should open circuit after threshold failures', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Trigger enough failures to open circuit
      for (let i = 0; i < 4; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected failures
        }
      }
      
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should reject operations when circuit is open', async () => {
      // Force circuit to open state
      circuitBreaker.state = 'OPEN';
      const operation = jest.fn();
      
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker \'test_circuit\' is OPEN');
      expect(operation).not.toHaveBeenCalled();
    });

    it('should transition to half-open after reset timeout', async () => {
      // Force circuit to open
      circuitBreaker.state = 'OPEN';
      circuitBreaker.lastFailureTime = Date.now() - 2000; // 2 seconds ago
      
      const operation = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED'); // Should close after successful operation
    });

    it('should provide accurate statistics', () => {
      const stats = circuitBreaker.getStats();
      
      expect(stats).toEqual({
        name: 'test_circuit',
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
        totalRequests: 0,
        isHealthy: true,
        lastFailureTime: null,
        uptime: expect.any(Number)
      });
    });

    it('should reset statistics and state', () => {
      circuitBreaker.failureCount = 5;
      circuitBreaker.state = 'OPEN';
      
      circuitBreaker.reset();
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.failureCount).toBe(0);
      expect(circuitBreaker.successCount).toBe(0);
    });
  });

  describe('RetryManager', () => {
    let retryManager;

    beforeEach(() => {
      retryManager = new RetryManager({
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000
      });
    });

    it('should succeed on first attempt if operation succeeds', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryManager.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(ErrorFactory.create(new Error('network error'), 'network_error'))
        .mockRejectedValueOnce(ErrorFactory.create(new Error('timeout'), 'timeout_error'))
        .mockResolvedValue('success');
      
      const result = await retryManager.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(
        ErrorFactory.create(new Error('auth error'), 'auth_error')
      );
      
      await expect(retryManager.execute(operation)).rejects.toThrow('auth error');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(
        ErrorFactory.create(new Error('persistent error'), 'network_error')
      );
      
      await expect(retryManager.execute(operation)).rejects.toThrow('persistent error');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should calculate exponential backoff delays', () => {
      const delay1 = retryManager.calculateDelay(1);
      const delay2 = retryManager.calculateDelay(2);
      const delay3 = retryManager.calculateDelay(3);
      
      expect(delay1).toBeGreaterThanOrEqual(90); // 100ms with jitter
      expect(delay1).toBeLessThanOrEqual(110);
      expect(delay2).toBeGreaterThanOrEqual(180); // 200ms with jitter
      expect(delay2).toBeLessThanOrEqual(220);
      expect(delay3).toBeGreaterThanOrEqual(360); // 400ms with jitter
      expect(delay3).toBeLessThanOrEqual(440);
    });

    it('should work with circuit breaker integration', async () => {
      const circuitBreaker = new CircuitBreaker({ name: 'test', failureThreshold: 2 });
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure 1'))
        .mockResolvedValue('success');
      
      const result = await retryManager.executeWithCircuitBreaker(
        operation,
        circuitBreaker,
        { operation: 'test' }
      );
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('TimeoutManager', () => {
    let timeoutManager;

    beforeEach(() => {
      timeoutManager = new TimeoutManager({
        defaultTimeout: 1000,
        maxTimeout: 5000,
        minTimeout: 100
      });
    });

    it('should execute operation within timeout', async () => {
      const operation = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 100))
      );
      
      const result = await timeoutManager.execute(operation, 500);
      
      expect(result).toBe('success');
    });

    it('should timeout long-running operations', async () => {
      const operation = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 2000))
      );
      
      await expect(timeoutManager.execute(operation, 500)).rejects.toThrow('Operation timed out');
    });

    it('should use default timeout when none specified', async () => {
      const operation = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 100))
      );
      
      const result = await timeoutManager.execute(operation);
      
      expect(result).toBe('success');
    });

    it('should enforce minimum and maximum timeouts', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      // Test minimum timeout enforcement
      const result1 = await timeoutManager.execute(operation, 50); // Below minimum
      expect(result1).toBe('success');
      
      // Test maximum timeout enforcement
      const result2 = await timeoutManager.execute(operation, 10000); // Above maximum
      expect(result2).toBe('success');
    });

    it('should clean up timeouts properly', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      await timeoutManager.execute(operation, 1000);
      
      const metrics = timeoutManager.getHealthMetrics();
      expect(metrics.activeTimeouts).toBe(0);
      expect(metrics.completedOperations).toBe(1);
    });

    it('should cancel all timeouts on cleanup', () => {
      const timeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // Start some operations
      timeoutManager.execute(jest.fn().mockImplementation(() => new Promise(() => {})), 1000);
      timeoutManager.execute(jest.fn().mockImplementation(() => new Promise(() => {})), 2000);
      
      timeoutManager.cleanup();
      
      expect(timeoutSpy).toHaveBeenCalled();
      timeoutSpy.mockRestore();
    });

    it('should provide health metrics', () => {
      const metrics = timeoutManager.getHealthMetrics();
      
      expect(metrics).toEqual({
        activeTimeouts: 0,
        completedOperations: 0,
        timedOutOperations: 0,
        averageExecutionTime: 0,
        isHealthy: true
      });
    });
  });

  describe('ErrorHandler Integration', () => {
    let errorHandler;

    beforeEach(() => {
      const mockConfig = {
        RAGE_TIMEOUT_MS: 5000,
        RAGE_RETRY_ATTEMPTS: 2,
        RAGE_RETRY_DELAY_MS: 100,
        RAGE_ENABLE_FALLBACK: true
      };

      // Mock configManager
      require('../config').configManager = {
        getConfig: () => mockConfig
      };

      errorHandler = new ErrorHandler();
    });

    it('should execute operation with full resilience protection', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await errorHandler.executeWithResilience(operation, {
        operation: 'test_operation',
        correlationId: 'test-id'
      });
      
      expect(result).toBe('success');
    });

    it('should apply fallback on operation failure', async () => {
      const operation = jest.fn().mockRejectedValue(
        ErrorFactory.create(new Error('timeout error'), 'timeout_error')
      );
      
      const result = await errorHandler.executeWithResilience(operation, {
        operation: 'enrichMessage',
        correlationId: 'test-id'
      });
      
      // Should return null due to graceful degradation for RAGE operations
      expect(result).toBeNull();
    });

    it('should handle circuit breaker open state', async () => {
      // Force circuit breaker to open by causing multiple failures
      const failingOperation = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Cause enough failures to open circuit
      for (let i = 0; i < 6; i++) {
        try {
          await errorHandler.executeWithResilience(failingOperation, {
            operation: 'test_operation'
          });
        } catch (error) {
          // Expected failures
        }
      }
      
      // Now try a new operation - should fail fast due to open circuit
      const newOperation = jest.fn().mockResolvedValue('success');
      const result = await errorHandler.executeWithResilience(newOperation, {
        operation: 'enrichMessage'
      });
      
      // Should get fallback result due to open circuit breaker
      expect(result).toBeNull();
      expect(newOperation).not.toHaveBeenCalled();
    });

    it('should provide comprehensive health status', () => {
      const health = errorHandler.getHealthStatus();
      
      expect(health).toEqual({
        timestamp: expect.any(String),
        overall: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        components: {
          circuitBreaker: expect.any(Object),
          retryManager: expect.any(Object),
          timeoutManager: expect.any(Object)
        },
        configuration: {
          fallbackEnabled: true,
          gracefulDegradation: true
        }
      });
    });

    it('should reset all components', () => {
      errorHandler.reset();
      
      const health = errorHandler.getHealthStatus();
      expect(health.overall).toBe('healthy');
    });

    it('should update configuration dynamically', () => {
      errorHandler.updateConfig({
        timeout: 10000,
        retryAttempts: 5,
        fallbackEnabled: false
      });
      
      // Verify configuration was updated
      expect(errorHandler.fallbackEnabled).toBe(false);
    });
  });

  describe('End-to-End Resilience Scenarios', () => {
    let errorHandler;

    beforeEach(() => {
      const mockConfig = {
        RAGE_TIMEOUT_MS: 1000,
        RAGE_RETRY_ATTEMPTS: 3,
        RAGE_RETRY_DELAY_MS: 50,
        RAGE_ENABLE_FALLBACK: true
      };

      require('../config').configManager = {
        getConfig: () => mockConfig
      };

      errorHandler = new ErrorHandler();
    });

    it('should handle intermittent network failures with retry', async () => {
      let callCount = 0;
      const operation = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(ErrorFactory.create(new Error('network error'), 'network_error'));
        }
        return Promise.resolve('success after retries');
      });
      
      const result = await errorHandler.executeWithResilience(operation, {
        operation: 'vectorizeApi',
        correlationId: 'test-network'
      });
      
      expect(result).toBe('success after retries');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should handle timeout scenarios gracefully', async () => {
      const operation = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('too late'), 2000))
      );
      
      const result = await errorHandler.executeWithResilience(operation, {
        operation: 'enrichMessage',
        timeout: 500,
        correlationId: 'test-timeout'
      });
      
      // Should return null due to graceful degradation
      expect(result).toBeNull();
    });

    it('should cascade through multiple failure modes', async () => {
      let callCount = 0;
      const operation = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(ErrorFactory.create(new Error('timeout'), 'timeout_error'));
        } else if (callCount === 2) {
          return Promise.reject(ErrorFactory.create(new Error('network'), 'network_error'));
        } else if (callCount === 3) {
          return Promise.reject(ErrorFactory.create(new Error('rate limit'), 'rate_limit'));
        }
        return Promise.resolve('finally success');
      });
      
      const result = await errorHandler.executeWithResilience(operation, {
        operation: 'enrichMessage',
        correlationId: 'test-cascade'
      });
      
      // Should exhaust retries and apply graceful degradation
      expect(result).toBeNull();
      expect(operation).toHaveBeenCalledTimes(3); // Original + 2 retries
    });

    it('should maintain system stability under high error rates', async () => {
      const operations = [];
      
      // Create multiple failing operations
      for (let i = 0; i < 10; i++) {
        const operation = jest.fn().mockRejectedValue(new Error(`failure ${i}`));
        operations.push(
          errorHandler.executeWithResilience(operation, {
            operation: 'enrichMessage',
            correlationId: `test-${i}`
          })
        );
      }
      
      const results = await Promise.all(operations);
      
      // All should return null due to graceful degradation
      expect(results.every(result => result === null)).toBe(true);
      
      // System should still be responsive
      const health = errorHandler.getHealthStatus();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);
    });

    it('should recover after circuit breaker reset', async () => {
      // Cause circuit to open
      const failingOperation = jest.fn().mockRejectedValue(new Error('failure'));
      
      for (let i = 0; i < 6; i++) {
        try {
          await errorHandler.executeWithResilience(failingOperation);
        } catch (error) {
          // Expected
        }
      }
      
      // Reset the error handler
      errorHandler.reset();
      
      // Now operations should work again
      const successOperation = jest.fn().mockResolvedValue('recovered');
      const result = await errorHandler.executeWithResilience(successOperation, {
        operation: 'test_recovery'
      });
      
      expect(result).toBe('recovered');
    });
  });

  describe('Performance Under Stress', () => {
    let errorHandler;

    beforeEach(() => {
      const mockConfig = {
        RAGE_TIMEOUT_MS: 100,
        RAGE_RETRY_ATTEMPTS: 1,
        RAGE_RETRY_DELAY_MS: 10,
        RAGE_ENABLE_FALLBACK: true
      };

      require('../config').configManager = {
        getConfig: () => mockConfig
      };

      errorHandler = new ErrorHandler();
    });

    it('should handle concurrent operations efficiently', async () => {
      const operations = [];
      const startTime = Date.now();
      
      // Create 50 concurrent operations
      for (let i = 0; i < 50; i++) {
        const operation = jest.fn().mockResolvedValue(`result-${i}`);
        operations.push(
          errorHandler.executeWithResilience(operation, {
            operation: 'concurrent_test',
            correlationId: `concurrent-${i}`
          })
        );
      }
      
      const results = await Promise.all(operations);
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(results.every((result, index) => result === `result-${index}`)).toBe(true);
    });

    it('should maintain performance with mixed success/failure rates', async () => {
      const operations = [];
      const startTime = Date.now();
      
      // Create operations with 50% failure rate
      for (let i = 0; i < 100; i++) {
        const operation = jest.fn().mockImplementation(() => {
          if (i % 2 === 0) {
            return Promise.resolve(`success-${i}`);
          } else {
            return Promise.reject(new Error(`failure-${i}`));
          }
        });
        
        operations.push(
          errorHandler.executeWithResilience(operation, {
            operation: 'enrichMessage', // RAGE operation for graceful degradation
            correlationId: `mixed-${i}`
          })
        );
      }
      
      const results = await Promise.all(operations);
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Count successes and nulls (graceful degradation)
      const successes = results.filter(r => r !== null).length;
      const gracefulFailures = results.filter(r => r === null).length;
      
      expect(successes).toBeGreaterThan(0);
      expect(gracefulFailures).toBeGreaterThan(0);
      expect(successes + gracefulFailures).toBe(100);
    });
  });
});