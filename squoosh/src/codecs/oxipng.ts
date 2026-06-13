/**
 * OxiPNG codec — wasm-pack Rust module, NOT Emscripten.
 *
 * Uses two flavours:
 *   - Single-threaded: codecs/oxipng/pkg/squoosh_oxipng.js
 *   - Multi-threaded:  codecs/oxipng/pkg-parallel/squoosh_oxipng.js
 *
 * PNG decode (for reading .png files) uses codecs/png/pkg/squoosh_png.js.
 */
import { threads } from 'wasm-feature-detect';
import type { OxiPNGOptions } from '../types';

export type { OxiPNGOptions };

export const defaultOptions: Required<OxiPNGOptions> = {
  level: 2,
  interlace: false,
};

// Tracks the optimise function once WASM is initialized.
let wasmReady: Promise<(data: Uint8ClampedArray, width: number, height: number, level: number, interlace: boolean) => Uint8Array>;
let pngModule: Promise<any>;

async function initMT(oxipngBase: string) {
  const m = await import(oxipngBase + 'pkg-parallel/squoosh_oxipng.js');
  await m.default(fetch(oxipngBase + 'pkg-parallel/squoosh_oxipng_bg.wasm'));
  await m.initThreadPool(navigator.hardwareConcurrency);
  return m.optimise;
}

async function initST(oxipngBase: string) {
  const m = await import(oxipngBase + 'pkg/squoosh_oxipng.js');
  await m.default(fetch(oxipngBase + 'pkg/squoosh_oxipng_bg.wasm'));
  return m.optimise;
}

async function initPng(pngBase: string) {
  if (!pngModule) {
    pngModule = (async () => {
      const m = await import(pngBase + 'pkg/squoosh_png.js');
      await m.default(fetch(pngBase + 'pkg/squoosh_png_bg.wasm'));
      return m;
    })();
  }
  return pngModule;
}

async function initOxiPNG(oxipngBase: string) {
  if (!wasmReady) {
    // Safari 16 nested worker check mirrors squoosh.app
    const supportsThreads =
      (await threads()) &&
      'importScripts' in self &&
      'Worker' in self;
    wasmReady = supportsThreads ? initMT(oxipngBase) : initST(oxipngBase);
  }
  return wasmReady;
}

export async function encode(
  data: ImageData,
  options: OxiPNGOptions,
  codecBase: string,
): Promise<ArrayBuffer> {
  const opts = { ...defaultOptions, ...options };
  // codecBase = <cdn>codecs/oxipng/
  const optimise = await initOxiPNG(codecBase + 'oxipng/');
  return optimise(
    new Uint8ClampedArray(data.data.buffer),
    data.width,
    data.height,
    opts.level,
    opts.interlace,
  ).buffer as ArrayBuffer;
}

export async function decode(blob: Blob, codecBase: string): Promise<ImageData> {
  // codecBase = <cdn>codecs/png/
  const pngMod = await initPng(codecBase + 'png/');
  const arrayBuffer = await blob.arrayBuffer();
  const result = pngMod.decode(new Uint8Array(arrayBuffer));
  if (!result) throw new Error('PNG decode failed');
  return result;
}
