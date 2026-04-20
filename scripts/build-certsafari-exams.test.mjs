// scripts/build-certsafari-exams.test.mjs
// Run: node --test scripts/build-certsafari-exams.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { buildExam, transformQuestion, domainQuota } = await import('./build-certsafari-exams.mjs');

const rawBank = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'raw', 'certsafari', 'cca-f-questions.json'), 'utf8')
);

test('transformQuestion maps CertSafari shape to exam shape', () => {
  const cs = rawBank.questions[0];
  const q = transformQuestion(cs);
  assert.equal(q.id.startsWith('certsafari-'), true);
  assert.ok(['domain-1-agentic','domain-2-claude-code','domain-3-prompt-engineering','domain-4-mcp','domain-5-context'].includes(q.domain));
  assert.equal(typeof q.stem, 'string');
  assert.equal(typeof q.options.A, 'string');
  assert.equal(typeof q.options.B, 'string');
  assert.equal(typeof q.options.C, 'string');
  assert.equal(typeof q.options.D, 'string');
  assert.match(q.correct, /^[A-D]$/);
  assert.equal(typeof q.explanation, 'string');
  assert.equal(q['source-note'].startsWith('raw/certsafari/'), true);
});

test('domainQuota returns target counts proportional to meta.yaml weights', () => {
  const q = domainQuota(60);
  assert.equal(q['domain-1-agentic'] + q['domain-2-claude-code'] + q['domain-3-prompt-engineering'] + q['domain-4-mcp'] + q['domain-5-context'], 60);
  assert.ok(q['domain-1-agentic'] >= 15 && q['domain-1-agentic'] <= 17);
  assert.ok(q['domain-5-context'] >= 8 && q['domain-5-context'] <= 10);
});

test('buildExam(42,60) produces 60 questions with domain balance', () => {
  const exam = buildExam(42, 60, rawBank);
  assert.equal(exam.total, 60);
  assert.equal(exam.questions.length, 60);
  const counts = {};
  for (const q of exam.questions) counts[q.domain] = (counts[q.domain] || 0) + 1;
  assert.equal(Object.keys(counts).length, 5);
});

test('buildExam is seed-deterministic', () => {
  const a = buildExam(42, 60, rawBank);
  const b = buildExam(42, 60, rawBank);
  assert.deepEqual(a.questions.map(q => q.id), b.questions.map(q => q.id));
});

test('buildExam metadata tags source correctly', () => {
  const exam = buildExam(7, 60, rawBank);
  assert.equal(exam.exam_metadata.source, 'certsafari-curated');
  assert.equal(exam.exam_metadata.verified_by, 'source-is-ground-truth');
  assert.equal(exam.exam_metadata.seed, 7);
});
