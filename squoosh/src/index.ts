/**
 * @bit-blazer/squoosh — Main thread entry point.
 *
 * Usage:
 *   import { Squoosh } from '@bit-blazer/squoosh';
 *   const squoosh = new Squoosh();
 *   const result = await squoosh.encode(imageData, { codec: 'mozjpeg', options: { quality: 75 } });
 *   squoosh.terminate();
 */
import { WorkerBridge } from './worker-bridge';
import type {
  CodecOptions,
  EncodeResult,
  QuantizeOptions,
  ResizeOptions,
  RotateOptions,
  SquooshOptions,
} from './types';

// Injected at build time by Rollup replace plugin.
declare const __SQUOOSH_VERSION__: string;
declare const __SQUOOSH_CDN_BASE__: string;

const CODEC_META: Record<string, { mimeType: string; extension: string }> = {
  mozjpeg: { mimeType: 'image/jpeg', extension: 'jpg' },
  webp: { mimeType: 'image/webp', extension: 'webp' },
  avif: { mimeType: 'image/avif', extension: 'avif' },
  jxl: { mimeType: 'image/jxl', extension: 'jxl' },
  oxipng: { mimeType: 'image/png', extension: 'png' },
  wp2: { mimeType: 'image/webp2', extension: 'wp2' },
  qoi: { mimeType: 'image/qoi', extension: 'qoi' },
};

const MAGIC_NUMBERS: [RegExp, string][] = [
  [/^\xFF\xD8\xFF/, 'image/jpeg'],
  [/^\x89PNG\x0D\x0A\x1A\x0A/, 'image/png'],
  [/^GIF8/, 'image/gif'],
  [/^BM/, 'image/bmp'],
  [/^RIFF....WEBPVP8[LX ]/s, 'image/webp'],
  [/^\xF4\xFF\x6F/, 'image/webp2'],
  [/^\x00\x00\x00 ftypavif\x00\x00\x00\x00/, 'image/avif'],
  [/^\xff\x0a/, 'image/jxl'],
  [/^\x00\x00\x00\x0cJXL \x0d\x0a\x87\x0a/, 'image/jxl'],
  [/^qoif/, 'image/qoi'],
];

async function sniffMimeType(blob: Blob): Promise<string> {
  const chunk = await blob.slice(0, 16).arrayBuffer();
  const str = Array.from(new Uint8Array(chunk))
    .map((v) => String.fromCodePoint(v))
    .join('');
  for (const [re, mime] of MAGIC_NUMBERS) {
    if (re.test(str)) return mime;
  }
  return '';
}

export class Squoosh {
  private _bridge: WorkerBridge;
  private _cdnBase: string;

  constructor(options: SquooshOptions = {}) {
    const version =
      typeof __SQUOOSH_VERSION__ !== 'undefined'
        ? __SQUOOSH_VERSION__
        : '1.0.0';
    const defaultCdn =
      typeof __SQUOOSH_CDN_BASE__ !== 'undefined'
        ? __SQUOOSH_CDN_BASE__
        : `https://cdn.jsdelivr.net/npm/@bit-blazer/squoosh@${version}/dist/`;

    this._cdnBase = options.cdnBase ?? defaultCdn;
    const workerUrl = this._cdnBase + 'worker.js';
    this._bridge = new WorkerBridge(workerUrl, this._cdnBase);
  }

  /**
   * Decode any supported image format into an ImageData object.
   * Uses the browser's native createImageBitmap for common formats (JPEG, PNG, GIF, BMP),
   * and falls back to WASM decoders for exotic formats not supported natively.
   */
  async decode(
    input: Blob | File | ArrayBuffer,
    signal: AbortSignal = new AbortController().signal,
  ): Promise<ImageData> {
    const blob = input instanceof ArrayBuffer ? new Blob([input]) : input;
    const mimeType = await sniffMimeType(blob);

    // Try native browser decode first (fastest, uses GPU-accelerated codecs in Chromium).
    // Note: PNG and WebP are included here; WASM fallback only for formats browsers can't handle.
    const nativeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
    ];
    if (nativeTypes.includes(mimeType)) {
      try {
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        // Fall through to WASM decoder
      }
    }

    // WASM decoders for formats not natively supported (or native failed).
    switch (mimeType) {
      case 'image/avif':
        return this._bridge.call(signal, 'avifDecode', blob);
      case 'image/webp':
        return this._bridge.call(signal, 'webpDecode', blob);
      case 'image/png':
        return this._bridge.call(signal, 'pngDecode', blob);
      case 'image/webp2':
        return this._bridge.call(signal, 'wp2Decode', blob);
      case 'image/jxl':
        return this._bridge.call(signal, 'jxlDecode', blob);
      case 'image/qoi':
        return this._bridge.call(signal, 'qoiDecode', blob);
      default:
        // Last resort: try native
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  }

  /** Encode ImageData using the specified codec. */
  async encode(
    data: ImageData,
    codecOptions: CodecOptions,
    signal: AbortSignal = new AbortController().signal,
  ): Promise<EncodeResult> {
    const { codec, options = {} } = codecOptions as any;
    const methodName = `${codec}Encode` as any;
    const raw: ArrayBuffer = await this._bridge.call(
      signal,
      methodName,
      data,
      options,
    );
    const meta = CODEC_META[codec];
    return {
      data: new Uint8Array(raw),
      size: raw.byteLength,
      extension: meta.extension,
      mimeType: meta.mimeType,
    };
  }

  /** Encode and return a Blob. */
  async encodeToBlob(
    data: ImageData,
    codecOptions: CodecOptions,
    signal?: AbortSignal,
  ): Promise<Blob> {
    const result = await this.encode(data, codecOptions, signal);
    return new Blob([result.data as any], { type: result.mimeType });
  }

  /** Encode and return a File with the correct extension. */
  async encodeToFile(
    data: ImageData,
    filename: string,
    codecOptions: CodecOptions,
    signal?: AbortSignal,
  ): Promise<File> {
    const result = await this.encode(data, codecOptions, signal);
    const base = filename.replace(/\.[^.]*$/, '');
    return new File([result.data as any], `${base}.${result.extension}`, {
      type: result.mimeType,
    });
  }

  /** Resize the image (off-main-thread). */
  resize(
    data: ImageData,
    options: ResizeOptions,
    signal: AbortSignal = new AbortController().signal,
  ): Promise<ImageData> {
    return this._bridge.call(signal, 'resize', data, options);
  }

  /** Reduce the colour palette (quantize). */
  quantize(
    data: ImageData,
    options: QuantizeOptions = {},
    signal: AbortSignal = new AbortController().signal,
  ): Promise<ImageData> {
    return this._bridge.call(signal, 'quantize', data, options);
  }

  /** Rotate the image by multiples of 90°. */
  rotate(
    data: ImageData,
    options: RotateOptions,
    signal: AbortSignal = new AbortController().signal,
  ): Promise<ImageData> {
    return this._bridge.call(signal, 'rotate', data, options);
  }

  /** Terminate the internal Web Worker and free resources. */
  terminate() {
    this._bridge.terminate();
  }
}

export type {
  EncodeResult,
  ResizeOptions,
  QuantizeOptions,
  RotateOptions,
  CodecOptions,
  SquooshOptions,
};
export type {
  MozJPEGOptions,
  WebPOptions,
  AVIFOptions,
  JXLOptions,
  OxiPNGOptions,
  WP2Options,
  QOIOptions,
} from './types';
