import { mkdir, readdir, copyFile } from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const source = new URL('../assets/', import.meta.url);
const output = new URL('../public/assets/', import.meta.url);
await mkdir(output, { recursive: true });
for (const file of await readdir(source)) {
  if (file.startsWith('cover-')) {
    await sharp(fileURLToPath(new URL(file, source)))
      .resize({ width: 1440, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(fileURLToPath(new URL(file.replace(/\.(png|jpe?g)$/i, '.webp'), output)));
  }
}
// Never process/re-encode the QR image.
for (const file of ['support-promptpay.png', 'favicon.svg']) {
  await copyFile(new URL(file, source), new URL(file, output));
}
await sharp(fileURLToPath(new URL('mee-game-kor-pla-logo.png', source)))
  .resize(160).webp({ quality: 88 })
  .toFile(fileURLToPath(new URL('brand.webp', output)));
console.log('Prepared responsive-ready WebP covers, brand and original QR.');
