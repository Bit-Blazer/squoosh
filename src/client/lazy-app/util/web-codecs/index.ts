import { drawableToImageData } from '../canvas';

const hasImageDecoder = typeof ImageDecoder !== 'undefined';

export async function isTypeSupported(mimeType: string): Promise<boolean> {
  if (!hasImageDecoder) return false;
  // Some old versions of this API threw here.
  // It only impacted folks with experimental web platform flags enabled in Chrome 90.
  // The API was updated in Chrome 91.
  try {
    return await ImageDecoder.isTypeSupported(mimeType);
  } catch (err) {
    return false;
  }
}

export async function decode(
  blob: Blob | File,
  mimeType: string,
): Promise<ImageData> {
  if (!hasImageDecoder) {
    throw Error(
      `This browser does not support ImageDecoder. This function should not have been called.`,
    );
  }
  const decoder = new ImageDecoder({
    type: mimeType,
    data: blob.stream(),
  });
  try {
    const { image } = await decoder.decode();
    try {
      return drawableToImageData(image);
    } finally {
      image.close(); // Crucial: Free GPU memory
    }
  } finally {
    decoder.close(); // Crucial: Free hardware decoder context
  }
}
