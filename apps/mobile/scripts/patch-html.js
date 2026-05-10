/**
 * Post-build script:
 * 1. Adds type="module" to script tags in dist/index.html
 * 2. Replaces import.meta.env references in JS bundles with static values
 *    (Zustand uses import.meta.env.MODE to show deprecation warnings)
 */

const fs = require('fs');
const path = require('path');

// ── Patch index.html ─────────────────────────────────────────────────────────

const htmlPath = path.join(__dirname, '../dist/index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('dist/index.html not found — skipping patch');
  process.exit(0);
}

let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/<script\s+src=/g, '<script type="module" src=');
fs.writeFileSync(htmlPath, html);
console.log('✓ Patched dist/index.html: added type="module" to script tags');

// ── Patch JS bundles ──────────────────────────────────────────────────────────

const jsDir = path.join(__dirname, '../dist/_expo/static/js/web');

if (!fs.existsSync(jsDir)) {
  console.log('No JS bundle directory found — skipping JS patch');
  process.exit(0);
}

const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

for (const file of jsFiles) {
  const filePath = path.join(jsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace import.meta.env?.MODE and import.meta.env.MODE with "production"
  const before = content.length;
  content = content.replace(/import\.meta\.env\?\.MODE/g, '"production"');
  content = content.replace(/import\.meta\.env\.MODE/g, '"production"');
  content = content.replace(/import\.meta\.env/g, '{"MODE":"production"}');
  content = content.replace(/import\.meta/g, '{"env":{"MODE":"production"},"url":""}');

  if (content.length !== before || content.includes('"production"')) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Patched ${file}: replaced import.meta references`);
  }
}

console.log('✓ All patches applied successfully');
