// Record a ~10-sec WebM of the dungeon by driving the live deployed game.
// Usage: node record-demo.mjs [--local]  (--local for localhost:5173, default for live URL)
//
// Canvas config: 960x720, FIT-scaled, centered in 1280x720 viewport.
// Game coords map 1:1 to canvas pixels when scale=1 (960x720 canvas in 1280x720 viewport).
// Canvas offset x = (1280-960)/2 = 160, y = 0.
//
// Key game coordinates:
//   HubScene — Begin Quest button: (480, 230)
//   BossFightScene — option buttons: (480, 470/518/566/614) for A/B/C/D
//   BossFightScene — spell buttons row1: (100,650),(380,650),(660,650)
//   BossFightScene — spell buttons row2: (240,682),(520,682)

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'assets/_recording');
mkdirSync(outDir, { recursive: true });

const target = process.argv.includes('--local')
  ? 'http://localhost:5173/'
  : 'https://silver-snoopy.github.io/ai-kb/dungeon/';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();

console.log(`Recording from ${target} ...`);
await page.goto(target, { waitUntil: 'networkidle' });

// Wait for canvas
await page.waitForSelector('canvas', { timeout: 10000 });
const box = await page.locator('canvas').boundingBox();
console.log(`Canvas: x=${box.x} y=${box.y} w=${box.width} h=${box.height}`);

// Scale factor: canvas CSS width / game width (960)
const scale = box.width / 960;
const gx = (gameX) => box.x + gameX * scale;
const gy = (gameY) => box.y + gameY * scale;

// Wait for BootScene to load bank and transition to HubScene (~2.5s)
await page.waitForTimeout(3000);

// HubScene: click "Begin Quest" at game (480, 230)
console.log('Clicking Begin Quest...');
await page.mouse.click(gx(480), gy(230));
await page.waitForTimeout(3000); // wait for BossFightScene to load + first question

// BossFightScene: click option A (first answer) at game (480, 470)
console.log('Clicking option A...');
await page.mouse.click(gx(480), gy(470));
await page.waitForTimeout(1500); // auto-advance delay

// Click option B for second question
console.log('Clicking option B...');
await page.mouse.click(gx(480), gy(518));
await page.waitForTimeout(1500);

// End recording (total ~9-10s)
await context.close();
await browser.close();
console.log(`Recording saved to ${outDir}/`);
