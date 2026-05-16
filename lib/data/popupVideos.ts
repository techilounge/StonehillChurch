import "server-only";

import { randomUUID } from "crypto";
import path from "path";
import { getAdminStorage } from "@/lib/firebaseAdmin";
import { hasMp4MagicBytes } from "@/lib/popup/mp4";
import type { AdminSession } from "@/lib/auth";

const ACCEPTED_VIDEO_TYPES = new Set(["video/mp4"]);
const OUTPUT_CONTENT_TYPE = "video/mp4";
// 25 MB cap. Popup videos are short marketing clips; larger files belong on
// YouTube/Vimeo, which the schema already supports via videoUrl. Bandwidth
// served directly from Firebase Storage is meaningfully more expensive than
// the hosted-video CDNs, so we don't want to encourage long uploads here.
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export class PopupVideoUploadError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "PopupVideoUploadError";
    this.code = code;
    this.status = status;
  }
}

export type PopupVideoUploadInput = {
  file: File;
  actor: AdminSession;
};

export type PopupVideoUploadResult = {
  url: string;
  storagePath: string;
  size: number;
};

function safeFileBaseName(originalName: string): string {
  const parsed = path.parse(originalName);
  const base = parsed.name || "video";

  return (
    base
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "video"
  );
}

function storagePathForVideo(actorUid: string, originalName: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeBase = safeFileBaseName(originalName);
  return `media/videos/${actorUid}/${year}/${month}/${Date.now()}-${randomUUID()}-${safeBase}.mp4`;
}

function firebaseDownloadUrl(bucketName: string, storagePath: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    storagePath,
  )}?alt=media&token=${token}`;
}

function assertUploadableVideo(file: File, buffer: Buffer): void {
  if (!file.name.trim()) {
    throw new PopupVideoUploadError("FILE_NAME_REQUIRED", "Uploaded file must have a name.", 400);
  }
  if (file.size <= 0 || buffer.length <= 0) {
    throw new PopupVideoUploadError("EMPTY_FILE", "Uploaded video is empty.", 400);
  }
  if (file.size > MAX_VIDEO_BYTES || buffer.length > MAX_VIDEO_BYTES) {
    throw new PopupVideoUploadError(
      "FILE_TOO_LARGE",
      "Uploaded MP4 must be 25 MB or smaller. For longer clips, host on YouTube or Vimeo and paste the link.",
      413,
    );
  }
  const declared = (file.type || "").toLowerCase();
  if (!ACCEPTED_VIDEO_TYPES.has(declared)) {
    throw new PopupVideoUploadError(
      "UNSUPPORTED_FILE_TYPE",
      "Only MP4 video uploads are allowed.",
      415,
    );
  }
  if (!hasMp4MagicBytes(buffer)) {
    throw new PopupVideoUploadError(
      "INVALID_VIDEO_FILE",
      "The uploaded file does not appear to be a valid MP4.",
      400,
    );
  }
}

export async function uploadPopupVideo({
  file,
  actor,
}: PopupVideoUploadInput): Promise<PopupVideoUploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  assertUploadableVideo(file, buffer);

  const bucket = getAdminStorage().bucket();
  if (!bucket.name) {
    throw new PopupVideoUploadError(
      "STORAGE_BUCKET_NOT_CONFIGURED",
      "Firebase Storage bucket is not configured.",
      500,
    );
  }

  const storagePath = storagePathForVideo(actor.uid, file.name);
  const downloadToken = randomUUID();
  const storageFile = bucket.file(storagePath);

  try {
    await storageFile.save(buffer, {
      resumable: false,
      metadata: {
        contentType: OUTPUT_CONTENT_TYPE,
        // Popup videos are immutable per upload — every upload gets a fresh
        // path. One-year immutable cache mirrors the image pipeline.
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          approved: "true",
          firebaseStorageDownloadTokens: downloadToken,
          originalContentType: OUTPUT_CONTENT_TYPE,
          originalFileName: file.name,
          public: "true",
          uploadPipeline: "popup-video",
          uploadedBy: actor.uid,
        },
      },
    });
  } catch (error) {
    console.error("[popupVideos] storage upload failed:", error);
    throw new PopupVideoUploadError("STORAGE_UPLOAD_FAILED", "Could not upload video.", 500);
  }

  return {
    url: firebaseDownloadUrl(bucket.name, storagePath, downloadToken),
    storagePath,
    size: buffer.length,
  };
}
