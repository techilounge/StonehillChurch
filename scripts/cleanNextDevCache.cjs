const fs = require("fs");
const path = require("path");

const workspace = process.cwd();
const lifecycleEvent = process.env.npm_lifecycle_event || "script";
const nextDir = path.resolve(workspace, ".next");
const relative = path.relative(workspace, nextDir);
const shouldPrepareCache =
  lifecycleEvent === "predev" || lifecycleEvent === "prebuild";

if (
  relative.startsWith("..") ||
  path.isAbsolute(relative) ||
  path.basename(nextDir) !== ".next"
) {
  throw new Error(`Refusing to clean unexpected path: ${nextDir}`);
}

if (process.env.SKIP_NEXT_DEV_CLEAN === "1") {
  process.stdout.write(`[${lifecycleEvent}] Skipping .next cleanup.\n`);
  process.exit(0);
}

// Best-effort sweep of leftover `.next-stale-*` directories from previous
// runs. Locked folders are skipped silently so a stuck handle never blocks
// dev or build. Whichever folders aren't locked anymore get reclaimed.
function sweepStaleNextDirectories() {
  let entries;
  try {
    entries = fs.readdirSync(workspace, { withFileTypes: true });
  } catch (error) {
    process.stdout.write(
      `[${lifecycleEvent}] Could not list workspace for stale cleanup (${error.code || error.message}).\n`,
    );
    return;
  }

  let removed = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith(".next-stale-")) {
      continue;
    }

    const staleDir = path.resolve(workspace, entry.name);
    const staleRelative = path.relative(workspace, staleDir);

    if (
      staleRelative.startsWith("..") ||
      path.isAbsolute(staleRelative) ||
      !path.basename(staleDir).startsWith(".next-stale-")
    ) {
      continue;
    }

    try {
      fs.rmSync(staleDir, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 150,
      });
      removed += 1;
    } catch {
      skipped += 1;
    }
  }

  if (removed > 0 || skipped > 0) {
    process.stdout.write(
      `[${lifecycleEvent}] Stale cache sweep: removed ${removed}, skipped ${skipped} (still locked).\n`,
    );
  }
}

sweepStaleNextDirectories();

if (
  shouldPrepareCache &&
  process.env.CLEAN_NEXT_DEV_CACHE !== "1"
) {
  if (!fs.existsSync(nextDir)) {
    process.stdout.write(`[${lifecycleEvent}] No .next cache to prepare.\n`);
    process.exit(0);
  }

  const staleDir = path.resolve(workspace, `.next-stale-${Date.now()}`);
  const staleRelative = path.relative(workspace, staleDir);

  if (
    staleRelative.startsWith("..") ||
    path.isAbsolute(staleRelative) ||
    !path.basename(staleDir).startsWith(".next-stale-")
  ) {
    throw new Error(`Refusing to move .next to unexpected path: ${staleDir}`);
  }

  try {
    fs.renameSync(nextDir, staleDir);
    process.stdout.write(
      `[${lifecycleEvent}] Moved .next to ${path.basename(staleDir)} before continuing.\n`,
    );
  } catch (error) {
    process.stdout.write(
      `[${lifecycleEvent}] Could not move .next (${error.code || error.message}). Continuing without cleanup.\n`,
    );
  }

  process.exit(0);
}

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200,
  });
  process.stdout.write(`[${lifecycleEvent}] Cleared .next before continuing.\n`);
}

process.exit(0);
