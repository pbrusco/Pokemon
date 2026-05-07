// ---------------------------------------------------------------------------
// SfxController — singleton that manages all game sound effects.
// Uses Web Audio API for synthesized retro sounds + optional .ogg sample
// playback from public/sfx/.
// ---------------------------------------------------------------------------

type SoundId =
  | 'menu_open'
  | 'menu_close'
  | 'menu_select'
  | 'menu_back'
  | 'dialog_advance'
  | 'bump'
  | 'trainer_spotted'
  | 'battle_start'
  | 'item_get'
  | 'heal'
  | 'warp'
  | 'pokeball_throw'
  | 'pokeball_shake'
  | 'pokeball_catch'
  | 'level_up'
  | 'hm_use'
  | 'hit'
  | 'crit'
  | 'miss'
  | 'faint';

const SFX_FILES: Partial<Record<SoundId, string>> = {
  trainer_spotted: 'trainer_spotted.ogg',
  battle_start: 'battle_start.ogg',
};

let _ctx: AudioContext | null = null;
let _volume = 0.5;
let _muted = false;
let _audioCtxAvailable: boolean | null = null;
const sampleCache = new Map<string, AudioBuffer>();

function audioCtxAvailable(): boolean {
  if (_audioCtxAvailable !== null) return _audioCtxAvailable;
  if (typeof AudioContext === 'undefined' && typeof (globalThis as { webkitAudioContext?: unknown }).webkitAudioContext === 'undefined') {
    _audioCtxAvailable = false;
    return false;
  }
  _audioCtxAvailable = true;
  return true;
}

function ctx(): AudioContext | null {
  if (!audioCtxAvailable()) return null;
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function gain(): GainNode | null {
  const c = ctx();
  if (!c) return null;
  const g = c.createGain();
  g.gain.value = _muted ? 0 : _volume;
  g.connect(c.destination);
  return g;
}

function ensureCtxResumed() {
  const c = ctx();
  if (c && c.state === 'suspended') c.resume();
}

async function loadSample(path: string): Promise<AudioBuffer | null> {
  const cached = sampleCache.get(path);
  if (cached) return cached;
  const c = ctx();
  if (!c) return null;
  const resp = await fetch(import.meta.env.BASE_URL + 'sfx/' + path);
  const buf = await c.decodeAudioData(await resp.arrayBuffer());
  sampleCache.set(path, buf);
  return buf;
}

async function tryLoadAndPlay(soundId: SoundId): Promise<void> {
  const file = SFX_FILES[soundId];
  if (!file) return;
  try {
    ensureCtxResumed();
    const buf = await loadSample(file);
    if (!buf) return;
    const c = ctx();
    if (!c) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = gain();
    if (!g) return;
    src.connect(g);
    src.start(0);
  } catch {
    // Sample not available — silently skip
  }
}

// ── Synthesized sound generators ────────────────────────────────────────────

function playTone(freq: number, dur: number, type: OscillatorType = 'square', ramp?: { from: number; to: number }) {
  const c = ctx();
  if (!c) return;
  ensureCtxResumed();
  const osc = c.createOscillator();
  const g = gain();
  if (!g) return;
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  const now = c.currentTime;
  if (ramp) {
    osc.frequency.setValueAtTime(ramp.from, now);
    osc.frequency.linearRampToValueAtTime(ramp.to, now + dur);
  }
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.start(now);
  osc.stop(now + dur);
}

function playNoise(dur: number, band: 'low' | 'mid' | 'high' = 'mid') {
  const c = ctx();
  if (!c) return;
  ensureCtxResumed();
  const now = c.currentTime;
  const bufSize = c.sampleRate * dur;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  let filter: BiquadFilterNode | null = null;
  if (band === 'low') {
    filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
  } else if (band === 'high') {
    filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
  }

  const g = gain();
  if (!g) return;
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);

  if (filter) {
    src.connect(filter);
    filter.connect(g);
  } else {
    src.connect(g);
  }
  src.start(now);
  src.stop(now + dur);
}

function playSweep(from: number, to: number, dur: number) {
  playTone(from, dur, 'square', { from, to });
}

// ── Sound definitions ──────────────────────────────────────────────────────

const SYNTH_SOUNDS: Record<SoundId, () => void> = {
  menu_open: () => {
    playTone(800, 0.06, 'square');
    setTimeout(() => playTone(1000, 0.08, 'square'), 40);
  },
  menu_close: () => {
    playTone(1000, 0.06, 'square');
    setTimeout(() => playTone(800, 0.08, 'square'), 40);
  },
  menu_select: () => playTone(880, 0.08, 'square'),
  menu_back: () => playTone(440, 0.08, 'square'),
  dialog_advance: () => playTone(1200, 0.04, 'square'),
  bump: () => {
    playNoise(0.06, 'low');
    playTone(150, 0.06, 'square');
  },
  trainer_spotted: () => {
    playSweep(600, 1200, 0.12);
    setTimeout(() => playSweep(800, 1600, 0.10), 80);
  },
  battle_start: () => {
    playSweep(200, 600, 0.3);
    playNoise(0.2, 'low');
  },
  item_get: () => {
    playTone(660, 0.08, 'square');
    setTimeout(() => playTone(880, 0.08, 'square'), 60);
    setTimeout(() => playTone(1100, 0.12, 'square'), 120);
  },
  heal: () => {
    playTone(523, 0.12, 'sine');
    setTimeout(() => playTone(659, 0.12, 'sine'), 100);
    setTimeout(() => playTone(784, 0.12, 'sine'), 200);
    setTimeout(() => playTone(1047, 0.20, 'sine'), 300);
  },
  warp: () => {
    playSweep(400, 1200, 0.25);
    playNoise(0.15, 'mid');
  },
  pokeball_throw: () => {
    playSweep(200, 400, 0.15);
    playNoise(0.1, 'low');
  },
  pokeball_shake: () => {
    playTone(200, 0.10, 'triangle');
    setTimeout(() => playTone(220, 0.10, 'triangle'), 140);
  },
  pokeball_catch: () => {
    playTone(880, 0.10, 'square');
    setTimeout(() => playTone(1100, 0.10, 'square'), 80);
    setTimeout(() => playTone(1320, 0.15, 'square'), 160);
  },
  level_up: () => {
    playTone(523, 0.08, 'square');
    setTimeout(() => playTone(659, 0.08, 'square'), 80);
    setTimeout(() => playTone(784, 0.08, 'square'), 160);
    setTimeout(() => playTone(1047, 0.15, 'square'), 240);
  },
  hm_use: () => {
    playSweep(200, 800, 0.3);
    playNoise(0.15, 'mid');
  },
  hit: () => {
    playNoise(0.08, 'mid');
    playTone(300, 0.06, 'sawtooth');
  },
  crit: () => {
    playSweep(800, 1600, 0.10);
    playNoise(0.06, 'high');
    setTimeout(() => playSweep(1200, 2000, 0.08), 50);
  },
  miss: () => {
    playSweep(600, 200, 0.12);
  },
  faint: () => {
    playSweep(400, 100, 0.3);
    playNoise(0.15, 'low');
  },
};

// ── Public API ─────────────────────────────────────────────────────────────

export const SfxController = {
  play(soundId: SoundId | string) {
    tryLoadAndPlay(soundId as SoundId);
    const synth = SYNTH_SOUNDS[soundId as SoundId];
    if (synth) synth();
  },

  setVolume(v: number) {
    _volume = Math.max(0, Math.min(1, v));
  },

  getVolume(): number {
    return _volume;
  },

  setMuted(muted: boolean) {
    _muted = muted;
  },

  isMuted(): boolean {
    return _muted;
  },
};
