# RAGE API Troubleshooting Guide

This guide helps diagnose and resolve common issues with the RAGE (Retrieval Augmented Generation Enhancement) API integration.

## Quick Diagnostics

### Health Check Commands

```bash
# Test RAGE configuration
node -e "console.log(require('./rageapi/config').configManager.getSummary())"

# Test RAGE query with mock data
npm run rage:query "test query" --mock

# Debug mode query test
npm run rage:query "test query" --mock --debug

# Validate environment variables
node -e "
const { configManager } = require('./rageapi/config');
try {
  const config = configManager.initialize({ validateOnly: true });
  console.log('✓ Configuration valid');
} catch (error) {
  console.log('✗ Configuration error:', error.message);
}
"
```

### System Status

```bash
# Check RAGE integration status
grep -r "RAGE" api/server/services/**.js | head -5

# Verify environment variables are loaded
env | grep RAGE

# Check LibreChat logs for RAGE activities
tail -f logs/librechat.log | grep -i rage
```

## Common Issues

### 1. RAGE Not Working / No Context Enrichment

**Symptoms:**
- Messages processed normally but no additional context provided
- No RAGE-related log entries
- Conversations feel generic without specific knowledge

**Diagnostic Steps:**

```bash
# Check if RAGE is enabled
echo $RAGE_ENABLED

# Verify configuration
node -e "
const { configManager } = require('./rageapi/config');
console.log('RAGE Status:', configManager.getSummary());
"

# Test with debug mode
npm run rage:query 'test query' --debug
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| `RAGE_ENABLED=false` or not set | Set `RAGE_ENABLED=true` in environment |
| Missing required environment variables | Configure all required RAGE variables (see Configuration section) |
| RAGE module not loaded | Check LibreChat BaseClient initialization |
| Configuration validation failing | Run diagnostic commands above to identify specific issues |

**Verification:**
```bash
# Should see RAGE initialization messages
grep "RAGE configuration initialized" logs/librechat.log

# Test query should show enriched results
npm run rage:query "company policy" --debug
```

---

### 2. Authentication/Authorization Failures

**Symptoms:**
- HTTP 401 Unauthorized errors
- "Authentication Failed" messages in logs
- JWT token invalid errors

**Diagnostic Steps:**

```bash
# Verify JWT token format and expiration
echo $RAGE_VECTORIZE_API_KEY | cut -d'.' -f2 | base64 -d 2>/dev/null | jq .exp 2>/dev/null

# Test API connectivity
npm run rage:query "test" --debug 2>&1 | grep -i auth

# Manual API test
curl -H "Authorization: Bearer $RAGE_VECTORIZE_API_KEY" \
     "$RAGE_VECTORIZE_URI/health" -v
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Expired JWT token | Generate new token from Vectorize.io dashboard |
| Malformed JWT token | Verify token format: `eyJ...` (3 parts separated by dots) |
| Missing `Authorization` header | Check API key is properly set in environment |
| Invalid API endpoint URL | Verify `RAGE_VECTORIZE_URI` matches your Vectorize.io endpoint |

**Token Validation:**
```bash
# Check token expiration (Unix timestamp)
node -e "
const token = process.env.RAGE_VECTORIZE_API_KEY;
if (token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64'));
    const expiry = new Date(payload.exp * 1000);
    console.log('Token expires:', expiry);
    console.log('Valid?', expiry > new Date());
  } catch (e) {
    console.log('Invalid token format');
  }
} else {
  console.log('No token configured');
}
"
```

---

### 3. Connection/Network Issues

**Symptoms:**
- Connection timeout errors
- "Connection failed" messages
- Network-related error codes (ECONNREFUSED, ETIMEDOUT)

**Diagnostic Steps:**

```bash
# Test basic connectivity
curl -I https://api.vectorize.io/health

# Test with timeout
npm run rage:query "test" --mock --timeout 10000

# Check DNS resolution
nslookup api.vectorize.io

# Test from container (if using Docker)
docker exec -it librechat-api curl -I https://api.vectorize.io/health
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Network connectivity issues | Check internet connection and DNS resolution |
| Firewall blocking connections | Configure firewall to allow HTTPS to api.vectorize.io |
| Proxy configuration | Set HTTP_PROXY/HTTPS_PROXY environment variables |
| API endpoint down | Check Vectorize.io status page |
| Timeout too low | Increase `RAGE_TIMEOUT_MS` (default: 5000) |

**Network Debugging:**
```bash
# Test connectivity with verbose output
npm run rage:query "test" --debug --timeout 15000 2>&1 | grep -E "(timeout|connection|network)"

# Check if proxy is required
curl -v https://api.vectorize.io/health 2>&1 | grep -i proxy
```

---

### 4. Empty/No Search Results

**Symptoms:**
- RAGE queries return successfully but with no results
- "No results found" messages
- Context appears to be missing relevant information

**Diagnostic Steps:**

```bash
# Test with different queries
npm run rage:query "general company information" --debug
npm run rage:query "specific technical term" --debug

# Check relevance scoring
npm run rage:query "test query" --debug --format verbose | grep -i score

# Verify pipeline configuration
curl -H "Authorization: Bearer $RAGE_VECTORIZE_API_KEY" \
     "$RAGE_VECTORIZE_URI/pipelines/$RAGE_VECTORIZE_PIPELINE_ID" | jq .
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Empty vector database | Verify documents are indexed in Qdrant |
| Query terms too specific | Try broader search terms |
| Relevance threshold too high | Lower `RAGE_MIN_RELEVANCE_SCORE` (default: 0.7) |
| Pipeline misconfiguration | Verify pipeline ID and configuration |
| Index not ready | Check if indexing is complete |

**Database Verification:**
```bash
# Check if documents exist in pipeline
npm run rage:query "the" --debug --max-results 10 | grep -i "results:"

# Test with very low relevance threshold  
RAGE_MIN_RELEVANCE_SCORE=0.1 npm run rage:query "test" --debug
```

---

### 5. Performance Issues/Slow Responses

**Symptoms:**
- RAGE queries taking longer than expected
- Timeout errors under normal conditions
- LibreChat conversations feel sluggish

**Diagnostic Steps:**

```bash
# Measure response times
time npm run rage:query "performance test" --debug

# Check timeout settings
echo "Timeout: ${RAGE_TIMEOUT_MS}ms"
echo "Max Results: ${RAGE_NUM_RESULTS}"

# Monitor performance metrics
npm run rage:query "test" --debug --format verbose 2>&1 | grep -E "(time|ms)"
```

**Performance Optimization:**

| Setting | Recommended Value | Purpose |
|---------|-------------------|---------|
| `RAGE_TIMEOUT_MS` | 5000-10000 | Balance between responsiveness and reliability |
| `RAGE_NUM_RESULTS` | 3-5 | Fewer results = faster processing |
| `RAGE_ENABLE_CACHING` | true | Cache responses for repeated queries |
| `RAGE_CACHE_TTL` | 300-900 | Cache duration in seconds |

**Performance Tuning:**
```bash
# Test with optimized settings
RAGE_TIMEOUT_MS=3000 RAGE_NUM_RESULTS=3 npm run rage:query "test" --debug

# Enable performance metrics
RAGE_ENABLE_METRICS=true npm start
```

---

### 6. Configuration Errors

**Symptoms:**
- "Configuration validation failed" errors
- Service fails to start
- Invalid environment variable messages

**Diagnostic Commands:**

```bash
# Validate configuration
npm run config:validate 2>/dev/null || echo "Config validation script not found"

# Check all RAGE environment variables
env | grep ^RAGE_ | sort

# Validate specific configurations
node -e "
const { configManager } = require('./rageapi/config');
const validation = configManager.validateConfiguration();
console.log(validation);
"
```

**Configuration Checklist:**

**Required Variables:**
- [ ] `RAGE_ENABLED=true`
- [ ] `RAGE_VECTORIZE_URI=https://api.vectorize.io/v1`
- [ ] `RAGE_VECTORIZE_ORGANIZATION_ID=<guid>`
- [ ] `RAGE_VECTORIZE_PIPELINE_ID=<guid>`
- [ ] `RAGE_VECTORIZE_API_KEY=<jwt-token>`

**Optional but Recommended:**
- [ ] `RAGE_TIMEOUT_MS=5000`
- [ ] `RAGE_NUM_RESULTS=5`
- [ ] `RAGE_LOG_LEVEL=info`

---

## Debug Mode Deep Dive

### Enabling Debug Mode

```bash
# Environment variable
export RAGE_DEBUG=true

# Or per-query
npm run rage:query "debug test" --debug --format verbose
```

### Debug Output Interpretation

**Successful Request:**
```
Debug Information:
  Configuration:
    API URL: https://api.vectorize.io/v1
    Pipeline ID: abc-123-def
    JWT Token: [REDACTED]
    Timeout: 5000ms
    Max Results: 5
    Query: "debug test"

Request Details:
  URL: https://api.vectorize.io/v1/pipelines/abc-123-def/retrieve
  Method: POST
  Headers: {
    "Content-Type": "application/json",
    "Authorization": "[REDACTED]",
    "User-Agent": "LibreChat-RAGE/1.0"
  }
  Body: {
    "query": "debug test",
    "k": 5,
    "options": {
      "include_metadata": true,
      "include_scores": true
    }
  }

Response Details:
  Status: 200
  Data: { ... }

Execution time: 1250ms
```

**Failed Request Analysis:**
- **Status 401**: Authentication issue - check JWT token
- **Status 403**: Permission issue - verify pipeline access
- **Status 404**: Resource not found - check pipeline ID
- **Status 429**: Rate limiting - wait and retry
- **Timeout**: Network/performance issue - increase timeout

---

## Log Analysis

### Key Log Patterns

**RAGE Initialization:**
```
RAGE configuration initialized successfully {
  "environment": "production",
  "enabled": true,
  "features": {
    "caching": true,
    "metrics": true,
    "auditLog": false
  }
}
```

**Query Processing:**
```
RAGE query processing started {
  "correlationId": "rage-abc123",
  "query": "user question",
  "userId": "user-456"
}
```

**Error Patterns:**
```
RAGE query failed {
  "correlationId": "rage-abc123",
  "error": "Connection timeout",
  "duration": 5000,
  "retryAttempt": 2
}
```

### Log Location

```bash
# LibreChat main logs (contains RAGE entries)
tail -f logs/librechat.log | grep RAGE

# RAGE-specific logs (if configured)
tail -f logs/rage.log

# Error logs specifically
grep -i error logs/librechat.log | grep -i rage
```

---

## Advanced Diagnostics

### Manual API Testing

```bash
# Test pipeline health
curl -H "Authorization: Bearer $RAGE_VECTORIZE_API_KEY" \
     "$RAGE_VECTORIZE_URI/pipelines/$RAGE_VECTORIZE_PIPELINE_ID/health"

# Test query directly
curl -X POST \
  -H "Authorization: Bearer $RAGE_VECTORIZE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "k": 3}' \
  "$RAGE_VECTORIZE_URI/pipelines/$RAGE_VECTORIZE_PIPELINE_ID/retrieve"

# List available pipelines
curl -H "Authorization: Bearer $RAGE_VECTORIZE_API_KEY" \
     "$RAGE_VECTORIZE_URI/pipelines"
```

### Performance Profiling

```bash
# Enable detailed timing
RAGE_DEBUG=true RAGE_ENABLE_METRICS=true npm start

# Monitor memory usage
node --max-old-space-size=4096 api/server/index.js

# Profile with Node.js inspector
node --inspect api/server/index.js
```

### Circuit Breaker Status

```bash
# Check circuit breaker state (if accessible)
node -e "
const interceptor = require('./rageapi/interceptors/RageInterceptor');
// Check circuit breaker status implementation
"
```

---

## Environment-Specific Issues

### Docker/Container Environment

```bash
# Check environment variables in container
docker exec librechat-api env | grep RAGE

# Test network connectivity from container
docker exec librechat-api curl -I https://api.vectorize.io/health

# Check DNS resolution
docker exec librechat-api nslookup api.vectorize.io
```

### Kubernetes Environment

```bash
# Check ConfigMap
kubectl get configmap librechat-config -o yaml | grep RAGE

# Check Secret
kubectl get secret librechat-secrets -o yaml

# Check pod logs
kubectl logs -f deployment/librechat-api | grep RAGE

# Port forward for testing
kubectl port-forward service/librechat-api 3080:3080
```

---

## Getting Help

### Collecting Debug Information

When reporting issues, include:

```bash
# System information
node --version
npm --version
docker --version 2>/dev/null || echo "Docker not installed"

# Configuration summary (sensitive data redacted)
node -e "console.log(JSON.stringify(require('./rageapi/config').configManager.getSummary(), null, 2))"

# Recent logs
tail -50 logs/librechat.log | grep -i rage

# Test results
npm run rage:query "troubleshooting test" --mock --debug 2>&1
```

### Support Channels

1. **GitHub Issues**: Create detailed issue with debug output
2. **Community Discord**: Real-time troubleshooting assistance  
3. **Documentation**: Check latest documentation updates
4. **Configuration Guide**: Review detailed configuration documentation

### Creating Effective Issue Reports

Include:
- [ ] Clear problem description
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Debug output from commands above
- [ ] Environment details (Docker, Kubernetes, etc.)
- [ ] Configuration summary (redacted)
- [ ] Relevant log excerpts

---

## Preventive Measures

### Regular Health Checks

```bash
# Create monitoring script
cat > rage-healthcheck.sh << 'EOF'
#!/bin/bash
echo "RAGE Health Check $(date)"
echo "================================"

# Test configuration
node -e "
try {
  const summary = require('./rageapi/config').configManager.getSummary();
  console.log('✓ Configuration:', summary.enabled ? 'Enabled' : 'Disabled');
  console.log('✓ API Key:', summary.api.hasApiKey ? 'Present' : 'Missing');
} catch (e) {
  console.log('✗ Configuration Error:', e.message);
}
"

# Test query
timeout 10s npm run rage:query "health check" --mock >/dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✓ Query Tool: Working"
else
  echo "✗ Query Tool: Failed"
fi

echo "================================"
EOF

chmod +x rage-healthcheck.sh
./rage-healthcheck.sh
```

### Configuration Validation

```bash
# Add to CI/CD pipeline
node -e "
const { configManager } = require('./rageapi/config');
try {
  configManager.validateConfiguration('production');
  console.log('✓ Production configuration valid');
  process.exit(0);
} catch (error) {
  console.log('✗ Configuration invalid:', error.message);
  process.exit(1);
}
"
```

### Monitoring Setup

- Set up alerts for RAGE error rates
- Monitor response times and timeout rates
- Track configuration changes
- Monitor JWT token expiration dates