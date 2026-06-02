import { threads } from 'wasm-feature-detect';
import { initEmscriptenModule } from '../emscripten-utils';
import type { AVIFOptions } from '../types';

export type { AVIFOptions };

export const defaultOptions: Required<AVIFOptions> = {
  quality: 50,
  qualityAlpha: -1,
  denoiseLevel: 0,
  tileColsLog2: 0,
  tileRowsLog2: 0,
  speed: 6,
  subsample: 1,
  chromaDeltaQ: false,
  sharpness: 0,
  tune: 0 /* AVIFTune.auto */,
  enableSharpYUV: false,
};

let encModule: Promise<any>;
let decModule: Promise<any>;

/**
 * Checks WASM threads support AND nested Worker support (for Safari 16 compat).
 * Must be called from inside a Worker context.
 */
async function checkThreadsSupport(): Promise<boolean> {
  const supportsThreads = await threads();
  if (!supportsThreads) return false;
  // Safari 16 has wasm threads but no nested workers.
  // We only call this from worker context, so 'importScripts' presence tells us we're in a worker.
  if (!('importScripts' in self)) return false;
  return 'Worker' in self;
}

async function initEnc(base: string): Promise<any> {
  if (!encModule) {
    encModule = (async () => {
      if (await checkThreadsSupport()) {
        const m = await import(base + 'avif_enc_mt.js');
        return initEmscriptenModule(
          m.default,
          base + 'avif_enc_mt.wasm',
          base + 'avif_enc_mt.worker.js',
        );
      }
      const m = await import(base + 'avif_enc.js');
      return initEmscriptenModule(m.default, base + 'avif_enc.wasm');
    })();
  }
  return encModule;
}

async function initDec(base: string): Promise<any> {
  if (!decModule) {
    decModule = import(base + 'avif_dec.js').then((m) =>
      initEmscriptenModule(m.default, base + 'avif_dec.wasm'),
    );
  }
  return decModule;
}

export async function encode(
  data: ImageData,
  options: AVIFOptions,
  codecBase: string,
): Promise<ArrayBuffer> {
  const opts = { ...defaultOptions, ...options };
  const module = await initEnc(codecBase);
  const result = module.encode(data.data, data.width, data.height, opts);
  if (!result) throw new Error('AVIF encode failed');
  return result.buffer as ArrayBuffer;
}

export async function decode(blob: Blob, codecBase: string): Promise<ImageData> {
  const module = await initDec(codecBase);
  const arrayBuffer = await blob.arrayBuffer();
  const result = module.decode(new Uint8Array(arrayBuffer));
  if (!result) throw new Error('AVIF decode failed');
  return result;
}
