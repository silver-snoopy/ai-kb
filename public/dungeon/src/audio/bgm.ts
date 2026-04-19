// Procedural 8-bit-style BGM per boss, generated at runtime via the Web Audio
// oscillators that Phaser's sound system already owns. Five distinct ostinatos
// keyed to each boss's theme. No asset dependency — keeps the game at 0 MB of
// music files while still delivering per-boss musical identity.
//
// Playback is single-track square-wave arpeggio at low volume (0.04 gain) to
// sit well under the SFX. Start called once per boss fight; stop called on
// scene shutdown. Safe against missing AudioContext (no-op).

type PhaserSoundManager = { context?: AudioContext };

interface BossTrack {
  root: number;      // Hz of note 0 of the scale
  seq: number[];     // semitone offsets from root
  tempoMs: number;   // interval between notes
  wave: OscillatorType;
}

// Frequencies chosen to feel on-theme: lower roots = menacing; higher = airy.
const TRACKS: Record<string, BossTrack> = {
  'the-orchestrator': {
    // A2-based, minor 6-note walk. Marching, inevitable.
    root: 110,
    seq: [0, 3, 7, 10, 7, 3],
    tempoMs: 320,
    wave: 'square',
  },
  'the-compiler-king': {
    // C3-based pentatonic; sounds like a forge-beat.
    root: 130.81,
    seq: [0, 5, 7, 12, 7, 5],
    tempoMs: 280,
    wave: 'square',
  },
  'the-grammarian': {
    // D3 Dorian drift; spectral, reading-by-candle feel.
    root: 146.83,
    seq: [0, 2, 5, 7, 5, 2],
    tempoMs: 360,
    wave: 'triangle',
  },
  'the-tool-smith': {
    // G2 blues-ish riff, hammery.
    root: 98,
    seq: [0, 5, 3, 5, 7, 5],
    tempoMs: 300,
    wave: 'square',
  },
  'the-memory-kraken': {
    // F2 chromatic drone, submerged.
    root: 87.31,
    seq: [0, 1, 3, 1, 5, 3],
    tempoMs: 400,
    wave: 'sawtooth',
  },
};

export class ProceduralBGM {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;

  /**
   * Start looping the BGM for a boss. Pass in Phaser's sound manager so we
   * borrow its AudioContext — avoids creating a second context that would
   * need its own user-gesture unlock.
   */
  start(bossId: string, sound: PhaserSoundManager): void {
    this.stop();
    const ctx = sound.context;
    if (!ctx) return;
    const track = TRACKS[bossId];
    if (!track) return;

    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.04;
    this.masterGain.connect(ctx.destination);
    this.step = 0;

    const playNote = (): void => {
      const cx = this.ctx;
      const mg = this.masterGain;
      if (!cx || !mg) return;
      const note = track.seq[this.step] ?? 0;
      const freq = track.root * Math.pow(2, note / 12);
      const osc = cx.createOscillator();
      const g = cx.createGain();
      osc.type = track.wave;
      osc.frequency.value = freq;
      const now = cx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(1.0, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + track.tempoMs / 1000 * 0.9);
      osc.connect(g).connect(mg);
      osc.start(now);
      osc.stop(now + track.tempoMs / 1000);
      this.step = (this.step + 1) % track.seq.length;
    };

    this.timer = setInterval(playNote, track.tempoMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.masterGain && this.ctx) {
      // Fade out master gain to avoid clicks
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
      const g = this.masterGain;
      setTimeout(() => g.disconnect(), 150);
    }
    this.masterGain = null;
    this.ctx = null;
  }
}
