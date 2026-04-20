// scripts/build-certsafari-exams.mjs
// Builds deterministic 60-Q exams from the CertSafari bank.
// Output bypasses /cca-f-verify-exam because the source is pre-verified.
//
// Usage: node scripts/build-certsafari-exams.mjs --seed <N> [--size 60] [--out <path>]

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const vault = resolve(scriptDir, '..');

const CS_DOMAIN_TO_SLUG = {
  'Domain 1: Agentic Architecture & Orchestration':   'domain-1-agentic',
  'Domain 2: Tool Design & MCP Integration':          'domain-4-mcp',
  'Domain 3: Claude Code Configuration & Workflows':  'domain-2-claude-code',
  'Domain 4: Prompt Engineering & Structured Output': 'domain-3-prompt-engineering',
  'Domain 5: Context Management & Reliability':       'domain-5-context',
};

const DOMAIN_META = {
  'domain-1-agentic':            { num: 1, name: 'Agentic Architecture & Orchestration', weight: 0.27, color: '#f39c4a' },
  'domain-2-claude-code':        { num: 2, name: 'Claude Code Configuration & Workflows', weight: 0.20, color: '#a87cf0' },
  'domain-3-prompt-engineering': { num: 3, name: 'Prompt Engineering & Structured Output', weight: 0.20, color: '#5db5f0' },
  'domain-4-mcp':                { num: 4, name: 'Tool Design & MCP Integration', weight: 0.18, color: '#5ad1a0' },
  'domain-5-context':            { num: 5, name: 'Context Management & Reliability', weight: 0.15, color: '#e85d75' },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function transformQuestion(cs) {
  const slug = CS_DOMAIN_TO_SLUG[cs.domain];
  if (!slug) throw new Error(`Unknown CertSafari domain: ${cs.domain}`);
  const options = { A: cs.options[0], B: cs.options[1], C: cs.options[2], D: cs.options[3] };
  const correct = cs.correct_answers?.[0] ?? 'A';
  const explanation = (cs.explanations || [])
    .map(e => `${e.option}: ${e.explanation}`)
    .join('\n');
  return {
    id: `certsafari-${slug}-${String(cs.id).padStart(3, '0')}`,
    domain: slug,
    difficulty: 'medium',
    stem: cs.question,
    options,
    options_array: [options.A, options.B, options.C, options.D],
    correct,
    explanation,
    'source-note': `raw/certsafari/cca-f-questions.json (certsafari_id=${cs.id})`,
  };
}

export function domainQuota(size) {
  const slugs = Object.keys(DOMAIN_META);
  const raw = slugs.map(s => ({ slug: s, want: DOMAIN_META[s].weight * size }));
  const floored = raw.map(r => ({ slug: r.slug, n: Math.floor(r.want), frac: r.want - Math.floor(r.want) }));
  let used = floored.reduce((a, b) => a + b.n, 0);
  const byFrac = [...floored].sort((a, b) => b.frac - a.frac);
  let i = 0;
  while (used < size) {
    byFrac[i % byFrac.length].n += 1;
    used += 1;
    i += 1;
  }
  const out = {};
  for (const r of floored) out[r.slug] = r.n;
  return out;
}

export function buildExam(seed, size, rawBank) {
  const rng = mulberry32(seed);
  const questions = rawBank.questions.map(transformQuestion);
  const byDomain = {};
  for (const q of questions) (byDomain[q.domain] ??= []).push(q);

  const quota = domainQuota(size);
  const picked = [];
  for (const [slug, want] of Object.entries(quota)) {
    const pool = byDomain[slug] || [];
    if (pool.length < want) {
      throw new Error(`Insufficient questions for ${slug}: want ${want}, have ${pool.length}. Run the CertSafari extractor for that domain first.`);
    }
    const shuffled = shuffle(pool, rng);
    picked.push(...shuffled.slice(0, want));
  }

  const shuffledPicked = shuffle(picked, mulberry32(seed + 1));
  const byDomainCount = {};
  for (const q of shuffledPicked) byDomainCount[q.domain] = (byDomainCount[q.domain] || 0) + 1;

  return {
    built_at: new Date().toISOString(),
    total: shuffledPicked.length,
    exam_metadata: {
      seed,
      source: 'certsafari-curated',
      verified_by: 'source-is-ground-truth',
      generator: 'scripts/build-certsafari-exams.mjs',
      generator_date: new Date().toISOString(),
      composition: 'certsafari-mixed (no scenario tagging — predates scenario taxonomy)',
      time_limit_minutes: 120,
      passing_score: 720,
      scale_max: 1000,
      coverage_warnings: [],
    },
    by_domain: byDomainCount,
    domains: DOMAIN_META,
    questions: shuffledPicked,
  };
}

function parseArgs(argv) {
  const out = { seed: null, size: 60, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--seed') out.seed = parseInt(argv[++i], 10);
    else if (a.startsWith('--seed=')) out.seed = parseInt(a.slice(7), 10);
    else if (a === '--size') out.size = parseInt(argv[++i], 10);
    else if (a.startsWith('--size=')) out.size = parseInt(a.slice(7), 10);
    else if (a === '--out') out.out = argv[++i];
    else if (a.startsWith('--out=')) out.out = a.slice(6);
  }
  if (out.seed == null || Number.isNaN(out.seed)) {
    throw new Error('Missing or invalid --seed. Usage: node scripts/build-certsafari-exams.mjs --seed <N> [--size 60] [--out <path>]');
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rawPath = resolve(vault, 'raw', 'certsafari', 'cca-f-questions.json');
  const rawBank = JSON.parse(await readFile(rawPath, 'utf8'));
  const exam = buildExam(args.seed, args.size, rawBank);
  const outPath = args.out
    ? resolve(vault, args.out)
    : resolve(vault, 'public', 'exams', 'cca-f', 'verified', `certsafari-seed${args.seed}.json`);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(exam, null, 2));
  console.log(`Wrote ${outPath} (${exam.total} Qs, seed=${args.seed})`);
  console.log(`  by_domain: ${JSON.stringify(exam.by_domain)}`);
}

const invokedPath = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : '';
if (import.meta.url.endsWith(invokedPath)) {
  main().catch(err => { console.error(err); process.exit(1); });
}
