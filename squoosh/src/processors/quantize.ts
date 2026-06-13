/**
 * Quantize processor — Emscripten C++ module (imagequant).
 * WASM path: codecs/imagequant/imagequant.js + imagequant.wasm
 */
import { initEmscriptenModule } from '../emscripten-utils';
import type { QuantizeOptions } from '../types';

export const defaultOptions: Required<QuantizeOptions> = {
  maxNumColors: 255,
  dither: 1.0,
};

let quantModule: Promise<any>;

async function initQuantize(base: string): Promise<any> {
  // base = <cdn>codecs/imagequant/
  if (!quantModule) {
    quantModule = import(base + 'imagequant.js').then((m) =>
      initEmscriptenModule(m.default, base + 'imagequant.wasm'),
    );
  }
  return quantModule;
}

export async function quantize(
  data: ImageData,
  options: QuantizeOptions,
  processorBase: string,
): Promise<ImageData> {
  const opts = { ...defaultOptions, ...options };
  // processorBase = <cdn>codecs/
  const module = await initQuantize(processorBase + 'imagequant/');
  const result = module.quantize(
    data.data,
    data.width,
    data.height,
    opts.maxNumColors,
    opts.dither,
  );
  return new ImageData(result, data.width, data.height);
}
