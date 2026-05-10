/**
 * Post-build script: adds type="module" to script tags in dist/index.html
 * so that import.meta works correctly in the browser.
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../dist/index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('dist/index.html not found — skipping patch');
  process.exit(0);
}

let html = fs.readFileSync(htmlPath, 'utf8');

// Add type="module" to all script tags that don't already have it
html = html.replace(/<script\s+src=/g, '<script type="module" src=');

fs.writeFileSync(htmlPath, html);
console.log('✓ Patched dist/index.html: added type="module" to script tags');
