import { threads, simd } from 'wasm-feature-detect';
import { initEmscriptenModule } from '../emscripten-utils';
import type { JXLOptions } from '../types';

export type { JXLOptions };

export const defaultOptions: Required<JXLOptions> = {
  speed: 4,
  quality: 75,
  progressive: false,
  epf: -1,
  nearLossless: 0,
  lossyPalette: false,
  decodingSpeedTier: 0,
};

let encModule: Promise<any>;
let decModule: Promise<any>;

/**
 * JXL has the most sophisticated capability ladder:
 *   threads() && simd()  → jxl_enc_mt_simd (fastest)
 *   threads() only       → jxl_enc_mt
 *   fallback             → jxl_enc (widest compat)
 *
 * Both MT variants spawn a nested pthreads worker via .worker.js.
 */
async function initEnc(base: string): Promise<any> {
  if (!encModule) {
    encModule = (async () => {
      const supportsThreads =
        (await threads()) &&
        'importScripts' in self &&
        'Worker' in self;

      if (supportsThreads && await simd()) {
        const m = await import(base + 'jxl_enc_mt_simd.js');
        return initEmscriptenModule(
          m.default,
          base + 'jxl_enc_mt_simd.wasm',
          base + 'jxl_enc_mt_simd.worker.js',
        );
      }
      if (supportsThreads) {
        const m = await import(base + 'jxl_enc_mt.js');
        return initEmscriptenModule(
          m.default,
          base + 'jxl_enc_mt.wasm',
          base + 'jxl_enc_mt.worker.js',
        );
      }
      const m = await import(base + 'jxl_enc.js');
      return initEmscriptenModule(m.default, base + 'jxl_enc.wasm');
    })();
  }
  return encModule;
}

async function initDec(base: string): Promise<any> {
  if (!decModule) {
    decModule = import(base + 'jxl_dec.js').then((m) =>
      initEmscriptenModule(m.default, base + 'jxl_dec.wasm'),
    );
  }
  return decModule;
}

export async function encode(
  data: ImageData,
  options: JXLOptions,
  codecBase: string,
): Promise<ArrayBuffer> {
  const opts = { ...defaultOptions, ...options };
  const module = await initEnc(codecBase);
  const result = module.encode(data.data, data.width, data.height, opts);
  if (!result) throw new Error('JXL encode failed');
  return result.buffer as ArrayBuffer;
}

export async function decode(blob: Blob, codecBase: string): Promise<ImageData> {
  const module = await initDec(codecBase);
  const arrayBuffer = await blob.arrayBuffer();
  const result = module.decode(new Uint8Array(arrayBuffer));
  if (!result) throw new Error('JXL decode failed');
  return result;
}
