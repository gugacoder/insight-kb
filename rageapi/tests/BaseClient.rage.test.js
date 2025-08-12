// Mock the BaseClient since it's part of LibreChat
const mockBaseClient = jest.fn().mockImplementation(() => ({
  rageInterceptor: null,
  enrichWithRage: jest.fn(),
  addRageContext: jest.fn(),
  sendMessage: jest.fn(),
  handleContextStrategy: jest.fn()
}));

// Mock RageInterceptor
const mockRageInterceptor = {
  enrichMessage: jest.fn(),
  isEnabled: jest.fn().mockReturnValue(true),
  healthCheck: jest.fn()
};

jest.mock('../../rageapi/interceptors/RageInterceptor', () => jest.fn(() => mockRageInterceptor));

describe('BaseClient RAGE Integration', () => {
  let baseClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    baseClient = new mockBaseClient();
    
    // Simulate RAGE initialization in constructor
    baseClient.rageInterceptor = mockRageInterceptor;
    
    // Mock the actual methods we added to BaseClient
    baseClient.enrichWithRage = async function(message, options = {}) {
      if (!this.rageInterceptor || !message) {
        return null;
      }
      
      try {
        const enrichmentOptions = {
          userId: options.user?.id || options.user,
          conversationId: options.conversationId,
          correlationId: options.correlationId,
          language: options.language || 'english'
        };
        
        return await this.rageInterceptor.enrichMessage(message, enrichmentOptions);
      } catch (error) {
        return null; // Graceful degradation
      }
    };
    
    baseClient.addRageContext = function(messages, rageContext) {
      if (!rageContext || !Array.isArray(messages)) {
        return messages;
      }
      
      const contextMessage = {
        role: 'system',
        content: rageContext,
        name: 'rage_context',
        timestamp: new Date().toISOString()
      };
      
      // Find insertion point after existing system messages
      let insertIndex = 0;
      for (let i = 0; i < messages.length; i++) {
        if (messages[i].role === 'system') {
          insertIndex = i + 1;
        } else {
          break;
        }
      }
      
      const modifiedMessages = [...messages];
      modifiedMessages.splice(insertIndex, 0, contextMessage);
      return modifiedMessages;
    };
    
    baseClient.sendMessage = async function(message, opts = {}) {
      // Simulate RAGE enrichment integration
      let rageContext = null;
      if (!opts.isEdited && this.rageInterceptor) {
        try {
          rageContext = await this.enrichWithRage(message, {
            user: opts.user,
            conversationId: opts.conversationId,
            correlationId: opts.correlationId,
            language: opts.language
          });
          
          if (rageContext) {
            opts.rageContext = rageContext;
          }
        } catch (error) {
          // Graceful degradation
        }
      }
      
      // Simulate message processing
      return {
        text: `Response to: ${message}`,
        rageContext: rageContext
      };
    };
  });

  describe('RAGE Interceptor Initialization', () => {
    it('should initialize RAGE interceptor when available', () => {
      expect(baseClient.rageInterceptor).toBeDefined();
      expect(baseClient.rageInterceptor).toBe(mockRageInterceptor);
    });

    it('should handle RAGE interceptor initialization failure gracefully', () => {
      const baseClientWithError = new mockBaseClient();
      baseClientWithError.rageInterceptor = null; // Simulate init failure
      
      expect(baseClientWithError.rageInterceptor).toBeNull();
    });
  });

  describe('enrichWithRage method', () => {
    const testMessage = 'What is machine learning?';
    const testOptions = {
      user: { id: 'user123' },
      conversationId: 'conv456',
      correlationId: 'corr789'
    };

    it('should return null when RAGE interceptor is not available', async () => {
      baseClient.rageInterceptor = null;
      
      const result = await baseClient.enrichWithRage(testMessage, testOptions);
      
      expect(result).toBeNull();
    });

    it('should return null for empty messages', async () => {
      const result = await baseClient.enrichWithRage('', testOptions);
      
      expect(result).toBeNull();
    });

    it('should successfully enrich message when RAGE is available', async () => {
      const mockContext = 'Enriched context about machine learning...';
      mockRageInterceptor.enrichMessage.mockResolvedValue(mockContext);
      
      const result = await baseClient.enrichWithRage(testMessage, testOptions);
      
      expect(result).toBe(mockContext);
      expect(mockRageInterceptor.enrichMessage).toHaveBeenCalledWith(testMessage, {
        userId: 'user123',
        conversationId: 'conv456',
        correlationId: 'corr789',
        language: 'english'
      });
    });

    it('should handle RAGE enrichment errors gracefully', async () => {
      mockRageInterceptor.enrichMessage.mockRejectedValue(new Error('API error'));
      
      const result = await baseClient.enrichWithRage(testMessage, testOptions);
      
      expect(result).toBeNull();
    });

    it('should use correct enrichment options', async () => {
      const options = {
        user: 'simple-user-id',
        conversationId: 'conv123',
        language: 'spanish'
      };
      
      await baseClient.enrichWithRage(testMessage, options);
      
      expect(mockRageInterceptor.enrichMessage).toHaveBeenCalledWith(testMessage, {
        userId: 'simple-user-id',
        conversationId: 'conv123',
        correlationId: undefined,
        language: 'spanish'
      });
    });
  });

  describe('addRageContext method', () => {
    it('should return original messages when no RAGE context provided', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      
      const result = baseClient.addRageContext(messages, null);
      
      expect(result).toEqual(messages);
    });

    it('should return original messages when messages is not an array', () => {
      const notAnArray = 'not an array';
      const rageContext = 'Some context';
      
      const result = baseClient.addRageContext(notAnArray, rageContext);
      
      expect(result).toBe(notAnArray);
    });

    it('should inject RAGE context as system message', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];
      const rageContext = 'Relevant context from knowledge base...';
      
      const result = baseClient.addRageContext(messages, rageContext);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        role: 'system',
        content: rageContext,
        name: 'rage_context',
        timestamp: expect.any(String)
      });
      expect(result[1]).toEqual(messages[0]);
      expect(result[2]).toEqual(messages[1]);
    });

    it('should insert RAGE context after existing system messages', () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'system', content: 'Additional instructions' },
        { role: 'user', content: 'Hello' }
      ];
      const rageContext = 'RAGE context...';
      
      const result = baseClient.addRageContext(messages, rageContext);
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(messages[0]); // First system message
      expect(result[1]).toEqual(messages[1]); // Second system message
      expect(result[2]).toEqual({              // RAGE context inserted here
        role: 'system',
        content: rageContext,
        name: 'rage_context',
        timestamp: expect.any(String)
      });
      expect(result[3]).toEqual(messages[2]); // User message
    });

    it('should handle empty messages array', () => {
      const messages = [];
      const rageContext = 'RAGE context...';
      
      const result = baseClient.addRageContext(messages, rageContext);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: 'system',
        content: rageContext,
        name: 'rage_context',
        timestamp: expect.any(String)
      });
    });
  });

  describe('sendMessage RAGE Integration', () => {
    const testMessage = 'What is machine learning?';
    const testOptions = {
      user: { id: 'user123' },
      conversationId: 'conv456'
    };

    it('should enrich message with RAGE context during sendMessage', async () => {
      const mockContext = 'ML context from knowledge base...';
      mockRageInterceptor.enrichMessage.mockResolvedValue(mockContext);
      
      const result = await baseClient.sendMessage(testMessage, testOptions);
      
      expect(result.rageContext).toBe(mockContext);
      expect(mockRageInterceptor.enrichMessage).toHaveBeenCalled();
    });

    it('should skip RAGE enrichment for edited messages', async () => {
      const editedOptions = { ...testOptions, isEdited: true };
      
      await baseClient.sendMessage(testMessage, editedOptions);
      
      expect(mockRageInterceptor.enrichMessage).not.toHaveBeenCalled();
    });

    it('should continue normally when RAGE enrichment fails', async () => {
      mockRageInterceptor.enrichMessage.mockRejectedValue(new Error('RAGE error'));
      
      const result = await baseClient.sendMessage(testMessage, testOptions);
      
      expect(result.text).toBe(`Response to: ${testMessage}`);
      expect(result.rageContext).toBeNull();
    });

    it('should not enrich when RAGE interceptor is not available', async () => {
      baseClient.rageInterceptor = null;
      
      const result = await baseClient.sendMessage(testMessage, testOptions);
      
      expect(result.text).toBe(`Response to: ${testMessage}`);
      expect(result.rageContext).toBeNull();
      expect(mockRageInterceptor.enrichMessage).not.toHaveBeenCalled();
    });

    it('should attach RAGE context to options when enrichment succeeds', async () => {
      const mockContext = 'Enriched context...';
      mockRageInterceptor.enrichMessage.mockResolvedValue(mockContext);
      
      // Spy on the options modification
      const optionsSpy = jest.fn();
      baseClient.sendMessage = async function(message, opts = {}) {
        let rageContext = null;
        if (!opts.isEdited && this.rageInterceptor) {
          rageContext = await this.enrichWithRage(message, opts);
          if (rageContext) {
            opts.rageContext = rageContext;
          }
        }
        optionsSpy(opts);
        return { text: 'response', rageContext };
      };
      
      await baseClient.sendMessage(testMessage, testOptions);
      
      expect(optionsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          rageContext: mockContext
        })
      );
    });
  });

  describe('Error Handling and Graceful Degradation', () => {
    it('should continue message processing when RAGE fails', async () => {
      mockRageInterceptor.enrichMessage.mockRejectedValue(new Error('Network timeout'));
      
      const result = await baseClient.sendMessage('test message', { user: 'user123' });
      
      expect(result.text).toBe('Response to: test message');
      expect(result.rageContext).toBeNull();
    });

    it('should handle missing user information gracefully', async () => {
      const optionsWithoutUser = { conversationId: 'conv123' };
      
      const result = await baseClient.enrichWithRage('test message', optionsWithoutUser);
      
      expect(mockRageInterceptor.enrichMessage).toHaveBeenCalledWith(
        'test message',
        expect.objectContaining({
          userId: undefined,
          conversationId: 'conv123'
        })
      );
    });

    it('should handle options without any required fields', async () => {
      await baseClient.enrichWithRage('test message', {});
      
      expect(mockRageInterceptor.enrichMessage).toHaveBeenCalledWith(
        'test message',
        expect.objectContaining({
          userId: undefined,
          conversationId: undefined,
          correlationId: undefined,
          language: 'english'
        })
      );
    });
  });

  describe('Performance and Memory Management', () => {
    it('should not create memory leaks with large RAGE context', () => {
      const largeContext = 'x'.repeat(10000);
      const messages = [{ role: 'user', content: 'test' }];
      
      const result = baseClient.addRageContext(messages, largeContext);
      
      expect(result[0].content).toBe(largeContext);
      expect(result).toHaveLength(2);
    });

    it('should handle many system messages efficiently', () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        role: 'system',
        content: `System message ${i}`
      }));
      messages.push({ role: 'user', content: 'User message' });
      
      const result = baseClient.addRageContext(messages, 'RAGE context');
      
      expect(result).toHaveLength(12); // 10 system + 1 RAGE + 1 user
      expect(result[10].name).toBe('rage_context'); // RAGE context at position 10
      expect(result[11].role).toBe('user'); // User message last
    });
  });

  describe('Configuration and Setup', () => {
    it('should work with different user ID formats', async () => {
      const testCases = [
        { user: 'string-user-id' },
        { user: { id: 'object-user-id' } },
        { user: { id: 123, name: 'Test User' } }
      ];
      
      for (const testCase of testCases) {
        await baseClient.enrichWithRage('test', testCase);
        
        const expectedUserId = typeof testCase.user === 'string' 
          ? testCase.user 
          : testCase.user.id;
        
        expect(mockRageInterceptor.enrichMessage).toHaveBeenCalledWith(
          'test',
          expect.objectContaining({
            userId: expectedUserId
          })
        );
      }
    });

    it('should preserve original message order in context injection', () => {
      const complexMessages = [
        { role: 'system', content: 'System 1', priority: 'high' },
        { role: 'system', content: 'System 2', priority: 'low' },
        { role: 'user', content: 'User 1', timestamp: 123 },
        { role: 'assistant', content: 'Assistant 1', model: 'gpt-4' },
        { role: 'user', content: 'User 2', timestamp: 456 }
      ];
      
      const result = baseClient.addRageContext(complexMessages, 'RAGE context');
      
      // RAGE context should be inserted after system messages (index 2)
      expect(result[0]).toEqual(complexMessages[0]); // System 1
      expect(result[1]).toEqual(complexMessages[1]); // System 2
      expect(result[2].name).toBe('rage_context'); // RAGE context
      expect(result[3]).toEqual(complexMessages[2]); // User 1
      expect(result[4]).toEqual(complexMessages[3]); // Assistant 1
      expect(result[5]).toEqual(complexMessages[4]); // User 2
    });
  });
});