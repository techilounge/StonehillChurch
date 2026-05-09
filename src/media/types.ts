export type MediaAssetStatus = "private" | "approved";

export type MediaAsset = {
  id: string;
  altText: string;
  contentType: string;
  createdAt?: unknown;
  height: number;
  originalFilename: string;
  originalSize: number;
  public: boolean;
  size: number;
  status: MediaAssetStatus;
  storagePath: string;
  updatedAt?: unknown;
  uploadedBy: string;
  uploadedByEmail?: string;
  url: string;
  width: number;
};
