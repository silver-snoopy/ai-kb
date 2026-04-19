export type Trigger =
  | 'battle-start'
  | 'phase-66'
  | 'phase-33'
  | 'phase-10'
  | 'boss-defeated'
  | 'hero-defeated'
  | 'spell-cast'
  | 'filler';

export type BossId =
  | 'the-orchestrator'
  | 'the-compiler-king'
  | 'the-grammarian'
  | 'the-tool-smith'
  | 'the-memory-kraken';

export interface NarratorLine {
  readonly text: string;
  readonly trigger: Trigger;
  readonly bossId?: BossId;
}

export type Priority = number;

export const TRIGGER_PRIORITY: Record<Trigger, Priority> = {
  'boss-defeated': 7,
  'phase-10':     6,
  'phase-33':     5,
  'phase-66':     4,
  'hero-defeated': 3,
  'battle-start': 2,
  'spell-cast':   1,
  'filler':       0,
};
