import type Phaser from 'phaser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

function makeFakeScene(demo: boolean) {
  const text = makeFakeText();
  const scene = {
    add: { text: vi.fn(() => text) },
    registry: { get: vi.fn((k: string) => (k === 'demoMode' ? demo : undefined)) },
  } as unknown as Phaser.Scene;
  return { scene, text };
}

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* jsdom always has localStorage */
  }
});

describe('mountDecorativeSigil', () => {
  it('renders the sigil glyph at the given position for all players', () => {
    const { scene, text } = makeFakeScene(false);
    mountDecorativeSigil(scene, 720, 50);
    expect(
      (scene as unknown as { add: { text: ReturnType<typeof vi.fn> } }).add.text,
    ).toHaveBeenCalledWith(720, 50, SIGIL_GLYPH, expect.anything());
    expect(text.setDepth).toHaveBeenCalledWith(1000);
  });

  it('is INERT when not in demo mode (no interactivity, no handler)', () => {
    const { scene, text } = makeFakeScene(false);
    mountDecorativeSigil(scene, 720, 50);
    expect(text.setInteractive).not.toHaveBeenCalled();
    expect(text.on).not.toHaveBeenCalled();
  });

  it('is ARMED in demo mode (interactive + pointerdown handler)', () => {
    const { scene, text } = makeFakeScene(true);
    mountDecorativeSigil(scene, 720, 50);
    expect(text.setInteractive).toHaveBeenCalledWith({ useHandCursor: false });
    expect(text.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
  });
});
