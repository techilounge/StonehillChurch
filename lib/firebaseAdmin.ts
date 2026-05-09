import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

import type { AdminRole } from "./permissions";

function getAdminPrivateKey() {
  return process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

export function getFirebaseAdminApp(): App {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // When running with emulators, we don't need a valid private key.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    if (!projectId) {
      throw new Error("Missing FIREBASE_ADMIN_PROJECT_ID for emulator.");
    }
    return initializeApp({
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = getAdminPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables.");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getFirebaseAdminApp());
}

export type UserClaims = {
  role: AdminRole | null;
  approved: boolean;
  disabled: boolean;
};

// Mirrors role/approved/disabled into the auth token so Storage rules
// (which can't read Firestore) stay consistent with the users/{uid} doc.
// Call after every users/{uid} write that changes any of these fields.
// Token-side claims propagate on next refresh (~1h) — force a refresh client-side
// after sensitive promotions/demotions if you can't wait.
export async function syncUserClaims(uid: string, claims: UserClaims): Promise<void> {
  await getAdminAuth().setCustomUserClaims(uid, {
    role: claims.role,
    approved: claims.approved === true,
    disabled: claims.disabled === true,
  });
}
