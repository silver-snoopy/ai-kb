import type { NarratorLine, Trigger, BossId } from './types';

const LAST_N = 3;
const EMERGENCY_LINE = 'The chamber holds its breath.';

export class LinePool {
  private readonly lines: readonly NarratorLine[];
  private recent: Map<Trigger, string[]> = new Map();

  constructor(lines: readonly NarratorLine[]) {
    this.lines = lines;
  }

  pick(trigger: Trigger, bossId?: BossId): string {
    // 1. Try boss-specific for this trigger.
    let candidates = this.lines.filter(l => l.trigger === trigger && l.bossId === bossId);
    // 2. Fall back to generic if no boss-specific.
    if (candidates.length === 0 && bossId !== undefined) {
      candidates = this.lines.filter(l => l.trigger === trigger && l.bossId === undefined);
    }
    // 3. Fall back to filler if pool for trigger empty.
    if (candidates.length === 0) {
      candidates = this.lines.filter(l => l.trigger === 'filler' && l.bossId === undefined);
    }
    // 4. Emergency hardcoded if still nothing.
    if (candidates.length === 0) {
      return EMERGENCY_LINE;
    }
    // 5. Apply last-N exclusion.
    const recentForTrigger = this.recent.get(trigger) ?? [];
    let eligible = candidates.filter(l => !recentForTrigger.includes(l.text));
    if (eligible.length === 0) {
      // Reset window and retry.
      this.recent.set(trigger, []);
      eligible = candidates;
    }
    // 6. Pick uniformly at random from eligible.
    const picked = eligible[Math.floor(Math.random() * eligible.length)]!;
    // 7. Push into last-N buffer.
    const buf = [...recentForTrigger, picked.text];
    while (buf.length > LAST_N) buf.shift();
    this.recent.set(trigger, buf);
    return picked.text;
  }

  reset(): void {
    this.recent.clear();
  }
}
