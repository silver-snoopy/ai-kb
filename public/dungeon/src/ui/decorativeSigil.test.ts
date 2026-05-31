import type Phaser from 'phaser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SIGIL_GLYPH, mountDecorativeSigil } from './decorativeSigil';

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
