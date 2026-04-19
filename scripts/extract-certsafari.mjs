// scripts/extract-certsafari.mjs
// Extracts all ~363 CertSafari questions for the Claude Certified Architect
// exam by creating one quiz per domain and iterating /api/questions.
//
// API (discovered by network inspection, 2026-04-18):
//   POST https://www.certsafari.com/api/create-quiz
//     body: { certificate, vendor, n_questions, user_id, mode, domain }
//     returns: { data: { quiz: { id, question_ids }, first_question: {...} } }
//   POST https://www.certsafari.com/api/questions
//     body: { quiz_id }
//     returns: { data: [question_obj] }   // returns next question in the quiz
//
// Invariants:
// - 500ms pacing between /api/questions calls to avoid per-minute rate limit.
// - Uses provided user-id; doesn't pollute the user's real quiz history in any unsafe way.
// - Writes immutable raw JSON + per-domain markdown with ```question blocks.

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USER_ID = process.env.CERTSAFARI_USER_ID || process.argv[2];
if (!USER_ID) {
  console.error('Usage: CERTSAFARI_USER_ID=<uid> node extract-certsafari.mjs');
  console.error('  OR:  node extract-certsafari.mjs <uid>');
  process.exit(1);
}

const BASE = 'https://www.certsafari.com';
const DOMAINS = [
  { name: 'Domain 1: Agentic Architecture & Orchestration', count: 86, id: 'domain-1-agentic' },
  { name: 'Domain 2: Tool Design & MCP Integration',         count: 60, id: 'domain-2-mcp' },
  { name: 'Domain 3: Claude Code Configuration & Workflows', count: 73, id: 'domain-3-claude-code' },
  { name: 'Domain 4: Prompt Engineering & Structured Output', count: 72, id: 'domain-4-prompt-engineering' },
  { name: 'Domain 5: Context Management & Reliability',      count: 72, id: 'domain-5-context' },
];
const PACING_MS = 500;
const COOLDOWN_MS = 2000;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function createQuiz(domain, count) {
  const res = await fetch(`${BASE}/api/create-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      certificate: 'claude-certified-architect',
      vendor: 'anthropic',
      n_questions: Math.min(count, 100),
      user_id: USER_ID,
      mode: 'exam',
      domain,
    }),
  });
  if (!res.ok) throw new Error(`create-quiz failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function getNextQuestion(quizId) {
  const res = await fetch(`${BASE}/api/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_id: quizId }),
  });
  if (!res.ok) throw new Error(`questions failed (${res.status})`);
  return res.json();
}

async function extractDomain(d) {
  console.log(`\n\u2192 ${d.name}: target=${d.count}`);
  const createJson = await createQuiz(d.name, d.count);
  if (!createJson.data?.quiz) throw new Error(`no quiz in response: ${JSON.stringify(createJson).slice(0, 200)}`);
  const quizId = createJson.data.quiz.id;
  const expectedIds = new Set(createJson.data.quiz.question_ids || []);
  const collected = new Map();
  if (createJson.data.first_question) collected.set(createJson.data.first_question.id, createJson.data.first_question);
  let stalls = 0;
  let attempts = 0;
  const maxAttempts = expectedIds.size * 3 + 10;
  while (collected.size < expectedIds.size && stalls < 5 && attempts < maxAttempts) {
    attempts++;
    await sleep(PACING_MS);
    try {
      const qj = await getNextQuestion(quizId);
      const q = qj.data?.[0];
      if (q && !collected.has(q.id)) {
        collected.set(q.id, q);
        stalls = 0;
      } else {
        stalls++;
      }
      process.stdout.write(`  ${collected.size}/${expectedIds.size} (attempts: ${attempts})\r`);
    } catch (e) {
      console.error(`\n  ${e.message} \u2014 backing off 2s`);
      stalls++;
      await sleep(2000);
    }
  }
  console.log(`\n  \u2713 ${collected.size}/${expectedIds.size} collected in ${attempts} attempts`);
  return Array.from(collected.values()).map(q => ({ ...q, _domain_slug: d.id }));
}

function toQuestionBlock(q, index, domainSlug) {
  const correctLetter = (q.correct_answers?.[0] ?? 'A');
  const optsLines = ['A', 'B', 'C', 'D'].map((l, idx) => `  ${l}: ${JSON.stringify(q.options[idx] || '')}`).join('\n');
  const explParts = (q.explanations || [])
    .map(e => `  ${e.option}: ${e.explanation.replace(/\n/g, ' ')}`)
    .join('\n');
  const explanation = explParts || 'See CertSafari.';
  const stemIndented = q.question.split('\n').map(l => `  ${l}`).join('\n');
  const explIndented = explanation.split('\n').map(l => `  ${l}`).join('\n');
  return [
    '```question',
    `id: certsafari-${domainSlug}-${String(index + 1).padStart(3, '0')}`,
    `domain: ${domainSlug}`,
    `difficulty: medium`,
    `stem: |`,
    stemIndented,
    `options:`,
    optsLines,
    `correct: ${correctLetter}`,
    `explanation: |`,
    explIndented,
    `source-note: raw/certsafari/cca-f-questions.json (certsafari_id=${q.id})`,
    '```',
    '',
  ].join('\n');
}

async function main() {
  const scriptDir = fileURLToPath(new URL('.', import.meta.url));
  const vault = resolve(scriptDir, '..');

  const all = [];
  for (const d of DOMAINS) {
    try {
      const qs = await extractDomain(d);
      all.push(...qs);
    } catch (e) {
      console.error(`Domain ${d.id} failed: ${e.message}`);
    }
    await sleep(COOLDOWN_MS);
  }

  const rawPath = join(vault, 'raw', 'certsafari', 'cca-f-questions.json');
  await mkdir(dirname(rawPath), { recursive: true });
  await writeFile(rawPath, JSON.stringify({
    extracted_at: new Date().toISOString(),
    source: 'https://www.certsafari.com/anthropic/claude-certified-architect',
    certificate: 'claude-certified-architect',
    vendor: 'anthropic',
    total: all.length,
    questions: all,
  }, null, 2));
  console.log(`\n\u2713 Raw archive: ${rawPath} (${all.length} questions)`);

  for (const d of DOMAINS) {
    const qs = all.filter(q => q._domain_slug === d.id);
    if (!qs.length) continue;
    const header = [
      '---',
      'cert: cca-f',
      `domain: ${d.id}`,
      'status: done',
      'source: certsafari',
      'tags: [seeded, certsafari]',
      '---',
      '',
      `# CertSafari Practice Questions \u2014 ${d.name}`,
      '',
      `${qs.length} questions from CertSafari's Claude Certified Architect practice bank. Source: raw/certsafari/cca-f-questions.json.`,
      '',
    ].join('\n');
    const body = qs.map((q, i) => toQuestionBlock(q, i, d.id)).join('\n');
    const mdPath = join(vault, 'certs', 'cca-f', d.id, 'certsafari-questions.md');
    await mkdir(dirname(mdPath), { recursive: true });
    await writeFile(mdPath, header + body);
    console.log(`\u2713 ${mdPath} (${qs.length} question blocks)`);
  }

  console.log(`\nDone. Total: ${all.length} questions.`);
}

main().catch(e => { console.error(e); process.exit(1); });
