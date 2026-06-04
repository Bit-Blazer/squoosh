import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImagePool } from '../build/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testImagePath = path.resolve(__dirname, '../../test-images/example.png');

describe('squoosh-node', () => {
  let imagePool;
  let fileBuffer;

  before(async () => {
    imagePool = new ImagePool(2);
    fileBuffer = await fs.readFile(testImagePath);
  });

  after(async () => {
    await imagePool.close();
  });

  it('should successfully ingest an image', () => {
    const image = imagePool.ingestImage(fileBuffer);
    assert.ok(image, 'Image object should be created');
    assert.ok(image.decoded, 'Decoded promise should exist');
  });

  it('should decode and preprocess (resize) an image', async () => {
    const image = imagePool.ingestImage(fileBuffer);
    await image.decoded;
    await image.preprocess({
      resize: {
        enabled: true,
        width: 100,
      },
    });
    // Check that decoded bitmap size has changed.
    const decoded = await image.decoded;
    assert.strictEqual(decoded.bitmap.width, 100, 'Image should be resized to 100px width');
  });

  const codecs = ['mozjpeg', 'webp', 'avif', 'jxl', 'oxipng', 'wp2'];

  for (const codec of codecs) {
    it(`should successfully encode an image using ${codec}`, async () => {
      const image = imagePool.ingestImage(fileBuffer);

      // We explicitly await the decode first to ensure it's loaded
      await image.decoded;

      // Encode using auto config for everything, or default empty config
      await image.encode({ [codec]: 'auto' });

      const result = await image.encodedWith[codec];
      assert.ok(result, `Result for ${codec} should exist`);
      assert.ok(result.binary instanceof Uint8Array, `Binary should be a Uint8Array for ${codec}`);
      assert.ok(result.binary.length > 0, `Binary length should be > 0 for ${codec}`);
      assert.ok(result.extension, `Should have an extension for ${codec}`);

      const originalSize = fileBuffer.length;
      const newSize = result.binary.length;
      const isBigger = newSize > originalSize;
      const percentChange = (Math.abs(originalSize - newSize) / originalSize * 100).toFixed(2);
      const sign = isBigger ? '↑' : '↓';
      const color = isBigger ? '\x1b[31m' : '\x1b[32m';
      const reset = '\x1b[0m';
      process.stdout.write(`\n  \x1b[36msquoosh-node results (${codec}):${reset}\n`);
      process.stdout.write(`   \x1b[90mOriginal:\x1b[0m ${(originalSize / 1024).toFixed(2)} KB\n`);
      process.stdout.write(`   \x1b[90m└ Output:\x1b[0m ${(newSize / 1024).toFixed(2)} KB (${color}${sign}${percentChange}%${reset})\n\n`);
    });
  }
});
