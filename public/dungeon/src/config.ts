// Game-wide constants. Source: spec §4.3, §5.2, §6.
import type { BossDefinition, Spell } from './types';

export const GAME_CONFIG = {
  HERO_MAX_HP: 3,
  BOSS_HP: {
    'first-run': 5,
    'ng-plus': 7,
    'ng-plus-plus': 10,
    'ng-plus-plus-plus': 10,
  },
  BASE_DAMAGE_PER_CORRECT: 1,
  HP_COST_PER_WRONG: 1, // INVARIANT R6: never modified
  SPELLBOOK_SIZE: 3, // loadout slots per run
  FOCUS_CONTEMPLATION_MS: 15_000,
} as const;

export const BOSSES: BossDefinition[] = [
  {
    id: 'the-orchestrator',
    name: 'The Orchestrator',
    domain: 'domain-1-agentic',
    theme: 'Throne hall with chess-piece attendants',
    taunts: {
      correct: [
        'You see the pattern. Good.',
        'The dispatch aligns. I grant you that.',
        'A legion stands corrected.',
      ],
      wrong: [
        'Disorder. As expected.',
        'Your coordination falters.',
        'The patterns escape you.',
      ],
    },
    environmentColor: 0x2d1b4e,
  },
  {
    id: 'the-compiler-king',
    name: 'The Compiler-King',
    domain: 'domain-2-claude-code',
    theme: 'Iron workshop; command sigils',
    taunts: {
      correct: ['Your config compiles.', 'The build succeeds.', 'Compilation: 0 errors.'],
      wrong: ['Syntax error.', 'Your config will fail.', 'Malformed workflow.'],
    },
    environmentColor: 0x4e2d1b,
  },
  {
    id: 'the-grammarian',
    name: 'The Grammarian',
    domain: 'domain-3-prompt-engineering',
    theme: 'Library of carved stone scrolls',
    taunts: {
      correct: ['Precise.', 'Your tags are sacred.', 'Structure holds.'],
      wrong: ['Imprecision.', 'Grammar fails you.', 'Your prompts are broken.'],
    },
    environmentColor: 0x1b4e2d,
  },
  {
    id: 'the-tool-smith',
    name: 'The Tool-Smith',
    domain: 'domain-4-mcp',
    theme: 'Forge surrounded by schemas-as-runes',
    taunts: {
      correct: ['The schema holds.', 'Well-forged.', 'Your tools cut true.'],
      wrong: ['Schema violation.', 'Malformed invocation.', 'Your tools shatter.'],
    },
    environmentColor: 0x4e4e1b,
  },
  {
    id: 'the-memory-kraken',
    name: 'The Memory-Kraken',
    domain: 'domain-5-context',
    theme: 'Flooded archive; sinking context-shelves',
    taunts: {
      correct: ['You remember.', 'The tide holds.', 'Context preserved.'],
      wrong: ['Forgotten.', 'The tide takes it.', 'Your context drowns.'],
    },
    environmentColor: 0x1b2d4e,
  },
];

export const SPELLS: Record<import('./types').SpellId, Spell> = {
  echo: {
    id: 'echo',
    name: 'Echo',
    description: 'Next question is a retake of a previous question from this fight.',
    tier: 'uncommon',
    effect: { type: 'retake' },
    unlockedIn: 'first-run',
  },
  'study-the-tome': {
    id: 'study-the-tome',
    name: 'Study the Tome',
    description: 'Before next question, reveal a 3-sentence primer from the source note. Context only, no answer.',
    tier: 'uncommon',
    effect: { type: 'primer' },
    unlockedIn: 'first-run',
  },
  memorize: {
    id: 'memorize',
    name: 'Memorize',
    description: 'No combat effect. Adds current question to the session log flagged for weakness-queue.',
    tier: 'rare',
    effect: { type: 'weakness-queue' },
    unlockedIn: 'first-run',
  },
  amplify: {
    id: 'amplify',
    name: 'Amplify',
    description: 'Next correct answer deals 2 damage.',
    tier: 'common',
    effect: { type: 'damage-mult', multiplier: 2 },
    unlockedIn: 'ng-plus',
  },
  doubleshot: {
    id: 'doubleshot',
    name: 'Doubleshot',
    description: 'Next correct answer deals 3 damage.',
    tier: 'rare',
    effect: { type: 'damage-mult', multiplier: 3 },
    unlockedIn: 'ng-plus-plus',
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    description: 'Next question gets a 15-second contemplation phase.',
    tier: 'uncommon',
    effect: { type: 'retake' /* handled separately via pendingFocus flag */ },
    unlockedIn: 'ng-plus-plus-plus',
  },
};
