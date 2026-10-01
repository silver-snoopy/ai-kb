// Take screenshots of specific slides for visual verification.
// Usage: node snap-slides.mjs [slide-id ...]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'assets/_review');
mkdirSync(outDir, { recursive: true });

const args = process.argv.slice(2);
const wantAll = args.includes('--all') || args.includes('all');
const wantSizes = args.find((a) => a.startsWith('--sizes='))?.split('=')[1]?.split(',') ?? ['laptop','desktop','wallscreen'];
const slides = args.filter((a) => !a.startsWith('--') && a !== 'all');
const targets = wantAll
  ? Array.from({ length: 15 }, (_, i) => `slide-${i + 1}`)
  : (slides.length ? slides : ['slide-3', 'slide-4']);

const browser = await chromium.launch({ headless: true });
const allSizes = [
  { name: 'laptop', w: 1366, h: 800 },
  { name: 'desktop', w: 1920, h: 1080 },
  { name: 'wallscreen', w: 2560, h: 1440 },
];
const sizes = allSizes.filter((s) => wantSizes.includes(s.name));

for (const { name, w, h } of sizes) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
  for (const id of targets) {
    await page.evaluate((sid) => document.getElementById(sid)?.scrollIntoView({ behavior: 'instant' }), id);
    await page.waitForTimeout(800);
    // For slide-3, click to reveal cards
    if (id === 'slide-3') {
      for (let i = 0; i < 5; i++) {
        await page.locator(`#${id}`).click();
        await page.waitForTimeout(450);
      }
    }
    const out = resolve(outDir, `${id}-${name}.png`);
    await page.screenshot({ path: out, fullPage: false, clip: { x: 0, y: 0, width: w, height: h } });
    console.log(`wrote ${out}`);
  }
  await context.close();
}
await browser.close();
