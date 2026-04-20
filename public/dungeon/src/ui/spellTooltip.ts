import type { Spell } from '../types';

/**
 * Two-line tooltip content shown above a spell button in BossFightScene:
 * line 1 = spell name, line 2 = tagline (≤40 chars).
 *
 * Extracted so the format is unit-testable without booting Phaser.
 */
export function formatSpellTooltip(spell: Spell): string {
  return `${spell.name}\n${spell.tagline}`;
}
