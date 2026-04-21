// scripts/build-bank.test.mjs
// Run: node --test scripts/build-bank.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const vault = resolve(scriptDir, '..');

// build-bank.mjs doesn't export its transform directly (it runs as a script
// via main()). Rather than restructure for testability, these tests assert
// properties of the BUILT bank.json. Run `node scripts/build-bank.mjs`
// before running these tests, or run via the combined CI step.

const bankPath = resolve(vault, 'public', 'exams', 'cca-f', 'bank.json');

async function loadBank() {
  return JSON.parse(await readFile(bankPath, 'utf-8'));
}

test('bank has the expected top-level shape', async () => {
  const bank = await loadBank();
  assert.equal(bank.cert_id, 'cca-f');
  // Version starts at 1 from build-bank, bumps to 2 after classify-scenarios,
  // and continues bumping as LLM-generated candidates merge. Just assert it's
  // a positive integer — stricter checks live in the classify/merge tests.
  assert.ok(Number.isInteger(bank.version) && bank.version >= 1, `version must be positive integer, got ${bank.version}`);
  assert.equal(typeof bank.built_at, 'string');
  assert.equal(typeof bank.total, 'number');
  assert.equal(typeof bank.domains, 'object');
  assert.equal(typeof bank.scenarios, 'object');
  assert.ok(Array.isArray(bank.questions));
  assert.equal(bank.total, bank.questions.length);
});

test('every domain slug used in questions is in bank.domains', async () => {
  const bank = await loadBank();
  const slugs = new Set(bank.questions.map(q => q.domain));
  for (const slug of slugs) {
    assert.ok(bank.domains[slug], `domain "${slug}" used by a question but not in bank.domains`);
  }
});

test('scenarios 1-6 are present with required metadata', async () => {
  const bank = await loadBank();
  for (const id of ['1', '2', '3', '4', '5', '6']) {
    const s = bank.scenarios[id];
    assert.ok(s, `scenario ${id} missing`);
    assert.equal(typeof s.name, 'string');
    assert.ok(Array.isArray(s.domains) && s.domains.length > 0);
  }
});

test('cs ID prefix preserved on every imported question', async () => {
  const bank = await loadBank();
  const cs = bank.questions.filter(q => q.source === 'cs');
  assert.ok(cs.length > 0, 'expected at least one cs-sourced question');
  for (const q of cs) {
    assert.ok(
      q.id.startsWith('cs-'),
      `cs question has wrong id prefix: ${q.id}`,
    );
  }
});

test('ID prefix discriminates source (invariant)', async () => {
  const bank = await loadBank();
  for (const q of bank.questions) {
    if (q.source === 'cs') {
      assert.ok(q.id.startsWith('cs-'),
        `source=cs but id=${q.id}`);
    } else if (q.source === 'llm') {
      assert.ok(q.id.startsWith('gen-'),
        `source=llm but id=${q.id}`);
    } else {
      assert.fail(`unknown source: ${q.source} on ${q.id}`);
    }
  }
});

test('each question has required fields', async () => {
  const bank = await loadBank();
  for (const q of bank.questions) {
    assert.equal(typeof q.id, 'string');
    assert.equal(typeof q.source, 'string');
    assert.equal(typeof q.domain, 'string');
    // scenario is null initially; tagged later by classify-scenarios.mjs
    assert.ok(q.scenario === null || /^[1-6]$/.test(q.scenario),
      `scenario must be null or '1'..'6', got ${JSON.stringify(q.scenario)}`);
    assert.equal(typeof q.difficulty, 'string');
    assert.equal(typeof q.stem, 'string');
    assert.equal(typeof q.options, 'object');
    for (const letter of ['A', 'B', 'C', 'D']) {
      assert.equal(typeof q.options[letter], 'string', `option ${letter} missing on ${q.id}`);
    }
    assert.ok(['A', 'B', 'C', 'D'].includes(q.correct), `invalid correct=${q.correct} on ${q.id}`);
    assert.equal(typeof q.explanation, 'string');
    assert.equal(typeof q.source_note, 'string');
  }
});

test('questions are sorted by id (deterministic output)', async () => {
  const bank = await loadBank();
  const ids = bank.questions.map(q => q.id);
  const sorted = [...ids].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(ids, sorted, 'questions array should be sorted by id');
});

test('no duplicate question IDs', async () => {
  const bank = await loadBank();
  const seen = new Set();
  for (const q of bank.questions) {
    assert.ok(!seen.has(q.id), `duplicate id: ${q.id}`);
    seen.add(q.id);
  }
});
