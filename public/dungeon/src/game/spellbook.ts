import type { CombatState, RunMode, SpellId } from '../types';
import { SPELLS } from '../config';

export type Spellbook = Record<SpellId, number>;

export function createSpellbook(mode: RunMode): Spellbook {
  const book: Spellbook = {
    echo: 0,
    'study-the-tome': 0,
    memorize: 0,
    amplify: 0,
    doubleshot: 0,
    focus: 0,
  };
  const tierOrder: RunMode[] = ['first-run', 'ng-plus', 'ng-plus-plus', 'ng-plus-plus-plus'];
  const currentIdx = tierOrder.indexOf(mode);
  for (const spell of Object.values(SPELLS)) {
    const spellIdx = tierOrder.indexOf(spell.unlockedIn);
    if (spellIdx <= currentIdx) book[spell.id] = 1;
  }
  return book;
}

export function canCast(book: Spellbook, spell: SpellId): boolean {
  return (book[spell] ?? 0) > 0;
}

export function castSpell(spell: SpellId, book: Spellbook, state: CombatState): void {
  if (!canCast(book, spell)) throw new Error(`No charges remaining for ${spell}`);
  book[spell] -= 1;

  const def = SPELLS[spell];
  switch (def.effect.type) {
    case 'damage-mult':
      state.pendingDamageMultiplier = def.effect.multiplier ?? 1;
      break;
    case 'retake':
      state.pendingRetake = true;
      break;
    case 'primer':
      state.pendingPrimer = 'PRIMER_PENDING';
      break;
    case 'weakness-queue':
      break;
  }
}

export function grantBossDefeatReward(book: Spellbook, chosenSpell: SpellId): void {
  book[chosenSpell] = (book[chosenSpell] ?? 0) + 1;
}
