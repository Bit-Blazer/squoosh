/**
 * Rotate processor — raw WebAssembly.instantiate (no Emscripten, no wasm-pack).
 * WASM path: codecs/rotate/rotate.wasm
 * Matches squoosh-node/src/codecs.ts rotate implementation exactly.
 */
import type { RotateOptions } from '../types';

export const defaultOptions: RotateOptions = { numRotations: 0 };

interface RotateExports {
  memory: WebAssembly.Memory;
  rotate(width: number, height: number, degrees: number): void;
}

let rotateInstance: WebAssembly.Instance | null = null;

async function initRotate(base: string): Promise<{ exports: RotateExports }> {
  // base = <cdn>codecs/rotate/
  if (!rotateInstance) {
    const response = await fetch(base + 'rotate.wasm');
    const buffer = await response.arrayBuffer();
    const result = await WebAssembly.instantiate(buffer);
    rotateInstance = result.instance;
  }
  return rotateInstance as unknown as { exports: RotateExports };
}

export async function rotate(
  data: ImageData,
  options: RotateOptions,
  processorBase: string,
): Promise<ImageData> {
  const degrees = (options.numRotations * 90) % 360;
  if (degrees === 0) return data;

  const sameDimensions = degrees === 180;
  const size = data.width * data.height * 4;

  // processorBase = <cdn>codecs/
  const { exports } = await initRotate(processorBase + 'rotate/');
  const { memory } = exports;

  const additionalPagesNeeded = Math.ceil(
    (size * 2 - memory.buffer.byteLength + 8) / (64 * 1024),
  );
  if (additionalPagesNeeded > 0) {
    memory.grow(additionalPagesNeeded);
  }

  const view = new Uint8ClampedArray(memory.buffer);
  view.set(data.data, 8);
  exports.rotate(data.width, data.height, degrees);

  return new ImageData(
    view.slice(size + 8, size * 2 + 8),
    sameDimensions ? data.width : data.height,
    sameDimensions ? data.height : data.width,
  );
}
