# PRP: Token Pricing Configuration for GPT-5 Models

## Role

You are a **Backend Systems Developer** with expertise in AI model integration and cost management systems. Your responsibility is to implement token pricing configuration for GPT-5 models following LibreChat's existing pricing architecture and cost calculation patterns.

**Required Expertise:**
- Node.js and JavaScript ES6+ patterns
- Token-based pricing systems and cost calculation algorithms
- AI model pricing structures and rate limiting
- LibreChat's transaction and billing architecture
- OpenAI API pricing models and token economics

**Context Awareness:**
- Understanding of LibreChat's existing token pricing patterns in `api/models/tx.js`
- Knowledge of the `getValueKey` function and model detection logic
- Familiarity with cache token pricing for Anthropic models
- Security considerations for pricing configuration and cost controls

## Objective

**Primary Goal:** Implement comprehensive token pricing configuration for all GPT-5 model variants with accurate pricing rates and proper cost calculation integration.

**Success Criteria:**
- [ ] GPT-5 models added to tokenValues object with correct pricing rates
- [ ] GPT-5 cache token pricing configured if applicable
- [ ] getValueKey function updated to detect all GPT-5 model variants
- [ ] Cost calculations work correctly for GPT-5 models
- [ ] Pricing configuration matches OpenAI's official rates
- [ ] Backward compatibility maintained for existing models

**Scope Boundaries:**
- **In Scope:** Token pricing configuration, model detection patterns, cost calculation logic
- **Out of Scope:** Frontend pricing displays, user billing interfaces, payment processing
- **Future Considerations:** Dynamic pricing updates, real-time rate synchronization

## Motivation

**Business Value:**
- Enables users to access the latest GPT-5 models through LibreChat platform
- Accurate cost tracking prevents unexpected billing surprises
- Maintains cost transparency and user trust in the platform

**Problem Statement:**
- GPT-5 models are not recognized by the current pricing system
- Missing pricing configuration prevents proper cost calculation
- Users cannot access GPT-5 models due to pricing validation failures

**Strategic Importance:**
- Essential for staying current with OpenAI's latest model releases
- Competitive requirement to support cutting-edge AI models
- Foundation for future model integrations and pricing strategies

**Success Metrics:**
- Zero pricing calculation errors for GPT-5 models
- 100% accuracy in cost tracking compared to OpenAI API costs
- Seamless integration without disrupting existing model pricing

## Context

### Technical Environment

**Architecture:**
- Monorepo structure with backend API service
- Express.js server with modular service architecture
- MongoDB for transaction logging and cost tracking
- Token-based pricing system with configurable rates

**Current Codebase:**
- `/api/models/tx.js`: Core token pricing and calculation logic
- `/api/utils/tokens.js`: Token limit and context window configuration
- `/api/server/services/ModelService.js`: Model management and caching
- `/packages/data-provider/src/config.ts`: Default model configurations

### Dependencies and Constraints

**Technical Dependencies:**
- OpenAI API pricing documentation for accurate rates
- Existing tokenValues object structure for consistency
- getValueKey function pattern matching logic
- Cache token pricing system for potential GPT-5 features

**Business Constraints:**
- Pricing accuracy critical for cost management
- Must maintain compatibility with existing billing systems
- Cannot disrupt current model pricing calculations

### Documentation and References

**Technical Documentation:**
- OpenAI API pricing documentation
- LibreChat token calculation architecture
- Cost tracking and billing system documentation

**External References:**
- OpenAI GPT-5 model specifications
- Token pricing industry best practices
- AI model cost optimization strategies

### Known Gotchas and Edge Cases

**Critical Considerations:**
- GPT-5 models may have different pricing tiers
- Cache token pricing may apply to GPT-5 variants
- Model name variations require flexible pattern matching
- Pricing updates should not affect historical cost calculations

**Edge Cases to Handle:**
- Model name variations (gpt-5, gpt-5-turbo, gpt-5-preview)
- Custom deployment names with GPT-5 base models
- Pricing rate changes during active usage
- Token calculation precision for high-volume usage

## Implementation Blueprint

### Phase 1: Pricing Research and Configuration

**Objective:** Research accurate GPT-5 pricing and prepare configuration structure

**Tasks:**
1. Research OpenAI GPT-5 pricing rates
   - **Input:** OpenAI API documentation and pricing pages
   - **Output:** Accurate prompt and completion rates per 1M tokens
   - **Validation:** Verify rates match OpenAI's official pricing

2. Analyze GPT-5 model variants and naming patterns
   - **Input:** OpenAI model list and documentation
   - **Output:** Complete list of GPT-5 model names and variants
   - **Validation:** Cross-reference with OpenAI API responses

### Phase 2: Core Implementation

**Objective:** Update token pricing configuration with GPT-5 models

**Tasks:**
1. Update tokenValues object in tx.js
   - **Input:** Researched pricing rates and model names
   - **Output:** Updated tokenValues with GPT-5 entries
   - **Validation:** Pricing structure matches existing pattern

2. Enhance getValueKey function for GPT-5 detection
   - **Input:** GPT-5 model naming patterns
   - **Output:** Updated pattern matching logic
   - **Validation:** All GPT-5 variants correctly detected

3. Configure cache token pricing if applicable
   - **Input:** GPT-5 cache pricing documentation
   - **Output:** Updated cacheTokenValues if needed
   - **Validation:** Cache pricing correctly applied

### Phase 3: Validation and Testing

**Objective:** Verify pricing accuracy and integration

**Tasks:**
1. Test cost calculations for all GPT-5 variants
   - **Input:** Sample token usage scenarios
   - **Output:** Accurate cost calculations
   - **Validation:** Costs match expected OpenAI charges

2. Validate pattern matching edge cases
   - **Input:** Various GPT-5 model name formats
   - **Output:** Correct pricing key resolution
   - **Validation:** All naming variants handled properly

### Code Structure

**File Modifications:**
```
api/
├── models/
│   └── tx.js (Primary changes)
└── utils/
    └── tokens.js (Token limits if needed)
```

**Key Components:**
- **tokenValues**: Core pricing configuration object
- **getValueKey**: Model detection and pricing key resolution
- **cacheTokenValues**: Cache pricing configuration if applicable

### Integration Points

**Pricing Integration:**
- `calculateTokens()`: Uses getValueKey for pricing lookup
- `getTokenConfig()`: Retrieves token limits and pricing
- `logTransaction()`: Records costs with correct pricing

**Cost Calculation Flow:**
1. Model name provided in API request
2. getValueKey() resolves to pricing key
3. tokenValues[key] provides rates
4. Token usage multiplied by rates for cost

## Validation Loop

### Level 1: Syntax and Style

**Tools and Commands:**
```bash
# ESLint validation
npm run lint

# Prettier formatting
npm run format
```

**Acceptance Criteria:**
- [ ] Code passes all linting rules
- [ ] Formatting is consistent with existing codebase
- [ ] No syntax errors or warnings
- [ ] Variable naming follows existing conventions

### Level 2: Unit Testing

**Test Coverage Requirements:**
- 100% coverage for new pricing configurations
- All GPT-5 model variants tested
- Edge cases and error conditions covered
- Cost calculation accuracy verified

**Test Commands:**
```bash
# Run pricing-specific tests
npm run test:api -- --grep "pricing"

# Coverage for tx.js
npm run test:coverage -- api/models/tx.js
```

**Test Cases to Include:**
- GPT-5 model detection accuracy
- Cost calculation precision
- Edge case handling for model variants
- Backward compatibility with existing models

### Level 3: Integration Testing

**Integration Test Scenarios:**
- End-to-end cost calculation workflow
- API request with GPT-5 model selection
- Transaction logging with correct pricing
- Model validation with pricing verification

**Test Commands:**
```bash
# Integration tests
npm run test:api

# API endpoint tests
npm run test:endpoints
```

### Level 4: Performance and Security

**Performance Benchmarks:**
- Model detection: < 1ms per request
- Cost calculation: < 5ms per transaction
- Memory usage: No increase from baseline
- Pattern matching: O(1) complexity maintained

**Security Checks:**
- [ ] No pricing configuration exposed to frontend
- [ ] Cost calculation overflow prevention
- [ ] Input validation for model names
- [ ] Audit logging for pricing changes

## Additional Notes

### Security Considerations
**Critical Security Points:**
- Pricing configuration should not be exposed in API responses
- Cost calculations must prevent arithmetic overflow
- Model name validation to prevent injection attacks
- Audit trail for all pricing-related changes

**Security Checklist:**
- [ ] Pricing data not exposed in client-side code
- [ ] Input sanitization for model names
- [ ] Rate limiting to prevent cost calculation abuse
- [ ] Secure storage of pricing configuration

### Performance Considerations
**Performance Critical Paths:**
- getValueKey function called on every API request
- Cost calculation for high-volume usage
- Pattern matching optimization for model detection
- Memory usage for pricing configuration storage

**Performance Monitoring:**
- Response time for cost calculations
- Memory usage of pricing configuration
- Pattern matching efficiency metrics

### Maintenance and Extensibility
**Future Extensibility:**
- Dynamic pricing configuration updates
- Support for custom pricing tiers
- Integration with external pricing APIs
- Automated pricing synchronization

**Documentation Requirements:**
- [ ] Update API documentation with GPT-5 pricing
- [ ] Document pricing configuration patterns
- [ ] Add examples for cost calculation
- [ ] Update deployment guides with pricing setup

### Rollback and Recovery
**Rollback Strategy:**
- Version control for pricing configuration changes
- Ability to revert to previous pricing rates
- Graceful handling of pricing update failures
- Backup pricing configuration validation

**Monitoring and Alerting:**
- Cost calculation accuracy monitoring
- Pricing configuration validation alerts
- Model detection failure notifications
- Transaction cost discrepancy alerts