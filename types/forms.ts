import type { FirestoreTimestampLike, FormSubmissionStatus } from "./shared";

export type FormType =
  | "contact"
  | "prayer_request"
  | "volunteer"
  | "plan_visit"
  | "membership_transfer"
  | "maintenance_request"
  | "submit_announcement";

export const FORM_TYPES: FormType[] = [
  "contact",
  "prayer_request",
  "volunteer",
  "plan_visit",
  "membership_transfer",
  "maintenance_request",
  "submit_announcement",
];

export type FormSubmissionPayload = Record<
  string,
  string | number | boolean | string[] | null
>;

export type FormSubmission = {
  formType: FormType;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  payloadJson: FormSubmissionPayload;
  status: FormSubmissionStatus;
  assignedTo: string | null;
  internalNotes: string;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
};
