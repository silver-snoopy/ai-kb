import type { CombatState, Question } from '../types';

export interface CombatInit {
  heroMaxHp: number;
  bossMaxHp: number;
}

export interface ResolutionResult {
  wasCorrect: boolean;
  damageDealt: number;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export function initCombat(init: CombatInit): CombatState {
  return {
    heroHp: init.heroMaxHp,
    heroMaxHp: init.heroMaxHp,
    bossHp: init.bossMaxHp,
    bossMaxHp: init.bossMaxHp,
    currentQuestion: null,
    questionHistory: [],
    pendingDamageMultiplier: 1,
    pendingPrimer: null,
    pendingRetake: false,
  };
}

export function resolveAnswer(
  state: CombatState,
  selected: 'A' | 'B' | 'C' | 'D',
): ResolutionResult {
  const q = state.currentQuestion;
  if (!q) throw new Error('No current question to resolve');

  const wasCorrect = selected === q.correct;
  let damageDealt = 0;

  if (wasCorrect) {
    damageDealt = state.pendingDamageMultiplier;
    state.bossHp = Math.max(0, state.bossHp - damageDealt);
  } else {
    // INVARIANT R6: wrong answer always costs exactly 1 HP. No modifiers.
    state.heroHp = Math.max(0, state.heroHp - 1);
  }

  // Multiplier consumed on any submission (correct or wrong)
  state.pendingDamageMultiplier = 1;

  // Primer and retake are one-shot too (consumed when question fires)
  state.pendingPrimer = null;
  state.pendingRetake = false;

  // Move question to history
  state.questionHistory.push(q);
  state.currentQuestion = null;

  return {
    wasCorrect,
    damageDealt,
    correctAnswer: q.correct,
    explanation: q.explanation,
  };
}

export function isBossDefeated(state: CombatState): boolean {
  return state.bossHp <= 0;
}

export function isHeroDead(state: CombatState): boolean {
  return state.heroHp <= 0;
}
