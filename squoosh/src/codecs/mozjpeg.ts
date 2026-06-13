import { initEmscriptenModule } from '../emscripten-utils';
import type { MozJPEGOptions } from '../types';

export type { MozJPEGOptions };

// Defaults mirror squoosh.app exactly
export const defaultOptions: Required<MozJPEGOptions> = {
  quality: 75,
  baseline: false,
  arithmetic: false,
  progressive: true,
  optimize_coding: true,
  smoothing: 0,
  color_space: 3 /* YCbCr */,
  quant_table: 3,
  trellis_multipass: false,
  trellis_opt_zero: false,
  trellis_opt_table: false,
  trellis_loops: 1,
  auto_subsample: true,
  chroma_subsample: 2,
  separate_chroma_quality: false,
  chroma_quality: 75,
};

// MozJPEG has no browser decoder — only a node one. Decoding is handled
// by the native createImageBitmap path in index.ts.

let encModule: Promise<any>;

export function initEnc(base: string) {
  // base = <cdn>codecs/mozjpeg/enc/
  if (!encModule) {
    encModule = import(base + 'mozjpeg_enc.js').then((m) =>
      initEmscriptenModule(m.default, base + 'mozjpeg_enc.wasm'),
    );
  }
  return encModule;
}

export async function encode(
  data: ImageData,
  options: MozJPEGOptions,
  codecBase: string,
): Promise<ArrayBuffer> {
  const opts = { ...defaultOptions, ...options };
  const module = await initEnc(codecBase);
  const result = module.encode(data.data, data.width, data.height, opts);
  return result.buffer as ArrayBuffer;
}
