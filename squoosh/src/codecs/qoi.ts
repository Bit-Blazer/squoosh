// QOI has WASM binaries (enc and dec).
import { initEmscriptenModule } from '../emscripten-utils';
import type { QOIOptions } from '../types';

export type { QOIOptions };

export const defaultOptions: QOIOptions = {};

let encModule: Promise<any>;
let decModule: Promise<any>;

function initEnc(base: string) {
  if (!encModule) {
    encModule = import(base + 'qoi_enc.js').then((m) =>
      initEmscriptenModule(m.default, base + 'qoi_enc.wasm'),
    );
  }
  return encModule;
}

function initDec(base: string) {
  if (!decModule) {
    decModule = import(base + 'qoi_dec.js').then((m) =>
      initEmscriptenModule(m.default, base + 'qoi_dec.wasm'),
    );
  }
  return decModule;
}

export async function encode(
  data: ImageData,
  _options: QOIOptions,
  codecBase: string,
): Promise<ArrayBuffer> {
  const module = await initEnc(codecBase);
  const result = module.encode(data.data, data.width, data.height, {});
  return result.buffer as ArrayBuffer;
}

export async function decode(blob: Blob, codecBase: string): Promise<ImageData> {
  const module = await initDec(codecBase);
  const arrayBuffer = await blob.arrayBuffer();
  const result = module.decode(new Uint8Array(arrayBuffer));
  if (!result) throw new Error('QOI decode failed');
  return result;
}
