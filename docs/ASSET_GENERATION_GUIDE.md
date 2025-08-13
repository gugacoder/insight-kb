# NIC Insight Asset Generation Guide

## Overview
This guide documents the process for updating logos, favicons, and brand assets for NIC Insight.

## File Locations

### Logo Assets
- **Source Logos**: `client/public/assets/brand/logos/`
  - `nic-logo.svg` - Main logo (light theme)
  - `nic-logo-dark.svg` - Dark theme variant
  - `nic-logo-pad.svg` - Logo with padding
  - `nic-logo-dark-pad.svg` - Dark logo with padding
  
- **Active Logo Files**:
  - `client/public/assets/logo.svg` - Main application logo
  - `client/public/assets/logo-dark.svg` - Dark theme logo

### Favicon Assets
- **Source Favicons**: `client/public/assets/brand/favicons/`
  - `favicon.ico` - Light theme favicon
  - `favicon-dark.ico` - Dark theme favicon
  
- **Generated Favicon Files**:
  - `client/public/assets/favicon.ico` - Main favicon
  - `client/public/assets/favicon-16x16.png` - 16x16 PNG
  - `client/public/assets/favicon-32x32.png` - 32x32 PNG
  - `client/public/assets/apple-touch-icon-180x180.png` - Apple touch icon
  - `client/public/assets/icon-192x192.png` - PWA icon
  - `client/public/assets/maskable-icon.png` - Maskable PWA icon

## Asset Generation Process

### 1. Logo Updates

To update the main application logos:

```bash
# Replace main logo
cp client/public/assets/brand/logos/nic-logo-pad.svg client/public/assets/logo.svg

# Replace dark theme logo  
cp client/public/assets/brand/logos/nic-logo-dark-pad.svg client/public/assets/logo-dark.svg
```

### 2. Favicon Generation

To generate favicon variants:

```bash
# Copy main favicon
cp client/public/assets/brand/favicons/favicon.ico client/public/assets/favicon.ico

# Generate PNG variants (requires image processing tools)
node scripts/create-favicon-pngs.js
```

### 3. PWA Icons

PWA icons are automatically configured in `client/vite.config.ts`:

```javascript
manifest: {
  name: 'NIC Insight',
  short_name: 'NIC Insight',
  icons: [
    { src: '/assets/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    { src: '/assets/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    { src: '/assets/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    { src: '/assets/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/assets/maskable-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}
```

## File Formats and Sizes

### Logo Requirements
- **Format**: SVG (preferred for scalability)
- **Fallback**: PNG at multiple resolutions
- **Variants**: Light and dark theme versions
- **Padding**: With and without padding versions

### Favicon Requirements
- **ICO Format**: Main favicon.ico (multiple sizes embedded)
- **PNG Sizes**: 16x16, 32x32, 180x180, 192x192, 512x512
- **Apple Touch Icon**: 180x180 PNG
- **Maskable Icon**: 512x512 PNG with safe zone

## Scripts

### Available Scripts
- `scripts/generate-favicons.js` - Generates favicon variants
- `scripts/create-favicon-pngs.js` - Creates PNG favicon files

### Running Scripts
```bash
# Generate all favicon variants
node scripts/generate-favicons.js

# Create PNG favicons from source
node scripts/create-favicon-pngs.js
```

## Validation

### File Verification
```bash
# Verify all assets exist
find client/public/assets -name "*.svg" -o -name "*.png" -o -name "*.ico" | grep -E "(logo|favicon)" | sort
```

### Build Testing
```bash
# Test production build
cd client && npm run build

# Verify assets in build
ls -la client/dist/assets/
```

## Troubleshooting

### Common Issues
1. **Missing favicons**: Run favicon generation scripts
2. **Wrong logo theme**: Check logo-dark.svg for dark theme
3. **PWA icon issues**: Verify manifest.json configuration
4. **Build errors**: Check file paths and permissions

### Image Processing Tools
If ImageMagick or Sharp is available, optimal favicon generation:
```bash
# Convert ICO to PNG (if ImageMagick available)
convert favicon.ico -resize 16x16 favicon-16x16.png
convert favicon.ico -resize 32x32 favicon-32x32.png
```

## Maintenance Notes
- Keep source assets in `brand/` folder for future updates
- Test across browsers after asset updates
- Verify PWA installation with new assets
- Update this guide when adding new asset types