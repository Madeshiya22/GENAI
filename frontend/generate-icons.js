import fs from 'fs';
import sharp from 'sharp';
import path from 'path';

const inputSvg = path.resolve('./public/favicon.svg');
const publicDir = path.resolve('./public');

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

async function generateIcons() {
  if (!fs.existsSync(inputSvg)) {
    console.error(`Input SVG not found: ${inputSvg}`);
    return;
  }

  const svgBuffer = fs.readFileSync(inputSvg);

  for (const item of sizes) {
    const outputPath = path.join(publicDir, item.name);
    try {
      await sharp(svgBuffer)
        .resize(item.size, item.size)
        .png()
        .toFile(outputPath);
      console.log(`Generated ${item.name} (${item.size}x${item.size})`);
    } catch (err) {
      console.error(`Error generating ${item.name}:`, err);
    }
  }

  // Also create a maskable icon (often with a background)
  try {
    await sharp(svgBuffer)
      .resize(512, 512, { fit: 'contain', background: { r: 134, g: 59, b: 255, alpha: 1 } }) // #863bff background for maskable
      .flatten({ background: { r: 134, g: 59, b: 255 } })
      .png()
      .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
    console.log('Generated maskable-icon-512x512.png');
  } catch (err) {
      console.error(`Error generating maskable icon:`, err);
  }
}

generateIcons();
