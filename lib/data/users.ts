import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import type { AppUser } from "@/types/auth";
import { serializeData, type Serialized } from "./utils";

export async function listAdminUsers(): Promise<Serialized<AppUser>[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection(collections.users)
      .orderBy("name", "asc")
      .get();

    return snapshot.docs.map((doc) =>
      serializeData({ id: doc.id, ...doc.data() } as unknown as AppUser),
    );
  } catch (error) {
    console.error("[users] listAdminUsers failed:", error);
    return [];
  }
}

export async function getAdminUserById(uid: string): Promise<Serialized<AppUser> | null> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection(collections.users).doc(uid).get();

    if (!snapshot.exists) {
      return null;
    }

    return serializeData({ id: snapshot.id, ...snapshot.data() } as unknown as AppUser);
  } catch (error) {
    console.error("[users] getAdminUserById failed:", error);
    return null;
  }
}

export type AdminUserUpdate = {
  role?: AppUser["role"];
  approved?: boolean;
  disabled?: boolean;
};

export async function updateAdminUser(
  uid: string,
  update: AdminUserUpdate,
  actorUid: string,
): Promise<void> {
  const db = getAdminFirestore();
  const docRef = db.collection(collections.users).doc(uid);
  const patch: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: actorUid,
  };

  if (typeof update.role !== "undefined") patch.role = update.role;
  if (typeof update.approved !== "undefined") patch.approved = update.approved;
  if (typeof update.disabled !== "undefined") patch.disabled = update.disabled;

  await docRef.set(patch, { merge: true });
}
