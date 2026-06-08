import fs from 'fs';
import sharp from 'sharp';
import path from 'path';

const inputLogo = path.resolve('./src/assets/mentoai_logo.png');
const iconDir = path.resolve('./public/icon');

if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });

const sizes = [
  { name: 'mentoai_logo.png',        size: 192 },
  { name: 'mentoai_logo_512x512.png', size: 512 },
];

async function generateIcons() {
  const buf = fs.readFileSync(inputLogo);

  for (const item of sizes) {
    await sharp(buf)
      .resize(item.size, item.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(iconDir, item.name));
    console.log(`✓ Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Maskable: logo on dark background with padding
  await sharp(buf)
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 56, bottom: 56, left: 56, right: 56, background: { r: 13, g: 6, b: 30, alpha: 1 } })
    .png()
    .toFile(path.resolve('./public/maskable-icon-512x512.png'));
  console.log('✓ Generated maskable-icon-512x512.png');

  // Apple touch icon
  await sharp(buf)
    .resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: { r: 13, g: 6, b: 30, alpha: 1 } })
    .png()
    .toFile(path.resolve('./public/apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png (180x180)');
}

generateIcons().catch(console.error);
