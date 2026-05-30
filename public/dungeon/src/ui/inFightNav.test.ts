import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { mountMenuButton } from './inFightNav';

// Minimal chainable fakes — mountMenuButton only calls a small surface on the
// scene's add factory and on the returned game objects. We capture the `on`
// handlers so the test can fire a pointerdown and assert onExit ran. Mirrors
// the fake style in optionFeedback.test.ts.
function makeGameObjectFake() {
  const handlers: Record<string, () => void> = {};
  const obj = {
    handlers,
    setScale: () => obj,
    setDepth: () => obj,
    setOrigin: () => obj,
    setInteractive: () => obj,
    setTint: () => obj,
    clearTint: () => obj,
    setBackgroundColor: () => obj,
    setColor: () => obj,
    on(event: string, fn: () => void) {
      handlers[event] = fn;
      return obj;
    },
  };
  return obj;
}

function makeSceneFake() {
  const image = makeGameObjectFake();
  const text = makeGameObjectFake();
  return {
    image,
    text,
    add: {
      image: () => image,
      text: () => text,
    },
  };
}

describe('mountMenuButton', () => {
  it('invokes onExit when the door icon is clicked', () => {
    const scene = makeSceneFake();
    const onExit = vi.fn();
    mountMenuButton(scene as unknown as Phaser.Scene, onExit);
    scene.image.handlers.pointerdown?.();
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('invokes onExit when the Menu label is clicked', () => {
    const scene = makeSceneFake();
    const onExit = vi.fn();
    mountMenuButton(scene as unknown as Phaser.Scene, onExit);
    scene.text.handlers.pointerdown?.();
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
