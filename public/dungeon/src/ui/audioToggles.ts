// Mountable audio-toggle controls for BGM + SFX. Two tiny buttons in the
// top-right of any scene, showing current mute state. Click to toggle.
// Persisted to localStorage and the Phaser scene registry so the state
// survives scene transitions.

import Phaser from 'phaser';

const BGM_STORAGE_KEY = 'stc:bgm-muted';
const SFX_STORAGE_KEY = 'stc:sfx-muted';

// Registry keys \u2014 other scenes read these (e.g. BossFightScene.create
// checks bgmMuted before starting its BGM).
export const REGISTRY_BGM_MUTED = 'bgmMuted';
export const REGISTRY_SFX_MUTED = 'sfxMuted';

export interface AudioPreferences {
  bgmMuted: boolean;
  sfxMuted: boolean;
}

/**
 * Read stored audio preferences. Defaults to both unmuted when absent or
 * when localStorage is unavailable (e.g. file:// or sandboxed iframes).
 */
export function loadAudioPreferences(): AudioPreferences {
  try {
    return {
      bgmMuted: localStorage.getItem(BGM_STORAGE_KEY) === 'true',
      sfxMuted: localStorage.getItem(SFX_STORAGE_KEY) === 'true',
    };
  } catch {
    return { bgmMuted: false, sfxMuted: false };
  }
}

function savePreference(key: string, muted: boolean): void {
  try {
    localStorage.setItem(key, String(muted));
  } catch {
    // localStorage unavailable \u2014 ignore, session-only state still works via registry
  }
}

interface MountOptions {
  onBgmToggle?: (muted: boolean) => void;
}

/**
 * Mount the two mute buttons in the scene. Call from create(). Returns the
 * button objects in case the caller needs to reposition or destroy them.
 *
 * The scene's `this.sound.mute` is kept in sync with the SFX mute so every
 * play() call through Phaser respects it. BGM is ProceduralBGM-driven and
 * is not managed through Phaser's sound manager, so callers with a BGM
 * instance must pass `onBgmToggle` to start/stop it as needed.
 */
export function mountAudioToggles(
  scene: Phaser.Scene,
  opts: MountOptions = {},
): { bgm: Phaser.GameObjects.Text; sfx: Phaser.GameObjects.Text } {
  // Seed registry from localStorage on first mount. Subsequent scenes read
  // from the registry only, so the state is consistent within a session.
  if (scene.registry.get(REGISTRY_BGM_MUTED) === undefined) {
    const prefs = loadAudioPreferences();
    scene.registry.set(REGISTRY_BGM_MUTED, prefs.bgmMuted);
    scene.registry.set(REGISTRY_SFX_MUTED, prefs.sfxMuted);
  }

  const bgmMuted = (): boolean => scene.registry.get(REGISTRY_BGM_MUTED) === true;
  const sfxMuted = (): boolean => scene.registry.get(REGISTRY_SFX_MUTED) === true;

  // Apply the current SFX mute to the scene's sound manager so any
  // subsequent play() calls respect it.
  scene.sound.mute = sfxMuted();

  const makeButton = (x: number, label: () => string): Phaser.GameObjects.Text => {
    const t = scene.add.text(x, 18, label(), {
      fontSize: '14px',
      color: '#c0c0d0',
      fontFamily: 'monospace',
      backgroundColor: '#1a1a2a',
      padding: { x: 8, y: 4 },
    });
    t.setOrigin(1, 0);
    t.setInteractive({ useHandCursor: true });
    t.setScrollFactor(0);
    t.setDepth(1000);
    return t;
  };

  const bgmLabel = (): string => bgmMuted() ? '\uD83D\uDD07 BGM' : '\uD83C\uDFB5 BGM';
  const sfxLabel = (): string => sfxMuted() ? '\uD83D\uDD07 SFX' : '\uD83D\uDD0A SFX';

  const bgm = makeButton(935, bgmLabel);
  const sfx = makeButton(855, sfxLabel);

  bgm.on('pointerdown', () => {
    const next = !bgmMuted();
    scene.registry.set(REGISTRY_BGM_MUTED, next);
    savePreference(BGM_STORAGE_KEY, next);
    bgm.setText(bgmLabel());
    opts.onBgmToggle?.(next);
  });

  sfx.on('pointerdown', () => {
    const next = !sfxMuted();
    scene.registry.set(REGISTRY_SFX_MUTED, next);
    savePreference(SFX_STORAGE_KEY, next);
    scene.sound.mute = next;
    sfx.setText(sfxLabel());
  });

  return { bgm, sfx };
}
