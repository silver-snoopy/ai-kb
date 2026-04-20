import { describe, it, expect } from 'vitest';
import { formatSpellTooltip } from './spellTooltip';
import { SPELLS } from '../config';

describe('formatSpellTooltip', () => {
  it('joins name and tagline on two lines', () => {
    expect(formatSpellTooltip(SPELLS.echo)).toBe('Echo\nRetake a past question.');
  });

  it('uses the tagline field, not the full description', () => {
    const out = formatSpellTooltip(SPELLS['study-the-tome']);
    expect(out).toBe('Study the Tome\nRead a primer first.');
    // The longer description must NOT leak into the tooltip.
    expect(out).not.toContain('3-sentence primer');
  });

  it('every spell has a tagline short enough for the combat tooltip', () => {
    // Soft budget: ≤40 chars keeps the 180px-wide tooltip readable at 12px
    // monospace without wrapping onto a third line.
    for (const spell of Object.values(SPELLS)) {
      expect(spell.tagline.length, `${spell.id} tagline too long`).toBeLessThanOrEqual(40);
    }
  });
});
