import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = pkg.version;
const cdnBase = `https://cdn.jsdelivr.net/npm/@bit-blazer/squoosh@${version}/dist/`;

const isProd = process.env.NODE_ENV === 'production';

const commonPlugins = [resolve({ browser: true }), commonjs()];

/** @type {import('rollup').RollupOptions[]} */
export default [
  // ── Build 1: Main thread bundle (ESM) ──────────────────────────────────
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/squoosh.esm.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      ...commonPlugins,
      typescript({ tsconfig: './tsconfig.json' }),
      replace({
        preventAssignment: true,
        values: {
          __SQUOOSH_VERSION__: JSON.stringify(version),
          __SQUOOSH_CDN_BASE__: JSON.stringify(cdnBase),
        },
      }),
      isProd ? terser() : null,
    ].filter(Boolean),
    // Comlink bundled inline — no external deps.
  },

  // ── Build 2: Main thread bundle (CJS) ──────────────────────────────────
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/squoosh.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      ...commonPlugins,
      typescript({ tsconfig: './tsconfig.json' }),
      replace({
        preventAssignment: true,
        values: {
          __SQUOOSH_VERSION__: JSON.stringify(version),
          __SQUOOSH_CDN_BASE__: JSON.stringify(cdnBase),
        },
      }),
      isProd ? terser() : null,
    ].filter(Boolean),
  },

  // ── Build 3: Worker bundle (IIFE, fully self-contained) ────────────────
  // This runs inside a Web Worker. importScripts() loads it cross-origin.
  // All deps (Comlink, wasm-feature-detect) bundled inline.
  {
    input: 'src/worker.ts',
    output: {
      file: 'dist/worker.js',
      format: 'iife',
      name: 'SquooshWorker',
      sourcemap: true,
    },
    plugins: [
      ...commonPlugins,
      typescript({ tsconfig: './tsconfig.json' }),
      replace({
        preventAssignment: true,
        values: {
          // Fallback CDN base in case __SQUOOSH_CDN_BASE__ wasn't set via the blob bootstrap.
          __SQUOOSH_CDN_BASE__: JSON.stringify(cdnBase),
        },
      }),
      isProd ? terser() : null,
    ].filter(Boolean),
  },
];
