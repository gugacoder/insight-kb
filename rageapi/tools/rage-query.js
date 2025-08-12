#!/usr/bin/env node

/**
 * RAGE Query Testing Tool
 * 
 * CLI tool for testing RAGE API queries, retrieving embeddings,
 * and diagnosing integration issues.
 */

const path = require('path');
const dotenv = require('dotenv');
const RageClient = require('./lib/client');
const formatter = require('./lib/formatter');
const diagnostics = require('./lib/diagnostics');

// Load environment variables
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Also load from project root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Simple argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    format: 'pretty',
    debug: false,
    timeout: '5000',
    maxResults: '5',
    mock: false,
    noColor: false
  };
  
  let query = '';
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      console.log(`
RAGE Query Testing Tool v1.0.0

Usage: npm run rage:query "<query>" [options]

Arguments:
  <query>                    The query string to test

Options:
  -f, --format <type>        Output format (json|pretty|verbose) [default: pretty]
  -d, --debug               Enable debug mode with detailed request/response info
  -t, --timeout <ms>        Request timeout in milliseconds [default: 5000]
  --max-results <n>         Maximum number of results to return [default: 5]
  --mock                    Use mock responses for testing
  --api-url <url>           Override RAGE API URL
  --jwt-token <token>       Override JWT token (use with caution)
  --no-color                Disable colored output
  -h, --help                Display this help message

Examples:
  npm run rage:query "What is the company policy?"
  npm run rage:query "Employee handbook" --format json
  npm run rage:query "Benefits" --debug --verbose
  npm run rage:query "test query" --mock

Environment Variables:
  RAGE_VECTORIZE_API_KEY    JWT authentication token (required)
  RAGE_VECTORIZE_URI        API endpoint URL (required) 
  RAGE_VECTORIZE_PIPELINE_ID     Pipeline identifier (required)
`);
      process.exit(0);
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i];
    } else if (arg === '--debug' || arg === '-d') {
      options.debug = true;
    } else if (arg === '--timeout' || arg === '-t') {
      options.timeout = args[++i];
    } else if (arg === '--max-results') {
      options.maxResults = args[++i];
    } else if (arg === '--mock') {
      options.mock = true;
    } else if (arg === '--api-url') {
      options.apiUrl = args[++i];
    } else if (arg === '--jwt-token') {
      options.jwtToken = args[++i];
    } else if (arg === '--no-color') {
      options.noColor = true;
    } else if (!arg.startsWith('-')) {
      query = arg;
    }
  }
  
  if (!query) {
    console.error('Error: Query is required\n');
    console.error('Usage: npm run rage:query "<query>" [options]');
    console.error('Run --help for more information');
    process.exit(1);
  }
  
  return { options, query };
}

const { options, query } = parseArgs();

// Simple coloring functions
const colors = {
  red: options.noColor ? (str) => str : (str) => `\x1b[31m${str}\x1b[0m`,
  green: options.noColor ? (str) => str : (str) => `\x1b[32m${str}\x1b[0m`, 
  blue: options.noColor ? (str) => str : (str) => `\x1b[34m${str}\x1b[0m`,
  yellow: options.noColor ? (str) => str : (str) => `\x1b[33m${str}\x1b[0m`,
  cyan: options.noColor ? (str) => str : (str) => `\x1b[36m${str}\x1b[0m`,
  gray: options.noColor ? (str) => str : (str) => `\x1b[90m${str}\x1b[0m`,
  white: options.noColor ? (str) => str : (str) => `\x1b[37m${str}\x1b[0m`
};

// Configuration
const config = {
  apiUrl: options.apiUrl || process.env.RAGE_VECTORIZE_URI || 'https://api.vectorize.io/v1',
  jwtToken: options.jwtToken || process.env.RAGE_VECTORIZE_API_KEY,
  orgId: process.env.RAGE_VECTORIZE_ORGANIZATION_ID,
  pipelineId: process.env.RAGE_VECTORIZE_PIPELINE_ID,
  timeout: parseInt(options.timeout),
  maxResults: parseInt(options.maxResults),
  mock: options.mock,
  debug: options.debug,
  format: options.format
};

// Main execution
async function main() {
  try {
    // Start timer
    const startTime = Date.now();

    // Validate configuration (skip in mock mode)
    if (!config.mock) {
      const configErrors = diagnostics.validateConfig(config);
      if (configErrors.length > 0) {
        console.error(colors.red('Configuration Errors:'));
        configErrors.forEach(error => {
          console.error(colors.yellow(`  • ${error}`));
        });
        
        console.error('\n' + diagnostics.getConfigHelp());
        process.exit(1);
      }
    }

    // Display debug info if requested
    if (options.debug) {
      console.log(colors.cyan('Debug Information:'));
      console.log(colors.gray('  Configuration:'));
      console.log(colors.gray(`    API URL: ${config.apiUrl}`));
      console.log(colors.gray(`    Pipeline ID: ${config.pipelineId || 'Not configured'}`));
      console.log(colors.gray(`    JWT Token: ${config.jwtToken ? '[REDACTED]' : 'Not configured'}`));
      console.log(colors.gray(`    Timeout: ${config.timeout}ms`));
      console.log(colors.gray(`    Max Results: ${config.maxResults}`));
      console.log(colors.gray(`    Query: "${query}"`));
      console.log();
    }

    // Create client
    const client = new RageClient(config);

    // Execute query
    console.log(colors.blue(`Querying: "${query}"...`));
    
    const response = await client.query(query);
    const elapsedTime = Date.now() - startTime;

    // Format and display results
    switch (options.format) {
      case 'json':
        console.log(JSON.stringify(response, null, 2));
        break;
      
      case 'verbose':
        formatter.displayVerbose(response, {
          query,
          elapsedTime,
          config,
          colors
        });
        break;
      
      case 'pretty':
      default:
        formatter.displayPretty(response, {
          query,
          elapsedTime,
          colors
        });
        break;
    }

    // Display performance info
    if (options.debug) {
      console.log();
      console.log(colors.gray(`Execution time: ${elapsedTime}ms`));
    }

  } catch (error) {
    // Handle errors with diagnostics
    const diagnostic = diagnostics.diagnoseError(error, config, colors);
    
    if (options.debug) {
      console.error(colors.red('\nError Details:'));
      console.error(colors.gray(error.stack));
    }
    
    console.error(diagnostic);
    process.exit(1);
  }
}

// Run the tool
main().catch(error => {
  console.error(colors.red('Unexpected Error:'), error.message);
  if (options.debug) {
    console.error(error.stack);
  }
  process.exit(1);
});