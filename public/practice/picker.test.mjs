// public/practice/picker.test.mjs
// Run: node --test public/practice/picker.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCardData, toPracticeSrc } from './picker.js';

test('toPracticeSrc converts repo-relative path to practice-relative src', () => {
  assert.equal(
    toPracticeSrc('public/exams/cca-f/verified/certsafari-seed42.json'),
    '../exams/cca-f/verified/certsafari-seed42.json'
  );
});

test('toPracticeSrc leaves already-practice-relative paths alone', () => {
  assert.equal(
    toPracticeSrc('../exams/foo.json'),
    '../exams/foo.json'
  );
});

test('toPracticeSrc throws on unexpected shapes', () => {
  assert.throws(() => toPracticeSrc(''), /path/i);
  assert.throws(() => toPracticeSrc(null), /path/i);
});

test('buildCardData produces one entry per registry exam, merged with exam-file metadata', () => {
  const registry = {
    exams: [
      { path: 'public/exams/cca-f/verified/certsafari-seed42.json', seed: 42, source: 'certsafari-curated', total: 60 },
      { path: 'public/exams/cca-f/verified/gen-1000.json', seed: 1000, source: 'generated', total: 60 },
    ],
  };
  const examFiles = {
    '../exams/cca-f/verified/certsafari-seed42.json': {
      built_at: '2026-04-20T10:00:00Z',
      total: 60,
      exam_metadata: {
        seed: 42,
        source: 'certsafari-curated',
        composition: 'certsafari-mixed',
        coverage_warnings: [],
      },
    },
    '../exams/cca-f/verified/gen-1000.json': {
      built_at: '2026-04-20T11:00:00Z',
      total: 60,
      exam_metadata: {
        seed: 1000,
        source: 'generated',
        scenarios_kept: ['a', 'b', 'c', 'd'],
        scenarios_dropped: ['e', 'f'],
        difficulty_actual: { easy: 9, medium: 30, hard: 21 },
        coverage_warnings: [],
      },
    },
  };
  const cards = buildCardData(registry, examFiles);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].src, '../exams/cca-f/verified/certsafari-seed42.json');
  assert.equal(cards[0].seed, 42);
  assert.equal(cards[0].source, 'certsafari-curated');
  assert.equal(cards[0].total, 60);
  assert.equal(cards[0].composition, 'certsafari-mixed');
  assert.equal(cards[1].seed, 1000);
  assert.equal(cards[1].source, 'generated');
  assert.ok(cards[1].difficulty === 'E9/M30/H21' || cards[1].difficulty === 'E:9 M:30 H:21' || /^E.?9/.test(cards[1].difficulty));
});

test('buildCardData tolerates missing exam files (degraded card, still renderable)', () => {
  const registry = {
    exams: [
      { path: 'public/exams/cca-f/verified/certsafari-seed42.json', seed: 42, source: 'certsafari-curated', total: 60 },
    ],
  };
  const examFiles = {};
  const cards = buildCardData(registry, examFiles);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].seed, 42);
  assert.equal(cards[0].source, 'certsafari-curated');
  assert.equal(cards[0].src, '../exams/cca-f/verified/certsafari-seed42.json');
});

test('buildCardData surfaces coverage_warnings as a string array on the card', () => {
  const registry = {
    exams: [{ path: 'public/exams/cca-f/verified/gen-2000.json', seed: 2000, source: 'generated', total: 60 }],
  };
  const examFiles = {
    '../exams/cca-f/verified/gen-2000.json': {
      exam_metadata: {
        seed: 2000,
        source: 'generated',
        coverage_warnings: ['Domain 2 has 0 questions'],
      },
    },
  };
  const cards = buildCardData(registry, examFiles);
  assert.deepEqual(cards[0].warnings, ['Domain 2 has 0 questions']);
});
