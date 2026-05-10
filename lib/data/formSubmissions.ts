import "server-only";

import { FieldValue, type DocumentData, type Query } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/firestore";
import type {
  FormSubmission,
  FormSubmissionListOptions,
  FormSubmissionStatusUpdate,
  PublicFormSubmissionInput,
} from "@/types/forms";
import type { FormSubmissionStatus } from "@/types/shared";
import { serializeData, type Serialized } from "./utils";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;
const FIRESTORE_READ_TIMEOUT_MS = 5000;

function normalizeLimit(limit?: number): number {
  if (!Number.isFinite(limit) || !limit) {
    return DEFAULT_LIST_LIMIT;
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_LIST_LIMIT);
}

function serializeSubmission(
  id: string,
  data: DocumentData,
): Serialized<FormSubmission> {
  return serializeData({ id, ...data } as unknown as FormSubmission);
}

function withReadTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Firestore read timed out.")), FIRESTORE_READ_TIMEOUT_MS);
    }),
  ]);
}

export async function createFormSubmission(
  input: PublicFormSubmissionInput,
): Promise<Serialized<FormSubmission>> {
  const db = getAdminFirestore();
  const docRef = await db.collection(collections.formSubmissions).add({
    formType: input.formType,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    subject: input.subject ?? null,
    message: input.message,
    payloadJson: input.payloadJson,
    status: "new" satisfies FormSubmissionStatus,
    assignedTo: null,
    internalNotes: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const snapshot = await docRef.get();
  return serializeSubmission(snapshot.id, snapshot.data() ?? {});
}

export async function listFormSubmissions(
  options: FormSubmissionListOptions = {},
): Promise<Serialized<FormSubmission>[]> {
  const db = getAdminFirestore();
  let query: Query<DocumentData> = db
    .collection(collections.formSubmissions)
    .orderBy("createdAt", "desc");

  if (options.formType) {
    query = query.where("formType", "==", options.formType);
  }

  if (options.status) {
    query = query.where("status", "==", options.status);
  }

  try {
    const snapshot = await withReadTimeout(query.limit(normalizeLimit(options.limit)).get());
    return snapshot.docs.map((doc) => serializeSubmission(doc.id, doc.data()));
  } catch {
    return [];
  }
}

export async function getFormSubmissionById(
  id: string,
): Promise<Serialized<FormSubmission> | null> {
  const db = getAdminFirestore();
  let snapshot;

  try {
    snapshot = await withReadTimeout(db.collection(collections.formSubmissions).doc(id).get());
  } catch {
    return null;
  }

  if (!snapshot.exists) {
    return null;
  }

  return serializeSubmission(snapshot.id, snapshot.data() ?? {});
}

export async function updateFormSubmissionStatus(
  id: string,
  update: FormSubmissionStatusUpdate,
  updatedBy: string,
): Promise<Serialized<FormSubmission> | null> {
  const db = getAdminFirestore();
  const docRef = db.collection(collections.formSubmissions).doc(id);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return null;
  }

  await docRef.update({
    status: update.status,
    ...(Object.prototype.hasOwnProperty.call(update, "assignedTo")
      ? { assignedTo: update.assignedTo ?? null }
      : {}),
    ...(typeof update.internalNotes === "string"
      ? { internalNotes: update.internalNotes }
      : {}),
    statusUpdatedAt: FieldValue.serverTimestamp(),
    statusUpdatedBy: updatedBy,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return getFormSubmissionById(id);
}
