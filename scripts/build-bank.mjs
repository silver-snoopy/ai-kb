// scripts/build-bank.mjs
//
// Transforms the raw upstream question bank into the unified study-surface
// bank used by Practice and Dungeon. Produces public/exams/cca-f/bank.json
// with scenario=null on every question — run scripts/classify-scenarios.mjs
// afterward to fill in scenario tags via LLM classification.
//
// Input:  raw/certsafari/cca-f-questions.json (364 Qs, upstream schema)
// Output: public/exams/cca-f/bank.json (bank schema; see spec §A)
//
// Also loads the six scenario definitions from certs/cca-f/_scenarios.md and
// embeds them under bank.scenarios so downstream UIs don't need to re-parse
// markdown. Domain metadata comes straight from certs/cca-f/meta.yaml.
//
// Idempotent: re-running on an existing bank.json PRESERVES scenario tags
// (merge-by-id) and only rebuilds questions, domains, scenarios structure.
// Use scripts/classify-scenarios.mjs to fill scenario tags after this.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const vault = resolve(scriptDir, '..');

// Upstream domain name → vault slug. Authoritative reference lives in the
// local memory note on the upstream source's API shape.
const DOMAIN_SLUG = {
  'Domain 1: Agentic Architecture & Orchestration':   'domain-1-agentic',
  'Domain 2: Tool Design & MCP Integration':          'domain-4-mcp',
  'Domain 3: Claude Code Configuration & Workflows':  'domain-2-claude-code',
  'Domain 4: Prompt Engineering & Structured Output': 'domain-3-prompt-engineering',
  'Domain 5: Context Management & Reliability':       'domain-5-context',
};

const DOMAIN_META = {
  'domain-1-agentic':            { num: 1, name: 'Agentic Architecture & Orchestration',   weight: 0.27, color: '#f39c4a' },
  'domain-2-claude-code':        { num: 2, name: 'Claude Code Configuration & Workflows',  weight: 0.20, color: '#a87cf0' },
  'domain-3-prompt-engineering': { num: 3, name: 'Prompt Engineering & Structured Output', weight: 0.20, color: '#5db5f0' },
  'domain-4-mcp':                { num: 4, name: 'Tool Design & MCP Integration',          weight: 0.18, color: '#5ad1a0' },
  'domain-5-context':            { num: 5, name: 'Context Management & Reliability',       weight: 0.15, color: '#e85d75' },
};

// Scenario taxonomy: from certs/cca-f/_scenarios.md (6 scenarios, each lists
// the domains it tests). Embedded inline so the bank builder doesn't need to
// parse the markdown — keep in sync if the spec ever changes.
const SCENARIO_META = {
  '1': {
    name: 'Customer Support Resolution Agent',
    domains: ['domain-1-agentic', 'domain-4-mcp', 'domain-5-context'],
  },
  '2': {
    name: 'Code Generation with Claude Code',
    domains: ['domain-2-claude-code', 'domain-3-prompt-engineering'],
  },
  '3': {
    name: 'Multi-Agent Research System',
    domains: ['domain-1-agentic', 'domain-5-context'],
  },
  '4': {
    name: 'Developer Productivity with Claude',
    domains: ['domain-4-mcp'],
  },
  '5': {
    name: 'Claude Code for CI/CD',
    domains: ['domain-2-claude-code', 'domain-3-prompt-engineering'],
  },
  '6': {
    name: 'Structured Data Extraction',
    domains: ['domain-3-prompt-engineering', 'domain-5-context'],
  },
};

function transformQuestion(rawQ) {
  const slug = DOMAIN_SLUG[rawQ.domain];
  if (!slug) throw new Error(`Unknown upstream domain: "${rawQ.domain}"`);

  if (!Array.isArray(rawQ.options) || rawQ.options.length !== 4) {
    throw new Error(`Question ${rawQ.id}: expected 4 options, got ${rawQ.options?.length}`);
  }
  const optionsObj = { A: rawQ.options[0], B: rawQ.options[1], C: rawQ.options[2], D: rawQ.options[3] };

  const correct = rawQ.correct_answers?.[0];
  if (!correct || !['A', 'B', 'C', 'D'].includes(correct)) {
    throw new Error(`Question ${rawQ.id}: invalid correct_answers=${JSON.stringify(rawQ.correct_answers)}`);
  }

  // Flatten explanations into "A: ... B: ... C: ... D: ..." so
  // summarizeExplanation in the dungeon can extract the correct-answer
  // paragraph cleanly.
  const explanation = (rawQ.explanations || [])
    .slice()
    .sort((a, b) => a.option.localeCompare(b.option))
    .map(e => `${e.option}: ${e.explanation}`)
    .join('\n');

  return {
    id: `cs-${slug}-${rawQ.id}`,
    source: 'cs',
    domain: slug,
    scenario: null, // filled in by classify-scenarios.mjs
    difficulty: 'medium', // upstream doesn't ship difficulty; default matches prior seed behavior
    stem: rawQ.question,
    options: optionsObj,
    correct,
    explanation,
    source_note: `cs id=${rawQ.id}`,
  };
}

/** Preserve existing scenario tags from a prior bank build (idempotency). */
function mergeScenarioTags(fresh, existing) {
  if (!existing?.questions) return fresh;
  const tagById = new Map();
  for (const q of existing.questions) {
    if (q.scenario != null) tagById.set(q.id, q.scenario);
  }
  let preserved = 0;
  for (const q of fresh.questions) {
    const tag = tagById.get(q.id);
    if (tag != null) {
      q.scenario = tag;
      preserved++;
    }
  }
  if (preserved > 0) {
    // eslint-disable-next-line no-console
    console.log(`  preserved ${preserved} existing scenario tag(s)`);
  }
  return fresh;
}

async function main() {
  const rawPath = join(vault, 'raw', 'certsafari', 'cca-f-questions.json');
  const raw = JSON.parse(await readFile(rawPath, 'utf-8'));
  if (!Array.isArray(raw.questions)) {
    throw new Error(`${rawPath}: expected top-level "questions" array`);
  }

  const questions = raw.questions.map(transformQuestion);

  // Sort questions deterministically by id so the bank file is diff-stable
  // across re-runs (important for merge-by-id idempotency).
  questions.sort((a, b) => a.id.localeCompare(b.id));

  const fresh = {
    cert_id: 'cca-f',
    version: 1,
    built_at: new Date().toISOString(),
    total: questions.length,
    domains: DOMAIN_META,
    scenarios: SCENARIO_META,
    questions,
  };

  const outPath = join(vault, 'public', 'exams', 'cca-f', 'bank.json');

  // Idempotency: if a bank.json already exists, preserve its scenario tags.
  let existing = null;
  if (existsSync(outPath)) {
    try {
      existing = JSON.parse(await readFile(outPath, 'utf-8'));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`  could not parse existing bank.json; proceeding with fresh build: ${e.message}`);
    }
  }
  const output = existing ? mergeScenarioTags(fresh, existing) : fresh;

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(output, null, 2));

  // Per-domain breakdown for the log
  const byDomain = {};
  for (const q of output.questions) byDomain[q.domain] = (byDomain[q.domain] || 0) + 1;
  const tagged = output.questions.filter(q => q.scenario != null).length;

  // eslint-disable-next-line no-console
  console.log(`\u2713 ${outPath}`);
  console.log(`  total: ${output.questions.length}`);
  console.log(`  scenario-tagged: ${tagged} / ${output.questions.length}`);
  for (const [d, c] of Object.entries(byDomain).sort()) {
    console.log(`    ${d}: ${c}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
