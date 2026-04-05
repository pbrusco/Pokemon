import { Howl } from 'howler';

const SOUNDS = {
  MOVE: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  SELECT: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  BATTLE_START: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  HIT: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
  FAINT: 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3',
  LEVEL_UP: 'https://assets.mixkit.co/active_storage/sfx/2575/2575-preview.mp3',
};

class SoundManager {
  private sounds: Record<string, Howl> = {};

  constructor() {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      this.sounds[key] = new Howl({
        src: [url],
        volume: 0.5,
      });
    });
  }

  play(key: keyof typeof SOUNDS) {
    if (this.sounds[key]) {
      this.sounds[key].play();
    }
  }

  stop(key: keyof typeof SOUNDS) {
    if (this.sounds[key]) {
      this.sounds[key].stop();
    }
  }
}

export const soundManager = new SoundManager();
