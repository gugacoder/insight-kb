# PRP: GPT-5 OpenAI Client Enhancement

## Role

You are a **Senior API Integration Engineer** with deep expertise in OpenAI API integration, TypeScript, and streaming architectures. Your responsibility is to enhance the OpenAI client to properly handle GPT-5 specific features, including the new max_completion_tokens parameter and response API compatibility.

**Required Expertise:**
- TypeScript/JavaScript advanced patterns
- OpenAI API v2 specifications
- Streaming response handling
- Error handling and retry logic
- API parameter optimization

**Context Awareness:**
- Understanding of LangChain integration patterns
- Knowledge of OpenAI parameter evolution
- Familiarity with streaming SSE responses
- Experience with API versioning strategies

## Objective

**Primary Goal:** Update the OpenAI client implementation to properly detect GPT-5 models and apply the correct parameter mappings for max_completion_tokens and response API compatibility.

**Success Criteria:**
- [ ] GPT-5 models correctly detected via regex pattern
- [ ] max_completion_tokens parameter properly set for GPT-5
- [ ] Response API compatibility maintained
- [ ] Backward compatibility with GPT-4 preserved
- [ ] Streaming responses work flawlessly

**Scope Boundaries:**
- **In Scope:** Client parameter mapping, model detection, API compatibility
- **Out of Scope:** Authentication changes, new endpoint creation, UI modifications
- **Future Considerations:** GPT-6+ support, custom parameter profiles, A/B testing

## Motivation

**Business Value:**
- Enables full utilization of GPT-5's capabilities
- Ensures optimal API performance and cost efficiency
- Maintains platform reliability with proper parameter handling
- Future-proofs client for upcoming model releases

**Problem Statement:**
- Current client doesn't recognize GPT-5 parameter requirements
- Missing max_completion_tokens causes API errors
- Incorrect parameter mapping limits model capabilities
- Lack of version detection causes compatibility issues

**Strategic Importance:**
- Critical for GPT-5 feature completeness
- Affects all GPT-5 API interactions
- Performance optimization depends on correct parameters
- Platform stability requires proper error handling

**Success Metrics:**
- 100% successful GPT-5 API calls
- Zero parameter-related errors
- <100ms parameter processing overhead
- Full streaming compatibility maintained

## Context

### Technical Environment

**Architecture:**
- OpenAI client: `packages/api/src/endpoints/openai/llm.ts`
- LangChain integration for streaming
- TypeScript for type safety
- Server-sent events for real-time responses

**Current Codebase:**
- Parameter handling: Line ~302 in llm.ts
- Regex pattern: `/\bgpt-[5-9]\b/i`
- Model kwargs construction
- Response API detection logic

### Dependencies and Constraints

**Technical Dependencies:**
- TypeScript 5.x
- LangChain OpenAI package
- OpenAI SDK v4+
- Node.js streaming APIs
- No additional packages needed

**Business Constraints:**
- Must maintain GPT-4 compatibility
- Zero breaking changes allowed
- Deployment during maintenance window
- Performance regression unacceptable

### Documentation and References

**Technical Documentation:**
- OpenAI API Migration Guide
- max_completion_tokens vs max_tokens
- Response API documentation
- LangChain OpenAI integration docs

**External References:**
- OpenAI GPT-5 parameter specs
- API versioning best practices
- Streaming response patterns
- Error handling guidelines

### Known Gotchas and Edge Cases

**Critical Considerations:**
- Parameter name changes between API versions
- Streaming compatibility with new parameters
- Token limit validation differences
- Response format variations

**Edge Cases to Handle:**
- Mixed model conversations (GPT-4 to GPT-5)
- Parameter override scenarios
- Streaming interruption recovery
- Rate limit handling with new parameters

## Implementation Blueprint

### Phase 1: Foundation
**Objective:** Analyze current implementation and plan changes

**Tasks:**
1. Review current parameter handling logic
   - **Input:** Current llm.ts implementation
   - **Output:** Parameter flow documentation
   - **Validation:** All paths identified

2. Test GPT-5 API requirements
   - **Input:** OpenAI API documentation
   - **Output:** Parameter requirement matrix
   - **Validation:** API tests pass

### Phase 2: Core Implementation
**Objective:** Implement GPT-5 parameter handling

**Tasks:**
1. Update model detection regex (if needed)
   - **Input:** Current regex `/\bgpt-[5-9]\b/i`
   - **Output:** Validated regex pattern
   - **Validation:** Matches all GPT-5 variants

```typescript
// Line ~302 in llm.ts
// Current regex already supports GPT-5 through GPT-9
if (llmConfig.model && /\bgpt-[5-9]\b/i.test(llmConfig.model) && llmConfig.maxTokens != null) {
  // Parameter handling logic
}
```

2. Implement parameter mapping logic
   - **Input:** Model detection result
   - **Output:** Correct parameter assignment
   - **Validation:** Parameters correctly mapped

```typescript
// Enhanced parameter handling for GPT-5+
if (llmConfig.model && /\bgpt-[5-9]\b/i.test(llmConfig.model) && llmConfig.maxTokens != null) {
  // Determine correct parameter based on API version
  const paramName = 
    llmConfig.useResponsesApi === true 
      ? 'max_output_tokens'      // For response API
      : 'max_completion_tokens';  // For standard API
  
  // Set the parameter in modelKwargs
  modelKwargs[paramName] = llmConfig.maxTokens;
  
  // Remove maxTokens to prevent conflicts
  delete llmConfig.maxTokens;
  hasModelKwargs = true;
}
```

3. Add comprehensive error handling
   - **Input:** Potential error scenarios
   - **Output:** Robust error recovery
   - **Validation:** All errors handled gracefully

```typescript
try {
  // Parameter mapping logic
  if (isGPT5OrHigher(llmConfig.model)) {
    handleGPT5Parameters(llmConfig, modelKwargs);
  }
} catch (error) {
  logger.warn('Failed to map GPT-5 parameters, using defaults', error);
  // Fallback logic
}
```

### Phase 3: Enhancement and Optimization
**Objective:** Optimize performance and add monitoring

**Tasks:**
1. Add parameter validation
   - **Input:** Parameter constraints
   - **Output:** Validation layer
   - **Validation:** Invalid parameters rejected

2. Implement telemetry
   - **Input:** Monitoring requirements
   - **Output:** Metrics collection
   - **Validation:** Metrics accurately tracked

### Code Structure

**File Organization:**
```
packages/api/src/
├── endpoints/
│   └── openai/
│       ├── llm.ts (main implementation)
│       ├── llm.spec.ts (unit tests)
│       └── utils/
│           ├── parameters.ts (helper functions)
│           └── validation.ts (parameter validation)
```

**Key Components:**
- **Model Detector**: Identifies GPT-5+ models
- **Parameter Mapper**: Maps parameters based on model/API version
- **Validator**: Ensures parameter constraints
- **Error Handler**: Manages API errors gracefully

### Integration Points

**API Endpoints:**
- `POST /api/chat/send` - Uses enhanced client
- `POST /api/generate` - Applies GPT-5 parameters
- `GET /api/models/validate` - Validates model parameters

**Data Models:**
- LLMConfig: Extended for GPT-5 parameters
- ModelKwargs: New parameter support
- Response: Handles new response formats

**External Integrations:**
- OpenAI API: Direct parameter pass-through
- LangChain: Parameter compatibility layer
- Streaming: SSE with new parameters

## Validation Loop

### Level 1: Syntax and Style
**Tools and Commands:**
```bash
# TypeScript compilation
npm run type-check

# Linting
npm run lint -- packages/api/src/endpoints/openai/

# Format check
npm run format:check
```

**Acceptance Criteria:**
- [ ] TypeScript compilation successful
- [ ] No linting errors
- [ ] Code formatting consistent
- [ ] No type errors

### Level 2: Unit Testing
**Test Coverage Requirements:**
- 100% coverage for parameter mapping
- All model variants tested
- Error scenarios covered
- Edge cases validated

**Test Commands:**
```bash
# Run unit tests
npm run test -- packages/api/src/endpoints/openai/llm.spec.ts

# Coverage report
npm run test:coverage -- packages/api/src/endpoints/openai/llm.ts
```

**Test Cases to Include:**
- GPT-5 model detection
- Parameter mapping for each variant
- Response API compatibility
- Fallback behavior

### Level 3: Integration Testing
**Integration Test Scenarios:**
- End-to-end GPT-5 conversation
- Streaming response validation
- Parameter override testing
- Multi-model conversation flow

**Test Commands:**
```bash
# Integration tests
npm run test:integration -- --grep "GPT-5"

# API endpoint tests
npm run test:api -- --grep "OpenAI"
```

### Level 4: Performance and Security
**Performance Benchmarks:**
- Parameter processing: < 5ms
- No streaming latency increase
- Memory usage stable
- CPU usage minimal

**Security Checks:**
- [ ] Parameter injection prevention
- [ ] API key protection maintained
- [ ] No sensitive data in logs
- [ ] Rate limiting effective

**Validation Commands:**
```bash
# Performance profiling
npm run profile -- packages/api/src/endpoints/openai/llm.ts

# Load testing
npm run test:load -- --model=gpt-5
```

### Acceptance Testing
**User Acceptance Criteria:**
- [ ] GPT-5 conversations work smoothly
- [ ] No parameter-related errors
- [ ] Streaming responses uninterrupted
- [ ] Performance unchanged

**Manual Testing Checklist:**
- [ ] Test each GPT-5 model variant
- [ ] Verify streaming responses
- [ ] Check parameter logs
- [ ] Validate error handling

## Additional Notes

### Security Considerations
**Critical Security Points:**
- Prevent parameter injection attacks
- Validate all model inputs
- Sanitize parameter values
- Audit parameter changes

**Security Checklist:**
- [ ] Input validation implemented
- [ ] Parameter bounds enforced
- [ ] Logging sanitized
- [ ] API key never exposed

### Performance Considerations
**Performance Critical Paths:**
- Model detection regex execution
- Parameter mapping logic
- Streaming response handling
- Error recovery mechanisms

**Performance Monitoring:**
- Parameter processing time
- API call latency
- Streaming throughput
- Error rate tracking

### Maintenance and Extensibility
**Future Extensibility:**
- GPT-6+ model support
- Custom parameter profiles
- Dynamic parameter discovery
- API version auto-detection

**Documentation Requirements:**
- [ ] Parameter mapping documented
- [ ] API compatibility notes
- [ ] Migration guide updated
- [ ] Troubleshooting guide

### Rollback and Recovery
**Rollback Strategy:**
- Feature flag for GPT-5 parameters
- Fallback to GPT-4 logic
- Parameter cache clearing
- API version override

**Monitoring and Alerting:**
- Parameter mapping failures
- API error rates
- Response time degradation
- Streaming failures