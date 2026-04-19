import { describe, it, expect } from 'vitest';
import { NARRATOR_LINES } from './lines';

describe('narrator lines pool', () => {
  it('has exactly 40 lines', () => {
    expect(NARRATOR_LINES).toHaveLength(40);
  });

  it('every line is ≤ 90 characters', () => {
    const over = NARRATOR_LINES.filter(l => l.text.length > 90);
    expect(over).toEqual([]);
  });

  it('each of 5 bosses has exactly 5 boss-specific lines', () => {
    const bosses = ['orchestrator', 'compiler-king', 'grammarian', 'tool-smith', 'memory-kraken'] as const;
    for (const b of bosses) {
      const count = NARRATOR_LINES.filter(l => l.bossId === b).length;
      expect({ boss: b, count }).toEqual({ boss: b, count: 5 });
    }
  });

  it('every boss-specific line covers the 5 expected triggers exactly once', () => {
    const bosses = ['orchestrator', 'compiler-king', 'grammarian', 'tool-smith', 'memory-kraken'] as const;
    const expectedTriggers = ['battle-start', 'phase-66', 'phase-33', 'phase-10', 'boss-defeated'] as const;
    for (const b of bosses) {
      const triggers = NARRATOR_LINES.filter(l => l.bossId === b).map(l => l.trigger).sort();
      expect(triggers).toEqual([...expectedTriggers].sort());
    }
  });

  it('has generic pool for spell-cast (≥4), hero-defeated (≥3), filler (≥8)', () => {
    const generic = NARRATOR_LINES.filter(l => l.bossId === undefined);
    expect(generic.filter(l => l.trigger === 'spell-cast').length).toBeGreaterThanOrEqual(4);
    expect(generic.filter(l => l.trigger === 'hero-defeated').length).toBeGreaterThanOrEqual(3);
    expect(generic.filter(l => l.trigger === 'filler').length).toBeGreaterThanOrEqual(8);
  });
});
