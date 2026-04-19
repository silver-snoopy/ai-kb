// scripts/dashboard.mjs
//
// Dashboard generator for the AI Cert KB.
//
// Reads meta.yaml files, walks certs/*/domain-* notes, parses mock-exam reports,
// and writes a dashboard.md at the vault root.
//
// Invariants:
// - Does NOT modify anything except dashboard.md.
// - Safe to run from either local CLI or GitHub Actions.
// - Output is deterministic; running twice in a row produces identical dashboard.md
//   (except for the _Last updated:_ timestamp in the footer, stripped for diff check).

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { glob } from 'glob';

// ---------- Cert discovery ----------

export async function discoverCerts(vaultRoot) {
  const files = await glob('certs/*/meta.yaml', { cwd: vaultRoot, posix: true });
  const out = [];
  for (const rel of files.sort()) {
    const dirName = rel.split('/')[1];
    if (dirName.startsWith('_')) continue; // skip _template
    try {
      const text = await readFile(join(vaultRoot, rel), 'utf-8');
      const data = parseYaml(text);
      if (data && typeof data === 'object' && 'id' in data) {
        out.push(data);
      }
    } catch {
      // malformed YAML — skip
    }
  }
  return out;
}

// ---------- Frontmatter parsing ----------

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;

export function parseFrontmatter(text) {
  const m = text.match(FRONTMATTER_RE);
  if (!m) return null;
  try {
    const fm = parseYaml(m[1]);
    return fm && typeof fm === 'object' ? fm : null;
  } catch {
    return null;
  }
}

async function readFrontmatter(filePath) {
  try {
    const text = await readFile(filePath, 'utf-8');
    return parseFrontmatter(text);
  } catch {
    return null;
  }
}

// ---------- Note counting ----------

export async function countNotesInDomain(vaultRoot, certId, domainId) {
  const domainDir = join(vaultRoot, 'certs', certId, domainId);
  if (!existsSync(domainDir)) return 0;
  const files = await glob('**/*.md', { cwd: domainDir, nodir: true, posix: true });
  let count = 0;
  for (const rel of files) {
    const name = rel.split('/').pop();
    if (name.startsWith('_') || name === 'README.md') continue;
    const fm = await readFrontmatter(join(domainDir, rel));
    if (fm && fm.cert === certId && fm.domain === domainId) {
      count++;
    }
  }
  return count;
}

export async function countWeaknessQueueItems(vaultRoot, certId) {
  const queuePath = join(vaultRoot, 'certs', certId, 'weakness-queue.md');
  if (!existsSync(queuePath)) return { total: 0, unchecked: 0 };
  const text = await readFile(queuePath, 'utf-8');
  // Count checkbox list items; match `- [ ]` (unchecked) and `- [x]` (checked)
  const total = (text.match(/^- \[[ x]\]/gm) || []).length;
  const unchecked = (text.match(/^- \[ \]/gm) || []).length;
  return { total, unchecked };
}

// ---------- Mock exam parsing ----------

export async function parseMockExam(filePath) {
  const fm = await readFrontmatter(filePath);
  if (!fm) return {};
  return {
    score: fm.score,
    total: fm.total,
    pass: fm.pass,
    mode: fm.mode,
    date: fm.date,
  };
}

export async function findMockExams(vaultRoot, certId) {
  const dir = join(vaultRoot, 'certs', certId, 'mock-exams');
  if (!existsSync(dir)) return [];
  const files = await glob('*.md', { cwd: dir, nodir: true, posix: true });
  const out = [];
  for (const rel of files.sort()) {
    if (rel.startsWith('_')) continue;
    const info = await parseMockExam(join(dir, rel));
    if (info.score != null) {
      info.path = relative(vaultRoot, join(dir, rel)).split(/[\\/]/).join('/');
      out.push(info);
    }
  }
  return out;
}

// ---------- Countdown ----------

export function daysUntil(targetDateStr, today = new Date()) {
  const [y, m, d] = targetDateStr.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((target - todayUtc) / msPerDay);
}

// ---------- Presentation helpers ----------

const SPARK_CHARS = [...'\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588'];

export function sparkline(values) {
  if (!values.length) return '';
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const rng = hi - lo || 1;
  return values
    .map(v => {
      const idx = Math.min(
        SPARK_CHARS.length - 1,
        Math.floor(((v - lo) / rng) * (SPARK_CHARS.length - 1))
      );
      return SPARK_CHARS[idx];
    })
    .join('');
}

function statusIcon(pctOfExpected) {
  if (pctOfExpected >= 0.8) return '\ud83d\udfe2';
  if (pctOfExpected >= 0.4) return '\ud83d\udfe1';
  return '\ud83d\udd34';
}

// ---------- Rendering ----------

async function renderCertBlock(vaultRoot, cert) {
  const certId = cert.id;
  const name = cert.name;
  const target = cert.target_date || '';
  const days = target ? daysUntil(target) : null;

  const countdownLine = days != null
    ? `**${name}** \u2014 ${days} days to exam (target: ${target})`
    : `**${name}**`;

  const lines = [`## \ud83c\udfaf ${countdownLine}`, '', '### Coverage vs. exam weight', ''];
  lines.push('| Domain | Weight | Notes | Cards | Status |');
  lines.push('|---|---:|---:|---:|:---:|');

  const weakness = await countWeaknessQueueItems(vaultRoot, certId);

  for (const d of cert.domains || []) {
    const weight = d.weight || 0;
    const expected = Math.max(1, Math.round(weight * 20));
    const actual = await countNotesInDomain(vaultRoot, certId, d.id);
    const icon = statusIcon(expected ? actual / expected : 1.0);
    lines.push(
      `| ${d.name} | ${Math.round(weight * 100)}% | ${actual} | \u2014 | ${icon} (${actual}/${expected} target) |`
    );
  }
  lines.push('');
  lines.push(`_Weakness queue for ${certId}: ${weakness.unchecked} unchecked / ${weakness.total} total_`);
  lines.push('');

  const exams = await findMockExams(vaultRoot, certId);
  if (exams.length) {
    lines.push('### Mock exam trend', '');
    for (const e of exams.slice(-5)) {
      const pct = e.total ? (e.score / e.total) * 100 : 0;
      const verdict = e.pass ? '\ud83d\udfe2 PASS' : '\ud83d\udd34 FAIL';
      lines.push(`- ${e.date ?? '?'} \u00b7 ${e.mode ?? '?'} \u00b7 ${e.score}/${e.total} (${pct.toFixed(0)}%) \u00b7 ${verdict}`);
    }
    const scores = exams.slice(-10).map(e => e.total ? (e.score / e.total) * 100 : 0);
    if (scores.length >= 2) {
      lines.push('', `Trend (last ${scores.length}): ${sparkline(scores)}`);
    }
    lines.push('');
  } else {
    lines.push('### Mock exam trend', '');
    lines.push(`_No mock exams yet. Run \`/mock-exam ${certId}\` to begin tracking._`);
    lines.push('');
  }

  return lines.join('\n');
}

export async function renderDashboard(vaultRoot, now = new Date()) {
  const certs = await discoverCerts(vaultRoot);
  const header = '# \ud83d\udcca AI Cert KB Dashboard';
  const subheader = `_Last updated: ${now.toISOString()} (auto \u2014 do not edit by hand)_`;

  const blocks = certs.length
    ? await Promise.all(certs.map(c => renderCertBlock(vaultRoot, c)))
    : ['_No certs configured. Seed a `certs/<id>/meta.yaml` to begin._'];

  const footer = '\n---\n_Generated by `scripts/dashboard.mjs`. Invariants: never modifies any file except this one._';
  return [header, subheader, ...blocks].join('\n\n') + footer;
}

export async function writeDashboard(vaultRoot, outputPath = null) {
  outputPath = outputPath || join(vaultRoot, 'dashboard.md');
  const newContent = await renderDashboard(vaultRoot);

  const stripTs = (s) => s.split('\n').filter(l => !l.startsWith('_Last updated:')).join('\n');

  if (existsSync(outputPath)) {
    const old = await readFile(outputPath, 'utf-8');
    if (stripTs(old) === stripTs(newContent)) {
      return false;
    }
  }
  await writeFile(outputPath, newContent, 'utf-8');
  return true;
}

// ---------- Entrypoint ----------
// Only runs the CLI when this file is executed directly (not imported).
// Using resolve() to normalize paths makes this work on Windows + Unix.

const invokedAsMain =
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] || '');

if (invokedAsMain) {
  const scriptDir = fileURLToPath(new URL('.', import.meta.url));
  const defaultVault = resolve(scriptDir, '..');
  const vault = process.argv[2] || defaultVault;
  const changed = await writeDashboard(vault);
  console.log(`dashboard.md ${changed ? 'WRITTEN' : 'unchanged'}`);
}
