import "server-only";

import { randomUUID } from "crypto";
import path from "path";
import sharp from "sharp";
import { FieldValue } from "firebase-admin/firestore";
import { collections } from "@/lib/constants/collections";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebaseAdmin";
import type { AdminSession } from "@/lib/auth";
import type { MediaAsset } from "@/types/media";
import { serializeData, type Serialized, withReadTimeout } from "./utils";

const ACCEPTED_INPUT_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);
const OUTPUT_CONTENT_TYPE = "image/webp";
// Source files larger than 2 MB are rejected before compression. Most brand
// photography lands well below this when exported at sensible quality, and a
// tight cap keeps Storage costs and bandwidth predictable.
const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 2400;
const WEBP_QUALITY = 82;
const MAX_ALT_TEXT_LENGTH = 200;

export type MediaUploadInput = {
  file: File;
  altText: string;
  actor: AdminSession;
};

export type MediaUploadResult = {
  asset: Serialized<MediaAsset>;
  compression: {
    inputContentType: string;
    outputContentType: typeof OUTPUT_CONTENT_TYPE;
    originalSize: number;
    compressedSize: number;
    compressed: boolean;
  };
};

export class MediaUploadError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "MediaUploadError";
    this.code = code;
    this.status = status;
  }
}

function normalizeAltText(altText: string): string {
  const trimmed = altText.trim().replace(/\s+/g, " ");

  if (trimmed.length < 8) {
    throw new MediaUploadError(
      "ALT_TEXT_REQUIRED",
      "Alt text must be at least 8 characters.",
      400,
    );
  }

  if (trimmed.length > MAX_ALT_TEXT_LENGTH) {
    throw new MediaUploadError(
      "ALT_TEXT_TOO_LONG",
      `Alt text must be ${MAX_ALT_TEXT_LENGTH} characters or less.`,
      400,
    );
  }

  return trimmed;
}

function normalizeContentType(contentType: string): string {
  const normalized = contentType.toLowerCase();

  if (normalized === "image/jpg") {
    return "image/jpeg";
  }

  return normalized;
}

function hasValidMagicBytes(buffer: Buffer, contentType: string): boolean {
  if (contentType === "image/jpeg") {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (contentType === "image/png") {
    return (
      buffer.length > 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (contentType === "image/webp") {
    return (
      buffer.length > 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}

function safeFileBaseName(originalName: string): string {
  const parsed = path.parse(originalName);
  const base = parsed.name || "media";

  return base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "media";
}

function storagePathForUpload(actorUid: string, originalName: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeBase = safeFileBaseName(originalName);

  return `media/${actorUid}/${year}/${month}/${Date.now()}-${randomUUID()}-${safeBase}.webp`;
}

function firebaseDownloadUrl(bucketName: string, storagePath: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    storagePath,
  )}?alt=media&token=${token}`;
}

async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function optimizeImage(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
}> {
  let image = sharp(buffer, {
    failOn: "warning",
    limitInputPixels: 40_000_000,
  }).rotate();

  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new MediaUploadError(
      "INVALID_IMAGE_DIMENSIONS",
      "Could not read image dimensions.",
      400,
    );
  }

  image = image.resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });

  const outputBuffer = await image
    .webp({
      quality: WEBP_QUALITY,
      effort: 4,
    })
    .toBuffer();
  const outputMetadata = await sharp(outputBuffer).metadata();

  if (!outputMetadata.width || !outputMetadata.height) {
    throw new MediaUploadError(
      "OPTIMIZED_IMAGE_INVALID",
      "Could not verify optimized image dimensions.",
      500,
    );
  }

  if (outputBuffer.length > MAX_OUTPUT_BYTES) {
    throw new MediaUploadError(
      "IMAGE_TOO_LARGE_AFTER_COMPRESSION",
      "The optimized WEBP image is still larger than 5 MB.",
      413,
    );
  }

  return {
    buffer: outputBuffer,
    width: outputMetadata.width,
    height: outputMetadata.height,
  };
}

function assertUploadableFile(file: File, inputContentType: string, buffer: Buffer) {
  if (!file.name.trim()) {
    throw new MediaUploadError("FILE_NAME_REQUIRED", "Uploaded file must have a name.", 400);
  }

  if (file.size <= 0 || buffer.length <= 0) {
    throw new MediaUploadError("EMPTY_FILE", "Uploaded file is empty.", 400);
  }

  if (file.size > MAX_SOURCE_BYTES || buffer.length > MAX_SOURCE_BYTES) {
    throw new MediaUploadError(
      "FILE_TOO_LARGE",
      "Uploaded image must be 12 MB or smaller before compression.",
      413,
    );
  }

  if (!ACCEPTED_INPUT_TYPES.has(inputContentType)) {
    throw new MediaUploadError(
      "UNSUPPORTED_FILE_TYPE",
      "Only WEBP, JPEG, and PNG image uploads are allowed.",
      415,
    );
  }

  if (!hasValidMagicBytes(buffer, inputContentType)) {
    throw new MediaUploadError(
      "INVALID_IMAGE_FILE",
      "The uploaded file contents do not match the declared image type.",
      400,
    );
  }
}

export async function uploadMediaAsset({
  file,
  altText,
  actor,
}: MediaUploadInput): Promise<MediaUploadResult> {
  const cleanAltText = normalizeAltText(altText);
  const inputContentType = normalizeContentType(file.type || "");
  const sourceBuffer = await fileToBuffer(file);

  assertUploadableFile(file, inputContentType, sourceBuffer);

  let optimized: Awaited<ReturnType<typeof optimizeImage>>;

  try {
    optimized = await optimizeImage(sourceBuffer);
  } catch (error) {
    if (error instanceof MediaUploadError) {
      throw error;
    }

    console.error("[mediaAssets] image optimization failed:", error);
    throw new MediaUploadError("IMAGE_OPTIMIZATION_FAILED", "Could not process image.", 400);
  }

  const bucket = getAdminStorage().bucket();

  if (!bucket.name) {
    throw new MediaUploadError(
      "STORAGE_BUCKET_NOT_CONFIGURED",
      "Firebase Storage bucket is not configured.",
      500,
    );
  }

  const storagePath = storagePathForUpload(actor.uid, file.name);
  const downloadToken = randomUUID();
  const storageFile = bucket.file(storagePath);

  try {
    await storageFile.save(optimized.buffer, {
      resumable: false,
      metadata: {
        contentType: OUTPUT_CONTENT_TYPE,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          altText: cleanAltText,
          approved: "true",
          compression: "auto",
          firebaseStorageDownloadTokens: downloadToken,
          originalContentType: inputContentType,
          originalFileName: file.name,
          public: "true",
          uploadPipeline: "compressed",
          uploadedBy: actor.uid,
        },
      },
    });
  } catch (error) {
    console.error("[mediaAssets] storage upload failed:", error);
    throw new MediaUploadError("STORAGE_UPLOAD_FAILED", "Could not upload image.", 500);
  }

  const fileName = path.basename(storagePath);
  const url = firebaseDownloadUrl(bucket.name, storagePath, downloadToken);
  const compressed =
    inputContentType !== OUTPUT_CONTENT_TYPE || optimized.buffer.length < sourceBuffer.length;
  const assetDoc = {
    fileName,
    originalFileName: file.name,
    filename: fileName,
    originalFilename: file.name,
    url,
    storagePath,
    altText: cleanAltText,
    contentType: OUTPUT_CONTENT_TYPE,
    mimeType: OUTPUT_CONTENT_TYPE,
    size: optimized.buffer.length,
    width: optimized.width,
    height: optimized.height,
    uploadedBy: actor.uid,
    compressed,
    originalSize: sourceBuffer.length,
    compressedSize: optimized.buffer.length,
    public: true,
    status: "approved" as const,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  } satisfies MediaAsset;
  const docRef = getAdminFirestore().collection(collections.mediaAssets).doc();

  try {
    await docRef.set(assetDoc);
  } catch (error) {
    console.error("[mediaAssets] metadata write failed:", error);

    try {
      await storageFile.delete({ ignoreNotFound: true });
    } catch (deleteError) {
      console.error("[mediaAssets] failed to delete orphaned storage object:", deleteError);
    }

    throw new MediaUploadError(
      "MEDIA_METADATA_WRITE_FAILED",
      "Image uploaded but metadata could not be saved.",
      500,
    );
  }

  return {
    asset: serializeData({ id: docRef.id, ...assetDoc }),
    compression: {
      inputContentType,
      outputContentType: OUTPUT_CONTENT_TYPE,
      originalSize: sourceBuffer.length,
      compressedSize: optimized.buffer.length,
      compressed,
    },
  };
}

export type DeleteMediaResult = {
  deletedCount: number;
  failed: { id: string; reason: string }[];
};

async function deleteSingleAsset(id: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!id || typeof id !== "string") {
    return { ok: false, reason: "Invalid id." };
  }

  const docRef = getAdminFirestore().collection(collections.mediaAssets).doc(id);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return { ok: false, reason: "Asset not found." };
  }

  const data = snapshot.data() as MediaAsset | undefined;
  const storagePath = data?.storagePath;

  if (storagePath && typeof storagePath === "string") {
    try {
      const bucket = getAdminStorage().bucket();
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
    } catch (error) {
      console.error(`[mediaAssets] failed to delete storage object for ${id}:`, error);
      return { ok: false, reason: "Failed to delete storage object." };
    }
  }

  try {
    await docRef.delete();
  } catch (error) {
    console.error(`[mediaAssets] failed to delete Firestore doc for ${id}:`, error);
    return { ok: false, reason: "Failed to delete metadata document." };
  }

  return { ok: true };
}

export async function deleteMediaAsset(id: string): Promise<DeleteMediaResult> {
  const result = await deleteSingleAsset(id);
  return result.ok
    ? { deletedCount: 1, failed: [] }
    : { deletedCount: 0, failed: [{ id, reason: result.reason }] };
}

export async function deleteMediaAssets(ids: string[]): Promise<DeleteMediaResult> {
  const unique = Array.from(new Set(ids.filter((id) => typeof id === "string" && id.length > 0)));
  let deletedCount = 0;
  const failed: { id: string; reason: string }[] = [];

  for (const id of unique) {
    const result = await deleteSingleAsset(id);
    if (result.ok) {
      deletedCount += 1;
    } else {
      failed.push({ id, reason: result.reason });
    }
  }

  return { deletedCount, failed };
}

export async function listMediaAssets(options?: {
  limit?: number;
}): Promise<Serialized<MediaAsset>[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const snapshot = await withReadTimeout(
    getAdminFirestore()
      .collection(collections.mediaAssets)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get(),
  );

  return snapshot.docs.map((doc) =>
    serializeData({ id: doc.id, ...doc.data() } as MediaAsset & { id: string }),
  );
}
