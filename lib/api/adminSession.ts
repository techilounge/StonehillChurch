import "server-only";

import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { requirePermission } from "@/lib/auth";
import { collections } from "@/lib/firestore";
import type { AdminPermission } from "@/lib/permissions";

export function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

export async function getAdminSessionForRequest(
  request: NextRequest,
  permission: AdminPermission,
) {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const decoded = await getAdminAuth().verifyIdToken(token);
  const profileSnapshot = await getAdminFirestore()
    .collection(collections.users)
    .doc(decoded.uid)
    .get();

  if (!profileSnapshot.exists) {
    return null;
  }

  const profile = profileSnapshot.data() ?? {};
  const authResult = requirePermission(
    {
      uid: decoded.uid,
      email: typeof profile.email === "string" ? profile.email : decoded.email ?? null,
      role: profile.role,
      approved: profile.approved === true,
      disabled: profile.disabled === true,
    },
    permission,
  );

  return authResult.ok ? authResult.session : null;
}
