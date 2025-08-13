# NIC Insight Theme Customization Guide

## Overview
This guide explains how to customize colors and themes in NIC Insight, built on LibreChat with NIC branding integration.

## Theme System Architecture

### CSS Variables System
NIC Insight uses CSS variables for dynamic theming:
- **Light Theme**: `:root` selector
- **Dark Theme**: `[data-theme="dark"]` selector
- **Tailwind Integration**: CSS variables mapped to Tailwind classes

### File Structure
```
client/src/
├── themes/
│   └── nic-colors.css          # NIC theme color definitions
├── style.css                   # Main styles with theme imports
└── tailwind.config.cjs         # Tailwind configuration
```

## Color Token System

### Current Color Tokens
The system defines semantic color tokens in `client/src/themes/nic-colors.css`:

```css
:root {
  /* Light theme colors */
  --surface-primary: #ffffff;
  --surface-secondary: #f3f3f3;
  --text-primary: #000000;
  --text-secondary: #6f6f6f;
  --accent-primary: #007acc;
  --accent-secondary: #16825d;
  --border-primary: #d4d4d4;
  --interactive-hover: #e8e8e8;
}

[data-theme="dark"] {
  /* Dark theme colors */
  --surface-primary: #1e1e1e;
  --surface-secondary: #252526;
  --text-primary: #d4d4d4;
  --text-secondary: #bbbbbb;
  --accent-primary: #007acc;
  --accent-secondary: #16825d;
  --border-primary: #454545;
  --interactive-hover: #383b3d;
}
```

### NIC Brand Colors
Primary brand colors are defined in `client/src/style.css`:

```css
:root {
  --nic-blue-ish: #286292;
  --nic-blue-ish-alt1: #3d95df;
  --nic-gray-ish: #5fbcd3;
  --nic-dark-ish: #101820;
  --nic-red-ish: #c83737;
}
```

## Customizing Colors

### 1. Modifying Existing Colors

To change theme colors, edit `client/src/themes/nic-colors.css`:

```css
:root {
  --accent-primary: #YOUR_NEW_COLOR;    /* Changes primary accent */
  --surface-primary: #YOUR_BG_COLOR;    /* Changes main background */
}

[data-theme="dark"] {
  --accent-primary: #YOUR_DARK_COLOR;   /* Dark theme variant */
}
```

### 2. Adding New Color Tokens

Add new semantic colors to both themes:

```css
:root {
  --my-custom-color: #ff6b35;
  --status-warning: #ffa500;
}

[data-theme="dark"] {
  --my-custom-color: #ff8560;
  --status-warning: #ffb84d;
}
```

### 3. Updating Tailwind Configuration

Add new colors to `client/tailwind.config.cjs`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'my-custom': 'var(--my-custom-color)',
        'status-warning': 'var(--status-warning)',
      }
    }
  }
}
```

## Creating New Theme Variants

### 1. Extract Colors from VSCode Themes

Use the provided script to extract colors from VSCode theme files:

```bash
# Place your theme JSON in PRPs/Examples/
# Run extraction script
node scripts/clean-theme-json.js
```

### 2. Manual Theme Creation

Create a new theme file `client/src/themes/my-theme.css`:

```css
[data-theme="my-theme"] {
  --surface-primary: #your_background;
  --text-primary: #your_text_color;
  --accent-primary: #your_accent_color;
  /* ... other tokens */
}
```

### 3. Import New Theme

Add import to `client/src/style.css`:

```css
@import './themes/nic-colors.css';
@import './themes/my-theme.css';
```

## Theme Application

### Using CSS Variables
Apply themes using CSS variables:

```css
.my-component {
  background-color: var(--surface-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}
```

### Using Tailwind Classes
Use Tailwind classes that map to variables:

```jsx
<div className="bg-surface-primary text-text-primary border-border-primary">
  Content with theme colors
</div>
```

## Color Accessibility

### Contrast Requirements
Ensure WCAG AA compliance:
- Normal text: 4.5:1 contrast ratio minimum
- Large text: 3:1 contrast ratio minimum

### Testing Colors
```bash
# Use online contrast checkers or browser dev tools
# Test with: Chrome DevTools > Accessibility > Contrast
```

## Advanced Customization

### Dynamic Color Generation
For programmatic color generation:

```javascript
// Generate color variants
function generateColorVariants(baseColor) {
  // Implementation for tints/shades
  return {
    light: lighten(baseColor, 0.1),
    dark: darken(baseColor, 0.1)
  };
}
```

### Theme Switching
The theme switching is handled by existing LibreChat components:
- `ThemeSelector` component in navigation
- Theme preference stored in localStorage
- Automatic system theme detection

## Scripts and Tools

### Available Scripts
- `scripts/clean-theme-json.js` - Extract colors from VSCode themes
- `scripts/extract-theme-colors.js` - Generate theme CSS from JSON

### Color Tools
- [Adobe Color](https://color.adobe.com) - Color palette generator
- [Coolors](https://coolors.co) - Color scheme generator  
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Accessibility testing

## Troubleshooting

### Common Issues
1. **Colors not applying**: Check CSS variable names and imports
2. **Dark theme not working**: Verify `[data-theme="dark"]` selectors
3. **Tailwind classes not working**: Update `tailwind.config.cjs`
4. **Build errors**: Check CSS syntax and file paths

### Debug CSS Variables
```javascript
// In browser console
getComputedStyle(document.documentElement).getPropertyValue('--surface-primary')
```

## Best Practices

### Color Naming
- Use semantic names (`surface-primary` vs `blue-500`)
- Maintain consistency across themes
- Document color purposes

### Theme Structure
- Keep light/dark variants synchronized
- Use relative color relationships
- Test in both themes

### Performance
- Minimize CSS variable usage in hot paths
- Use CSS custom properties efficiently
- Consider browser support for older browsers

## Migration Guide

### From Previous Versions
1. Back up current theme files
2. Update color token names
3. Test all UI components
4. Validate accessibility

### Breaking Changes
- Color token renames require component updates
- CSS variable changes affect custom styles
- Theme structure modifications impact builds