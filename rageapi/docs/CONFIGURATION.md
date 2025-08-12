# RAGE Configuration Guide

## Overview

This guide provides comprehensive information about configuring the RAGE (Retrieval Augmented Generation Enhancement) system for LibreChat. RAGE enhances AI conversations by automatically retrieving relevant context from your organization's knowledge base.

## Quick Start

### Minimum Required Configuration

To enable RAGE, you need to set these essential environment variables:

```bash
RAGE_ENABLED=true
RAGE_VECTORIZE_URI=https://api.vectorize.io/v1
RAGE_VECTORIZE_ORGANIZATION_ID=your-org-id
RAGE_VECTORIZE_PIPELINE_ID=your-pipeline-id
RAGE_VECTORIZE_API_KEY=your-jwt-token
```

### Complete Configuration Template

Copy the RAGE section from `.env.example` to your `.env` file and update the values:

```bash
# Required Settings
RAGE_ENABLED=true
RAGE_VECTORIZE_URI=https://api.vectorize.io/v1
RAGE_VECTORIZE_ORGANIZATION_ID=550e8400-e29b-41d4-a716-446655440000
RAGE_VECTORIZE_PIPELINE_ID=6ba7b810-9dad-11d1-80b4-00c04fd430c8
RAGE_VECTORIZE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional Performance Settings
RAGE_NUM_RESULTS=5
RAGE_TIMEOUT_MS=5000
RAGE_MIN_RELEVANCE_SCORE=0.7
```

## Configuration Reference

### Core Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RAGE_ENABLED` | boolean | `false` | Master switch to enable/disable RAGE |

**Important:** When `RAGE_ENABLED=false`, the system operates normally without any context enhancement. When `true`, all required Vectorize.io settings must be provided.

### Vectorize.io API Settings

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `RAGE_VECTORIZE_URI` | string (URL) | Yes | Vectorize.io API endpoint |
| `RAGE_VECTORIZE_ORGANIZATION_ID` | string (UUID) | Yes | Your organization ID from Vectorize.io |
| `RAGE_VECTORIZE_PIPELINE_ID` | string (UUID) | Yes | Pipeline ID for your vector database |
| `RAGE_VECTORIZE_API_KEY` | string (JWT) | Yes | Authentication token from Vectorize.io |

#### Getting Vectorize.io Credentials

1. **Sign up** at [Vectorize.io](https://vectorize.io)
2. **Create an organization** and note the Organization ID
3. **Set up a pipeline** connected to your Qdrant vector database
4. **Generate an API key** with appropriate permissions
5. **Copy the JWT token** for the `RAGE_VECTORIZE_API_KEY` setting

### Retrieval Settings

| Variable | Type | Default | Range | Description |
|----------|------|---------|-------|-------------|
| `RAGE_NUM_RESULTS` | number | 5 | 1-20 | Maximum documents to retrieve |
| `RAGE_RERANK` | boolean | true | - | Enable result reranking |
| `RAGE_MIN_RELEVANCE_SCORE` | number | 0.7 | 0.0-1.0 | Minimum relevance threshold |

#### Tuning Retrieval Settings

- **More Results**: Increase `RAGE_NUM_RESULTS` for richer context (impacts performance)
- **Quality Control**: Adjust `RAGE_MIN_RELEVANCE_SCORE` to filter irrelevant results
- **Performance**: Disable `RAGE_RERANK` for faster responses (lower quality)

### Performance Settings

| Variable | Type | Default | Range | Description |
|----------|------|---------|-------|-------------|
| `RAGE_TIMEOUT_MS` | number | 5000 | 1000-30000 | API request timeout |
| `RAGE_RETRY_ATTEMPTS` | number | 2 | 0-5 | Number of retry attempts |
| `RAGE_RETRY_DELAY_MS` | number | 1000 | 100-10000 | Base retry delay |
| `RAGE_CACHE_TTL` | number | 300 | 0-3600 | Cache time-to-live (seconds) |

#### Performance Optimization

**For High-Load Environments:**
```bash
RAGE_TIMEOUT_MS=3000
RAGE_RETRY_ATTEMPTS=1
RAGE_NUM_RESULTS=3
RAGE_CACHE_TTL=600
```

**For High-Quality Responses:**
```bash
RAGE_TIMEOUT_MS=8000
RAGE_RETRY_ATTEMPTS=3
RAGE_NUM_RESULTS=8
RAGE_MIN_RELEVANCE_SCORE=0.8
```

### Debug and Logging Settings

| Variable | Type | Default | Options | Description |
|----------|------|---------|---------|-------------|
| `RAGE_LOG_LEVEL` | string | "info" | error, warn, info, debug, verbose | Logging verbosity |
| `RAGE_DEBUG` | boolean | false | - | Enable debug mode |

#### Debug Configuration

**Development Environment:**
```bash
RAGE_DEBUG=true
RAGE_LOG_LEVEL=debug
```

**Production Environment:**
```bash
RAGE_DEBUG=false
RAGE_LOG_LEVEL=info
```

### Advanced Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RAGE_METRICS_ENABLED` | boolean | true | Enable metrics collection |
| `RAGE_CORRELATION_ID_PREFIX` | string | "rage" | Prefix for correlation IDs |
| `RAGE_USER_AGENT` | string | "LibreChat-RAGE/1.0" | HTTP User-Agent header |

### Feature Flags

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RAGE_ENABLE_CACHING` | boolean | true | Enable response caching |
| `RAGE_ENABLE_METRICS` | boolean | true | Enable performance metrics |
| `RAGE_ENABLE_AUDIT_LOG` | boolean | false | Enable audit logging |

## Environment-Specific Configuration

### Development

```bash
RAGE_DEBUG=true
RAGE_LOG_LEVEL=debug
RAGE_ENABLE_AUDIT_LOG=true
RAGE_TIMEOUT_MS=10000
```

### Testing

```bash
RAGE_ENABLED=false
RAGE_LOG_LEVEL=error
RAGE_ENABLE_CACHING=false
RAGE_ENABLE_METRICS=false
```

### Production

```bash
RAGE_DEBUG=false
RAGE_LOG_LEVEL=info
RAGE_ENABLE_AUDIT_LOG=true
RAGE_ENABLE_METRICS=true
RAGE_TIMEOUT_MS=5000
```

## Configuration Profiles

### Performance Profile

Optimized for high-throughput environments:

```bash
RAGE_CONFIG_PROFILE=performance
```

Automatically applies:
- `RAGE_TIMEOUT_MS=3000`
- `RAGE_RETRY_ATTEMPTS=1`
- `RAGE_NUM_RESULTS=3`
- `RAGE_CACHE_TTL=600`
- `RAGE_ENABLE_METRICS=false`

### Security Profile

Optimized for compliance and auditing:

```bash
RAGE_CONFIG_PROFILE=security
```

Automatically applies:
- `RAGE_DEBUG=false`
- `RAGE_LOG_LEVEL=warn`
- `RAGE_ENABLE_AUDIT_LOG=true`
- `RAGE_ENABLE_METRICS=true`

## Legacy Compatibility

For backwards compatibility, these alternative variable names are supported:

| Legacy Variable | Current Variable |
|----------------|------------------|
| `VECTORIZE_API_URL` | `RAGE_VECTORIZE_URI` |
| `VECTORIZE_ORG_ID` | `RAGE_VECTORIZE_ORGANIZATION_ID` |
| `VECTORIZE_PIPELINE_ID` | `RAGE_VECTORIZE_PIPELINE_ID` |
| `VECTORIZE_JWT_TOKEN` | `RAGE_VECTORIZE_API_KEY` |

**Recommendation:** Use the new `RAGE_*` prefixed variables for new installations.

## Configuration Validation

### Startup Validation

RAGE validates configuration at startup and will:

1. **Log warnings** for missing optional settings
2. **Provide recommendations** for optimization
3. **Fail startup** if required settings are invalid
4. **Gracefully disable** if RAGE is misconfigured

### Manual Validation

Check your configuration:

```bash
npm run config:validate
```

### Common Validation Errors

**"Required configuration missing"**
- Ensure all `RAGE_VECTORIZE_*` variables are set when `RAGE_ENABLED=true`

**"Invalid JWT token format"**
- Verify the JWT token has three parts separated by dots
- Check for extra whitespace or line breaks

**"Invalid URL format"**
- Ensure `RAGE_VECTORIZE_URI` includes protocol (https://)
- Verify the URL is accessible from your deployment

## Configuration Security

### Best Practices

1. **Environment Variables**: Store all sensitive data in environment variables
2. **Secrets Management**: Use Docker secrets or Kubernetes secrets in production
3. **Credential Rotation**: Regularly rotate API keys
4. **Access Control**: Limit access to configuration files

### Security Checklist

- [ ] JWT tokens are stored securely (not in code)
- [ ] Debug mode disabled in production
- [ ] Audit logging enabled for compliance
- [ ] Configuration access is restricted
- [ ] Credentials are rotated regularly

## Troubleshooting

### RAGE Not Working

1. **Check enabled status**: Verify `RAGE_ENABLED=true`
2. **Validate credentials**: Test API key with Vectorize.io
3. **Check network**: Ensure connectivity to Vectorize.io
4. **Review logs**: Look for RAGE-related errors in LibreChat logs

### Performance Issues

1. **Reduce timeout**: Lower `RAGE_TIMEOUT_MS` if requests are slow
2. **Fewer results**: Decrease `RAGE_NUM_RESULTS` to reduce latency
3. **Increase caching**: Higher `RAGE_CACHE_TTL` reduces API calls
4. **Monitor metrics**: Enable metrics to identify bottlenecks

### Configuration Errors

1. **Invalid values**: Check ranges and types for all settings
2. **Missing requirements**: Ensure all required fields are present
3. **Format issues**: Validate UUID and JWT token formats
4. **Environment issues**: Check for typos in variable names

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
RAGE_DEBUG=true
RAGE_LOG_LEVEL=debug
```

This will log:
- Configuration loading details
- API request/response information
- Performance metrics
- Error stack traces

## Migration Guide

### From Version 1.0 to 1.1

1. **Update variable names**: Replace legacy names with `RAGE_*` prefixed versions
2. **Add new settings**: Configure new performance and feature flags
3. **Test configuration**: Validate all settings work correctly
4. **Update documentation**: Update your deployment scripts

### Configuration Backup

Before making changes, backup your current configuration:

```bash
# Export current environment
env | grep RAGE_ > rage-config-backup.env
```

## Support and Resources

### Documentation

- [Vectorize.io API Documentation](https://docs.vectorize.io/)
- [LibreChat Configuration Guide](https://librechat.ai/docs/configuration/)
- [RAGE Architecture Overview](./ARCHITECTURE.md)

### Getting Help

1. **Check logs**: Review LibreChat logs for RAGE-specific errors
2. **Configuration validation**: Use built-in validation tools
3. **Community support**: Join the LibreChat community forums
4. **Professional support**: Contact for enterprise support options

### Best Practices

1. **Start simple**: Begin with minimal configuration and add features gradually
2. **Monitor performance**: Track response times and adjust settings accordingly
3. **Regular maintenance**: Keep credentials updated and configuration optimized
4. **Test changes**: Always test configuration changes in staging first