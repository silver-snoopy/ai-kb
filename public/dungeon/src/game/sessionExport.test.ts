import { describe, it, expect } from 'vitest';
import { sessionFilename } from './sessionExport';
import type { SessionLog } from '../types';

function dummyLog(overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    schema_version: 1,
    cert_id: 'cca-f',
    mode: 'first-run',
    started_at: '2026-04-19T10:15:30.123Z',
    ended_at: '2026-04-19T10:45:00.000Z',
    result: 'victory',
    bosses_defeated: [],
    spells_cast: [],
    questions: [],
    total_correct: 0,
    total_wrong: 0,
    final_hero_hp: 3,
    ...overrides,
  };
}

describe('sessionExport.sessionFilename', () => {
  it('builds deterministic filename from SessionLog', () => {
    const name = sessionFilename(dummyLog());
    expect(name).toBe('slay-the-cert_cca-f_first-run_2026-04-19T10-15-30-123Z.json');
  });

  it('sanitizes timestamp but preserves .json extension', () => {
    const name = sessionFilename(dummyLog());
    expect(name.endsWith('.json')).toBe(true);
    const stem = name.replace(/\.json$/, '');
    expect(stem).not.toMatch(/[:.]/g);
  });

  it('varies with mode', () => {
    expect(sessionFilename(dummyLog({ mode: 'ng-plus' }))).toContain('_ng-plus_');
    expect(sessionFilename(dummyLog({ mode: 'ng-plus-plus-plus' }))).toContain('_ng-plus-plus-plus_');
  });
});
