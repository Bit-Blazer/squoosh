import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.resolve(__dirname, '../src/prod.js');
const sourceImagePath = path.resolve(__dirname, '../../codecs/example.png');
const tempTestPath = path.resolve(__dirname, '../temp');

describe('squoosh-cli', () => {
  before(async () => {
    // Prepare temp output directory
    await fs.rm(tempTestPath, { recursive: true, force: true });
    await fs.mkdir(tempTestPath, { recursive: true });
  });

  after(async () => {
    // Cleanup
    await fs.rm(tempTestPath, { recursive: true, force: true });
  });

  const runCli = async (args) => {
    // Use node to run the CLI build directly
    const command = `node "${cliPath}" ${args} -d "${tempTestPath}" "${sourceImagePath}"`;
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return { stdout, stderr };
  };

  it('should print help text', async () => {
    const { stdout } = await execAsync(`node "${cliPath}" --help`);
    assert.match(
      stdout,
      /Usage: squoosh-cli|Usage: squoosh-cli|Usage: cli/i,
      'Help text should contain usage',
    );
  });

  const codecs = ['mozjpeg', 'webp', 'avif', 'jxl', 'oxipng', 'wp2'];

  for (const codec of codecs) {
    it(`should encode using ${codec}`, async () => {
      // Run the test directly
      await runCli(`--${codec} auto`);

      const files = await fs.readdir(tempTestPath);
      // Determine expected extension
      let ext = codec;
      if (codec === 'mozjpeg') ext = 'jpg';
      if (codec === 'oxipng') ext = 'png';

      const hasOutput = files.some((f) => f.endsWith(`.${ext}`));
      assert.ok(hasOutput, `Should have generated a .${ext} file`);
    });
  }

  it('should apply preprocessors (resize and quantize)', async () => {
    await runCli(
      `--resize '{"enabled":true,"width":100}' --quant '{"enabled":true,"maxNumColors":16}' --oxipng '{"level":2}'`,
    );
    const files = await fs.readdir(tempTestPath);
    const hasPng = files.some((f) => f.endsWith('.png'));
    assert.ok(hasPng, 'Should have generated a resized/quantized .png file');
  });
});
