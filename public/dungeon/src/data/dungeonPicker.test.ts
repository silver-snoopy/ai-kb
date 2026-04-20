import { describe, it, expect } from 'vitest';
import { toExamSrc, buildCardDescriptors } from './dungeonPicker';

describe('toExamSrc', () => {
  it('converts repo-relative path to dungeon-relative src', () => {
    expect(toExamSrc('public/exams/cca-f/verified/certsafari-seed42.json'))
      .toBe('../exams/cca-f/verified/certsafari-seed42.json');
  });

  it('leaves already-dungeon-relative paths alone', () => {
    expect(toExamSrc('../exams/foo.json')).toBe('../exams/foo.json');
  });

  it('throws on invalid input', () => {
    expect(() => toExamSrc('')).toThrow(/path/i);
    expect(() => toExamSrc(null as unknown as string)).toThrow(/path/i);
  });
});

describe('buildCardDescriptors', () => {
  it('merges registry entries with exam-file metadata', () => {
    const registry = {
      exams: [
        { path: 'public/exams/cca-f/verified/certsafari-seed42.json', seed: 42, source: 'certsafari-curated', total: 60 },
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
    };
    const cards = buildCardDescriptors(registry, examFiles);
    expect(cards).toHaveLength(1);
    expect(cards[0]!.src).toBe('../exams/cca-f/verified/certsafari-seed42.json');
    expect(cards[0]!.seed).toBe(42);
    expect(cards[0]!.source).toBe('certsafari-curated');
    expect(cards[0]!.total).toBe(60);
    expect(cards[0]!.composition).toBe('certsafari-mixed');
  });

  it('tolerates missing exam files (degraded card using registry fields only)', () => {
    const registry = {
      exams: [{ path: 'public/exams/cca-f/verified/x.json', seed: 7, source: 'certsafari-curated', total: 60 }],
    };
    const cards = buildCardDescriptors(registry, {});
    expect(cards).toHaveLength(1);
    expect(cards[0]!.seed).toBe(7);
    expect(cards[0]!.total).toBe(60);
    expect(cards[0]!.src).toBe('../exams/cca-f/verified/x.json');
  });

  it('surfaces difficulty summary for generator-shaped exams', () => {
    const registry = {
      exams: [{ path: 'public/exams/cca-f/verified/gen-1.json', seed: 1, source: 'generated', total: 60 }],
    };
    const examFiles = {
      '../exams/cca-f/verified/gen-1.json': {
        exam_metadata: {
          seed: 1,
          source: 'generated',
          difficulty_actual: { easy: 9, medium: 30, hard: 21 },
          scenarios_kept: ['a', 'b', 'c', 'd'],
          scenarios_dropped: ['e', 'f'],
          coverage_warnings: [],
        },
      },
    };
    const cards = buildCardDescriptors(registry, examFiles);
    expect(cards[0]!.difficulty).toBe('E9/M30/H21');
    expect(cards[0]!.scenarioSummary).toBe('4 of 6 scenarios');
  });

  it('surfaces coverage_warnings as an array on the card', () => {
    const registry = {
      exams: [{ path: 'public/exams/cca-f/verified/gen-2.json', seed: 2, source: 'generated', total: 60 }],
    };
    const examFiles = {
      '../exams/cca-f/verified/gen-2.json': {
        exam_metadata: {
          seed: 2,
          source: 'generated',
          coverage_warnings: ['Domain 2 has 0 questions'],
        },
      },
    };
    const cards = buildCardDescriptors(registry, examFiles);
    expect(cards[0]!.warnings).toEqual(['Domain 2 has 0 questions']);
  });

  it('returns empty array when registry has no exams', () => {
    expect(buildCardDescriptors({ exams: [] }, {})).toEqual([]);
    expect(buildCardDescriptors({} as { exams: [] }, {})).toEqual([]);
  });
});
