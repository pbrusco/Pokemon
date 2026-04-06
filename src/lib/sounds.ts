// ---------------------------------------------------------------------------
// synthesized-sounds.ts - Deluxe 8-Bit Edition
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
// Music Sequences
// ---------------------------------------------------------------------------

const MELODIES = {
  OVERWORLD: [
    { f: 523, d: 0.2 }, { f: 392, d: 0.2 }, { f: 329, d: 0.2 }, { f: 261, d: 0.4 },
    { f: 293, d: 0.2 }, { f: 329, d: 0.2 }, { f: 349, d: 0.2 }, { f: 392, d: 0.4 },
    { f: 440, d: 0.2 }, { f: 493, d: 0.2 }, { f: 523, d: 0.2 }, { f: 392, d: 0.4 },
    { f: 349, d: 0.2 }, { f: 329, d: 0.2 }, { f: 293, d: 0.2 }, { f: 261, d: 0.6 },
    { f: 440, d: 0.2 }, { f: 440, d: 0.2 }, { f: 523, d: 0.2 }, { f: 440, d: 0.2 },
    { f: 392, d: 0.2 }, { f: 392, d: 0.2 }, { f: 493, d: 0.2 }, { f: 392, d: 0.2 },
    { f: 349, d: 0.2 }, { f: 349, d: 0.2 }, { f: 440, d: 0.2 }, { f: 349, d: 0.2 },
    { f: 329, d: 0.2 }, { f: 293, d: 0.2 }, { f: 329, d: 0.2 }, { f: 392, d: 0.4 },
  ],
  
  // High-intensity, fast-paced battle loop
  BATTLE: [
    // Intro Stinger
    { f: 440, d: 0.1 }, { f: 415, d: 0.1 }, { f: 392, d: 0.1 }, { f: 370, d: 0.1 },
    { f: 349, d: 0.1 }, { f: 330, d: 0.1 }, { f: 311, d: 0.1 }, { f: 293, d: 0.1 },
    // Main High-Energy Loop
    { f: 146, d: 0.15 }, { f: 146, d: 0.15 }, { f: 293, d: 0.15 }, { f: 146, d: 0.15 },
    { f: 164, d: 0.15 }, { f: 164, d: 0.15 }, { f: 329, d: 0.15 }, { f: 164, d: 0.15 },
    { f: 174, d: 0.15 }, { f: 174, d: 0.15 }, { f: 349, d: 0.15 }, { f: 174, d: 0.15 },
    { f: 164, d: 0.15 }, { f: 146, d: 0.15 }, { f: 130, d: 0.15 }, { f: 123, d: 0.15 },
  ],

  // Soothing, nursery-rhyme style healing center theme
  POKECENTER: [
    { f: 392, d: 0.4 }, { f: 329, d: 0.4 }, { f: 392, d: 0.4 }, { f: 523, d: 0.8 },
    { f: 440, d: 0.4 }, { f: 523, d: 0.4 }, { f: 392, d: 0.8 },
    { f: 349, d: 0.4 }, { f: 392, d: 0.4 }, { f: 440, d: 0.4 }, { f: 392, d: 0.4 },
    { f: 349, d: 0.4 }, { f: 329, d: 0.4 }, { f: 293, d: 0.8 },
  ]
};

const SFX = {
  MOVE: () => playTone('square', [220, 280], 0.06, 0.1),
  SELECT: () => {
    playTone('square', [440, 550], 0.08, 0.1);
    playTone('square', [660], 0.08, 0.08, 0.08);
  },
  BATTLE_START: () => {
    playTone('square', [330, 440, 550], 0.4, 0.2);
    playTone('sawtooth', [110, 220], 0.4, 0.1);
  },
  HIT: () => playTone('sawtooth', [300, 50], 0.15, 0.2),
  FAINT: () => playTone('square', [440, 330, 220, 110], 0.8, 0.2),
  LEVEL_UP: () => {
    [0, 0.1, 0.2, 0.3].forEach((delay, i) => {
      const notes = [523, 659, 784, 1047];
      playTone('square', [notes[i]], 0.2, 0.1, delay);
    });
  },
  TRAINER_SPOTTED: () => {
    playTone('square', [880], 0.1, 0.2, 0);
    playTone('square', [1320], 0.15, 0.15, 0.1);
  },
};

class SoundManager {
  private currentMusicKey: keyof typeof MELODIES | null = null;
  private isLooping = false;

  play(key: keyof typeof SFX) {
    SFX[key]?.();
  }

  playMove(moveSfxType: 'pulse' | 'noise' | 'glissando' = 'pulse') {
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

  private playNote(freq: number, duration: number, delay: number, type: keyof typeof MELODIES) {
    const ctx = getCtx();
    const t0 = ctx.currentTime + delay;
    
    // Battle music gets a harsher Square-heavy sound
    // PokéCenter gets a smoother Triangle-heavy sound
    const squareVol = type === 'BATTLE' ? 0.06 : 0.03;
    const triVol = type === 'POKECENTER' ? 0.08 : 0.05;

    this.createOscillator('square', freq, duration, squareVol, t0);
    this.createOscillator('triangle', freq, duration, triVol, t0);
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, vol: number, time: number) {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(vol, time);
    const release = type === 'triangle' ? duration * 0.95 : duration * 0.85;
    gain.gain.exponentialRampToValueAtTime(0.0001, time + release);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + duration);
    
    currentMusicOscillators.push({ osc, gain });
    
    setTimeout(() => {
      currentMusicOscillators = currentMusicOscillators.filter(item => item.osc !== osc);
    }, (time - ctx.currentTime + duration) * 1000);
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

export function playTone(type: OscillatorType, freqs: number[], duration: number, volume = 0.1, startDelay = 0) {
  try {
    const ctx = getCtx();
    const t0 = ctx.currentTime + startDelay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const step = duration / Math.max(freqs.length - 1, 1);
    freqs.forEach((f, i) => {
      if (i === 0) osc.frequency.setValueAtTime(f, t0);
      else osc.frequency.linearRampToValueAtTime(f, t0 + i * step);
    });

    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.start(t0);
    osc.stop(t0 + duration);
  } catch (e) {}
}

export const soundManager = new SoundManager();