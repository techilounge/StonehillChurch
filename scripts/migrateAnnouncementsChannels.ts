import { loadEnvConfig } from "@next/env";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { buildAnnouncementMigrationPatch } from "@/lib/announcements";
import { collections } from "@/lib/constants/collections";

loadEnvConfig(process.cwd());

const applyChanges = process.argv.includes("--apply");
const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const usesEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

if (!projectId) {
  throw new Error("Missing FIREBASE_ADMIN_PROJECT_ID environment variable.");
}

if (getApps().length === 0) {
  if (usesEmulator) {
    initializeApp({ projectId });
  } else {
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!clientEmail || !privateKey) {
      throw new Error(
        "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY, or use the Firestore emulator.",
      );
    }
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
}

function uniqueSlug(baseSlug: string, usedSlugs: Set<string>): string {
  if (!usedSlugs.has(baseSlug)) return baseSlug;

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const suffixText = `-${suffix}`;
    const candidate = `${baseSlug.slice(0, 120 - suffixText.length).replace(/-+$/g, "")}${suffixText}`;
    if (!usedSlugs.has(candidate)) return candidate;
  }

  throw new Error(`Could not derive a unique slug from "${baseSlug}".`);
}

async function main() {
  const db = getFirestore();
  const snapshot = await db.collection(collections.announcements).get();
  const documents = [...snapshot.docs].sort((left, right) => left.id.localeCompare(right.id));
  const usedSlugs = new Set<string>();
  const duplicateExplicitSlugs = new Set<string>();

  for (const document of documents) {
    const slug = document.data().slug;
    if (typeof slug !== "string" || !slug.trim()) continue;
    if (usedSlugs.has(slug)) duplicateExplicitSlugs.add(slug);
    usedSlugs.add(slug);
  }

  let changed = 0;
  let skipped = 0;
  const writes: Array<{ id: string; patch: Record<string, unknown> }> = [];

  for (const document of documents) {
    const data = document.data() as Record<string, unknown>;
    const patch = buildAnnouncementMigrationPatch(data);

    if (typeof patch.slug === "string") {
      const slug = uniqueSlug(patch.slug, usedSlugs);
      patch.slug = slug;
      usedSlugs.add(slug);
    }

    if (Object.keys(patch).length === 0) {
      skipped += 1;
      continue;
    }

    changed += 1;
    writes.push({ id: document.id, patch });
    console.log(
      `${applyChanges ? "APPLY" : "DRY RUN"}: ${document.id} -> ${Object.keys(patch).join(", ")}`,
    );
  }

  if (applyChanges) {
    for (let offset = 0; offset < writes.length; offset += 400) {
      const batch = db.batch();
      for (const write of writes.slice(offset, offset + 400)) {
        batch.set(
          db.collection(collections.announcements).doc(write.id),
          write.patch,
          { merge: true },
        );
      }
      await batch.commit();
    }
  }

  console.log("");
  console.log(`Mode: ${applyChanges ? "APPLY" : "DRY RUN (no writes)"}`);
  console.log(`Scanned: ${documents.length}`);
  console.log(`Changed: ${changed}`);
  console.log(`Skipped: ${skipped}`);
  if (duplicateExplicitSlugs.size > 0) {
    console.warn(
      `Existing duplicate explicit slugs were preserved: ${[...duplicateExplicitSlugs].join(", ")}`,
    );
  }
  if (!applyChanges && changed > 0) {
    console.log("Re-run with --apply to write these missing fields.");
  }
}

main().catch((error) => {
  console.error("Announcement channel migration failed.", error);
  process.exitCode = 1;
});
