import type { FirestoreTimestampLike } from "./shared";
import type { CollectionName } from "@/lib/constants/collections";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "archive"
  | "login"
  | "logout"
  | "role_change"
  | "settings_update";

export type AuditLog = {
  actorUid: string;
  actorEmail: string;
  action: AuditAction;
  collection: CollectionName;
  documentId: string;
  details: Record<string, string | number | boolean | null> | null;
  createdAt: FirestoreTimestampLike;
};
