// Question bank types (matches questions.json schema)
export interface Question {
  id: string;
  domain: string;
  difficulty: 'easy' | 'medium' | 'hard';
  stem: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  source_note: string;
}

export interface DomainData {
  id: string;
  name: string;
  weight: number;
  questions: Question[];
}

export interface QuestionsJson {
  generated_at: string;
  cert_id: string;
  cert_name: string;
  total_questions: number;
  domains: DomainData[];
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
export type SpellId = 'echo' | 'study-the-tome' | 'memorize' | 'amplify' | 'doubleshot' | 'focus';

export interface SpellEffect {
  type: 'retake' | 'primer' | 'weakness-queue' | 'damage-mult';
  multiplier?: number; // for damage-mult
}

export interface Spell {
  id: SpellId;
  name: string;
  description: string;
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
