/**
 * Public-facing TypeScript types for @bit-blazer/squoosh.
 */

export interface EncodeResult {
  /** The compressed image as a raw byte array. */
  data: Uint8Array;
  /** File size in bytes. */
  size: number;
  /** File extension, e.g. 'jpg', 'webp'. */
  extension: string;
  /** MIME type, e.g. 'image/jpeg'. */
  mimeType: string;
}

export type ResizeMethod =
  | 'triangle'
  | 'catrom'
  | 'mitchell'
  | 'lanczos3'
  | 'hqx';
export type FitMethod = 'stretch' | 'contain';

export interface ResizeOptions {
  /** Target width in pixels. If omitted, derived from height preserving aspect ratio. */
  width?: number;
  /** Target height in pixels. If omitted, derived from width preserving aspect ratio. */
  height?: number;
  method?: ResizeMethod;
  fitMethod?: FitMethod;
  premultiply?: boolean;
  linearRGB?: boolean;
}

export interface RotateOptions {
  /** Number of 90° clockwise rotations (1 = 90°, 2 = 180°, 3 = 270°). */
  numRotations: 0 | 1 | 2 | 3;
}

export interface QuantizeOptions {
  maxNumColors?: number;
  dither?: number;
}

// ---- Codec option types ----

export interface MozJPEGOptions {
  quality?: number;
  baseline?: boolean;
  arithmetic?: boolean;
  progressive?: boolean;
  optimize_coding?: boolean;
  smoothing?: number;
  color_space?: number;
  quant_table?: number;
  trellis_multipass?: boolean;
  trellis_opt_zero?: boolean;
  trellis_opt_table?: boolean;
  trellis_loops?: number;
  auto_subsample?: boolean;
  chroma_subsample?: number;
  separate_chroma_quality?: boolean;
  chroma_quality?: number;
}

export interface WebPOptions {
  quality?: number;
  target_size?: number;
  target_PSNR?: number;
  method?: number;
  sns_strength?: number;
  filter_strength?: number;
  filter_sharpness?: number;
  filter_type?: number;
  partitions?: number;
  segments?: number;
  pass?: number;
  show_compressed?: number;
  preprocessing?: number;
  autofilter?: number;
  partition_limit?: number;
  alpha_compression?: number;
  alpha_filtering?: number;
  alpha_quality?: number;
  lossless?: number;
  exact?: number;
  image_hint?: number;
  emulate_jpeg_size?: number;
  thread_level?: number;
  low_memory?: number;
  near_lossless?: number;
  use_delta_palette?: number;
  use_sharp_yuv?: number;
}

export interface AVIFOptions {
  quality?: number;
  qualityAlpha?: number;
  denoiseLevel?: number;
  tileColsLog2?: number;
  tileRowsLog2?: number;
  speed?: number;
  subsample?: number;
  chromaDeltaQ?: boolean;
  sharpness?: number;
  tune?: number;
  enableSharpYUV?: boolean;
}

export interface JXLOptions {
  effort?: number;
  quality?: number;
  progressive?: boolean;
  epf?: number;
  lossyPalette?: boolean;
  decodingSpeedTier?: number;
  photonNoiseIso?: number;
  lossyModular?: boolean;
}

export interface OxiPNGOptions {
  level?: number;
  interlace?: boolean;
}

export interface WP2Options {
  quality?: number;
  alpha_quality?: number;
  effort?: number;
  pass?: number;
  sns?: number;
  uv_mode?: number;
  csp_type?: number;
  error_diffusion?: number;
  use_random_matrix?: boolean;
}

export interface QOIOptions {}

export type CodecOptions =
  | { codec: 'mozjpeg'; options?: MozJPEGOptions }
  | { codec: 'webp'; options?: WebPOptions }
  | { codec: 'avif'; options?: AVIFOptions }
  | { codec: 'jxl'; options?: JXLOptions }
  | { codec: 'oxipng'; options?: OxiPNGOptions }
  | { codec: 'wp2'; options?: WP2Options }
  | { codec: 'qoi'; options?: QOIOptions };

export interface SquooshOptions {
  /**
   * Base URL for loading WASM assets and the worker script.
   * Defaults to https://cdn.jsdelivr.net/npm/@bit-blazer/squoosh@{version}/dist/
   */
  cdnBase?: string;
}
