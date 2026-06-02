import { initEmscriptenModule } from '../emscripten-utils';
import type { WP2Options } from '../types';

export type { WP2Options };

export const defaultOptions: Required<WP2Options> = {
  quality: 75,
  alpha_quality: 75,
  effort: 5,
  pass: 1,
  sns: 50,
  uv_mode: 0 /* UVModeAuto */,
  csp_type: 0 /* kYCoCg */,
  error_diffusion: 0,
  use_random_matrix: false,
};

let encModule: Promise<any>;
let decModule: Promise<any>;

function initEnc(base: string) {
  if (!encModule) {
    encModule = import(base + 'wp2_enc.js').then((m) =>
      initEmscriptenModule(m.default, base + 'wp2_enc.wasm'),
    );
  }
  return encModule;
}

function initDec(base: string) {
  if (!decModule) {
    decModule = import(base + 'wp2_dec.js').then((m) =>
      initEmscriptenModule(m.default, base + 'wp2_dec.wasm'),
    );
  }
  return decModule;
}

export async function encode(
  data: ImageData,
  options: WP2Options,
  codecBase: string,
): Promise<ArrayBuffer> {
  const opts = { ...defaultOptions, ...options };
  const module = await initEnc(codecBase);
  const result = module.encode(data.data, data.width, data.height, opts);
  if (!result) throw new Error('WP2 encode failed');
  return result.buffer as ArrayBuffer;
}

export async function decode(blob: Blob, codecBase: string): Promise<ImageData> {
  const module = await initDec(codecBase);
  const arrayBuffer = await blob.arrayBuffer();
  const result = module.decode(new Uint8Array(arrayBuffer));
  if (!result) throw new Error('WP2 decode failed');
  return result;
}
