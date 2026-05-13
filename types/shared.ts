import type { FieldValue, Timestamp } from "firebase-admin/firestore";

export const PUBLISHED = "published";

export const CONTENT_STATUSES = ["draft", PUBLISHED, "archived"] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const FORM_SUBMISSION_STATUSES = [
  "new",
  "in_review",
  "completed",
  "archived",
] as const;

export type FormSubmissionStatus = (typeof FORM_SUBMISSION_STATUSES)[number];

export type FirestoreTimestampLike = Timestamp | FieldValue | Date | string | null;

export type AuditFields = {
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
  createdBy: string | null;
  updatedBy: string | null;
};

export type WithId<T> = T & { id: string };
