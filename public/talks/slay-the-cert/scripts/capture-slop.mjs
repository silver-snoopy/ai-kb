// Capture screenshots of competitor cert-prep sites for slides 3 + 4.
// Usage: node capture-slop.mjs
//
// Output: assets/slop-montage/guide-*.png and assets/slop-montage/mock-*.png
// Dimensions: 1366x768 (matches existing montage assets).

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'assets/slop-montage');
mkdirSync(outDir, { recursive: true });

const targets = [
  // category, slug, url
  ['guide', 'claudecertifications',  'https://claudecertifications.com/claude-certified-architect/domains/agentic-architecture'],
  ['guide', 'claudecertprep',        'https://claudecertprep.com/study-guide/intro'],
  ['guide', 'claudecert',            'https://claudecert.com/learn/1-agentic-architecture'],
  ['guide', 'claudecertification',   'https://claudecertification.com/study-guide/1'],
  ['mock',  'claudecertifications',  'https://claudecertifications.com/claude-certified-architect/practice-questions'],
  ['mock',  'claudecertprep',        'https://claudecertprep.com/mock'],
  ['mock',  'claudecert',            'https://claudecert.com/mock-exam'],
  ['mock',  'claudecertification',   'https://claudecertification.com/exams'],
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
});

for (const [category, slug, url] of targets) {
  const page = await context.newPage();
  const out = resolve(outDir, `${category}-${slug}.png`);
  process.stdout.write(`[${category}] ${slug} ← ${url} ... `);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // Settle: let fonts/images flush
    await page.waitForTimeout(1200);
    // Dismiss common cookie/consent banners best-effort
    for (const sel of ['button:has-text("Accept")', 'button:has-text("Got it")', 'button:has-text("Agree")', '[aria-label="Close"]']) {
      try { await page.locator(sel).first().click({ timeout: 600 }); } catch {}
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: out, fullPage: false });
    console.log('OK');
  } catch (err) {
    console.log(`FAIL: ${err.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log(`Done. Wrote to ${outDir}`);
