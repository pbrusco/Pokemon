// ---------------------------------------------------------------------------
// synthesized-sounds.ts - Fixed & Final Comfortable Edition
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;
let currentMusicOscillators: Array<{ osc: OscillatorNode; gain: GainNode }> = [];
let musicTimeout: ReturnType<typeof setTimeout> | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// ---------------------------------------------------------------------------
// Expanded Melodies
// ---------------------------------------------------------------------------

const MELODIES = {
  OVERWORLD: [
    // Passage A
    { f: 392, d: 0.2 }, { f: 329, d: 0.2 }, { f: 392, d: 0.2 }, { f: 523, d: 0.4 },
    { f: 440, d: 0.2 }, { f: 523, d: 0.2 }, { f: 392, d: 0.4 },
    { f: 349, d: 0.2 }, { f: 392, d: 0.2 }, { f: 440, d: 0.2 }, { f: 392, d: 0.2 },
    { f: 349, d: 0.2 }, { f: 329, d: 0.2 }, { f: 293, d: 0.4 },
    // Passage B
    { f: 440, d: 0.2 }, { f: 440, d: 0.2 }, { f: 523, d: 0.2 }, { f: 440, d: 0.2 },
    { f: 392, d: 0.2 }, { f: 392, d: 0.2 }, { f: 493, d: 0.2 }, { f: 392, d: 0.2 },
    { f: 349, d: 0.2 }, { f: 349, d: 0.2 }, { f: 440, d: 0.2 }, { f: 349, d: 0.2 },
    { f: 329, d: 0.2 }, { f: 392, d: 0.2 }, { f: 523, d: 0.6 },
  ],

  BATTLE: [
    // Intro
    { f: 466, d: 0.1 }, { f: 440, d: 0.1 }, { f: 415, d: 0.1 }, { f: 392, d: 0.1 },
    { f: 466, d: 0.1 }, { f: 440, d: 0.1 }, { f: 415, d: 0.1 }, { f: 392, d: 0.1 },
    // Main driving beat
    { f: 293, d: 0.15 }, { f: 293, d: 0.15 }, { f: 349, d: 0.15 }, { f: 293, d: 0.15 },
    { f: 311, d: 0.15 }, { f: 311, d: 0.15 }, { f: 370, d: 0.15 }, { f: 311, d: 0.15 },
    // Chromatic climb
    { f: 349, d: 0.1 }, { f: 370, d: 0.1 }, { f: 392, d: 0.1 }, { f: 415, d: 0.1 },
    { f: 440, d: 0.1 }, { f: 466, d: 0.1 }, { f: 493, d: 0.1 }, { f: 523, d: 0.1 },
  ],

  POKECENTER: [
    { f: 392, d: 0.5 }, { f: 329, d: 0.5 }, { f: 392, d: 0.5 }, { f: 523, d: 1.0 },
    { f: 440, d: 0.5 }, { f: 523, d: 0.5 }, { f: 392, d: 1.0 },
    { f: 659, d: 0.5 }, { f: 587, d: 0.5 }, { f: 523, d: 0.5 }, { f: 493, d: 0.5 },
    { f: 440, d: 0.5 }, { f: 493, d: 0.5 }, { f: 523, d: 1.0 },
  ]
};

// ---------------------------------------------------------------------------
// SoundManager Class
// ---------------------------------------------------------------------------

class SoundManager {
  private currentMusicKey: keyof typeof MELODIES | null = null;
  private isLooping = false;
  muted: boolean = localStorage.getItem('pokemon_sound_muted') !== 'false'; // muted by default

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('pokemon_sound_muted', this.muted ? 'true' : 'false');
    if (this.muted) this.stopMusic();
    return this.muted;
  }

  play(key: keyof typeof SFX) {
    if (this.muted) return;
    if (SFX[key]) {
      SFX[key]();
    }
  }

  playMove(moveSfxType: 'pulse' | 'noise' | 'glissando' = 'pulse') {
    if (this.muted) return;
    if (moveSfxType === 'noise') {
      playTone('sawtooth', [320, 180, 260], 0.14, 0.14);
      return;
    }
    if (moveSfxType === 'glissando') {
      playTone('triangle', [260, 440, 620], 0.18, 0.1);
      return;
    }
    playTone('square', [260, 380], 0.12, 0.12);
  }

  playMusic(key: keyof typeof MELODIES) {
    if (this.muted) return;
    if (this.currentMusicKey === key) return;
    this.stopMusic();
    this.currentMusicKey = key;
    this.isLooping = true;
    this.runMusicLoop(key);
  }

  private runMusicLoop(key: keyof typeof MELODIES) {
    if (!this.isLooping || this.currentMusicKey !== key) return;
    const melody = MELODIES[key];
    let totalTime = 0;

    melody.forEach((note) => {
      this.playNote(note.f, note.d, totalTime, key);
      totalTime += note.d;
    });

    musicTimeout = setTimeout(() => {
      this.runMusicLoop(key);
    }, totalTime * 1000);
  }

  private playNote(freq: number, duration: number, delay: number, type: string) {
    if (freq === 0) return;
    const ctx = getCtx();
    const t0 = ctx.currentTime + delay;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = (type === 'POKECENTER') ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(freq, t0);

    // Comfort Low-pass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t0);

    // Smooth envelope
    gain.gain.setValueAtTime(0, t0); 
    gain.gain.linearRampToValueAtTime(0.05, t0 + 0.02); 
    gain.gain.exponentialRampToValueAtTime(0.02, t0 + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(t0);
    osc.stop(t0 + duration);
    currentMusicOscillators.push({ osc, gain });
  }

  stopMusic() {
    this.isLooping = false;
    if (musicTimeout) clearTimeout(musicTimeout);
    currentMusicOscillators.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(0);
        osc.stop();
      } catch (e) {}
    });
    currentMusicOscillators = [];
    this.currentMusicKey = null;
  }
}

// ---------------------------------------------------------------------------
// Comfortable SFX
// ---------------------------------------------------------------------------

export const SFX = {
  SELECT: () => playTone('triangle', [600, 700], 0.1, 0.06),
  MOVE: () => playTone('sine', [200, 240], 0.06, 0.06),
  HIT: () => playTone('triangle', [150, 50], 0.15, 0.1),
  FAINT: () => playTone('square', [400, 100], 0.5, 0.05),
  LEVEL_UP: () => {
    [523, 659, 784, 1047].forEach((f, i) => playTone('sine', [f], 0.15, 0.05, i * 0.1));
  },
  BATTLE_START: () => playTone('triangle', [800, 200], 0.4, 0.08),
  TRAINER_SPOTTED: () => {
    playTone('square', [880, 880], 0.08, 0.05, 0);
    playTone('square', [1320, 1320], 0.15, 0.05, 0.08);
  }
};

/**
 * Utility for playing a single tone with comfort filtering
 */
export function playTone(type: OscillatorType, freqs: number[], duration: number, volume = 0.05, startDelay = 0) {
  try {
    const ctx = getCtx();
    const t0 = ctx.currentTime + startDelay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    const step = duration / Math.max(freqs.length - 1, 1);
    freqs.forEach((f, i) => {
      if (i === 0) osc.frequency.setValueAtTime(f, t0);
      else osc.frequency.linearRampToValueAtTime(f, t0 + i * step);
    });

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  } catch (e) {}
}

export const soundManager = new SoundManager();