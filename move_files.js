const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const destDir = __dirname;

if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, destDir, { recursive: true, force: true });
  console.log('Copy complete.');
  fs.rmSync(srcDir, { recursive: true, force: true });
  console.log('Removed src directory.');
} else {
  console.log('No src directory found.');
}
