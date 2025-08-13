const fs = require('fs');

function cleanThemeJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Remove comment lines that start with //
  const lines = content.split('\n');
  const cleanedLines = lines.filter(line => !line.trim().startsWith('//'));
  const cleanedContent = cleanedLines.join('\n');
  
  try {
    // Parse to validate JSON
    const parsed = JSON.parse(cleanedContent);
    return parsed;
  } catch (error) {
    console.error('Error parsing JSON:', error.message);
    // Try to fix common JSON issues
    const fixed = cleanedContent
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
    
    return JSON.parse(fixed);
  }
}

// Clean both theme files
const darkTheme = cleanThemeJson('./PRPs/Examples/nic-dark-theme.json');
const lightTheme = cleanThemeJson('./PRPs/Examples/nic-light-theme.json');

// Extract key colors manually
const extractedColors = {
  light: {
    'surface-primary': lightTheme.colors['editor.background'] || '#ffffff',
    'surface-secondary': lightTheme.colors['menu.background'] || '#f3f3f3', 
    'text-primary': lightTheme.colors['editor.foreground'] || '#000000',
    'text-secondary': lightTheme.colors['sideBarTitle.foreground'] || '#6f6f6f',
    'accent-primary': lightTheme.colors['activityBarBadge.background'] || '#007acc',
    'accent-secondary': lightTheme.colors['statusBarItem.remoteBackground'] || '#16825d',
    'border-primary': lightTheme.colors['menu.border'] || '#d4d4d4',
    'interactive-hover': lightTheme.colors['list.hoverBackground'] || '#e8e8e8'
  },
  dark: {
    'surface-primary': darkTheme.colors['editor.background'] || '#1e1e1e',
    'surface-secondary': darkTheme.colors['menu.background'] || '#252526',
    'text-primary': darkTheme.colors['editor.foreground'] || '#d4d4d4', 
    'text-secondary': darkTheme.colors['sideBarTitle.foreground'] || '#bbbbbb',
    'accent-primary': darkTheme.colors['activityBarBadge.background'] || '#007acc',
    'accent-secondary': darkTheme.colors['statusBarItem.remoteBackground'] || '#16825d',
    'border-primary': darkTheme.colors['menu.border'] || '#454545',
    'interactive-hover': darkTheme.colors['list.dropBackground'] || '#383b3d'
  }
};

// Generate CSS file
const cssContent = `/* NIC Insight Theme Colors */
:root {
  /* Light theme colors */
  --surface-primary: ${extractedColors.light['surface-primary']};
  --surface-secondary: ${extractedColors.light['surface-secondary']};
  --text-primary: ${extractedColors.light['text-primary']};
  --text-secondary: ${extractedColors.light['text-secondary']};
  --accent-primary: ${extractedColors.light['accent-primary']};
  --accent-secondary: ${extractedColors.light['accent-secondary']};
  --border-primary: ${extractedColors.light['border-primary']};
  --interactive-hover: ${extractedColors.light['interactive-hover']};
}

[data-theme="dark"] {
  /* Dark theme colors */
  --surface-primary: ${extractedColors.dark['surface-primary']};
  --surface-secondary: ${extractedColors.dark['surface-secondary']};
  --text-primary: ${extractedColors.dark['text-primary']};
  --text-secondary: ${extractedColors.dark['text-secondary']};
  --accent-primary: ${extractedColors.dark['accent-primary']};
  --accent-secondary: ${extractedColors.dark['accent-secondary']};
  --border-primary: ${extractedColors.dark['border-primary']};
  --interactive-hover: ${extractedColors.dark['interactive-hover']};
}

/* LibreChat compatibility */
:root {
  --nic-primary: var(--accent-primary);
  --nic-secondary: var(--accent-secondary);
}
`;

fs.writeFileSync('./client/src/themes/nic-colors.css', cssContent);

console.log('✓ Generated NIC theme colors at client/src/themes/nic-colors.css');
console.log('Extracted colors:');
console.log('Light theme:', Object.keys(extractedColors.light));
console.log('Dark theme:', Object.keys(extractedColors.dark));