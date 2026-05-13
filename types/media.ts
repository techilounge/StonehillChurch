import type { FirestoreTimestampLike } from "./shared";

export type MediaAsset = {
  fileName: string;
  originalFileName: string;
  filename: string;
  originalFilename: string;
  url: string;
  storagePath: string;
  altText: string;
  contentType: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  uploadedBy: string | null;
  compressed: boolean;
  originalSize: number | null;
  compressedSize: number | null;
  public: boolean;
  status: "approved" | "pending" | "archived";
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
};
