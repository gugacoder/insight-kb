# RAGE API Tools

Command-line tools for testing and debugging the RAGE (Retrieval Augmented Generation Engine) API integration.

## RAGE Query Tool

The `rage-query.js` tool allows you to test RAGE API queries directly without going through LibreChat, making it easier to debug configuration issues and validate embeddings.

### Usage

```bash
npm run rage:query "<your query>" [options]
```

### Examples

```bash
# Basic query
npm run rage:query "What is the company policy on remote work?"

# JSON output format
npm run rage:query "Employee handbook" --format json

# Debug mode with verbose output
npm run rage:query "Benefits information" --debug --format verbose

# Test with mock data (no API call)
npm run rage:query "test query" --mock

# Custom timeout and result limits
npm run rage:query "Complex query" --timeout 10000 --max-results 10
```

### Options

- `-f, --format <type>` - Output format: `json`, `pretty`, `verbose` (default: pretty)
- `-d, --debug` - Enable debug mode with detailed request/response information
- `-t, --timeout <ms>` - Request timeout in milliseconds (default: 5000)
- `--max-results <n>` - Maximum number of results to return (default: 5)
- `--mock` - Use mock responses for testing (no API call)
- `--api-url <url>` - Override RAGE API URL
- `--jwt-token <token>` - Override JWT token (use with caution)
- `--no-color` - Disable colored output
- `-h, --help` - Display help message

### Configuration

The tool uses environment variables for configuration:

#### Required Variables

- `RAGE_VECTORIZE_API_KEY` - Your JWT authentication token
- `RAGE_VECTORIZE_URI` - API endpoint URL  
- `RAGE_VECTORIZE_ORGANIZATION_ID` - Organization identifier
- `RAGE_VECTORIZE_PIPELINE_ID` - Pipeline identifier

#### Optional Variables

- `RAGE_TIMEOUT` - Request timeout (default: 5000ms)
- `RAGE_MAX_RESULTS` - Max results (default: 5)

### Environment Setup

Create a `.env` file in the project root:

```bash
RAGE_VECTORIZE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RAGE_VECTORIZE_URI=https://api.vectorize.io
RAGE_VECTORIZE_ORGANIZATION_ID=your-org-id
RAGE_VECTORIZE_PIPELINE_ID=your-pipeline-id
```

### Output Formats

#### Pretty Format (Default)

```
✓ Query Results
  Query: "What is the company policy?"
  Processing: 150ms
  Total time: 245ms
  Results: 3/3

Result 1:
  Score: 95.2%
  Source: employee-handbook.pdf
  Section: Remote Work
  Text:
    Our company supports flexible remote work arrangements...
```

#### JSON Format

```json
{
  "query": "What is the company policy?",
  "results": [
    {
      "id": "doc_1",
      "score": 0.952,
      "text": "Our company supports flexible remote work arrangements...",
      "metadata": {
        "source": "employee-handbook.pdf",
        "section": "Remote Work"
      }
    }
  ],
  "count": 1,
  "total": 1,
  "processingTime": 150
}
```

#### Verbose Format

Includes detailed configuration information, request/response details, and comprehensive result metadata.

### Error Handling

The tool provides detailed error messages with troubleshooting guidance:

- **Connection Failed**: Network connectivity issues, incorrect API URL
- **Authentication Failed**: Invalid or expired JWT token
- **Permission Denied**: Token lacks required permissions
- **Resource Not Found**: Pipeline not found or incorrect configuration
- **Rate Limit Exceeded**: API rate limit reached
- **Server Errors**: Upstream service issues

### Debugging

Use debug mode for detailed troubleshooting:

```bash
npm run rage:query "test query" --debug --verbose
```

Debug mode shows:
- Configuration values (JWT token redacted)
- Request headers and body
- Response details
- Execution timing
- Error stack traces

### Mock Mode

Test tool functionality without making API calls:

```bash
npm run rage:query "test query" --mock
```

Mock mode returns sample data and is useful for:
- Verifying tool installation
- Testing output formats
- Developing new features

### Security Considerations

- JWT tokens are redacted in debug output
- Avoid logging tokens in command history
- Use environment variables instead of command-line flags for tokens
- The `--jwt-token` flag is provided for testing but not recommended for production

### Architecture

The tool consists of:

- `rage-query.js` - Main CLI entry point and argument parsing
- `lib/client.js` - Simplified API client for testing
- `lib/formatter.js` - Output formatting for different modes
- `lib/diagnostics.js` - Error analysis and troubleshooting guidance

### Dependencies

The tool uses minimal dependencies:
- `dotenv` - Environment variable loading (from api workspace)
- `node-fetch` - HTTP requests (from api workspace)
- Built-in Node.js modules for argument parsing and coloring

No additional npm packages are required as the tool uses simplified implementations for maximum compatibility.