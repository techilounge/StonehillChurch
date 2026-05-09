import type { ImageCompressionOptions } from "@/types/media";

export function getDefaultImageCompressionOptions(): ImageCompressionOptions {
  return {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.82,
  };
}

