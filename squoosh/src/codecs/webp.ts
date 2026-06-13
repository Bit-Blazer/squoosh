import { simd } from 'wasm-feature-detect';
import { initEmscriptenModule } from '../emscripten-utils';
import type { WebPOptions } from '../types';

export type { WebPOptions };

export const defaultOptions: Required<WebPOptions> = {
  quality: 75,
  target_size: 0,
  target_PSNR: 0,
  method: 4,
  sns_strength: 50,
  filter_strength: 60,
  filter_sharpness: 0,
  filter_type: 1,
  partitions: 0,
  segments: 4,
  pass: 1,
  show_compressed: 0,
  preprocessing: 0,
  autofilter: 0,
  partition_limit: 0,
  alpha_compression: 1,
  alpha_filtering: 1,
  alpha_quality: 100,
  lossless: 0,
  exact: 0,
  image_hint: 0,
  emulate_jpeg_size: 0,
  thread_level: 0,
  low_memory: 0,
  near_lossless: 100,
  use_delta_palette: 0,
  use_sharp_yuv: 0,
};

let encModule: Promise<any>;
let decModule: Promise<any>;

async function initEnc(base: string): Promise<any> {
  if (!encModule) {
    encModule = (async () => {
      if (await simd()) {
        const m = await import(base + 'webp_enc_simd.js');
        return initEmscriptenModule(m.default, base + 'webp_enc_simd.wasm');
      }
      const m = await import(base + 'webp_enc.js');
      return initEmscriptenModule(m.default, base + 'webp_enc.wasm');
    })();
  }
  return encModule;
}

async function initDec(base: string): Promise<any> {
  if (!decModule) {
    decModule = import(base + 'webp_dec.js').then((m) =>
      initEmscriptenModule(m.default, base + 'webp_dec.wasm'),
    );
  }
  return decModule;
}

export async function encode(
  data: ImageData,
  options: WebPOptions,
  codecBase: string,
): Promise<ArrayBuffer> {
  const opts = { ...defaultOptions, ...options };
  const module = await initEnc(codecBase);
  const result = module.encode(data.data, data.width, data.height, opts);
  if (!result) throw new Error('WebP encode failed');
  return result.buffer as ArrayBuffer;
}

export async function decode(blob: Blob, codecBase: string): Promise<ImageData> {
  const module = await initDec(codecBase);
  const arrayBuffer = await blob.arrayBuffer();
  const result = module.decode(new Uint8Array(arrayBuffer));
  if (!result) throw new Error('WebP decode failed');
  return result;
}
