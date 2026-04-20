import type { Spell, SpellId } from '../types';
import { SPELLS } from '../config';

export interface TomeCardData {
  locked: boolean;
  name: string;       // spell name, or '???????' when locked
  subtitle: string;   // e.g. "uncommon · first-run" or "locked · ng-plus"
  body: string;       // spell description, or unlock hint when locked
}

const UNLOCK_COPY: Record<Spell['unlockedIn'], string> = {
  'first-run': 'Clear the dungeon for the first time to unveil this page.',
  'ng-plus': 'Clear NG+ to unveil this page.',
  'ng-plus-plus': 'Clear NG++ to unveil this page.',
  'ng-plus-plus-plus': 'Clear NG+++ to unveil this page.',
};

/**
 * Ordered list of spells as they should render in the Codex. Locked cards
 * show a silhouette + unlock hint; unlocked cards show full content.
 *
 * Order: unlock tier first (first-run → ng-plus → ng-plus-plus), then the
 * record-definition order inside each tier. Matches the spec.
 */
export const CODEX_SPELL_ORDER: readonly SpellId[] = [
  'echo',
  'study-the-tome',
  'memorize',
  'amplify',
  'doubleshot',
] as const;

export function getTomeCardData(
  spellId: SpellId,
  unlockedSpells: readonly SpellId[],
): TomeCardData {
  const spell = SPELLS[spellId];
  const isUnlocked = unlockedSpells.includes(spellId);
  if (isUnlocked) {
    return {
      locked: false,
      name: spell.name,
      subtitle: `${spell.tier} \u00B7 ${spell.unlockedIn}`,
      body: spell.description,
    };
  }
  return {
    locked: true,
    name: '???????',
    subtitle: `locked \u00B7 ${spell.unlockedIn}`,
    body: UNLOCK_COPY[spell.unlockedIn],
  };
}
