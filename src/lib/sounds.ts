import { Howl } from 'howler';

// ---------------------------------------------------------------------------
// Web Audio API – synthesized SFX (no external files needed)
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(
  type: OscillatorType,
  freqs: number[],         // frequency ramp: [start, …, end]
  duration: number,        // seconds
  volume = 0.25,
  startDelay = 0,
) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    const t0 = ctx.currentTime + startDelay;

    // Schedule frequency ramp
    const step = duration / Math.max(freqs.length - 1, 1);
    freqs.forEach((f, i) => {
      if (i === 0) osc.frequency.setValueAtTime(f, t0);
      else osc.frequency.linearRampToValueAtTime(f, t0 + i * step);
    });

    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.start(t0);
    osc.stop(t0 + duration);
  } catch {
    // Audio not available (e.g. SSR) — silently ignore
  }
}

const SFX: Record<string, () => void> = {
  MOVE: () => playTone('square', [220, 280], 0.06, 0.15),
  SELECT: () => {
    playTone('square', [440, 550], 0.08, 0.2);
    playTone('square', [660], 0.08, 0.15, 0.08);
  },
  BATTLE_START: () => {
    playTone('square', [330, 330, 440, 550], 0.4, 0.3);
    playTone('square', [550, 660, 880], 0.35, 0.2, 0.15);
  },
  HIT: () => playTone('sawtooth', [300, 100], 0.12, 0.3),
  FAINT: () => {
    playTone('square', [440, 330, 220, 110], 0.6, 0.25);
  },
  LEVEL_UP: () => {
    [0, 0.1, 0.2, 0.3, 0.4].forEach((delay, i) => {
      const notes = [523, 659, 784, 1047, 1319];
      playTone('square', [notes[i]], 0.15, 0.2, delay);
    });
  },
};

// ---------------------------------------------------------------------------
// Background music (looping, streamed from Pokémon Showdown public CDN)
// ---------------------------------------------------------------------------
const MUSIC = {
  OVERWORLD:  'https://play.pokemonshowdown.com/audio/bgm/overworld.mp3',
  BATTLE:     'https://play.pokemonshowdown.com/audio/bgm/battle.mp3',
  POKECENTER: 'https://play.pokemonshowdown.com/audio/bgm/pokecenter.mp3',
};

class SoundManager {
  private music: Record<string, Howl> = {};
  private currentMusicKey: string | null = null;

  constructor() {
    Object.entries(MUSIC).forEach(([key, url]) => {
      this.music[key] = new Howl({
        src: [url],
        volume: 0.3,
        loop: true,
        html5: true,
      });
    });
  }

  play(key: keyof typeof SFX) {
    SFX[key]?.();
  }

  // kept for API compatibility
  stop(_key: string) {}

  playMusic(key: keyof typeof MUSIC) {
    if (this.currentMusicKey === key) return;
    this.stopMusic();
    this.currentMusicKey = key;
    this.music[key]?.play();
  }

  stopMusic() {
    if (this.currentMusicKey) {
      this.music[this.currentMusicKey]?.stop();
      this.currentMusicKey = null;
    }
  }
}

export const soundManager = new SoundManager();
