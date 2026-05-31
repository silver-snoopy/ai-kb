import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOSSES, DEMO_BOSS_ORDER, DEMO_SEED } from '../config';
import { pickQuestionsForFight, questionsForDomain } from '../data/questionLoader';
import { campaignFromSave, demoRngForFloor } from '../game/dungeon';
import { readActiveRun, writeActiveRun } from '../game/runSave';
import type { Bank } from '../types';

// Golden answer-key guard for the scripted ?demo run. This pins the exact
// per-boss correct-letter sequence the live talk relies on, derived from the
// REAL bank via the same code path BossFightScene uses
// (demoRngForFloor(seed, floor) → pickQuestionsForFight). If a bank edit shifts
// the picks, this FAILS — that is the intended tripwire: regenerate both this
// golden and the cheat sheet
// (public/talks/2026-06-03-slay-the-cert/prep/demo-cheat-sheet.md) together.
//
// The expected values below MUST match that cheat sheet and the DEMO_SEED
// rationale comment in config.ts.

const bank = JSON.parse(readFileSync('public/data/bank.json', 'utf-8')) as Bank;
const FIRST_RUN_MAX_QUESTIONS = 7; // first-run boss HP (5) + hero max HP (3) - 1

const EXPECTED_KEYS: Record<string, string> = {
  'the-tool-smith': 'B C A C C B A',
  'the-orchestrator': 'A B B B A C D',
  'the-compiler-king': 'C B B B B B B',
  'the-grammarian': 'A B D B C C B',
  'the-memory-kraken': 'C C C B C B D',
};

function keyForFloor(bossId: string, floor: number): string {
  const boss = BOSSES.find((b) => b.id === bossId);
  if (!boss) throw new Error(`unknown boss ${bossId}`);
  const pool = questionsForDomain(bank, boss.domain);
  const picks = pickQuestionsForFight(
    pool,
    FIRST_RUN_MAX_QUESTIONS,
    demoRngForFloor(DEMO_SEED, floor),
  );
  return picks.map((q) => q.correct).join(' ');
}

describe('scripted demo answer key', () => {
  it('DEMO_BOSS_ORDER is a permutation of all bosses, Tool-Smith first', () => {
    expect(DEMO_BOSS_ORDER[0]).toBe('the-tool-smith');
    expect([...DEMO_BOSS_ORDER].sort()).toEqual(BOSSES.map((b) => b.id).sort());
  });

  it('produces the committed golden key per boss (matches the cheat sheet)', () => {
    DEMO_BOSS_ORDER.forEach((bossId, floor) => {
      expect(`${bossId}: ${keyForFloor(bossId, floor)}`).toBe(
        `${bossId}: ${EXPECTED_KEYS[bossId]}`,
      );
    });
  });

  // Regression: a between-boss demo save resumed from the Hub re-picks the next
  // fight's questions from campaignFromSave(save).seed. If the seed does not
  // survive the save round-trip, demoRngForFloor(undefined, floor) collapses to
  // a constant seed and floors > 0 silently diverge from the cheat sheet. Floor 1
  // is the first floor that would catch this (floor 0's seed coincides with the
  // collapsed value), so it is the meaningful guard.
  it('a resumed between-boss demo re-picks the SAME key on floor 1 (seed survives the save)', () => {
    const RESUME_FLOOR = 1; // literal index → narrow boss id, not string | undefined
    localStorage.clear();
    writeActiveRun({
      version: 1,
      journeyMode: 'demo',
      campaign: {
        bossOrder: [...DEMO_BOSS_ORDER],
        floorsCleared: RESUME_FLOOR,
        mode: 'first-run',
        seed: DEMO_SEED,
      },
      spellbook: { echo: 1, 'study-the-tome': 1, memorize: 1, amplify: 1, doubleshot: 1 },
      heroHpCarryover: 3,
      inBoss: null,
    });
    const resumed = campaignFromSave(readActiveRun()!);
    const bossId = DEMO_BOSS_ORDER[RESUME_FLOOR];
    const boss = BOSSES.find((b) => b.id === bossId)!;
    const picks = pickQuestionsForFight(
      questionsForDomain(bank, boss.domain),
      FIRST_RUN_MAX_QUESTIONS,
      demoRngForFloor(resumed.seed, resumed.floorsCleared),
    );
    expect(`${bossId}: ${picks.map((q) => q.correct).join(' ')}`).toBe(
      `${bossId}: ${EXPECTED_KEYS[bossId]}`,
    );
  });
});
