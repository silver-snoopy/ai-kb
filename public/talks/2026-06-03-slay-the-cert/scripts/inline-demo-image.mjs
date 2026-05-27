// Usage: node scripts/inline-demo-image.mjs
// Replaces the inlined demo media <img class="demo-fallback-gif"> in index.html with
// a base64 data: URI of assets/dungeon-demo.png (a crisp gameplay still captured from
// the live game). Supersedes the animated GIF: the still shows a populated boss fight
// (no empty title-card frame) at full resolution, and keeps the deck self-contained.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pngPath = resolve(root, 'assets/dungeon-demo.png');
const htmlPath = resolve(root, 'index.html');

const png = readFileSync(pngPath);
const dataUri = `data:image/png;base64,${png.toString('base64')}`;
const replacement = `<img src="${dataUri}" alt="Slay the Cert — a boss fight against The Tool-Smith posing a real CCA-F exam question" class="demo-fallback-gif">`;

let html = readFileSync(htmlPath, 'utf8');
const imgRe = /<img\b[^>]*class="demo-fallback-gif"[^>]*>/;
if (!imgRe.test(html)) {
  console.error('Could not find <img ... class="demo-fallback-gif"> in index.html.');
  process.exit(1);
}
html = html.replace(imgRe, replacement);
writeFileSync(htmlPath, html);
console.log(`Inlined ${png.length.toLocaleString()} bytes of PNG into index.html`);
