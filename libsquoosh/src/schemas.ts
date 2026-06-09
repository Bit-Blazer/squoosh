import { z } from 'zod';

export const ResizeSchema = z.object({
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  method: z.enum(['triangle', 'catrom', 'mitchell', 'lanczos3']),
  premultiply: z.boolean(),
  linearRGB: z.boolean(),
});
export type ResizeOptions = z.infer<typeof ResizeSchema>;

export const QuantSchema = z.object({
  numColors: z.number().int().min(2).max(256),
  dither: z.number().min(0).max(1),
});
export type QuantOptions = z.infer<typeof QuantSchema>;

export const RotateSchema = z.object({
  numRotations: z.number().int(),
});
export type RotateOptions = z.infer<typeof RotateSchema>;

export enum MozJpegColorSpace {
  GRAYSCALE = 1,
  RGB = 2,
  YCbCr = 3,
}

export const MozJpegSchema = z.object({
  quality: z.number().min(0).max(100),
  baseline: z.boolean(),
  arithmetic: z.boolean(),
  progressive: z.boolean(),
  optimize_coding: z.boolean(),
  smoothing: z.number(),
  color_space: z.enum(MozJpegColorSpace),
  quant_table: z.number().int(),
  trellis_multipass: z.boolean(),
  trellis_opt_zero: z.boolean(),
  trellis_opt_table: z.boolean(),
  trellis_loops: z.number().int(),
  auto_subsample: z.boolean(),
  chroma_subsample: z.number().int(),
  separate_chroma_quality: z.boolean(),
  chroma_quality: z.number().min(0).max(100),
});
export type MozJPEGEncodeOptions = z.infer<typeof MozJpegSchema>;

export enum AVIFTune {
  auto = 0,
  psnr = 1,
  ssim = 2,
}

export const AvifSchema = z.object({
  quality: z.number().min(0).max(100),
  qualityAlpha: z.number().min(-1).max(100),
  denoiseLevel: z.number(),
  tileRowsLog2: z.number().int(),
  tileColsLog2: z.number().int(),
  speed: z.number().int(),
  subsample: z.number().int(),
  chromaDeltaQ: z.boolean(),
  sharpness: z.number(),
  enableSharpYUV: z.boolean(),
  tune: z.enum(AVIFTune),
});
export type AvifEncodeOptions = z.infer<typeof AvifSchema>;

export const JxlSchema = z.object({
  effort: z.number().int(),
  quality: z.number(),
  progressive: z.boolean(),
  epf: z.number().int().min(-1).max(3),
  lossyPalette: z.boolean(),
  decodingSpeedTier: z.number().int(),
  photonNoiseIso: z.number(),
  lossyModular: z.boolean(),
});
export type JxlEncodeOptions = z.infer<typeof JxlSchema>;

export const WebPSchema = z.object({
  quality: z.number().min(0).max(100),
  target_size: z.number(),
  target_PSNR: z.number(),
  method: z.number().int(),
  sns_strength: z.number(),
  filter_strength: z.number(),
  filter_sharpness: z.number(),
  filter_type: z.number().int(),
  partitions: z.number().int(),
  segments: z.number().int(),
  pass: z.number().int(),
  show_compressed: z.number().int(),
  preprocessing: z.number().int(),
  autofilter: z.number().int(),
  partition_limit: z.number().int(),
  alpha_compression: z.number().int(),
  alpha_filtering: z.number().int(),
  alpha_quality: z.number().min(0).max(100),
  lossless: z.number().int(),
  exact: z.number().int(),
  image_hint: z.number().int(),
  emulate_jpeg_size: z.number().int(),
  thread_level: z.number().int(),
  low_memory: z.number().int(),
  near_lossless: z.number().int(),
  use_delta_palette: z.number().int(),
  use_sharp_yuv: z.number().int(),
});
export type WebPEncodeOptions = z.infer<typeof WebPSchema>;

export enum UVMode {
  UVModeAdapt = 0,
  UVMode420 = 1,
  UVMode444 = 2,
  UVModeAuto = 3,
}

export enum Csp {
  kYCoCg = 0,
  kYCbCr = 1,
  kCustom = 2,
  kYIQ = 3,
}

export const WP2Schema = z.object({
  quality: z.number().min(0).max(100),
  alpha_quality: z.number().min(0).max(100),
  effort: z.number().int(),
  pass: z.number().int(),
  sns: z.number(),
  uv_mode: z.enum(UVMode),
  csp_type: z.enum(Csp),
  error_diffusion: z.number(),
  use_random_matrix: z.boolean(),
});
export type WP2EncodeOptions = z.infer<typeof WP2Schema>;

export const OxiPngSchema = z.object({
  level: z.number().int().min(1).max(6),
  interlace: z.boolean(),
});
export type OxiPngEncodeOptions = z.infer<typeof OxiPngSchema>;

export const PreprocessSchemas = {
  resize: ResizeSchema,
  quant: QuantSchema,
  rotate: RotateSchema,
};

export const EncodeSchemas = {
  mozjpeg: MozJpegSchema,
  webp: WebPSchema,
  avif: AvifSchema,
  jxl: JxlSchema,
  wp2: WP2Schema,
  oxipng: OxiPngSchema,
};