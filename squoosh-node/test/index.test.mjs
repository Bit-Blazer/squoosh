import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImagePool } from '../build/index.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testImagePath = path.resolve(__dirname, '../../codecs/example.png');

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
    assert.strictEqual(
      decoded.bitmap.width,
      100,
      'Image should be resized to 100px width',
    );
  });

  const codecs = ['mozjpeg', 'webp', 'avif', 'jxl', 'oxipng', 'wp2'];

  for (const codec of codecs) {
    it(`should successfully encode an image using ${codec}`, async () => {
      const image = imagePool.ingestImage(fileBuffer);
      await image.decoded;

      const encodeOptions = {
        [codec]: 'auto',
      };

      await image.encode(encodeOptions);

      const result = await image.encodedWith[codec];
      assert.ok(result, `${codec} encoding result should exist`);
      assert.ok(
        result.binary instanceof Uint8Array,
        `${codec} output should be Uint8Array`,
      );
      assert.ok(
        result.size > 0,
        `${codec} encoded size should be greater than 0`,
      );
      assert.ok(
        result.binary.length > 0,
        `${codec} encoded binary should have data`,
      );

      console.log(`\n  squoosh-node results (${codec}):`);
      console.log(`   Original: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
      console.log(
        `   └ Output: ${(result.size / 1024).toFixed(2)} KB (↓${((1 - result.size / fileBuffer.length) * 100).toFixed(2)}%)`,
      );
    });
  }
});
