import Phaser from 'phaser';
import type { NarratorOverlay } from './NarratorOverlay';
import type { LinePool } from './linePool';
import type { BossId, Trigger } from './types';
import { TRIGGER_PRIORITY } from './types';

type EventBus = Phaser.Events.EventEmitter;

export class NarratorDispatcher {
  private bus: EventBus;
  private pool: LinePool;
  private overlay: NarratorOverlay;
  private handlers: Array<[string, (...args: any[]) => void]> = [];

  constructor(bus: EventBus, pool: LinePool, overlay: NarratorOverlay) {
    this.bus = bus;
    this.pool = pool;
    this.overlay = overlay;
    this.wire();
  }

  private wire(): void {
    this.on('battle-start', (p: { bossId: BossId }) => this.fire('battle-start', p.bossId));
    this.on('boss-phase-crossed', (p: { threshold: 66 | 33 | 10; bossId: BossId }) => {
      const trigger: Trigger = p.threshold === 10 ? 'phase-10' : p.threshold === 33 ? 'phase-33' : 'phase-66';
      this.fire(trigger, p.bossId);
    });
    this.on('boss-defeated', (p: { bossId: BossId }) => this.fire('boss-defeated', p.bossId));
    this.on('hero-defeated', (p: { bossId: BossId }) => this.fire('hero-defeated', p.bossId));
    this.on('spell-cast', (p: { bossId: BossId }) => this.fire('spell-cast', p.bossId));
  }

  private on(event: string, handler: (...args: any[]) => void): void {
    this.bus.on(event, handler);
    this.handlers.push([event, handler]);
  }

  private fire(trigger: Trigger, bossId?: BossId): void {
    const line = this.pool.pick(trigger, bossId);
    const priority = TRIGGER_PRIORITY[trigger];
    this.overlay.show(line, priority);
  }

  destroy(): void {
    for (const [event, handler] of this.handlers) {
      this.bus.off(event, handler);
    }
    this.handlers = [];
  }
}
