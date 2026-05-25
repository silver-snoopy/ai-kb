// Usage: node scripts/inline-gif.mjs
// Replaces the marker <!-- DUNGEON_DEMO_GIF --> in index.html with a base64-encoded data: URI.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const gifPath = resolve(root, 'assets/dungeon-demo.gif');
const htmlPath = resolve(root, 'index.html');

const gif = readFileSync(gifPath);
const dataUri = `data:image/gif;base64,${gif.toString('base64')}`;

let html = readFileSync(htmlPath, 'utf8');
const marker = '<!-- DUNGEON_DEMO_GIF -->';
if (!html.includes(marker)) {
  console.error(`Marker ${marker} not found in index.html. Already inlined?`);
  process.exit(1);
}

const replacement = `<img src="${dataUri}" alt="Dungeon boss fight demo loop" class="demo-fallback-gif">`;
html = html.replace(marker, replacement);
writeFileSync(htmlPath, html);
console.log(`Inlined ${gif.length.toLocaleString()} bytes of GIF into index.html`);
