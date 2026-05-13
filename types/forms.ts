import type { FirestoreTimestampLike, FormSubmissionStatus } from "./shared";

export type FormType =
  | "contact"
  | "prayer_request"
  | "volunteer"
  | "announcement_request"
  | "membership_transfer"
  | "maintenance_request";

export const FORM_TYPES = [
  "contact",
  "prayer_request",
  "volunteer",
  "announcement_request",
  "membership_transfer",
  "maintenance_request",
] as const satisfies readonly FormType[];

export type FormSubmissionPayload = Record<
  string,
  string | number | boolean | string[] | null
>;

export type FormSubmission = {
  formType: FormType;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  payloadJson: FormSubmissionPayload;
  status: FormSubmissionStatus;
  assignedTo: string | null;
  internalNotes: string;
  statusUpdatedAt?: FirestoreTimestampLike;
  statusUpdatedBy?: string | null;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
};

export type PublicFormSubmissionInput = {
  formType: FormType;
  name: string;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message: string;
  payloadJson: FormSubmissionPayload;
};

export type FormSubmissionListOptions = {
  formType?: FormType;
  status?: FormSubmissionStatus;
  limit?: number;
};

export type FormSubmissionStatusUpdate = {
  status: FormSubmissionStatus;
  assignedTo?: string | null;
  internalNotes?: string;
};

export type FormApiSuccess<T> = {
  ok: true;
  data: T;
};

export type FormApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

export type FormApiResponse<T> = FormApiSuccess<T> | FormApiError;
