import type Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SIGIL_GLYPH, armStingerTriggerIfDemo, mountDecorativeSigil } from './decorativeSigil';

function makeFakeText() {
  const t = {} as Record<string, ReturnType<typeof vi.fn>>;
  for (const m of ['setScrollFactor', 'setDepth', 'setOrigin', 'setInteractive', 'on']) {
    // mockReturnValue (not an inline closure) keeps the mock's signature type
    // assignable to ReturnType<typeof vi.fn> under strict tsc.
    t[m] = vi.fn().mockReturnValue(t);
  }
  return t;
}

function makeFakeScene() {
  const text = makeFakeText();
  const scene = { add: { text: vi.fn(() => text) } } as unknown as Phaser.Scene;
  return { scene, text };
}

// The sigil arms on isScriptedDemo(), which reads window.location.search.
function setSearch(search: string) {
  window.history.replaceState({}, '', `/${search}`);
}

afterEach(() => setSearch(''));

describe('mountDecorativeSigil', () => {
  it('renders the sigil glyph at the given position for all players', () => {
    setSearch('');
    const { scene, text } = makeFakeScene();
    mountDecorativeSigil(scene, 720, 50);
    expect(
      (scene as unknown as { add: { text: ReturnType<typeof vi.fn> } }).add.text,
    ).toHaveBeenCalledWith(720, 50, SIGIL_GLYPH, expect.anything());
    expect(text.setDepth).toHaveBeenCalledWith(1000);
  });

  it('is INERT in normal mode (no ?demo): no interactivity, no handler', () => {
    setSearch('');
    const { scene, text } = makeFakeScene();
    mountDecorativeSigil(scene, 720, 50);
    expect(text.setInteractive).not.toHaveBeenCalled();
    expect(text.on).not.toHaveBeenCalled();
  });

  it('is ARMED in demo mode (?demo): interactive + pointerdown handler', () => {
    setSearch('?demo=1');
    const { scene, text } = makeFakeScene();
    mountDecorativeSigil(scene, 720, 50);
    expect(text.setInteractive).toHaveBeenCalledWith({ useHandCursor: false });
    expect(text.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });
});

describe('armStingerTriggerIfDemo', () => {
  function makeTarget() {
    const t = {} as Record<string, ReturnType<typeof vi.fn>>;
    t.setInteractive = vi.fn().mockReturnValue(t);
    t.on = vi.fn().mockReturnValue(t);
    return t;
  }

  it('leaves the target untouched in normal mode (no ?demo)', () => {
    setSearch('');
    const target = makeTarget();
    armStingerTriggerIfDemo({} as Phaser.Scene, target as unknown as Phaser.GameObjects.GameObject);
    expect(target.setInteractive).not.toHaveBeenCalled();
    expect(target.on).not.toHaveBeenCalled();
  });

  it('arms an interactive pointerdown launcher in demo mode (?demo)', () => {
    setSearch('?demo=1');
    const target = makeTarget();
    armStingerTriggerIfDemo({} as Phaser.Scene, target as unknown as Phaser.GameObjects.GameObject);
    expect(target.setInteractive).toHaveBeenCalledWith({ useHandCursor: false });
    expect(target.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });
});
