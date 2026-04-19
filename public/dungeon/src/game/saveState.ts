import type { RunMode, SaveStateV1, SpellId } from '../types';

export const STORAGE_KEY_PREFIX = 'slay-the-cert:';

function keyFor(certId: string): string {
  return STORAGE_KEY_PREFIX + certId;
}

export function initSaveState(certId: string): SaveStateV1 {
  return {
    version: 1,
    cert_id: certId,
    current_campaign: null,
    unlocked_spells: ['echo', 'study-the-tome', 'memorize'],
    bosses_defeated_ever: [],
    parchment_earned: false,
    eternal_dungeon_unlocked: false,
    title_earned: null,
  };
}

export function loadSaveState(certId: string): SaveStateV1 | null {
  try {
    const raw = localStorage.getItem(keyFor(certId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SaveStateV1>;
    if (parsed.version !== 1) return null;
    return parsed as SaveStateV1;
  } catch {
    return null;
  }
}

export function saveSaveState(state: SaveStateV1): void {
  localStorage.setItem(keyFor(state.cert_id), JSON.stringify(state));
}

export function deleteSaveState(certId: string): void {
  localStorage.removeItem(keyFor(certId));
}

const NEW_SPELLS_PER_MODE: Record<RunMode, SpellId | null> = {
  'first-run': 'amplify',        // unlocked for NG+
  'ng-plus': 'doubleshot',       // unlocked for NG++
  'ng-plus-plus': 'focus',       // unlocked for NG+++
  'ng-plus-plus-plus': null,     // terminal
};

export function recordCampaignVictory(state: SaveStateV1, mode: RunMode): SaveStateV1 {
  const next: SaveStateV1 = {
    ...state,
    current_campaign: null,
    unlocked_spells: [...state.unlocked_spells],
  };

  const newSpell = NEW_SPELLS_PER_MODE[mode];
  if (newSpell && !next.unlocked_spells.includes(newSpell)) {
    next.unlocked_spells.push(newSpell);
  }

  if (mode === 'first-run' && !next.parchment_earned) {
    next.parchment_earned = true;
    next.eternal_dungeon_unlocked = true;
    next.title_earned = 'Archmage';
  }

  return next;
}
