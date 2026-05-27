// Usage (with qrcode installed locally): node scripts/make-qr.mjs
// Generates a theme-tinted SVG QR code for the live dungeon and writes it to
// assets/qr-dungeon.svg. The SVG markup is then inlined directly into the
// demo slide of index.html (self-contained deck — no runtime QR library).
//
// NOTE: the `qrcode` CLI (`npx qrcode -t svg ...`) silently ignores
// --dark/--light, emitting #000/#fff. This library API (QRCode.toString with
// the `color` option) DOES honor the warm tint, so it is the canonical
// generator. The committed assets/qr-dungeon.svg reflects these exact options.
//
// Design notes (see talk design memory):
//   - Dark modules on a parchment tile (NOT inverted): max luminance contrast
//     for scanning from the back of a meeting room. Refero screens research
//     (Cosmos / Netflix / OneSoil) shows scan-to-play QRs are always dark-on-light.
//   - Error-correction level M (not H): no center logo, so keep the matrix
//     coarse (~29x29) → fatter modules → scans from further away.
//   - Warm-tinted ink/parchment (#1a1410 on #e8dfc8) instead of pure #000/#fff
//     so the code reads as aged vellum. Contrast stays ~7:1, well above the
//     ~40% reflectance difference QR decoders need.
import QRCode from 'qrcode';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outPath = resolve(root, 'assets/qr-dungeon.svg');

const url = 'https://silver-snoopy.github.io/ai-kb/dungeon/';

const svg = await QRCode.toString(url, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 4, // full-spec quiet zone in modules (parchment tile padding adds more)
  color: {
    dark: '#1a1410ff', // warm near-black ink
    light: '#e8dfc8ff', // deck parchment (--text-primary)
  },
});

writeFileSync(outPath, svg);
console.log(`Wrote QR for ${url}\n  -> ${outPath}\n  bytes: ${svg.length}`);
