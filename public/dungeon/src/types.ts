// Question bank types. Flat array with per-question domain + scenario tags
// (matches public/exams/cca-f/bank.json). Replaces the domain-nested
// QuestionsJson / DomainData pair from the pre-2026-04-20 seed-exam model.
export interface Question {
  id: string;
  source: 'certsafari' | 'llm';
  domain: string;
  scenario: '1' | '2' | '3' | '4' | '5' | '6';
  difficulty: 'easy' | 'medium' | 'hard';
  stem: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  source_note: string;
}

export interface DomainMeta {
  num: number;
  name: string;
  weight: number;
  color?: string;
}

export interface ScenarioMeta {
  name: string;
  domains: string[];
}

export interface Bank {
  cert_id: string;
  version: number;
  built_at: string;
  total: number;
  domains: Record<string, DomainMeta>;
  scenarios: Record<string, ScenarioMeta>;
  questions: Question[];
}

// Boss types
export interface BossDefinition {
  id: string;
  name: string;
  domain: string;
  theme: string;
  taunts: { correct: string[]; wrong: string[] };
  environmentColor: number; // hex for Phaser fillRect, etc.
}

// Spell types
export type SpellId = 'echo' | 'study-the-tome' | 'memorize' | 'amplify' | 'doubleshot';

export interface SpellEffect {
  type: 'retake' | 'primer' | 'weakness-queue' | 'damage-mult';
  multiplier?: number; // for damage-mult
}

export interface Spell {
  id: SpellId;
  name: string;
  description: string;
  tagline: string; // short combat-tooltip copy, ≤40 chars
  tier: 'common' | 'uncommon' | 'rare';
  effect: SpellEffect;
  unlockedIn: 'first-run' | 'ng-plus' | 'ng-plus-plus' | 'ng-plus-plus-plus';
}

// Run mode
export type RunMode = 'first-run' | 'ng-plus' | 'ng-plus-plus' | 'ng-plus-plus-plus';

// Combat state
export interface CombatState {
  heroHp: number;
  heroMaxHp: number;
  bossHp: number;
  bossMaxHp: number;
  currentQuestion: Question | null;
  questionHistory: Question[];
  pendingDamageMultiplier: number; // 1, 2, or 3
  pendingPrimer: string | null;
  pendingRetake: boolean;
}

// Session log (for JSON export)
export interface SessionLog {
  schema_version: 1;
  cert_id: string;
  mode: RunMode;
  started_at: string;
  ended_at: string | null;  // null while session is in-progress or quit without saving
  result: 'victory' | 'death' | 'quit' | null;  // null until session ends
  bosses_defeated: string[];
  spells_cast: SpellId[];
  questions: Array<{
    question_id: string;
    domain: string;
    was_correct: boolean;
    time_elapsed_ms: number;
    flagged_for_review: boolean;
  }>;
  total_correct: number;
  total_wrong: number;
  final_hero_hp: number;
}

// Post-boss review — one entry per wrong answer from a single boss fight.
// BossFightScene accumulates these during combat and hands them to
// InterstitialScene for the mistakes-review beat.
export interface MissedQuestion {
  questionId: string;
  stem: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correct: 'A' | 'B' | 'C' | 'D';
  chosen: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

// Save state (localStorage v1)
export interface SaveStateV1 {
  version: 1;
  cert_id: string;
  current_campaign: {
    mode: RunMode;
    boss_order: string[]; // boss ids, shuffled
    floors_cleared: number; // 0 = none; 5 = all
    spellbook_charges: Record<SpellId, number>; // remaining casts this run
    hero_hp: number;
    run_questions_asked: string[]; // question ids, for Echo uniqueness
  } | null;
  unlocked_spells: SpellId[];
  bosses_defeated_ever: string[];
  parchment_earned: boolean;
  eternal_dungeon_unlocked: boolean;
  title_earned: string | null;
}
