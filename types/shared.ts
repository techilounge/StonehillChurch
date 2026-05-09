import type { FieldValue, Timestamp } from "firebase-admin/firestore";

export type ContentStatus = "draft" | "published" | "archived";

export const CONTENT_STATUSES: ContentStatus[] = ["draft", "published", "archived"];

export type FormSubmissionStatus = "new" | "in_review" | "completed" | "archived";

export const FORM_SUBMISSION_STATUSES: FormSubmissionStatus[] = [
  "new",
  "in_review",
  "completed",
  "archived",
];

export type FirestoreTimestampLike = Timestamp | FieldValue | Date | string | null;

export type AuditFields = {
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
  createdBy: string | null;
  updatedBy: string | null;
};

export type WithId<T> = T & { id: string };
