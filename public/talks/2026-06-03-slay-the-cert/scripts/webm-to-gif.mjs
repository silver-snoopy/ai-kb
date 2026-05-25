// Convert the latest WebM recording to a palette-optimised GIF using ffmpeg-static.
// Usage: node webm-to-gif.mjs
import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const recDir = resolve(root, 'assets/_recording');
const outGif = resolve(root, 'assets/dungeon-demo.gif');

// Find the most recent .webm file
const webms = readdirSync(recDir)
  .filter((f) => f.endsWith('.webm'))
  .map((f) => resolve(recDir, f));

if (webms.length === 0) {
  console.error('No .webm files found in', recDir);
  process.exit(1);
}
const webm = webms[0];
console.log(`Converting ${webm} -> ${outGif} ...`);

// Two-pass palette approach for high-quality GIF
// fps=10 + scale=480 keeps the output under ~3MB for a 10s clip.
// Pass 1: generate palette
const paletteFile = resolve(recDir, 'palette.png');
execFileSync(ffmpegPath, [
  '-y',
  '-i', webm,
  '-vf', 'fps=10,scale=480:-1:flags=lanczos,palettegen',
  paletteFile,
], { stdio: 'inherit' });

// Pass 2: apply palette
execFileSync(ffmpegPath, [
  '-y',
  '-i', webm,
  '-i', paletteFile,
  '-filter_complex', 'fps=10,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse',
  outGif,
], { stdio: 'inherit' });

console.log(`Done! GIF saved to ${outGif}`);
