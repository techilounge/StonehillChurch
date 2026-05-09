export type ContentStatus = "draft" | "published" | "archived";

export type FirestoreDate = Date | string | null;

export type AuditedFields = {
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  createdBy: string | null;
  updatedBy: string | null;
};

export type PublishableFields = AuditedFields & {
  status: ContentStatus;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  publishedAt: FirestoreDate;
};

