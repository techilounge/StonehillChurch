import type { FirestoreTimestampLike } from "./shared";

export type MediaAsset = {
  filename: string;
  originalFilename: string;
  url: string;
  storagePath: string;
  altText: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  uploadedBy: string | null;
  compressed: boolean;
  originalSize: number | null;
  compressedSize: number | null;
  createdAt: FirestoreTimestampLike;
};
