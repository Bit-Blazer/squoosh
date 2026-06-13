/**
 * WorkerBridge — main thread side.
 *
 * Mirrors squoosh.app's WorkerBridge almost exactly:
 *  - Lazy worker spawning (only created on first use)
 *  - Serialised queue (all calls are chained, no parallelism races)
 *  - AbortSignal support (terminates worker on abort, new one spawned on next call)
 *  - 10s idle auto-termination to free memory
 *
 * Cross-origin CDN worker loading is handled via the Blob+importScripts trick.
 */
import { wrap, type Remote } from 'comlink';
import type { SquooshWorkerApi } from './worker';

/** How long (ms) the worker stays alive after the last task finishes. */
const WORKER_IDLE_TIMEOUT = 10_000;

export class WorkerBridge {
  private _queue = Promise.resolve() as Promise<unknown>;
  private _worker?: Worker;
  private _workerApi?: Remote<SquooshWorkerApi>;
  private _workerTimeout?: ReturnType<typeof setTimeout>;
  private _workerUrl: string;
  private _cdnBase: string;

  constructor(workerUrl: string, cdnBase: string) {
    this._workerUrl = workerUrl;
    this._cdnBase = cdnBase;
  }

  private _terminateWorker() {
    if (!this._worker) return;
    clearTimeout(this._workerTimeout);
    this._worker.terminate();
    this._worker = undefined;
    this._workerApi = undefined;
  }

  private _startWorker() {
    // Resolve paths to absolute URLs on the main thread before passing to the blob worker.
    // Blob URLs don't have a path structure, so relative paths in importScripts will fail.
    // Blob worker: loads the real worker via importScripts so CDN CORS is bypassed.
    const absoluteCdnBase = new URL(this._cdnBase, location.href).toString();
    const absoluteWorkerUrl = new URL(
      this._workerUrl,
      location.href,
    ).toString();

    const bootstrap = [
      `self.SQUOOSH_CDN_BASE_OVERRIDE = ${JSON.stringify(absoluteCdnBase)};`,
      `importScripts(${JSON.stringify(absoluteWorkerUrl)});`,
    ].join('\n');

    const blob = new Blob([bootstrap], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    this._worker = new Worker(blobUrl);
    URL.revokeObjectURL(blobUrl);
    this._workerApi = wrap<SquooshWorkerApi>(this._worker);
  }

  /** Schedules a call to the worker, returning a promise that resolves with the result. */
  call<K extends keyof SquooshWorkerApi>(
    signal: AbortSignal,
    method: K,
    ...args: Parameters<SquooshWorkerApi[K]>
  ): Promise<Awaited<ReturnType<SquooshWorkerApi[K]>>> {
    this._queue = this._queue
      .catch(() => {})
      .then(async () => {
        if (signal.aborted) throw new DOMException('AbortError', 'AbortError');

        clearTimeout(this._workerTimeout);
        if (!this._worker) this._startWorker();

        const onAbort = () => this._terminateWorker();
        signal.addEventListener('abort', onAbort);

        try {
          // @ts-ignore — TypeScript can't resolve dynamic method on Remote<>
          return await this._workerApi![method](...args);
        } finally {
          signal.removeEventListener('abort', onAbort);
          this._workerTimeout = setTimeout(() => {
            this._terminateWorker();
          }, WORKER_IDLE_TIMEOUT);
        }
      });

    return this._queue as any;
  }

  terminate() {
    this._terminateWorker();
  }
}
