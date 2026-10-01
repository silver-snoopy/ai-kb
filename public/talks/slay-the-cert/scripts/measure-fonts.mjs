// Read computed font sizes for headline selectors at multiple viewports.
import { chromium } from 'playwright';

const selectors = [
  '.slide-1-title', '.slide-1-subline', '.slide-1-tagline', '.slide-1-for',
  '.slide-3-title', '.slide-3-subtitle', '.brand-caption', '.punchline',
  '.slide-4-brand-tag', '.slide-4-deeplink', '.slide-4-punchline',
  '.marginalia',
];

const browser = await chromium.launch({ headless: true });
for (const w of [1366, 1920, 2560]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: Math.round(w * 9 / 16) } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
  const rows = await page.evaluate((sels) => {
    return sels.map((s) => {
      const el = document.querySelector(s);
      if (!el) return [s, '(not found)'];
      const cs = getComputedStyle(el);
      return [s, cs.fontSize];
    });
  }, selectors);
  console.log(`\n=== viewport ${w}px ===`);
  for (const [s, v] of rows) console.log(`  ${s.padEnd(28)} ${v}`);
  await ctx.close();
}
await browser.close();
