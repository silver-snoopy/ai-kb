// public/exams/arrangement.test.mjs
// Run: node --test public/exams/arrangement.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mulberry32,
  normalizeSeed,
  filterBank,
  countByAxis,
  buildDrillSession,
  buildMockExam,
} from './arrangement.js';

// Minimal fixture bank: 2 domains, 2 scenarios, enough questions to test
// the weight/intersection math without loading the real bank.
function makeBank() {
  const questions = [];
  let n = 1;
  // domain-1-agentic, scenarios 1 and 3
  for (let i = 0; i < 10; i++) questions.push({ id: `q${n++}`, domain: 'domain-1-agentic', scenario: '1' });
  for (let i = 0; i < 10; i++) questions.push({ id: `q${n++}`, domain: 'domain-1-agentic', scenario: '3' });
  // domain-4-mcp, scenario 4
  for (let i = 0; i < 6; i++) questions.push({ id: `q${n++}`, domain: 'domain-4-mcp', scenario: '4' });
  // domain-5-context, scenarios 1 and 3 and 6
  for (let i = 0; i < 4; i++) questions.push({ id: `q${n++}`, domain: 'domain-5-context', scenario: '1' });
  for (let i = 0; i < 4; i++) questions.push({ id: `q${n++}`, domain: 'domain-5-context', scenario: '3' });
  for (let i = 0; i < 4; i++) questions.push({ id: `q${n++}`, domain: 'domain-5-context', scenario: '6' });
  return {
    cert_id: 'test',
    domains: {
      'domain-1-agentic':  { weight: 0.5 },
      'domain-4-mcp':      { weight: 0.3 },
      'domain-5-context':  { weight: 0.2 },
    },
    scenarios: {
      '1': { name: 'Scenario 1', domains: ['domain-1-agentic', 'domain-5-context', 'domain-4-mcp'] },
      '3': { name: 'Scenario 3', domains: ['domain-1-agentic', 'domain-5-context'] },
      '4': { name: 'Scenario 4', domains: ['domain-4-mcp'] },
      '6': { name: 'Scenario 6', domains: ['domain-5-context'] },
    },
    questions,
  };
}

// ---------- PRNG ----------

test('mulberry32 is deterministic for a given seed', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
});

test('mulberry32 produces different sequences for different seeds', () => {
  const a = mulberry32(1);
  const b = mulberry32(2);
  let diffs = 0;
  for (let i = 0; i < 10; i++) if (a() !== b()) diffs++;
  assert.ok(diffs >= 8, 'expected different seeds to diverge');
});

test('normalizeSeed hashes strings consistently', () => {
  assert.equal(normalizeSeed('seed1'), normalizeSeed('seed1'));
  assert.notEqual(normalizeSeed('seed1'), normalizeSeed('seed2'));
});

// ---------- filtering ----------

test('filterBank returns all questions when no filter provided', () => {
  const bank = makeBank();
  const out = filterBank(bank);
  assert.equal(out.length, bank.questions.length);
});

test('filterBank applies domain intersection', () => {
  const bank = makeBank();
  const out = filterBank(bank, { domains: ['domain-4-mcp'] });
  assert.equal(out.length, 6);
  for (const q of out) assert.equal(q.domain, 'domain-4-mcp');
});

test('filterBank applies scenario intersection', () => {
  const bank = makeBank();
  const out = filterBank(bank, { scenarios: ['3'] });
  assert.equal(out.length, 14); // 10 d1 + 4 d5 in scenario 3
  for (const q of out) assert.equal(q.scenario, '3');
});

test('filterBank applies domain AND scenario intersection', () => {
  const bank = makeBank();
  const out = filterBank(bank, { domains: ['domain-5-context'], scenarios: ['3'] });
  assert.equal(out.length, 4);
  for (const q of out) {
    assert.equal(q.domain, 'domain-5-context');
    assert.equal(q.scenario, '3');
  }
});

test('filterBank returns empty for impossible intersection', () => {
  const bank = makeBank();
  // domain-4-mcp never appears in scenario 3 in the fixture
  const out = filterBank(bank, { domains: ['domain-4-mcp'], scenarios: ['3'] });
  assert.equal(out.length, 0);
});

// ---------- counts for the live-filter UI ----------

test('countByAxis with no filter returns full totals', () => {
  const bank = makeBank();
  const c = countByAxis(bank);
  assert.equal(c.byDomain['domain-1-agentic'], 20);
  assert.equal(c.byDomain['domain-4-mcp'], 6);
  assert.equal(c.byScenario['4'], 6);
});

test('countByAxis reflects scenario filter on domain counts', () => {
  const bank = makeBank();
  // If user selects scenario 3, domains show counts within scenario 3.
  const c = countByAxis(bank, { scenarios: ['3'] });
  assert.equal(c.byDomain['domain-1-agentic'], 10);
  assert.equal(c.byDomain['domain-5-context'], 4);
  assert.equal(c.byDomain['domain-4-mcp'] ?? 0, 0); // d4 not in scenario 3
});

test('countByAxis reflects domain filter on scenario counts', () => {
  const bank = makeBank();
  const c = countByAxis(bank, { domains: ['domain-4-mcp'] });
  assert.equal(c.byScenario['4'], 6);
  assert.equal(c.byScenario['1'] ?? 0, 0); // d4 not in scenarios 1/3/6 in fixture
});

// ---------- drill session ----------

test('buildDrillSession is deterministic given a seed', () => {
  const bank = makeBank();
  const a = buildDrillSession(bank, { size: 5, seed: 42 });
  const b = buildDrillSession(bank, { size: 5, seed: 42 });
  assert.deepEqual(a.map(q => q.id), b.map(q => q.id));
});

test('buildDrillSession respects filters', () => {
  const bank = makeBank();
  const out = buildDrillSession(bank, { domains: ['domain-4-mcp'], size: 20, seed: 1 });
  assert.equal(out.length, 6);
  for (const q of out) assert.equal(q.domain, 'domain-4-mcp');
});

test('buildDrillSession caps at pool size if size > pool', () => {
  const bank = makeBank();
  const out = buildDrillSession(bank, { domains: ['domain-4-mcp'], size: 100, seed: 1 });
  assert.equal(out.length, 6);
});

test('buildDrillSession returns empty for impossible intersection', () => {
  const bank = makeBank();
  const out = buildDrillSession(bank, { domains: ['domain-4-mcp'], scenarios: ['3'], size: 10 });
  assert.equal(out.length, 0);
});

// ---------- mock exam ----------

test('buildMockExam is deterministic given a seed', () => {
  const bank = makeBank();
  const a = buildMockExam(bank, { seed: 42, size: 20, scenarioCount: 3 });
  const b = buildMockExam(bank, { seed: 42, size: 20, scenarioCount: 3 });
  assert.deepEqual(a.map(q => q.id), b.map(q => q.id));
});

test('buildMockExam drift: same seed + different bank → different output', () => {
  const smallBank = makeBank();
  const biggerBank = makeBank();
  // Extend bank with new questions.
  for (let i = 0; i < 5; i++) biggerBank.questions.push({ id: `new${i}`, domain: 'domain-1-agentic', scenario: '1' });
  const a = buildMockExam(smallBank, { seed: 42, size: 20, scenarioCount: 3 });
  const b = buildMockExam(biggerBank, { seed: 42, size: 20, scenarioCount: 3 });
  // Shouldn't be identical — documented drift behavior.
  assert.notDeepEqual(a.map(q => q.id), b.map(q => q.id));
});

test('buildMockExam returns requested size (or all available)', () => {
  const bank = makeBank();
  const out = buildMockExam(bank, { seed: 1, size: 12, scenarioCount: 2 });
  assert.ok(out.length > 0);
  assert.ok(out.length <= 12);
});

test('buildMockExam only draws from picked scenarios', () => {
  const bank = makeBank();
  const out = buildMockExam(bank, { seed: 1, size: 100, scenarioCount: 2 });
  const usedScenarios = new Set(out.map(q => q.scenario));
  assert.ok(usedScenarios.size <= 2, `expected at most 2 scenarios, got ${usedScenarios.size}`);
});

test('buildMockExam distributes roughly by domain weight when pool allows', () => {
  // Build a richer bank where no domain is short.
  const questions = [];
  let n = 1;
  const domains = ['d1', 'd2', 'd3'];
  for (const d of domains) {
    // 100 per domain so 0.6 weight on a 100-Q exam (wants 60) doesn't hit a supply cap.
    for (let i = 0; i < 100; i++) questions.push({ id: `${d}-${n++}`, domain: d, scenario: 'S' });
  }
  const bank = {
    domains: { d1: { weight: 0.6 }, d2: { weight: 0.3 }, d3: { weight: 0.1 } },
    scenarios: { S: { name: 'All', domains } },
    questions,
  };
  const out = buildMockExam(bank, { seed: 123, size: 100, scenarioCount: 1 });
  const counts = { d1: 0, d2: 0, d3: 0 };
  for (const q of out) counts[q.domain]++;
  // Weight 0.6/0.3/0.1 on 100 = ~60/30/10. Allow ±3 for rounding.
  assert.ok(Math.abs(counts.d1 - 60) <= 3, `d1 count off: ${counts.d1}`);
  assert.ok(Math.abs(counts.d2 - 30) <= 3, `d2 count off: ${counts.d2}`);
  assert.ok(Math.abs(counts.d3 - 10) <= 3, `d3 count off: ${counts.d3}`);
});
