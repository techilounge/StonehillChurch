export const ALLOWED_IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;

export const MAX_ORIGINAL_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_OPTIMIZED_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 2200;
export const OPTIMIZED_CONTENT_TYPE = "image/webp";

export type OptimizedImage = {
  blob: Blob;
  contentType: typeof OPTIMIZED_CONTENT_TYPE;
  width: number;
  height: number;
};

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Upload a WEBP, JPEG, or PNG image.";
  }

  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    return "Image is too large. Choose an image under 15 MB.";
  }

  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the selected image."));
    };

    image.src = objectUrl;
  });
}

function getTargetDimensions(width: number, height: number) {
  const largestSide = Math.max(width, height);

  if (largestSide <= MAX_IMAGE_DIMENSION) {
    return { width, height };
  }

  const scale = MAX_IMAGE_DIMENSION / largestSide;

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("The browser could not optimize this image."));
          return;
        }

        if (blob.type !== OPTIMIZED_CONTENT_TYPE) {
          reject(new Error("This browser does not support WEBP optimization."));
          return;
        }

        resolve(blob);
      },
      OPTIMIZED_CONTENT_TYPE,
      quality,
    );
  });
}

export async function optimizeImageForUpload(file: File): Promise<OptimizedImage> {
  const validationError = validateImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const image = await loadImage(file);
  const target = getTargetDimensions(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("This browser does not support image optimization.");
  }

  canvas.width = target.width;
  canvas.height = target.height;
  context.drawImage(image, 0, 0, target.width, target.height);

  const qualitySteps = [0.84, 0.76, 0.68, 0.6, 0.52];
  let optimizedBlob: Blob | null = null;

  for (const quality of qualitySteps) {
    const blob = await canvasToBlob(canvas, quality);
    optimizedBlob = blob;

    if (blob.size <= MAX_OPTIMIZED_IMAGE_BYTES) {
      break;
    }
  }

  if (!optimizedBlob || optimizedBlob.size > MAX_OPTIMIZED_IMAGE_BYTES) {
    throw new Error("Image could not be compressed below the 5 MB upload limit.");
  }

  return {
    blob: optimizedBlob,
    contentType: OPTIMIZED_CONTENT_TYPE,
    width: target.width,
    height: target.height,
  };
}

function randomSuffix() {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0].toString(36);
  }

  return Math.random().toString(36).slice(2, 10);
}

export function cleanFilename(filename: string): string {
  const baseName = filename.replace(/\.[^/.]+$/, "");
  const cleaned = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "image";
}

export function buildMediaStoragePath(uid: string, filename: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");

  return `media/${year}/${month}/${uid}/${Date.now()}-${cleanFilename(
    filename,
  )}-${randomSuffix()}.webp`;
}
