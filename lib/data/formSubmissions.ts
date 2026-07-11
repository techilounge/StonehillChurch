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

    let recipients: string[] = [];
    let senderName = "";
    let scenario = "";

    if (input.formType === "prayer_request") {
      const isConfidential = input.payloadJson?.confidential === true;
      if (isConfidential) {
        scenario = "Confidential Prayer Request";
        senderName = settings["notifications.confidential.senderName"];
        const emails = settings["notifications.confidential.recipients"];
        if (emails) {
          recipients = emails.split(",").map((e) => e.trim()).filter(Boolean);
        }
      } else {
        scenario = "Prayer Request";
        senderName = settings["notifications.prayerTeam.senderName"];
        const emails = settings["notifications.prayerTeam.recipients"];
        if (emails) {
          recipients = emails.split(",").map((e) => e.trim()).filter(Boolean);
        }
      }
    } else if (input.formType === "contact") {
      scenario = "General Contact";
      senderName = settings["notifications.contactForm.senderName"];
      const emails = settings["notifications.contactForm.recipients"];
      if (emails) {
        recipients = emails.split(",").map((e) => e.trim()).filter(Boolean);
      }
    } else {
      scenario = `${input.formType} submission`;
      senderName = settings["notifications.contactForm.senderName"];
      const emails = settings["notifications.contactForm.recipients"];
      if (emails) {
        recipients = emails.split(",").map((e) => e.trim()).filter(Boolean);
      }
    }

    // Log warning and fallback if no scenario-specific recipients are configured
    if (recipients.length === 0) {
      console.warn(
        `[formSubmissions] No recipients configured for contact scenario: "${scenario}". Falling back to default inbox.`,
      );
      const fallbackEmails =
        (settings["notifications.adminInbox"] as string)?.trim() ||
        (settings["contact.email"] as string)?.trim();

      if (fallbackEmails) {
        recipients = fallbackEmails.split(",").map((e) => e.trim()).filter(Boolean);
      }
    }

    if (recipients.length > 0) {
      const apiKey = process.env.RESEND_API_KEY?.trim();
      if (apiKey) {
        // Resolve Outgoing From Header Name & Email
        let fromEmail = "onboarding@resend.dev";
        const envFrom = process.env.RESEND_FROM_EMAIL?.trim() || process.env.RESEND_FROM?.trim();
        if (envFrom) {
          const match = envFrom.match(/<([^>]+)>/);
          fromEmail = match ? match[1].trim() : envFrom;
        }

        let resolvedFromName = senderName?.trim();
        if (!resolvedFromName) {
          console.warn(
            `[formSubmissions] No sender name configured for contact scenario: "${scenario}". Falling back to default "Stonehill SDA Church".`,
          );
          resolvedFromName = "Stonehill SDA Church";
        }

        const fromHeader = `${resolvedFromName} <${fromEmail}>`;
        const subject = `[Stonehill SDA] New ${input.formType} submission`;
        const text = [
          `New ${input.formType} submission received.`,
          `Name: ${input.name}`,
          input.email ? `Email: ${input.email}` : "",
          `Message: ${input.message.slice(0, 100)}...`,
          `View details: ${process.env.NEXT_PUBLIC_SITE_URL || "https://stonehillsda.org"}/admin/forms/${snapshot.id}`,
        ].filter(Boolean).join("\n");

        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromHeader,
              to: recipients,
              subject,
              text,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error(
              `[formSubmissions] Failed to send email for scenario "${scenario}". Status: ${res.status}. Error:`,
              errData,
            );
          }
        } catch (fetchErr) {
          console.error(
            `[formSubmissions] Network error sending email for scenario "${scenario}":`,
            fetchErr,
          );
        }
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
