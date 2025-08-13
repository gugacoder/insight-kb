const fs = require('fs');
const path = require('path');

// Read theme JSON files
const darkTheme = JSON.parse(fs.readFileSync('./PRPs/Examples/nic-dark-theme.json', 'utf8'));
const lightTheme = JSON.parse(fs.readFileSync('./PRPs/Examples/nic-light-theme.json', 'utf8'));

// Map VSCode color names to semantic UI colors
const colorMappings = {
  // Primary UI surfaces
  'editor.background': 'surface-primary',
  'menu.background': 'surface-secondary', 
  'sideBarSectionHeader.background': 'surface-tertiary',
  
  // Text colors
  'editor.foreground': 'text-primary',
  'sideBarTitle.foreground': 'text-secondary',
  'input.placeholderForeground': 'text-muted',
  'menu.foreground': 'text-menu',
  
  // Interactive elements
  'activityBarBadge.background': 'accent-primary',
  'statusBarItem.remoteBackground': 'accent-secondary',
  'menu.selectionBackground': 'interactive-hover',
  'list.hoverBackground': 'surface-hover',
  
  // Borders and separators
  'menu.border': 'border-primary',
  'widget.border': 'border-secondary',
  'checkbox.border': 'border-input',
  
  // Status colors
  'ports.iconRunningProcessForeground': 'status-success',
  'statusBarItem.errorBackground': 'status-error'
};

// Extract meaningful colors
function extractColors(theme, themeType) {
  const extracted = {};
  
  for (const [vscodeKey, semanticKey] of Object.entries(colorMappings)) {
    if (theme.colors[vscodeKey]) {
      extracted[semanticKey] = theme.colors[vscodeKey];
    }
  }
  
  return extracted;
}

const darkColors = extractColors(darkTheme, 'dark');
const lightColors = extractColors(lightTheme, 'light');

// Create Tailwind CSS variables format
function generateCSSVariables(colors, prefix = '') {
  return Object.entries(colors)
    .map(([key, value]) => `  --${prefix}${key}: ${value};`)
    .join('\n');
}

// Create Tailwind config format  
function generateTailwindColors(colors) {
  const tailwindColors = {};
  
  for (const [key, value] of Object.entries(colors)) {
    const tailwindKey = key.replace(/-/g, '-');
    tailwindColors[tailwindKey] = `var(--${key})`;
  }
  
  return tailwindColors;
}

// Generate CSS variables file
const cssContent = `/* NIC Insight Theme Colors */
:root {
  /* Light theme colors */
${generateCSSVariables(lightColors)}
}

[data-theme="dark"] {
  /* Dark theme colors */
${generateCSSVariables(darkColors)}
}

/* Additional semantic colors for LibreChat compatibility */
:root {
  --nic-primary: ${lightColors['accent-primary'] || '#007acc'};
  --nic-secondary: ${lightColors['accent-secondary'] || '#16825d'};
  --surface: var(--surface-primary);
  --surface-hover: var(--surface-hover);
  --text-primary: var(--text-primary);
  --text-secondary: var(--text-secondary);
}

[data-theme="dark"] {
  --nic-primary: ${darkColors['accent-primary'] || '#3794ff'};
  --nic-secondary: ${darkColors['accent-secondary'] || '#16825d'};
}
`;

// Generate Tailwind config extension
const tailwindExtension = `
// NIC Insight Theme Extension for tailwind.config.cjs
const nicThemeColors = ${JSON.stringify(generateTailwindColors(lightColors), null, 2)};

// Add to your tailwind.config.cjs theme.extend.colors:
module.exports = {
  theme: {
    extend: {
      colors: {
        ...nicThemeColors,
        // Additional theme colors
        'nic-primary': 'var(--nic-primary)',
        'nic-secondary': 'var(--nic-secondary)',
        'surface': 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
      }
    }
  }
}
`;

// Write files
fs.writeFileSync('./client/src/themes/nic-colors.css', cssContent);
fs.writeFileSync('./scripts/tailwind-theme-extension.js', tailwindExtension);

console.log('✓ Generated NIC theme colors:');
console.log('  - client/src/themes/nic-colors.css');
console.log('  - scripts/tailwind-theme-extension.js');
console.log('\nExtracted colors:');
console.log('Light theme:', Object.keys(lightColors).length, 'colors');
console.log('Dark theme:', Object.keys(darkColors).length, 'colors');