/**
 * Web Worker entry point for @bit-blazer/squoosh.
 *
 * Compiled into dist/worker.js (IIFE format, self-contained via importScripts).
 * Exposes all codec and processor functions via Comlink.
 *
 * CDN base is injected by the main thread blob bootstrap:
 *   self.__SQUOOSH_CDN_BASE__ = 'https://cdn.../dist/'
 *
 * Codec WASM files live under: <cdnBase>codecs/<codec>/<subdir>/
 * Processor WASM files live under: <cdnBase>codecs/
 */
import { expose } from 'comlink';
import * as mozjpeg from './codecs/mozjpeg';
import * as webp from './codecs/webp';
import * as avif from './codecs/avif';
import * as jxl from './codecs/jxl';
import * as oxipng from './codecs/oxipng';
import * as wp2 from './codecs/wp2';
import * as qoi from './codecs/qoi';
import { resize } from './processors/resize';
import { quantize } from './processors/quantize';
import { rotate } from './processors/rotate';

declare const __SQUOOSH_CDN_BASE__: string;

function getCdnBase(): string {
  return (
    (self as any)['SQUOOSH_CDN_BASE_OVERRIDE'] ||
    (typeof __SQUOOSH_CDN_BASE__ !== 'undefined' ? __SQUOOSH_CDN_BASE__ : './')
  );
}

/**
 * Returns the base URL for a named codec's assets.
 * Codec files are structured as: codecs/<name>/{enc|dec}/*.js
 * e.g. codecs/mozjpeg/enc/mozjpeg_enc.js
 */
function encBase(codec: string): string {
  return getCdnBase() + 'codecs/' + codec + '/enc/';
}

function decBase(codec: string): string {
  return getCdnBase() + 'codecs/' + codec + '/dec/';
}

/** Base URL for processors (imagequant, resize, rotate) — they live directly in codecs/. */
function codecsBase(): string {
  return getCdnBase() + 'codecs/';
}

const api = {
  // ---- Decoders (WASM) ----
  // MozJPEG: no browser decoder — only mozjpeg_node_dec exists. JPEG decode uses native createImageBitmap in index.ts.
  webpDecode: (blob: Blob) => webp.decode(blob, decBase('webp')),
  avifDecode: (blob: Blob) => avif.decode(blob, decBase('avif')),
  jxlDecode: (blob: Blob) => jxl.decode(blob, decBase('jxl')),
  // OxiPNG decode uses the PNG codec (codecs/png/) — path is handled inside oxipng.decode()
  pngDecode: (blob: Blob) => oxipng.decode(blob, codecsBase()),
  wp2Decode: (blob: Blob) => wp2.decode(blob, decBase('wp2')),
  qoiDecode: (blob: Blob) => qoi.decode(blob, decBase('qoi')),

  // ---- Encoders ----
  mozjpegEncode: (data: ImageData, opts: mozjpeg.MozJPEGOptions) =>
    mozjpeg.encode(data, opts, encBase('mozjpeg')),
  webpEncode: (data: ImageData, opts: webp.WebPOptions) =>
    webp.encode(data, opts, encBase('webp')),
  avifEncode: (data: ImageData, opts: avif.AVIFOptions) =>
    avif.encode(data, opts, encBase('avif')),
  jxlEncode: (data: ImageData, opts: jxl.JXLOptions) =>
    jxl.encode(data, opts, encBase('jxl')),
  // OxiPNG encode: oxipng.encode() appends oxipng/ internally, receives codecsBase
  oxipngEncode: (data: ImageData, opts: oxipng.OxiPNGOptions) =>
    oxipng.encode(data, opts, codecsBase()),
  wp2Encode: (data: ImageData, opts: wp2.WP2Options) =>
    wp2.encode(data, opts, encBase('wp2')),
  qoiEncode: (data: ImageData, opts: qoi.QOIOptions) =>
    qoi.encode(data, opts, encBase('qoi')),

  // ---- Processors ----
  resize: (data: ImageData, opts: Parameters<typeof resize>[1]) =>
    resize(data, opts, codecsBase()),
  quantize: (data: ImageData, opts: Parameters<typeof quantize>[1]) =>
    quantize(data, opts, codecsBase()),
  rotate: (data: ImageData, opts: Parameters<typeof rotate>[1]) =>
    rotate(data, opts, codecsBase()),
};

export type SquooshWorkerApi = typeof api;

expose(api, self as any);
