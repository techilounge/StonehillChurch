/**
 * Mark a Firebase Auth user's email as verified.
 *
 * Usage:
 *   tsx scripts/verifyAdminEmail.ts <email-or-uid>
 *
 * Requires the same Firebase Admin env vars as the seed script:
 *   - FIREBASE_ADMIN_PROJECT_ID
 *   - FIREBASE_ADMIN_CLIENT_EMAIL
 *   - FIREBASE_ADMIN_PRIVATE_KEY
 *
 * Why this exists: admins created in the Firebase Console default to
 * emailVerified=false, which the admin login flow rejects. This script flips
 * the flag so the user can sign in. Run it after onboarding any new admin
 * who wasn't created via the seed.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type UserRecord } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
const usesEmulator = Boolean(
  process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST,
);

if (!projectId) {
  throw new Error("Missing FIREBASE_ADMIN_PROJECT_ID environment variable.");
}

if (!usesEmulator && (!clientEmail || !privateKey)) {
  throw new Error(
    "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY, or use Firebase emulators.",
  );
}

const target = process.argv[2]?.trim();

if (!target) {
  console.error("Usage: tsx scripts/verifyAdminEmail.ts <email-or-uid>");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp(
    usesEmulator
      ? { projectId }
      : {
          credential: cert({
            projectId,
            clientEmail: clientEmail as string,
            privateKey: privateKey as string,
          }),
        },
  );
}

async function lookupUser(identifier: string): Promise<UserRecord> {
  const auth = getAuth();
  if (identifier.includes("@")) {
    return auth.getUserByEmail(identifier);
  }
  return auth.getUser(identifier);
}

async function run() {
  const auth = getAuth();
  const user = await lookupUser(target);

  if (user.emailVerified) {
    console.log(`✓ ${user.email ?? user.uid} is already verified — no change.`);
    return;
  }

  await auth.updateUser(user.uid, { emailVerified: true });
  console.log(`✓ Marked ${user.email ?? user.uid} as email-verified.`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
