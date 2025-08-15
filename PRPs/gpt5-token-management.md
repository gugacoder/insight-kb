# PRP: GPT-5 Token Management System Update

## Role

You are a **Senior Backend Engineer** specializing in billing systems, token economics, and API resource management. Your responsibility is to implement comprehensive token management for GPT-5 models, including token limits, pricing calculations, and cache management.

**Required Expertise:**
- JavaScript/Node.js development
- Token counting and pricing algorithms
- OpenAI API token economics
- Financial calculation precision
- Performance optimization

**Context Awareness:**
- Understanding of NIC Insight token tracking system
- Knowledge of OpenAI pricing models
- Familiarity with MongoDB transaction schemas
- Experience with caching strategies

## Objective

**Primary Goal:** Implement complete token management for GPT-5 models including token limits (400K), pricing structures, and cache value calculations to ensure accurate billing and resource tracking.

**Success Criteria:**
- [ ] GPT-5 models have correct 400K token limits
- [ ] Token pricing accurately reflects OpenAI rates
- [ ] Cache pricing properly configured
- [ ] Model detection regex correctly identifies GPT-5 variants
- [ ] No billing calculation errors in production

**Scope Boundaries:**
- **In Scope:** Token limits, pricing models, cache values, model detection
- **Out of Scope:** Payment processing, invoice generation, user credit management
- **Future Considerations:** Dynamic pricing updates, bulk pricing tiers, enterprise contracts

## Motivation

**Business Value:**
- Accurate billing ensures platform sustainability
- Proper token limits unlock GPT-5's full potential
- Transparent pricing builds user trust
- Efficient cache management reduces costs

**Problem Statement:**
- Missing token limits prevent GPT-5 usage
- Undefined pricing causes billing errors
- Lack of cache configuration increases API costs
- Model detection failures cause system errors

**Strategic Importance:**
- Revenue accuracy critical for business model
- Token management affects user experience
- Proper limits enable advanced use cases
- Cache optimization reduces operational costs

**Success Metrics:**
- 100% billing accuracy for GPT-5 usage
- 50% cost reduction through cache optimization
- Zero token-related errors in production
- <10ms token calculation performance

## Context

### Technical Environment

**Architecture:**
- Token management: `/api/utils/tokens.js`
- Transaction system: `/api/models/tx.js`
- MongoDB for transaction storage
- Redis for token cache
- Real-time usage tracking

**Current Codebase:**
- Token limits: `api/utils/tokens.js` (line 22-24)
- Token pricing: `api/models/tx.js` (line 89-91)
- Cache pricing: `api/models/tx.js` (line 179-181)
- Model detection: `api/models/tx.js` (line 219-224)

### Dependencies and Constraints

**Technical Dependencies:**
- Node.js 18+
- MongoDB 5.0+
- Redis for caching
- Decimal.js for precision math
- No new dependencies required

**Business Constraints:**
- Pricing must match OpenAI rates
- 400K token limit non-negotiable
- Backward compatibility required
- Zero downtime deployment

### Documentation and References

**Technical Documentation:**
- OpenAI Pricing Documentation
- GPT-5 Token Specifications
- MongoDB Transaction Patterns
- Redis Caching Best Practices

**External References:**
- OpenAI Token Counting Guide
- Billing System Best Practices
- Financial Calculation Standards
- Cache Invalidation Strategies

### Known Gotchas and Edge Cases

**Critical Considerations:**
- Floating-point precision in pricing calculations
- Token counting differences between models
- Cache invalidation timing
- Race conditions in billing updates

**Edge Cases to Handle:**
- Partial token consumption
- Mid-conversation model switching
- Cache hits vs. fresh API calls
- Pricing changes during active sessions

## Implementation Blueprint

### Phase 1: Foundation
**Objective:** Prepare token management infrastructure

**Tasks:**
1. Audit current token management system
   - **Input:** Current implementation files
   - **Output:** Gap analysis document
   - **Validation:** All components identified

2. Set up testing environment
   - **Input:** Test requirements
   - **Output:** Test suite for token calculations
   - **Validation:** Tests cover edge cases

### Phase 2: Core Implementation
**Objective:** Implement GPT-5 token configuration

**Tasks:**
1. Update token limits in `/api/utils/tokens.js`
   - **Input:** GPT-5 400K limit specification
   - **Output:** Updated openAIModels object
   - **Validation:** Correct limits applied

```javascript
const openAIModels = {
  // GPT-5 models - 400K context
  'gpt-5': 400000,
  'gpt-5-mini': 400000,
  'gpt-5-nano': 400000,
  // ... existing models
};
```

2. Configure token pricing in `/api/models/tx.js`
   - **Input:** OpenAI pricing structure
   - **Output:** Updated tokenValues object
   - **Validation:** Pricing calculations accurate

```javascript
tokenValues: {
  // GPT-5 pricing (per 1K tokens)
  'gpt-5': { prompt: 1.25, completion: 10 },
  'gpt-5-mini': { prompt: 0.25, completion: 2 },
  'gpt-5-nano': { prompt: 0.05, completion: 0.4 },
  // ... existing models
}
```

3. Set cache pricing values
   - **Input:** Cache pricing strategy
   - **Output:** Updated cacheValues object
   - **Validation:** Cache savings calculated correctly

```javascript
cacheValues: {
  // GPT-5 cache pricing
  'gpt-5': { write: 1.25, read: 0.125 },
  'gpt-5-mini': { write: 0.25, read: 0.025 },
  'gpt-5-nano': { write: 0.05, read: 0.005 },
  // ... existing models
}
```

4. Implement model detection logic
   - **Input:** Model name patterns
   - **Output:** Updated getModelTokenKey function
   - **Validation:** All GPT-5 variants detected

```javascript
function getModelTokenKey(modelName) {
  // Check for GPT-5 variants (order matters!)
  if (modelName.includes('gpt-5-nano')) {
    return 'gpt-5-nano';
  } else if (modelName.includes('gpt-5-mini')) {
    return 'gpt-5-mini';
  } else if (modelName.includes('gpt-5')) {
    return 'gpt-5';
  }
  // ... existing detection logic
}
```

### Phase 3: Enhancement and Optimization
**Objective:** Optimize performance and accuracy

**Tasks:**
1. Implement precision math for pricing
   - **Input:** Financial calculation requirements
   - **Output:** Decimal.js integration
   - **Validation:** No rounding errors

2. Add comprehensive logging
   - **Input:** Logging requirements
   - **Output:** Token usage audit trail
   - **Validation:** All transactions logged

### Code Structure

**File Organization:**
```
api/
├── utils/
│   ├── tokens.js (token limits)
│   └── tokens.spec.js (tests)
├── models/
│   ├── tx.js (pricing logic)
│   └── tx.spec.js (tests)
└── services/
    └── billing/ (future enhancement)
```

**Key Components:**
- **Token Limit Manager**: Enforces model-specific limits
- **Pricing Calculator**: Computes usage costs
- **Cache Manager**: Handles cached response pricing
- **Model Detector**: Identifies model variants

### Integration Points

**API Endpoints:**
- `POST /api/chat` - Applies token limits
- `GET /api/usage` - Returns token consumption
- `POST /api/billing/calculate` - Computes costs

**Data Models:**
- Transaction: stores token usage and costs
- Usage: tracks cumulative token consumption
- Cache: manages cached response metrics

**External Integrations:**
- OpenAI API: Token counting validation
- MongoDB: Transaction persistence
- Redis: Cache management

## Validation Loop

### Level 1: Syntax and Style
**Tools and Commands:**
```bash
# Code formatting
npm run format

# Linting
npm run lint

# Syntax check
node --check api/utils/tokens.js
node --check api/models/tx.js
```

**Acceptance Criteria:**
- [ ] No syntax errors
- [ ] ESLint rules passed
- [ ] Consistent code style
- [ ] No console.log statements

### Level 2: Unit Testing
**Test Coverage Requirements:**
- 100% coverage for pricing calculations
- All model variants tested
- Edge cases covered
- Precision math validated

**Test Commands:**
```bash
# Run specific tests
npm run test -- api/utils/tokens.spec.js
npm run test -- api/models/tx.spec.js

# Coverage report
npm run test:coverage -- api/utils/tokens.js
```

**Test Cases to Include:**
- Token limit enforcement
- Pricing calculation accuracy
- Cache value computation
- Model detection for all variants

### Level 3: Integration Testing
**Integration Test Scenarios:**
- End-to-end token tracking
- Billing calculation workflow
- Cache hit/miss scenarios
- Multi-model conversations

**Test Commands:**
```bash
# Integration tests
npm run test:integration

# Billing workflow tests
npm run test:billing
```

### Level 4: Performance and Security
**Performance Benchmarks:**
- Token calculation: < 10ms
- Pricing computation: < 5ms
- Model detection: < 1ms
- Database write: < 50ms

**Security Checks:**
- [ ] No pricing manipulation possible
- [ ] Decimal precision maintained
- [ ] No integer overflow risks
- [ ] Audit trail complete

**Validation Commands:**
```bash
# Performance testing
npm run benchmark:tokens

# Load testing
npm run test:load -- --users=100
```

### Acceptance Testing
**User Acceptance Criteria:**
- [ ] Token limits properly enforced
- [ ] Billing accurately calculated
- [ ] Usage dashboard shows correct data
- [ ] No billing discrepancies reported

**Manual Testing Checklist:**
- [ ] Test 400K token conversation
- [ ] Verify pricing calculations
- [ ] Check cache pricing
- [ ] Validate usage reports

## Additional Notes

### Security Considerations
**Critical Security Points:**
- Prevent price manipulation attacks
- Secure decimal calculations
- Audit all billing operations
- Validate token counts

**Security Checklist:**
- [ ] Input validation on all pricing inputs
- [ ] Decimal.js for financial math
- [ ] Transaction logging enabled
- [ ] Rate limiting on billing APIs

### Performance Considerations
**Performance Critical Paths:**
- Real-time token counting
- Pricing calculation on each message
- Cache lookup performance
- Database write throughput

**Performance Monitoring:**
- Token calculation latency
- Database write performance
- Cache hit ratios
- Memory usage patterns

### Maintenance and Extensibility
**Future Extensibility:**
- Dynamic pricing updates
- Bulk pricing tiers
- Custom enterprise rates
- Multi-currency support

**Documentation Requirements:**
- [ ] Token limit documentation
- [ ] Pricing structure guide
- [ ] Cache strategy documentation
- [ ] API usage examples

### Rollback and Recovery
**Rollback Strategy:**
- Revert token configuration
- Restore previous pricing
- Clear cache if needed
- Recalculate affected bills

**Monitoring and Alerting:**
- Pricing calculation errors
- Token limit violations
- Cache failure rates
- Billing discrepancy alerts