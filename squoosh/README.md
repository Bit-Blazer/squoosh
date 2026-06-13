# `@bit-blazer/squoosh`

A powerful, entirely local, browser-based image compression library running via Web Workers and WebAssembly. It delivers the exact same performance, WebAssembly codecs, and defaults as [squoosh.app](https://squoosh.app/).

This package allows you to integrate Squoosh's compression engine directly into your own frontend applications, decoding, processing, and encoding images entirely on the client side without any server-side processing.

## Features

- **100% Client-Side:** Runs completely in the browser.
- **Non-blocking:** Spawns an internal Web Worker pool to offload heavy WebAssembly operations.
- **Image Processing:** Supports WASM-accelerated resizing, rotation, and color quantization.
- **Multiple Codecs:** Supports MozJPEG, WebP, AVIF, JXL, OxiPNG, WP2, and QOI.
- **CORS Safe:** Automatically handles fetching and injecting WASM codecs across CDNs (e.g., jsDelivr/unpkg) by dynamically bootstrapping an isolated Blob worker.
- **Zero Config Defaults:** If you pass `{}`, it automatically injects the battle-tested default optimization values from `squoosh.app`.

## Installation

```bash
npm install @bit-blazer/squoosh
```

## Quick Start

```javascript
import { Squoosh } from '@bit-blazer/squoosh';

// Initialize Squoosh. By default, it automatically loads its WebAssembly
// codecs from the jsDelivr CDN.
const squoosh = new Squoosh();

// 1. Get a File object (e.g., from an <input type="file">)
const file = document.querySelector('input[type="file"]').files[0];

try {
  // 2. Decode the image into raw ImageData
  const imageData = await squoosh.decode(file);

  // 3. (Optional) Resize the image to 800px width
  const resizedImageData = await squoosh.resize(imageData, { width: 800 });

  // 4. Encode to a Blob using MozJPEG (passing {} uses default squoosh.app options)
  const resultBlob = await squoosh.encodeToBlob(resizedImageData, {
    codec: 'mozjpeg',
    options: {},
  });

  // 5. Display the result!
  document.getElementById('result-image').src = URL.createObjectURL(resultBlob);
} finally {
  squoosh.terminate(); // Free worker memory when done
}
```

## Advanced Processing Pipeline

Squoosh supports a full suite of image transformations before encoding. Because these run sequentially in the worker, performance is excellent.

```javascript
const squoosh = new Squoosh();
let imgData = await squoosh.decode(file);

// Rotate 90 degrees clockwise
imgData = await squoosh.rotate(imgData, { numRotations: 1 });

// Resize using advanced interpolation
imgData = await squoosh.resize(imgData, {
  width: 1024,
  method: 'lanczos3',
  fitMethod: 'contain',
});

// Quantize colors (highly recommended before encoding to PNG/OxiPNG)
imgData = await squoosh.quantize(imgData, {
  maxNumColors: 256,
  dither: 1.0,
});

// Finally, encode it!
const blob = await squoosh.encodeToBlob(imgData, {
  codec: 'oxipng',
  options: {},
});
```

---

## API Reference

### `new Squoosh(options?)`

- `cdnBase`: (Optional) The absolute URL to the directory containing the `worker.js` and `codecs/` folder. By default, this points to `https://cdn.jsdelivr.net/npm/@bit-blazer/squoosh@[version]/dist/`. Set this if you want to self-host the WebAssembly binaries on your own domain.

### `squoosh.decode(fileOrBlob | arrayBuffer)`

Decodes an image `File`, `Blob`, or `ArrayBuffer` into raw `ImageData`. Uses the browser's native `createImageBitmap` where possible for GPU acceleration, and falls back to WASM decoders for exotic formats.

### `squoosh.rotate(imageData, options)`

Rotates the `ImageData` by multiples of 90 degrees.

- `options.numRotations`: `0`, `1`, `2`, or `3` (representing 0°, 90°, 180°, and 270° clockwise).

### `squoosh.resize(imageData, options)`

Resizes the `ImageData` using WASM algorithms.

- `options.width`: Target width.
- `options.height`: Target height.
- `options.method`: Interpolation method: `'triangle'`, `'catrom'`, `'mitchell'`, `'lanczos3'`, or `'hqx'`.
- `options.fitMethod`: `'stretch'` or `'contain'`.
- `options.premultiply`: `boolean`.
- `options.linearRGB`: `boolean`.

### `squoosh.quantize(imageData, options)`

Reduces the color palette of the image (often used before PNG compression to drastically reduce file sizes).

- `options.maxNumColors`: Maximum colors to use (e.g., `256`).
- `options.dither`: Dithering amount between `0` and `1`.

### `squoosh.encode(imageData, codecOptions)`

Returns a `Promise<EncodeResult>` containing the raw `ArrayBuffer`, file size, MIME type, and extension of the compressed image.

`codecOptions` expects an object with `codec` and `options`:

- **`mozjpeg`**: `options` (e.g., `{ quality: 75, baseline: false, progressive: true, ... }`)
- **`webp`**: `options` (e.g., `{ quality: 75, lossless: 0, near_lossless: 100, ... }`)
- **`avif`**: `options` (e.g., `{ quality: 50, speed: 6, ... }`)
- **`jxl`**: `options` (e.g., `{ quality: 75, speed: 7, ... }`)
- **`oxipng`**: `options` (e.g., `{ level: 2, interlace: false }`)
- **`wp2`**: `options` (e.g., `{ quality: 75, effort: 5, ... }`)
- **`qoi`**: `options` (no configurable options, pass `{}`)

> **Note:** Passing `{}` to the `options` property for any codec will automatically inject the highly-tuned default settings used by `squoosh.app`.

### `squoosh.encodeToBlob(imageData, codecOptions)`

A convenience wrapper around `encode()` that automatically packages the `ArrayBuffer` into a browser `Blob` with the correct `type` (e.g., `image/jpeg`).

### `squoosh.encodeToFile(imageData, filename, codecOptions)`

A convenience wrapper around `encode()` that generates a `File` object. It automatically swaps out the file extension from your provided `filename` to match the encoded format (e.g., `image.png` -> `image.webp`).

### `squoosh.terminate()`

Terminates the internal Web Worker and frees up memory. Call this if you are done compressing images and want to clean up background resources.
