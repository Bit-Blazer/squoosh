/**
 * Browser-side Emscripten module initializer.
 * Uses locateFile() to redirect WASM asset loading to the CDN or a custom base URL.
 * No fs/readFileSync — pure browser fetch.
 */
export function initEmscriptenModule<T extends EmscriptenWasm.Module>(
  factory: EmscriptenWasm.ModuleFactory<T>,
  wasmUrl: string,
  workerUrl?: string,
): Promise<T> {
  return factory({
    noInitialRun: true,
    locateFile(requestedPath: string) {
      if (requestedPath.endsWith('.wasm')) return wasmUrl;
      if (requestedPath.endsWith('.worker.js') && workerUrl) return workerUrl;
      return requestedPath;
    },
  } as any);
}
