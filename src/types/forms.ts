import type { FirestoreDate } from "./shared";

export type FormSubmissionType =
  | "prayer_request"
  | "contact"
  | "volunteer"
  | "announcement_request"
  | "membership_transfer"
  | "maintenance_request";

export type FormSubmissionStatus = "new" | "reviewing" | "resolved" | "archived";

export type FormSubmission = {
  type: FormSubmissionType;
  status: FormSubmissionStatus;
  name: string;
  email: string;
  phone?: string;
  payload: Record<string, string | number | boolean | string[] | null>;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
};

