/**
 * Error Diagnostics for RAGE Query Tool
 * 
 * Provides helpful error messages and troubleshooting guidance.
 */

function validateConfig(config) {
  const errors = [];
  
  if (!config.jwtToken) {
    errors.push('JWT token is missing (RAGE_VECTORIZE_API_KEY or --jwt-token)');
  }
  
  if (!config.apiUrl) {
    errors.push('API URL is missing (RAGE_VECTORIZE_URI or --api-url)');
  }
  
  if (!config.orgId) {
    errors.push('Organization ID is missing (RAGE_VECTORIZE_ORGANIZATION_ID)');
  }
  
  if (!config.pipelineId) {
    errors.push('Pipeline ID is missing (RAGE_VECTORIZE_PIPELINE_ID)');
  }
  
  if (config.timeout && config.timeout < 1000) {
    errors.push('Timeout is too low, minimum is 1000ms');
  }
  
  if (config.maxResults && config.maxResults < 1) {
    errors.push('Max results must be at least 1');
  }
  
  return errors;
}

function diagnoseError(error, config, colors = null) {
  const errorCode = error.code || error.status;
  
  // Default colors if not provided
  if (!colors) {
    colors = {
      red: (str) => `\x1b[31m${str}\x1b[0m`,
      green: (str) => `\x1b[32m${str}\x1b[0m`, 
      blue: (str) => `\x1b[34m${str}\x1b[0m`,
      yellow: (str) => `\x1b[33m${str}\x1b[0m`,
      cyan: (str) => `\x1b[36m${str}\x1b[0m`,
      gray: (str) => `\x1b[90m${str}\x1b[0m`,
      white: (str) => `\x1b[37m${str}\x1b[0m`
    };
  }
  
  switch (errorCode) {
    case 'CONNECTION_FAILED':
      return formatConnectionError(error, config, colors);
    
    case 'TIMEOUT':
      return formatTimeoutError(error, config, colors);
    
    case 401:
      return formatAuthError(error, config, colors);
    
    case 402:
      return formatPaymentError(error, config, colors);
    
    case 403:
      return formatPermissionError(error, config, colors);
    
    case 404:
      return formatNotFoundError(error, config, colors);
    
    case 429:
      return formatRateLimitError(error, config, colors);
    
    case 500:
    case 502:
    case 503:
      return formatServerError(error, config, colors);
    
    default:
      return formatGenericError(error, config, colors);
  }
}

function formatConnectionError(error, config, colors) {
  return `
${colors.red('⚠ Connection Failed')}

Unable to connect to the RAGE API endpoint.

${colors.yellow('Possible causes:')}
  • Network connectivity issues
  • API endpoint is unreachable: ${config.apiUrl}
  • Firewall blocking the connection
  • DNS resolution problems

${colors.cyan('Solutions:')}
  1. Check your internet connection
  2. Verify the API URL: ${config.apiUrl}
  3. Test connectivity: curl ${config.apiUrl}/health
  4. Try with a longer timeout: --timeout 10000

${colors.gray('Debug: Run with --debug flag for detailed error information')}
`;
}

function formatTimeoutError(error, config, colors) {
  return `
${colors.red('⏱ Connection Timeout')}

The request took longer than ${config.timeout}ms to complete.

${colors.yellow('Possible causes:')}
  • Slow network connection
  • Server overloaded
  • Complex query requiring more processing time
  • Network latency issues

${colors.cyan('Solutions:')}
  1. Increase timeout: --timeout ${config.timeout * 2}
  2. Try a simpler query first
  3. Check network latency to API endpoint
  4. Contact API provider if issue persists

${colors.gray('Tip: Use --debug to see detailed request timing')}
`;
}

function formatAuthError(error, config, colors) {
  const tokenPreview = config.jwtToken 
    ? `${config.jwtToken.substring(0, 10)}...` 
    : 'Not provided';

  return `
${colors.red('🔐 Authentication Failed')}

The JWT token is invalid, expired, or malformed.

${colors.yellow('Token status:')} ${tokenPreview}

${colors.cyan('Solutions:')}
  1. Verify RAGE_VECTORIZE_API_KEY environment variable
  2. Check if token has expired
  3. Ensure token has correct format (JWT)
  4. Regenerate token from Vectorize.io dashboard

${colors.gray('Environment check:')}
  export RAGE_VECTORIZE_API_KEY="your-token-here"
  npm run rage:query "test query"

${colors.gray('Debug: Run with --debug flag to see token details (redacted)')}
`;
}

function formatPaymentError(error, config, colors) {
  return `
${colors.red('💳 Payment Required')}

Your Vectorize.io account requires payment to process requests.

${colors.yellow('This indicates:')}
  • API quota exceeded for current billing period
  • Account requires upgrade or payment
  • Free tier limits reached

${colors.cyan('Solutions:')}
  1. Check your Vectorize.io dashboard billing section
  2. Upgrade your account plan if needed
  3. Verify payment methods are up to date
  4. Contact Vectorize.io support for billing issues

${colors.gray('Account check:')}
  Visit https://dashboard.vectorize.io/billing
`;
}

function formatPermissionError(error, config, colors) {
  return `
${colors.red('🚫 Permission Denied')}

Your token doesn't have permission to access this resource.

${colors.yellow('Pipeline ID:')} ${config.pipelineId || 'Not configured'}

${colors.cyan('Solutions:')}
  1. Verify RAGE_VECTORIZE_PIPELINE_ID matches your pipeline
  2. Check token permissions in Vectorize.io dashboard
  3. Ensure pipeline exists and is active
  4. Contact admin for pipeline access

${colors.gray('Pipeline check:')}
  export RAGE_VECTORIZE_PIPELINE_ID="your-pipeline-id"
  npm run rage:query "test query"
`;
}

function formatNotFoundError(error, config, colors) {
  return `
${colors.red('📂 Resource Not Found')}

The requested pipeline or endpoint was not found.

${colors.yellow('Details:')}
  • API URL: ${config.apiUrl}
  • Pipeline ID: ${config.pipelineId || 'Not configured'}

${colors.cyan('Solutions:')}
  1. Verify pipeline ID is correct
  2. Check if pipeline exists in dashboard
  3. Ensure API URL is correct
  4. Confirm pipeline is not deleted

${colors.gray('Verification:')}
  curl -H "Authorization: Bearer $RAGE_VECTORIZE_API_KEY" \\
       ${config.apiUrl}/v1/pipelines
`;
}

function formatRateLimitError(error, config, colors) {
  return `
${colors.red('🚦 Rate Limit Exceeded')}

You've exceeded the API rate limit.

${colors.yellow('Rate limit reached')} - Please wait before retrying.

${colors.cyan('Solutions:')}
  1. Wait a few minutes and try again
  2. Reduce query frequency
  3. Contact provider about rate limit increase
  4. Implement exponential backoff in scripts

${colors.gray('Retry suggestion:')}
  sleep 60 && npm run rage:query "your query"
`;
}

function formatServerError(error, config, colors) {
  const statusMessages = {
    500: 'Internal server error',
    502: 'Bad gateway - upstream server error',
    503: 'Service unavailable - server overloaded'
  };
  
  const message = statusMessages[error.status] || 'Server error';
  
  return `
${colors.red('🔧 Server Error')}

${message} (${error.status})

${colors.yellow('This is a server-side issue, not a client problem.')}

${colors.cyan('Solutions:')}
  1. Wait a few minutes and retry
  2. Check Vectorize.io status page
  3. Contact support if issue persists
  4. Try with a simpler query

${colors.gray('Status check:')}
  curl -I ${config.apiUrl}/health
`;
}

function formatGenericError(error, config, colors) {
  return `
${colors.red('❌ Unknown Error')}

An unexpected error occurred.

${colors.yellow('Error:')} ${error.message}
${colors.yellow('Type:')} ${error.constructor.name}

${colors.cyan('Solutions:')}
  1. Run with --debug for more details
  2. Try with --mock to test tool functionality
  3. Check all configuration values
  4. Report bug if error persists

${colors.gray('Debug command:')}
  npm run rage:query "test query" --debug --verbose
`;
}

function getConfigHelp(colors = null) {
  if (!colors) {
    colors = {
      red: (str) => `\x1b[31m${str}\x1b[0m`,
      green: (str) => `\x1b[32m${str}\x1b[0m`, 
      blue: (str) => `\x1b[34m${str}\x1b[0m`,
      yellow: (str) => `\x1b[33m${str}\x1b[0m`,
      cyan: (str) => `\x1b[36m${str}\x1b[0m`,
      gray: (str) => `\x1b[90m${str}\x1b[0m`,
      white: (str) => `\x1b[37m${str}\x1b[0m`
    };
  }

  return `
${colors.cyan('Configuration Help:')}

Required environment variables:
  ${colors.white('RAGE_VECTORIZE_API_KEY')}         - Your JWT authentication token
  ${colors.white('RAGE_VECTORIZE_URI')}             - API endpoint URL
  ${colors.white('RAGE_VECTORIZE_ORGANIZATION_ID')} - Organization identifier
  ${colors.white('RAGE_VECTORIZE_PIPELINE_ID')}     - Pipeline identifier

Optional variables:
  ${colors.white('RAGE_TIMEOUT')}            - Request timeout (default: 5000ms)
  ${colors.white('RAGE_MAX_RESULTS')}        - Max results (default: 5)

Example .env file:
${colors.gray('  RAGE_VECTORIZE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')}
${colors.gray('  RAGE_VECTORIZE_URI=https://api.vectorize.io')}
${colors.gray('  RAGE_VECTORIZE_ORGANIZATION_ID=your-org-id')}
${colors.gray('  RAGE_VECTORIZE_PIPELINE_ID=your-pipeline-id')}

Test with mock data:
${colors.gray('  npm run rage:query "test query" --mock')}
`;
}

module.exports = {
  validateConfig,
  diagnoseError,
  getConfigHelp,
  formatConnectionError,
  formatTimeoutError,
  formatAuthError,
  formatPaymentError,
  formatPermissionError,
  formatNotFoundError,
  formatRateLimitError,
  formatServerError,
  formatGenericError
};