/**
 * Output Formatting for RAGE Query Tool
 * 
 * Handles different output formats for query results.
 */

function displayPretty(response, context) {
  const { query, elapsedTime, colors } = context;
  
  console.log(colors.green('✓ Query Results'));
  console.log(colors.gray(`  Query: "${query}"`));
  
  if (response.mock) {
    console.log(colors.yellow('  [MOCK MODE]'));
  }
  
  if (response.processingTime) {
    console.log(colors.gray(`  Processing: ${response.processingTime}ms`));
  }
  
  if (elapsedTime) {
    console.log(colors.gray(`  Total time: ${elapsedTime}ms`));
  }
  
  console.log(colors.gray(`  Results: ${response.count}/${response.total || response.count}`));
  console.log();

  if (!response.results || response.results.length === 0) {
    console.log(colors.yellow('  No results found'));
    return;
  }

  response.results.forEach((result, index) => {
    console.log(colors.cyan(`Result ${index + 1}:`));
    
    if (result.score !== undefined) {
      const scoreColor = result.score > 0.8 ? 'green' : result.score > 0.6 ? 'yellow' : 'red';
      console.log(colors.gray(`  Score: `) + colors[scoreColor](`${(result.score * 100).toFixed(1)}%`));
    }
    
    if (result.source || result.metadata?.source) {
      console.log(colors.gray(`  Source: ${result.source || result.metadata.source}`));
    }
    
    if (result.metadata?.section) {
      console.log(colors.gray(`  Section: ${result.metadata.section}`));
    }
    
    console.log(colors.white('  Text:'));
    console.log(formatText(result.text, '    '));
    console.log();
  });
}

function displayVerbose(response, context) {
  const { query, elapsedTime, config, colors } = context;
  
  console.log(colors.green('RAGE Query Results (Verbose)'));
  console.log('='.repeat(50));
  
  // Query information
  console.log(colors.cyan('Query Information:'));
  console.log(`  Query: "${query}"`);
  console.log(`  Results: ${response.count}/${response.total || response.count}`);
  
  if (response.mock) {
    console.log(colors.yellow('  Mode: MOCK'));
  }
  
  if (response.processingTime) {
    console.log(`  API Processing: ${response.processingTime}ms`);
  }
  
  if (elapsedTime) {
    console.log(`  Total Elapsed: ${elapsedTime}ms`);
  }
  
  console.log();
  
  // Configuration information
  console.log(colors.cyan('Configuration:'));
  console.log(`  API URL: ${config.apiUrl}`);
  console.log(`  Pipeline ID: ${config.pipelineId || 'Not configured'}`);
  console.log(`  Timeout: ${config.timeout}ms`);
  console.log(`  Max Results: ${config.maxResults}`);
  console.log();

  // Results
  if (!response.results || response.results.length === 0) {
    console.log(colors.yellow('No results found'));
    return;
  }

  console.log(colors.cyan('Results:'));
  response.results.forEach((result, index) => {
    console.log(`${index + 1}. ${colors.white(result.id || `Result ${index + 1}`)}`);
    
    if (result.score !== undefined) {
      const scoreColor = result.score > 0.8 ? 'green' : result.score > 0.6 ? 'yellow' : 'red';
      console.log(`   Score: ${colors[scoreColor]((result.score * 100).toFixed(2) + '%')}`);
    }
    
    console.log(`   Text: ${formatText(result.text, '         ')}`);
    
    if (result.metadata && Object.keys(result.metadata).length > 0) {
      console.log(`   Metadata:`);
      Object.entries(result.metadata).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    }
    
    console.log();
  });
}

function formatText(text, indent = '  ') {
  if (!text) return 'No text available';
  
  // Truncate very long text
  const maxLength = 200;
  let displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  
  // Handle line breaks and indentation
  return displayText
    .split('\n')
    .map((line, index) => index === 0 ? line : indent + line)
    .join('\n');
}

function displayStats(response, context) {
  const { elapsedTime, colors } = context;
  
  console.log(colors.blue('Statistics:'));
  console.log(`  Results returned: ${response.count}`);
  console.log(`  Total matches: ${response.total || response.count}`);
  
  if (response.processingTime) {
    console.log(`  API processing time: ${response.processingTime}ms`);
  }
  
  if (elapsedTime) {
    console.log(`  Total execution time: ${elapsedTime}ms`);
  }
  
  if (response.results && response.results.length > 0) {
    const scores = response.results
      .map(r => r.score)
      .filter(s => s !== undefined);
    
    if (scores.length > 0) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      
      console.log(`  Average score: ${(avgScore * 100).toFixed(1)}%`);
      console.log(`  Score range: ${(minScore * 100).toFixed(1)}% - ${(maxScore * 100).toFixed(1)}%`);
    }
  }
}

module.exports = {
  displayPretty,
  displayVerbose,
  displayStats,
  formatText
};