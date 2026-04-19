import { describe, it, expect } from 'vitest';
import Phaser from 'phaser';
import { installHitStop } from './hitStop';
import { installShakeGrading } from './shakeGrading';

describe('Feel Pack does not mutate damage (R6)', () => {
  it('listeners receive damage unchanged from emit call', () => {
    // Minimal EventEmitter stand-in — we don't need a full Phaser.Scene.
    const emitter = new Phaser.Events.EventEmitter();
    const fakeScene = {
      events: emitter,
      tweens: { pauseAll: () => {}, resumeAll: () => {}, killTweensOf: () => {}, add: () => ({}) },
      time: { delayedCall: () => ({}) },
      cameras: { main: { shake: () => {} } },
    } as unknown as Phaser.Scene;

    installHitStop(fakeScene);
    installShakeGrading(fakeScene);

    const observed: Array<{ event: string; payload: any }> = [];
    emitter.on('answer-correct', (p: any) => observed.push({ event: 'answer-correct', payload: p }));
    emitter.on('answer-wrong', (p: any) => observed.push({ event: 'answer-wrong', payload: p }));

    // Fire a series of events with known damage values.
    emitter.emit('answer-correct', { damage: 1, bossHpPct: 0.9, bossMaxHp: 10 });
    emitter.emit('answer-correct', { damage: 3, bossHpPct: 0.6, bossMaxHp: 10 });
    emitter.emit('answer-wrong', { heroHpRemaining: 2 });

    // Observed damage values must exactly match what was emitted.
    const correctEvents = observed.filter(o => o.event === 'answer-correct');
    expect(correctEvents[0]!.payload.damage).toBe(1);
    expect(correctEvents[1]!.payload.damage).toBe(3);
    const wrongEvents = observed.filter(o => o.event === 'answer-wrong');
    expect(wrongEvents[0]!.payload.heroHpRemaining).toBe(2);
  });
});
