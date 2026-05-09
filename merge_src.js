const fs = require('fs');
const path = require('path');

function mergeDirectories(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      mergeDirectories(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${srcPath} to ${destPath}`);
    }
  }
}

const srcDir = path.join(__dirname, 'src');
const destDir = __dirname;

if (fs.existsSync(srcDir)) {
  mergeDirectories(srcDir, destDir);
  console.log('Merge complete.');
  // Delete src after moving
  fs.rmSync(srcDir, { recursive: true, force: true });
  console.log('Removed src directory.');
} else {
  console.log('No src directory found.');
}
