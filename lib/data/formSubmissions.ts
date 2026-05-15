import "server-only";

import { FieldValue, type DocumentData, type Query } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import type {
  FormSubmission,
  FormSubmissionListOptions,
  FormSubmissionStatusUpdate,
  PublicFormSubmissionInput,
} from "@/types/forms";
import type { FormSubmissionStatus } from "@/types/shared";
import { serializeData, withReadTimeout, type Serialized } from "./utils";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;

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
  const serialized = serializeSubmission(snapshot.id, snapshot.data() ?? {});

  // Best-effort admin notification email
  try {
    const { getCachedSiteSettings } = await import("./siteSettings");
    const settings = await getCachedSiteSettings();
    const adminEmails =
      (settings["notifications.adminInbox"] as string)?.trim() ||
      (settings["contact.email"] as string)?.trim();

    if (adminEmails) {
      const apiKey = process.env.RESEND_API_KEY?.trim();
      const from =
        process.env.RESEND_FROM_EMAIL?.trim() ||
        process.env.RESEND_FROM?.trim() ||
        "Stonehill SDA Church <onboarding@resend.dev>";

      if (apiKey) {
        const recipients = adminEmails.split(",").map((e) => e.trim()).filter(Boolean);
        const subject = `[Stonehill SDA] New ${input.formType} submission`;
        const text = [
          `New ${input.formType} submission received.`,
          `Name: ${input.name}`,
          input.email ? `Email: ${input.email}` : "",
          `Message: ${input.message.slice(0, 100)}...`,
          `View details: ${process.env.NEXT_PUBLIC_SITE_URL || "https://stonehillsda.org"}/admin/forms/${snapshot.id}`,
        ].filter(Boolean).join("\n");

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: recipients,
            subject,
            text,
          }),
        });
      }
    }
  } catch (error) {
    console.error("[formSubmissions] Failed to send admin notification email.", error);
  }

  return serialized;
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
  } catch (error) {
    console.error("[data] listFormSubmissions failed.", error);
    throw error;
  }
}

export async function getFormSubmissionById(
  id: string,
): Promise<Serialized<FormSubmission> | null> {
  const db = getAdminFirestore();
  let snapshot;

  try {
    snapshot = await withReadTimeout(db.collection(collections.formSubmissions).doc(id).get());
  } catch (error) {
    console.error("[data] getFormSubmissionById failed.", error);
    throw error;
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
