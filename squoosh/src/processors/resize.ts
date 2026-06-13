/**
 * Resize processor — uses two wasm-pack Rust modules (squoosh_resize and squooshhqx),
 * NOT Emscripten. Loading pattern mirrors squoosh.app's resize.ts exactly.
 *
 * WASM paths:
 *   codecs/resize/pkg/squoosh_resize.js + squoosh_resize_bg.wasm
 *   codecs/hqx/pkg/squooshhqx.js        + squooshhqx_bg.wasm
 */
import type { ResizeOptions } from '../types';

export const defaultOptions: Required<ResizeOptions> = {
  width: 0,
  height: 0,
  method: 'lanczos3',
  fitMethod: 'stretch',
  premultiply: true,
  linearRGB: true,
};

/** Resize methods by index — must match order in squoosh_resize Rust code. */
const resizeMethods: Array<ResizeOptions['method']> = [
  'triangle',
  'catrom',
  'mitchell',
  'lanczos3',
];

let resizeWasmReady: Promise<any>;
let hqxWasmReady: Promise<any>;
let resizeMod: any;
let hqxMod: any;

async function initResize(base: string) {
  // base = <cdn>codecs/resize/pkg/
  if (!resizeWasmReady) {
    resizeWasmReady = (async () => {
      const m = await import(base + 'squoosh_resize.js');
      await m.default(fetch(base + 'squoosh_resize_bg.wasm'));
      resizeMod = m;
    })();
  }
  return resizeWasmReady;
}

async function initHqx(base: string) {
  // base = <cdn>codecs/hqx/pkg/
  if (!hqxWasmReady) {
    hqxWasmReady = (async () => {
      const m = await import(base + 'squooshhqx.js');
      await m.default(fetch(base + 'squooshhqx_bg.wasm'));
      hqxMod = m;
    })();
  }
  return hqxWasmReady;
}

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

async function hqxResize(
  input: ImageData,
  targetWidth: number,
  targetHeight: number,
  hqxBase: string,
): Promise<ImageData> {
  await initHqx(hqxBase);
  const widthRatio = targetWidth / input.width;
  const heightRatio = targetHeight / input.height;
  const ratio = Math.max(widthRatio, heightRatio);
  const factor = clamp(Math.ceil(ratio), 1, 4) as 1 | 2 | 3 | 4;
  if (factor === 1) return input;
  const result = hqxMod.resize(
    new Uint32Array(input.data.buffer),
    input.width,
    input.height,
    factor,
  );
  return new ImageData(
    new Uint8ClampedArray(result.buffer),
    input.width * factor,
    input.height * factor,
  );
}

function resolveSize(
  opts: ResizeOptions,
  inputWidth: number,
  inputHeight: number,
): { width: number; height: number } {
  if (!opts.width && !opts.height)
    throw new Error('Resize requires width or height');
  if (opts.width && opts.height)
    return { width: opts.width, height: opts.height };
  if (!opts.width) {
    return {
      width: Math.round((inputWidth / inputHeight) * opts.height!),
      height: opts.height!,
    };
  }
  return {
    width: opts.width,
    height: Math.round((inputHeight / inputWidth) * opts.width),
  };
}

/**
 * @param processorBase The CDN base for codec assets, e.g. https://cdn.../dist/codecs/
 */
export async function resize(
  data: ImageData,
  options: ResizeOptions,
  processorBase: string,
): Promise<ImageData> {
  const { width, height } = resolveSize(options, data.width, data.height);
  const method = options.method ?? defaultOptions.method;
  const resizeBase = processorBase + 'resize/pkg/';
  const hqxBase = processorBase + 'hqx/pkg/';

  await initResize(resizeBase);

  let input = data;
  if (method === 'hqx') {
    input = await hqxResize(data, width, height, hqxBase);
    // Finish with catrom to hit the exact target size
    const result = resizeMod.resize(
      new Uint8Array(input.data.buffer),
      input.width,
      input.height,
      width,
      height,
      resizeMethods.indexOf('catrom'),
      options.premultiply ?? true,
      options.linearRGB ?? true,
    );
    return new ImageData(new Uint8ClampedArray(result.buffer), width, height);
  }

  const result = resizeMod.resize(
    new Uint8Array(input.data.buffer),
    input.width,
    input.height,
    width,
    height,
    resizeMethods.indexOf(method),
    options.premultiply ?? true,
    options.linearRGB ?? true,
  );
  return new ImageData(new Uint8ClampedArray(result.buffer), width, height);
}
