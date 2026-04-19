import { describe, it, expect, vi } from 'vitest';
import Phaser from 'phaser';
import { SQUASH_SCALE_X, SQUASH_SCALE_Y, SQUASH_DURATION_MS, installSquashStretch } from './squashStretch';

describe('squashStretch', () => {
  it('exports expected scale constants', () => {
    expect(SQUASH_SCALE_X).toBe(1.15);
    expect(SQUASH_SCALE_Y).toBe(0.85);
    expect(SQUASH_DURATION_MS).toBe(80);
  });

  it('cancels any in-flight squash on same target before starting a new one', () => {
    // Spec §5.3: "If a squash-stretch tween is active on the target: cancel and restart. Do not stack."
    const emitter = new Phaser.Events.EventEmitter();
    const killCalls: any[] = [];
    const addCalls: any[] = [];
    const bossSprite = { scaleX: 1, scaleY: 1, setScale: vi.fn() } as any;
    const heroSprite = { scaleX: 1, scaleY: 1, setScale: vi.fn() } as any;
    const fakeScene = {
      events: emitter,
      tweens: {
        killTweensOf: (t: any) => { killCalls.push(t); },
        add: (cfg: any) => { addCalls.push(cfg); return cfg; },
      },
    } as unknown as Phaser.Scene;

    installSquashStretch(fakeScene, { heroSprite, bossSprite });
    emitter.emit('answer-correct', { damage: 1, bossHpPct: 0.9, bossMaxHp: 10 });
    emitter.emit('answer-correct', { damage: 1, bossHpPct: 0.8, bossMaxHp: 10 });

    // killTweensOf must be called on bossSprite both times to prevent stacking
    expect(killCalls.filter(t => t === bossSprite)).toHaveLength(2);
    // And scene.tweens.add is called twice
    expect(addCalls).toHaveLength(2);
  });

  it('applies to boss on correct, hero on wrong', () => {
    const emitter = new Phaser.Events.EventEmitter();
    const killCalls: any[] = [];
    const bossSprite = { scaleX: 1, scaleY: 1, setScale: vi.fn() } as any;
    const heroSprite = { scaleX: 1, scaleY: 1, setScale: vi.fn() } as any;
    const fakeScene = {
      events: emitter,
      tweens: {
        killTweensOf: (t: any) => { killCalls.push(t); },
        add: () => ({}),
      },
    } as unknown as Phaser.Scene;

    installSquashStretch(fakeScene, { heroSprite, bossSprite });
    emitter.emit('answer-correct', { damage: 1, bossHpPct: 0.9, bossMaxHp: 10 });
    emitter.emit('answer-wrong', { heroHpRemaining: 2 });

    expect(killCalls[0]).toBe(bossSprite);
    expect(killCalls[1]).toBe(heroSprite);
  });
});
