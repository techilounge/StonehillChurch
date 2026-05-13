import { loadEnvConfig } from "@next/env";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore, type Firestore } from "firebase-admin/firestore";
import { collections, SINGLETON_DOCS, type CollectionName } from "@/lib/constants/collections";
import { SUPER_ADMIN } from "@/types/auth";

import {
  announcementsSeed,
  eventsSeed,
  homepageSlidesSeed,
  leadersSeed,
  ministriesSeed,
  pagesSeed,
  resourcesSeed,
  sermonsSeed,
  siteSettingsSeed,
  youtubeSettingsSeed,
} from "./seedData";

loadEnvConfig(process.cwd());

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
const seedEmail = process.env.ADMIN_SEED_EMAIL;
const seedPassword = process.env.ADMIN_SEED_PASSWORD;
const seedName = process.env.ADMIN_SEED_NAME ?? "Stonehill Admin";
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

if (!seedEmail || !seedPassword) {
  throw new Error("Missing ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD environment variables.");
}

const adminEmail: string = seedEmail;
const adminPassword: string = seedPassword;

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

const firestore: Firestore = getFirestore();
const auth = getAuth();

function toTimestamp(value: unknown): Timestamp | unknown {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return Timestamp.fromDate(parsed);
    }
  }
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  return value;
}

const TIMESTAMP_FIELDS = new Set([
  "sermonDate",
  "startDateTime",
  "endDateTime",
  "startDate",
  "endDate",
]);

function normalizeTimestamps<T extends Record<string, unknown>>(data: T): T {
  const next: Record<string, unknown> = { ...data };
  for (const field of Object.keys(next)) {
    if (TIMESTAMP_FIELDS.has(field)) {
      next[field] = toTimestamp(next[field]);
    }
  }
  return next as T;
}

type SeedRecord = { id: string; data: Record<string, unknown> };

async function seedAdminUser(): Promise<{ uid: string; email: string }> {
  const existing = await auth.getUserByEmail(adminEmail).catch(() => null);
  const user = existing
    ? existing
    : await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: seedName,
        emailVerified: true,
      });

  await auth.setCustomUserClaims(user.uid, {
    role: SUPER_ADMIN,
    approved: true,
    disabled: false,
  });

  await firestore
    .collection(collections.users)
    .doc(user.uid)
    .set(
      {
        uid: user.uid,
        name: seedName,
        email: adminEmail,
        role: SUPER_ADMIN,
        approved: true,
        disabled: false,
        photoUrl: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: null,
      },
      { merge: true },
    );

  return { uid: user.uid, email: adminEmail };
}

async function seedCollection(
  name: CollectionName,
  records: SeedRecord[],
  actorUid: string,
  options?: { publishable?: boolean; audited?: boolean },
) {
  const audited = options?.audited ?? true;
  const publishable = options?.publishable ?? false;
  const collectionRef = firestore.collection(name);
  const batch = firestore.batch();

  for (const record of records) {
    const base: Record<string, unknown> = normalizeTimestamps(record.data);

    if (audited) {
      base.createdAt = FieldValue.serverTimestamp();
      base.updatedAt = FieldValue.serverTimestamp();
      base.createdBy = actorUid;
      base.updatedBy = actorUid;
    }

    if (publishable) {
      base.publishedAt = base.status === "published" ? FieldValue.serverTimestamp() : null;
    }

    batch.set(collectionRef.doc(record.id), base, { merge: true });
  }

  await batch.commit();
  console.log(`  ✓ ${name} (${records.length})`);
}

async function seedSimpleCollection(
  name: CollectionName,
  records: SeedRecord[],
  actorUid: string,
) {
  const collectionRef = firestore.collection(name);
  const batch = firestore.batch();

  for (const record of records) {
    const base: Record<string, unknown> = normalizeTimestamps(record.data);
    base.createdAt = FieldValue.serverTimestamp();
    base.updatedAt = FieldValue.serverTimestamp();
    base.createdBy = actorUid;
    base.updatedBy = actorUid;
    batch.set(collectionRef.doc(record.id), base, { merge: true });
  }

  await batch.commit();
  console.log(`  ✓ ${name} (${records.length})`);
}

async function seedSiteSettings(actorUid: string) {
  const collectionRef = firestore.collection(collections.siteSettings);
  const batch = firestore.batch();
  for (const record of siteSettingsSeed) {
    batch.set(
      collectionRef.doc(record.id),
      {
        ...record.data,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUid,
      },
      { merge: true },
    );
  }
  await batch.commit();
  console.log(`  ✓ siteSettings (${siteSettingsSeed.length})`);
}

async function seedYoutubeSettings(actorUid: string) {
  await firestore
    .collection(collections.youtubeSettings)
    .doc(SINGLETON_DOCS.youtubeSettings)
    .set(
      {
        ...youtubeSettingsSeed.data,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actorUid,
      },
      { merge: true },
    );
  console.log("  ✓ youtubeSettings (1)");
}

async function seed() {
  console.log("→ Seeding Stonehill Firestore");

  console.log("• Admin user");
  const admin = await seedAdminUser();
  console.log(`  ✓ ${admin.email} (${admin.uid})`);

  console.log("• Content collections");
  await seedCollection(collections.homepageSlides, homepageSlidesSeed, admin.uid, { publishable: true });
  await seedCollection(collections.sermons, sermonsSeed, admin.uid, { publishable: false });
  await seedCollection(collections.events, eventsSeed, admin.uid, { publishable: false });
  await seedCollection(collections.ministries, ministriesSeed, admin.uid, { publishable: false });
  await seedSimpleCollection(collections.leaders, leadersSeed, admin.uid);
  await seedSimpleCollection(collections.announcements, announcementsSeed, admin.uid);
  await seedSimpleCollection(collections.resources, resourcesSeed, admin.uid);
  await seedCollection(collections.pages, pagesSeed, admin.uid, { publishable: false });

  console.log("• Settings");
  await seedSiteSettings(admin.uid);
  await seedYoutubeSettings(admin.uid);

  console.log("✓ Stonehill Firestore seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
