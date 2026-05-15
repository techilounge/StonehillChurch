import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import { serializeData, type Serialized } from "./utils";

export type AuditLogEntry = {
  id: string;
  action: string;
  actorUid: string;
  actorEmail: string;
  targetType: string;
  targetId: string;
  targetName: string | null;
  createdAt: Date;
};

export async function getRecentAuditEntries(
  limit: number = 10,
): Promise<Serialized<AuditLogEntry>[]> {
  const db = getAdminFirestore();

  try {
    const snapshot = await db
      .collection(collections.auditLogs)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return serializeData({
        id: doc.id,
        action: data.action,
        actorUid: data.actorUid,
        actorEmail: data.actorEmail,
        targetType: data.targetType,
        targetId: data.targetId,
        targetName: data.targetName,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      }) as Serialized<AuditLogEntry>;
    });
  } catch (error) {
    console.error("[auditLogs] Failed to fetch recent entries:", error);
    return [];
  }
}
