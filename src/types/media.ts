import type { AuditedFields } from "./shared";

export type MediaAsset = AuditedFields & {
  fileName: string;
  originalName: string;
  fileUrl: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  active: boolean;
};

export type ImageCompressionOptions = {
  maxWidth: number;
  maxHeight: number;
  quality: number;
};

