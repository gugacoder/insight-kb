const fs = require('fs');
const path = require('path');

// Try to create proper favicon PNGs from existing resources
// Since we can't convert ICO to PNG easily without ImageMagick or similar tools,
// we'll create placeholder PNG files from the existing brand logos

const assetsDir = './client/public/assets';
const brandDir = './client/public/assets/brand/logos';

// Create 16x16 and 32x32 favicon PNGs by copying and renaming existing PNGs
// This is a temporary solution - ideally these should be generated from ICO files

try {
  const logoPath = path.join(brandDir, 'nic-logo.png');
  
  // Check if source logo exists
  if (!fs.existsSync(logoPath)) {
    console.error('Source logo not found:', logoPath);
    process.exit(1);
  }

  // Copy for 16x16 favicon
  const favicon16Path = path.join(assetsDir, 'favicon-16x16.png');
  fs.copyFileSync(logoPath, favicon16Path);
  console.log('✓ Created favicon-16x16.png');

  // Copy for 32x32 favicon  
  const favicon32Path = path.join(assetsDir, 'favicon-32x32.png');
  fs.copyFileSync(logoPath, favicon32Path);
  console.log('✓ Created favicon-32x32.png');

  console.log('\nNote: These are temporary PNG files. For optimal results, use proper image processing tools to create correctly sized favicons.');
  console.log('The files should be exactly 16x16 and 32x32 pixels respectively.');

} catch (error) {
  console.error('Error creating favicon PNGs:', error);
  process.exit(1);
}