/**
 * Worker interception patch for cross-origin rayon thread pool spawning.
 *
 * Problem:
 *   When COOP/COEP headers are set (required for SharedArrayBuffer), codecs like
 *   OxiPNG use wasm-bindgen-rayon to spawn thread pool workers. These workers are
 *   spawned from *inside* the Squoosh worker using the CDN URL directly:
 *     new Worker('https://cdn.jsdelivr.net/.../workerHelpers.js', { type: 'module' })
 *   Browsers block this as a cross-origin Worker instantiation ("Security Error").
 *
 * Fix:
 *   Intercept `new Worker(url)` inside the Squoosh worker context. If the URL is
 *   cross-origin (http/https), wrap it in a same-origin Blob.
 *
 *   - Module workers (type: 'module'): blob uses `import "url"` so ES module syntax works.
 *   - Classic workers: blob uses `importScripts("url")`.
 *
 * IMPORTANT: This file must be imported BEFORE any codec modules in worker.ts so the
 * patch is in place before wasm-bindgen-rayon captures globalThis.Worker.
 */

const OriginalWorker = (self as any).Worker as typeof Worker;

if (typeof OriginalWorker !== 'undefined') {
  (self as any).Worker = class PatchedWorker extends OriginalWorker {
    constructor(scriptURL: string | URL, options?: WorkerOptions) {
      const urlStr = scriptURL.toString();

      // Only intercept cross-origin URLs; leave blob: and relative URLs alone.
      if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
        const isModule = options?.type === 'module';

        let blobContent: string;
        if (isModule) {
          // ES module workers: use a static import so export/import syntax is valid.
          blobContent = `import ${JSON.stringify(urlStr)};`;
        } else {
          // Classic workers: importScripts is the only way to load external scripts.
          blobContent = `importScripts(${JSON.stringify(urlStr)});`;
        }

        const blob = new Blob([blobContent], {
          type: 'application/javascript',
        });
        const blobUrl = URL.createObjectURL(blob);

        // Pass options through unchanged — preserve type: 'module' if present.
        super(blobUrl, options);

        // Clean up the blob URL shortly after the worker has had time to start.
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
      } else {
        super(scriptURL, options);
      }
    }
  };
}
