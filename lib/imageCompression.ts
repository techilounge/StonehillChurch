export type ImageCompressionOptions = {
  maxWidth?: number;
  quality?: number;
};

export async function prepareImageForUpload(file: File, _options: ImageCompressionOptions = {}) {
  // Placeholder for browser-side compression in the media management phase.
  return file;
}
