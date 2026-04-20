// Atmospheric procedural BGM — one ambient bed per boss. Two layers:
//   1. A sustained drone on the root (sine wave, slow LFO breathing) so the
//      track feels continuous — the pad that fills silence.
//   2. A slow melodic walk (~1s-1.6s per note) with triangle/sawtooth wave,
//      soft attack + long decay so each note reads as a "bell" rather than
//      a rhythmic pulse.
//
// Shipped at master gain 0.035 so it sits far under SFX + voice. The player
// can toggle-off via a separate mute control (Step 3) — this module just
// exposes start/stop.

type PhaserSoundManager = { context?: AudioContext };

interface BossTrack {
  root: number;      // Hz of note 0 of the scale
  seq: number[];     // semitone offsets from root for the slow walk
  tempoMs: number;   // interval between melodic notes
  wave: OscillatorType;
  droneWave: OscillatorType;
  droneGain: number; // sustained level of the pad layer
}

// Each track designed to be heard-but-ignorable during question-reading.
// Tempos are 3-4x slower than the original arcade arpeggios.
const TRACKS: Record<string, BossTrack> = {
  'the-orchestrator': {
    // A2 minor walk — a slow processional beneath a court-hall drone.
    root: 110,
    seq: [0, 3, 7, 10, 7, 3],
    tempoMs: 1400,
    wave: 'triangle',
    droneWave: 'sine',
    droneGain: 0.012,
  },
  'the-compiler-king': {
    // C3 pentatonic — distant forge-bells.
    root: 130.81,
    seq: [0, 5, 7, 12, 7, 5],
    tempoMs: 1200,
    wave: 'triangle',
    droneWave: 'sine',
    droneGain: 0.010,
  },
  'the-grammarian': {
    // D3 Dorian drift — candlelit library, barely-there motion.
    root: 146.83,
    seq: [0, 2, 5, 7, 5, 2],
    tempoMs: 1600,
    wave: 'triangle',
    droneWave: 'sine',
    droneGain: 0.012,
  },
  'the-tool-smith': {
    // G2 blues — slow hammery rings, not a rhythm.
    root: 98,
    seq: [0, 5, 3, 5, 7, 5],
    tempoMs: 1300,
    wave: 'triangle',
    droneWave: 'sine',
    droneGain: 0.012,
  },
  'the-memory-kraken': {
    // F2 chromatic — submerged, buzzy. Keep the sawtooth for the texture.
    root: 87.31,
    seq: [0, 1, 3, 1, 5, 3],
    tempoMs: 1800,
    wave: 'sawtooth',
    droneWave: 'sine',
    droneGain: 0.014,
  },
};

const MASTER_GAIN = 0.035;

export class ProceduralBGM {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneLFO: OscillatorNode | null = null;
  private droneLFOGain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;

  start(bossId: string, sound: PhaserSoundManager): void {
    this.stop();
    const ctx = sound.context;
    if (!ctx) return;
    const track = TRACKS[bossId];
    if (!track) return;

    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = MASTER_GAIN;
    this.masterGain.connect(ctx.destination);
    this.step = 0;

    // --- Drone layer ---
    // Sustained root note; gain is modulated by a slow LFO so the pad feels
    // like it's breathing (0.08 Hz = ~7.5s per cycle).
    this.droneOsc = ctx.createOscillator();
    this.droneOsc.type = track.droneWave;
    this.droneOsc.frequency.value = track.root / 2; // octave down for depth
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = track.droneGain;
    this.droneLFO = ctx.createOscillator();
    this.droneLFO.type = 'sine';
    this.droneLFO.frequency.value = 0.08;
    this.droneLFOGain = ctx.createGain();
    this.droneLFOGain.gain.value = track.droneGain * 0.4; // LFO modulation depth
    this.droneLFO.connect(this.droneLFOGain).connect(this.droneGain.gain);
    this.droneOsc.connect(this.droneGain).connect(this.masterGain);
    this.droneOsc.start();
    this.droneLFO.start();

    // --- Melodic walk ---
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
      // Soft attack (80ms), long decay (90% of step duration) so the note
      // feels like a bell rather than a rhythmic pulse.
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.5, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (track.tempoMs / 1000) * 0.9);
      osc.connect(g).connect(mg);
      osc.start(now);
      osc.stop(now + (track.tempoMs / 1000));
      this.step = (this.step + 1) % track.seq.length;
    };

    this.timer = setInterval(playNote, track.tempoMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const cx = this.ctx;
    const mg = this.masterGain;
    // Fade master to 0, then disconnect everything, to avoid clicks.
    if (cx && mg) {
      mg.gain.cancelScheduledValues(cx.currentTime);
      mg.gain.linearRampToValueAtTime(0, cx.currentTime + 0.15);
    }
    const toStop: Array<OscillatorNode | null> = [this.droneOsc, this.droneLFO];
    const stopAt = cx ? cx.currentTime + 0.2 : 0;
    for (const o of toStop) {
      if (o) {
        try { o.stop(stopAt); } catch { /* already stopped */ }
      }
    }
    setTimeout(() => {
      mg?.disconnect();
      this.droneGain?.disconnect();
      this.droneLFOGain?.disconnect();
    }, 250);
    this.droneOsc = null;
    this.droneLFO = null;
    this.droneGain = null;
    this.droneLFOGain = null;
    this.masterGain = null;
    this.ctx = null;
  }
}
