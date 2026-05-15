const fs = require('fs');
const path = require('path');
const workspace = process.cwd();
const nextDir = path.resolve(workspace, '.next');
console.log('1. Checking stale directories');
const entries = fs.readdirSync(workspace, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isDirectory() && entry.name.startsWith('.next-stale-')) {
    console.log('Found stale:', entry.name);
    try {
      fs.rmSync(path.resolve(workspace, entry.name), { recursive: true, force: true, maxRetries: 1 });
      console.log('Removed', entry.name);
    } catch(e) {
      console.log('Skipped', entry.name);
    }
  }
}
console.log('2. Moving .next');
if (fs.existsSync(nextDir)) {
  const staleDir = path.resolve(workspace, '.next-stale-' + Date.now());
  try {
    fs.renameSync(nextDir, staleDir);
    console.log('Moved .next to', path.basename(staleDir));
  } catch(e) {
    console.log('Could not move .next', e.message);
  }
}
console.log('Done');
