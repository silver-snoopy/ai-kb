import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOSSES, DEMO_BOSS_ORDER, DEMO_SEED } from '../config';
import { pickQuestionsForFight, questionsForDomain } from '../data/questionLoader';
import { demoRngForFloor } from '../game/dungeon';
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
});
