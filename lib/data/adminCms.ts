import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import type { DocumentData, Query } from "firebase-admin/firestore";
import { z } from "zod";
import type { AdminSession } from "@/lib/auth";
import { collections } from "@/lib/constants/collections";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import {
  hasPermission,
  type AdminPermission,
} from "@/lib/permissions";
import {
  announcementSchema,
  eventSchema,
  homepageSlideSchema,
  leaderSchema,
  ministrySchema,
  pageSchema,
  popupSchema,
  resourceSchema,
  sermonSchema,
  siteSettingSchema,
} from "@/lib/validators";
import { PUBLISHED } from "@/types/shared";
import type { SiteSettingDoc } from "@/types/settings";
import { serializeData, type Serialized, withReadTimeout } from "./utils";

export const CMS_MODULES = [
  "homepageSlides",
  "sermons",
  "events",
  "ministries",
  "leaders",
  "announcements",
  "resources",
  "pages",
  "popups",
  "siteSettings",
] as const;

export type CmsModule = (typeof CMS_MODULES)[number];

export type CmsAction =
  | "read"
  | "create"
  | "update"
  | "publish"
  | "archive"
  | "delete";

type ModuleKind = "content" | "settings";
type LifecycleKind = "status" | "active" | "none";

type ModuleConfig = {
  collection: string;
  schema: z.ZodTypeAny;
  kind: ModuleKind;
  lifecycle: LifecycleKind;
  dateFields?: readonly string[];
  defaultOrderBy?: readonly [field: string, direction: "asc" | "desc"][];
};

const moduleConfigs = {
  homepageSlides: {
    collection: collections.homepageSlides,
    schema: homepageSlideSchema,
    kind: "content",
    lifecycle: "status",
    defaultOrderBy: [["sortOrder", "asc"]],
  },
  sermons: {
    collection: collections.sermons,
    schema: sermonSchema,
    kind: "content",
    lifecycle: "status",
    dateFields: ["sermonDate"],
    defaultOrderBy: [["sermonDate", "desc"]],
  },
  events: {
    collection: collections.events,
    schema: eventSchema,
    kind: "content",
    lifecycle: "status",
    dateFields: ["startDateTime", "endDateTime"],
    defaultOrderBy: [["startDateTime", "desc"]],
  },
  ministries: {
    collection: collections.ministries,
    schema: ministrySchema,
    kind: "content",
    lifecycle: "status",
    defaultOrderBy: [["sortOrder", "asc"]],
  },
  leaders: {
    collection: collections.leaders,
    schema: leaderSchema,
    kind: "content",
    lifecycle: "active",
    defaultOrderBy: [["sortOrder", "asc"]],
  },
  announcements: {
    collection: collections.announcements,
    schema: announcementSchema,
    kind: "content",
    lifecycle: "status",
    dateFields: ["startDate", "endDate"],
    defaultOrderBy: [["startDate", "desc"]],
  },
  resources: {
    collection: collections.resources,
    schema: resourceSchema,
    kind: "content",
    lifecycle: "status",
    defaultOrderBy: [["createdAt", "desc"]],
  },
  pages: {
    collection: collections.pages,
    schema: pageSchema,
    kind: "content",
    lifecycle: "status",
    defaultOrderBy: [["updatedAt", "desc"]],
  },
  popups: {
    collection: collections.popups,
    schema: popupSchema,
    kind: "content",
    lifecycle: "status",
    dateFields: ["startTime", "endTime"],
    defaultOrderBy: [["updatedAt", "desc"]],
  },
  siteSettings: {
    collection: collections.siteSettings,
    schema: siteSettingSchema,
    kind: "settings",
    lifecycle: "none",
    defaultOrderBy: [["key", "asc"]],
  },
} as const satisfies Record<CmsModule, ModuleConfig>;

export type CmsDocument = Serialized<Record<string, unknown>>;

export class CmsAdminError extends Error {
  code: string;
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(
    code: string,
    message: string,
    status = 400,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "CmsAdminError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function isCmsModule(module: string): module is CmsModule {
  return (CMS_MODULES as readonly string[]).includes(module);
}

function getConfig(module: CmsModule): ModuleConfig {
  return moduleConfigs[module];
}

function requiredPermission(config: ModuleConfig, action: CmsAction): AdminPermission {
  if (config.kind === "settings") {
    return action === "read" ? "settings:manage" : "settings:manage";
  }

  switch (action) {
    case "read":
      return "content:read";
    case "create":
      return "content:create";
    case "update":
      return "content:update";
    case "publish":
      return "content:publish";
    case "archive":
    case "delete":
      return "content:delete";
  }
}

function assertActorPermission(
  actor: AdminSession,
  config: ModuleConfig,
  action: CmsAction,
): void {
  const permission = requiredPermission(config, action);

  if (!hasPermission(actor, permission)) {
    throw new CmsAdminError(
      "FORBIDDEN",
      "You do not have permission to perform this CMS action.",
      403,
    );
  }
}

function normalizeId(id: string): string {
  const trimmed = id.trim();

  if (!trimmed || trimmed.length > 200 || /[/?#[\]]/.test(trimmed)) {
    throw new CmsAdminError("INVALID_ID", "Document id is invalid.", 400);
  }

  return trimmed;
}

function parseDateValue(value: unknown, field: string): Date {
  if (value instanceof Date) {
    return value;
  }

  // Handle Firestore Timestamp objects gracefully
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as any).toDate === "function"
  ) {
    return (value as any).toDate();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  throw new CmsAdminError(
    "VALIDATION_ERROR",
    `${field} must be a valid date.`,
    400,
    { [field]: ["Must be a valid date."] },
  );
}

function normalizeDateFields(
  data: Record<string, unknown>,
  dateFields: readonly string[] | undefined,
): Record<string, unknown> {
  const next = { ...data };

  for (const field of dateFields ?? []) {
    if (typeof next[field] !== "undefined" && next[field] !== null) {
      next[field] = parseDateValue(next[field], field);
    }
  }

  return next;
}

function cleanFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string[]] =>
      Array.isArray(entry[1]),
    ),
  );
}

function validateFullData(
  config: ModuleConfig,
  input: unknown,
): Record<string, unknown> {
  const normalizedInput =
    typeof input === "object" && input !== null
      ? normalizeDateFields(input as Record<string, unknown>, config.dateFields)
      : input;

  const parsed = config.schema.safeParse(normalizedInput);

  if (!parsed.success) {
    throw new CmsAdminError(
      "VALIDATION_ERROR",
      "CMS document data is invalid.",
      400,
      cleanFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  return parsed.data as Record<string, unknown>;
}

function validatePartialData(
  config: ModuleConfig,
  input: unknown,
): Record<string, unknown> {
  const partialSchema =
    config.schema instanceof z.ZodObject ? config.schema.partial() : z.object({}).passthrough();
  
  const normalizedInput =
    typeof input === "object" && input !== null
      ? normalizeDateFields(input as Record<string, unknown>, config.dateFields)
      : input;

  const parsed = partialSchema.safeParse(normalizedInput);

  if (!parsed.success) {
    throw new CmsAdminError(
      "VALIDATION_ERROR",
      "CMS update data is invalid.",
      400,
      cleanFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  return parsed.data as Record<string, unknown>;
}

function patchFromMergedData(
  patch: Record<string, unknown>,
  merged: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.keys(patch)
      .filter((key) => Object.prototype.hasOwnProperty.call(merged, key))
      .map((key) => [key, merged[key]]),
  );
}

function requireEditableByEditor(
  actor: AdminSession,
  config: ModuleConfig,
  existing: Record<string, unknown>,
  next: Record<string, unknown>,
): void {
  if (hasPermission(actor, "content:publish")) {
    return;
  }

  if (config.lifecycle !== "status") {
    return;
  }

  if (existing.status !== "draft" || next.status !== "draft") {
    throw new CmsAdminError(
      "FORBIDDEN",
      "Editors can only create or update draft content.",
      403,
    );
  }
}

function requirePublishAllowed(
  actor: AdminSession,
  next: Record<string, unknown>,
): void {
  if (next.status === PUBLISHED && !hasPermission(actor, "content:publish")) {
    throw new CmsAdminError(
      "FORBIDDEN",
      "Publishing content requires publish permission.",
      403,
    );
  }
}

function createdAuditPatch(actor: AdminSession, data: Record<string, unknown>) {
  return {
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: actor.uid,
    updatedBy: actor.uid,
  };
}

function updatedAuditPatch(actor: AdminSession, data: Record<string, unknown>) {
  return {
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid,
  };
}

function publishAuditPatch(
  config: ModuleConfig,
  existing: Record<string, unknown> | null,
  next: Record<string, unknown>,
): Record<string, unknown> {
  if (config.lifecycle !== "status") {
    return {};
  }

  if (next.status === PUBLISHED && existing?.status !== PUBLISHED) {
    return { publishedAt: FieldValue.serverTimestamp() };
  }

  if (next.status === "draft") {
    return { publishedAt: null };
  }

  return {};
}

function serializeDocument(id: string, data: DocumentData): CmsDocument {
  return serializeData({ id, ...data } as Record<string, unknown>);
}

async function getRawDocument(
  module: CmsModule,
  id: string,
): Promise<{ id: string; data: Record<string, unknown> } | null> {
  const config = getConfig(module);
  const doc = await withReadTimeout(
    getAdminFirestore().collection(config.collection).doc(normalizeId(id)).get(),
  );

  if (!doc.exists) {
    return null;
  }

  return { id: doc.id, data: doc.data() ?? {} };
}

function applyOrdering(query: Query, config: ModuleConfig): Query {
  let nextQuery = query;

  for (const [field, direction] of config.defaultOrderBy ?? []) {
    nextQuery = nextQuery.orderBy(field, direction);
  }

  return nextQuery;
}

export async function listCmsDocuments(
  module: CmsModule,
  actor: AdminSession,
  options?: { status?: string; limit?: number },
): Promise<CmsDocument[]> {
  const config = getConfig(module);
  assertActorPermission(actor, config, "read");

  let query: Query = getAdminFirestore().collection(config.collection);

  if (
    config.lifecycle === "status" &&
    options?.status &&
    ["draft", "published", "archived"].includes(options.status)
  ) {
    query = query.where("status", "==", options.status);
  }

  query = applyOrdering(query, config);

  if (typeof options?.limit === "number") {
    query = query.limit(Math.min(Math.max(options.limit, 1), 100));
  }

  const snapshot = await withReadTimeout(query.get());
  return snapshot.docs.map((doc) => serializeDocument(doc.id, doc.data()));
}

export async function getCmsDocument(
  module: CmsModule,
  id: string,
  actor: AdminSession,
): Promise<CmsDocument | null> {
  const config = getConfig(module);
  assertActorPermission(actor, config, "read");

  const doc = await getRawDocument(module, id);
  return doc ? serializeDocument(doc.id, doc.data) : null;
}

export async function createCmsDocument(
  module: CmsModule,
  input: unknown,
  actor: AdminSession,
  options?: { id?: string },
): Promise<CmsDocument> {
  const config = getConfig(module);
  assertActorPermission(actor, config, "create");

  const data = validateFullData(config, input);

  if (config.kind === "content") {
    requirePublishAllowed(actor, data);
    requireEditableByEditor(actor, config, { status: "draft" }, data);
  }

  const docId =
    options?.id ??
    (module === "siteSettings" && typeof data.key === "string" ? data.key : undefined);
  const docRef = docId
    ? getAdminFirestore().collection(config.collection).doc(normalizeId(docId))
    : getAdminFirestore().collection(config.collection).doc();

  const auditData =
    config.kind === "settings"
      ? {
          ...data,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: actor.uid,
        }
      : {
          ...createdAuditPatch(actor, data),
          ...publishAuditPatch(config, null, data),
        };

  await docRef.set(auditData, { merge: false });
  const created = await getRawDocument(module, docRef.id);

  if (!created) {
    throw new CmsAdminError("CREATE_FAILED", "Document was not created.", 500);
  }

  return serializeDocument(created.id, created.data);
}

export async function updateCmsDocument(
  module: CmsModule,
  id: string,
  input: unknown,
  actor: AdminSession,
): Promise<CmsDocument> {
  const config = getConfig(module);
  assertActorPermission(actor, config, "update");

  const existing = await getRawDocument(module, id);

  if (!existing) {
    throw new CmsAdminError("NOT_FOUND", "CMS document not found.", 404);
  }

  const patch = validatePartialData(config, input);
  const merged = validateFullData(config, { ...existing.data, ...patch });
  const normalizedPatch = patchFromMergedData(patch, merged);

  if (Object.keys(normalizedPatch).length === 0) {
    throw new CmsAdminError(
      "NO_CHANGES",
      "No valid CMS fields were provided for update.",
      400,
    );
  }

  if (config.kind === "content") {
    requirePublishAllowed(actor, merged);
    requireEditableByEditor(actor, config, existing.data, merged);
  }

  await getAdminFirestore()
    .collection(config.collection)
    .doc(existing.id)
    .set(
      {
        ...updatedAuditPatch(actor, normalizedPatch),
        ...publishAuditPatch(config, existing.data, merged),
      },
      { merge: true },
    );

  const updated = await getRawDocument(module, existing.id);

  if (!updated) {
    throw new CmsAdminError("UPDATE_FAILED", "Document was not updated.", 500);
  }

  return serializeDocument(updated.id, updated.data);
}

export async function publishCmsDocument(
  module: CmsModule,
  id: string,
  actor: AdminSession,
): Promise<CmsDocument> {
  const config = getConfig(module);

  if (config.lifecycle !== "status") {
    throw new CmsAdminError("UNSUPPORTED_LIFECYCLE", "This module cannot be published.", 400);
  }

  assertActorPermission(actor, config, "publish");

  const existing = await getRawDocument(module, id);

  if (!existing) {
    throw new CmsAdminError("NOT_FOUND", "CMS document not found.", 404);
  }

  await getAdminFirestore()
    .collection(config.collection)
    .doc(existing.id)
    .set(
      {
        status: PUBLISHED,
        publishedAt:
          existing.data.status === PUBLISHED
            ? existing.data.publishedAt ?? FieldValue.serverTimestamp()
            : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actor.uid,
      },
      { merge: true },
    );

  const updated = await getRawDocument(module, existing.id);

  if (!updated) {
    throw new CmsAdminError("PUBLISH_FAILED", "Document was not published.", 500);
  }

  return serializeDocument(updated.id, updated.data);
}

export async function archiveCmsDocument(
  module: CmsModule,
  id: string,
  actor: AdminSession,
): Promise<CmsDocument> {
  const config = getConfig(module);
  assertActorPermission(actor, config, "archive");

  if (config.kind === "settings") {
    throw new CmsAdminError("UNSUPPORTED_LIFECYCLE", "Settings cannot be archived.", 400);
  }

  const existing = await getRawDocument(module, id);

  if (!existing) {
    throw new CmsAdminError("NOT_FOUND", "CMS document not found.", 404);
  }

  const patch =
    config.lifecycle === "active"
      ? { active: false }
      : config.lifecycle === "status"
        ? { status: "archived" }
        : {};

  await getAdminFirestore()
    .collection(config.collection)
    .doc(existing.id)
    .set(updatedAuditPatch(actor, patch), { merge: true });

  const updated = await getRawDocument(module, existing.id);

  if (!updated) {
    throw new CmsAdminError("ARCHIVE_FAILED", "Document was not archived.", 500);
  }

  return serializeDocument(updated.id, updated.data);
}

export async function deleteCmsDocument(
  module: CmsModule,
  id: string,
  actor: AdminSession,
  options?: { hardDelete?: boolean },
): Promise<{ id: string; archived: boolean; deleted: boolean; document?: CmsDocument }> {
  const config = getConfig(module);
  assertActorPermission(actor, config, "delete");

  if (!options?.hardDelete && config.kind === "content") {
    const document = await archiveCmsDocument(module, id, actor);
    return { id: document.id, archived: true, deleted: false, document };
  }

  const normalizedId = normalizeId(id);
  const existing = await getRawDocument(module, normalizedId);

  if (!existing) {
    throw new CmsAdminError("NOT_FOUND", "CMS document not found.", 404);
  }

  await getAdminFirestore().collection(config.collection).doc(normalizedId).delete();
  return { id: normalizedId, archived: false, deleted: true };
}

export async function upsertSiteSetting(
  input: SiteSettingDoc,
  actor: AdminSession,
): Promise<CmsDocument> {
  return createCmsDocument("siteSettings", input, actor, { id: input.key });
}

/**
 * Batch-update the `sortOrder` field for a list of documents.
 * `orderedIds` is the full ordered array of document IDs — each entry
 * gets `sortOrder = index`.
 */
export async function reorderCmsDocuments(
  module: CmsModule,
  orderedIds: string[],
  actor: AdminSession,
): Promise<void> {
  const config = getConfig(module);
  assertActorPermission(actor, config, "update");

  if (orderedIds.length === 0) return;

  const db = getAdminFirestore();
  const batch = db.batch();

  for (let i = 0; i < orderedIds.length; i++) {
    const docRef = db.collection(config.collection).doc(normalizeId(orderedIds[i]));
    batch.update(docRef, {
      sortOrder: i,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid,
    });
  }

  await batch.commit();
}
