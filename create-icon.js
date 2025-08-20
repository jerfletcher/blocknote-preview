const sharp = require('sharp');

// Create SVG content
const svgContent = `
<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'>
  <!-- Document with transparent background -->
  <rect x='20' y='16' width='88' height='96' rx='4' fill='#4285f4' stroke='#1a73e8' stroke-width='2'/>
  
  <!-- BlockNote blocks -->
  <rect x='28' y='28' width='72' height='8' rx='4' fill='white' opacity='0.9'/>
  <rect x='28' y='44' width='56' height='8' rx='4' fill='white' opacity='0.7'/>
  <rect x='28' y='60' width='64' height='8' rx='4' fill='white' opacity='0.9'/>
  <rect x='28' y='76' width='48' height='8' rx='4' fill='white' opacity='0.7'/>
  <rect x='28' y='92' width='60' height='8' rx='4' fill='white' opacity='0.9'/>
  
  <!-- Edit indicator -->
  <circle cx='96' cy='32' r='8' fill='#34a853'/>
  <path d='M92 32 L96 28 L100 32 L96 36 Z' fill='white'/>
</svg>
`;

sharp(Buffer.from(svgContent))
  .resize(128, 128)
  .png()
  .toFile('media/blocknote-icon.png')
  .then(() => console.log('PNG icon created successfully'))
  .catch(err => console.error('Error:', err));

// Create smaller tab icon (16x16)
sharp(Buffer.from(svgContent))
  .resize(16, 16)
  .png()
  .toFile('media/blocknote-tab-icon.png')
  .then(() => console.log('Tab icon created successfully'))
  .catch(err => console.error('Tab icon error:', err));
