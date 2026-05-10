const fs = require("fs");
const path = require("path");

const workspace = process.cwd();
const nextDir = path.resolve(workspace, ".next");
const relative = path.relative(workspace, nextDir);

if (
  relative.startsWith("..") ||
  path.isAbsolute(relative) ||
  path.basename(nextDir) !== ".next"
) {
  throw new Error(`Refusing to clean unexpected path: ${nextDir}`);
}

if (process.env.SKIP_NEXT_DEV_CLEAN === "1") {
  process.stdout.write("[predev] Skipping .next cleanup.\n");
  process.exit(0);
}

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200,
  });
  process.stdout.write("[predev] Cleared .next before starting dev server.\n");
}

process.exit(0);
