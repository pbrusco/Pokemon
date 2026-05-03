// ---------------------------------------------------------------------------
// AudioController — singleton that manages all game music playback.
// Wraps HTMLAudioElement with cross-fading, looping, and jingle support.
// ---------------------------------------------------------------------------

export type MusicTrack =
  | 'title'
  | 'intro_route_24'
  | 'pallet_town'
  | 'professor_oak'
  | 'guide'
  | 'oak_lab'
  | 'caught'
  | 'blue'
  | 'battle_trainer'
  | 'victory_trainer'
  | 'route_1'
  | 'battle_wild'
  | 'item'
  | 'pokecenter'
  | 'healed'
  | 'trainer_boy'
  | 'pokedex_eval'
  | 'viridian_forest'
  | 'level_up'
  | 'trainer_girl'
  | 'pewter_city'
  | 'gym'
  | 'battle_gym_leader'
  | 'victory_gym'
  | 'route_3'
  | 'jigglypuff'
  | 'mt_moon'
  | 'trainer_badguy'
  | 'jessie_james'
  | 'evolution'
  | 'evolved'
  | 'cerulean'
  | 'vermilion'
  | 'ss_anne'
  | 'route_to_lavender'
  | 'lavender'
  | 'pokemon_tower'
  | 'celadon'
  | 'game_corner'
  | 'rocket_hideout'
  | 'key_item'
  | 'poke_flute'
  | 'bicycle'
  | 'silph_co'
  | 'surf'
  | 'cinnabar'
  | 'mansion'
  | 'victory_road'
  | 'final_battle'
  | 'hall_of_fame'
  | 'congrats'
  | 'ending'
  | 'were_back'
  | 'master_trainer'
  | 'victory_wild';

const MUSIC_FILES: Record<MusicTrack, string> = {
  title:             '01 Title Screen.ogg',
  intro_route_24:    '02 Intro Route 24.ogg',
  pallet_town:       '03 Pallet Town.ogg',
  professor_oak:     '04 Professor Oak.ogg',
  guide:             '05 Guide.ogg',
  oak_lab:           '06 Oak Lab.ogg',
  caught:            '07 Caught.ogg',
  blue:              '08 Blue.ogg',
  battle_trainer:    '09 Battle Trainer.ogg',
  victory_trainer:   '10 Victory Trainer.ogg',
  route_1:           '11 Route 1.ogg',
  battle_wild:       '12 Battle Wild.ogg',
  item:              '13 Item.ogg',
  pokecenter:        '14 Pokecenter.ogg',
  healed:            '15 Healed.ogg',
  trainer_boy:       '16 Trainer Boy.ogg',
  pokedex_eval:      '17 Pokedex Eval.ogg',
  viridian_forest:   '18 Viridian Forest.ogg',
  level_up:          '19 Level Up.ogg',
  trainer_girl:      '20 Trainer Girl.ogg',
  pewter_city:       '21 Pewter City.ogg',
  gym:               '22 Gym.ogg',
  battle_gym_leader: '23 Gym Leader.ogg',
  victory_gym:       '24 Victory Gym.ogg',
  route_3:           '25 Route 3.ogg',
  jigglypuff:        '26 Jigglypuff.ogg',
  mt_moon:           '27 Mt Moon.ogg',
  trainer_badguy:    '28 Trainer Badguy.ogg',
  jessie_james:      '29 Jessie James.ogg',
  evolution:         '30 Evolution.ogg',
  evolved:           '31 Evolved.ogg',
  cerulean:          '32 Cerulean.ogg',
  vermilion:         '33 Vermilion.ogg',
  ss_anne:           '34 SS Anne.ogg',
  route_to_lavender: '35 Route to Lavender.ogg',
  lavender:          '36 Lavender.ogg',
  pokemon_tower:     '37 Pokemon Tower.ogg',
  celadon:           '38 Celadon.ogg',
  game_corner:       '39 Game Corner.ogg',
  rocket_hideout:    '40 Rocket Hideout.ogg',
  key_item:          '41 Key Item.ogg',
  poke_flute:        '42 Poke Flute.ogg',
  bicycle:           '43 Bicycle.ogg',
  silph_co:          '44 Silph Co.ogg',
  surf:              '45 Surf.ogg',
  cinnabar:          '46 Cinnabar.ogg',
  mansion:           '47 Mansion.ogg',
  victory_road:      '48 Victory Road.ogg',
  final_battle:      '49 Final Battle.ogg',
  hall_of_fame:      '50 Hall of Fame.ogg',
  congrats:          '51 Congrats.ogg',
  ending:            '52 Ending.ogg',
  were_back:         '53 Were Back.ogg',
  master_trainer:    '54 Master Trainer.ogg',
  victory_wild:      '10 Victory Trainer.ogg', // reuse trainer victory
};

const BASE_PATH = import.meta.env.BASE_URL + 'music/';
const FADE_DURATION_MS = 300;
const FADE_STEP_MS = 32;

interface AudioControllerState {
  current: HTMLAudioElement | null;
  previous: HTMLAudioElement | null;
  currentTrack: MusicTrack | null;
  volume: number;
  muted: boolean;
  fading: boolean;
}

const state: AudioControllerState = {
  current: null,
  previous: null,
  currentTrack: null,
  volume: 0.5,
  muted: false,
  fading: false,
};

let fadeInterval: ReturnType<typeof setInterval> | null = null;

function resolvePath(track: MusicTrack): string {
  return BASE_PATH + MUSIC_FILES[track];
}

function createAudio(track: MusicTrack): HTMLAudioElement {
  const a = new Audio(resolvePath(track));
  a.volume = state.muted ? 0 : state.volume;
  return a;
}

function stopFade() {
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }
}

function applyVolume(a: HTMLAudioElement) {
  a.volume = state.muted ? 0 : state.volume;
}

export const AudioController = {
  isReady(): boolean {
    return true;
  },

  play(track: MusicTrack, opts?: { loop?: boolean; fadeIn?: boolean }) {
    if (state.currentTrack === track && state.current && !state.current.paused) {
      if (opts?.loop !== undefined) state.current.loop = opts.loop;
      return;
    }

    const next = createAudio(track);
    next.loop = opts?.loop ?? true;
    state.currentTrack = track;

    if (state.current && !state.current.paused) {
      const prev = state.current;
      state.previous = prev;
      state.current = next;
      state.fading = true;
      stopFade();

      const steps = Math.ceil(FADE_DURATION_MS / FADE_STEP_MS);
      const volStep = state.volume / steps;
      let step = 0;

      fadeInterval = setInterval(() => {
        step++;
        const fadeOutVol = Math.max(0, state.volume - volStep * step);
        const fadeInVol = Math.min(state.volume, volStep * step);

        prev.volume = state.muted ? 0 : fadeOutVol;
        next.volume = state.muted ? 0 : fadeInVol;

        if (step >= steps) {
          stopFade();
          prev.pause();
          prev.src = '';
          state.previous = null;
          state.fading = false;
          applyVolume(next);
        }
      }, FADE_STEP_MS);
    } else {
      state.current = next;
      applyVolume(next);
    }

    next.play().catch(() => {});
  },

  playJingle(jingle: MusicTrack, fallbackTrack?: MusicTrack) {
    if (state.current) {
      const resumeTrack = state.currentTrack ?? fallbackTrack;
      const wasLooping = state.current.loop;

      const prev = state.current;
      const jingleAudio = createAudio(jingle);
      jingleAudio.loop = false;
      state.current = jingleAudio;
      state.currentTrack = jingle;
      state.fading = true;
      stopFade();

      const steps = Math.ceil(FADE_DURATION_MS / FADE_STEP_MS);
      const volStep = state.volume / steps;
      let step = 0;

      fadeInterval = setInterval(() => {
        step++;
        const fadeOutVol = Math.max(0, state.volume - volStep * step);
        prev.volume = state.muted ? 0 : fadeOutVol;
        jingleAudio.volume = state.muted ? 0 : Math.min(state.volume, volStep * step);

        if (step >= steps) {
          stopFade();
          prev.pause();
          prev.src = '';
          state.previous = null;
          state.fading = false;
          applyVolume(jingleAudio);
        }
      }, FADE_STEP_MS);

      jingleAudio.play().catch(() => {});

      jingleAudio.addEventListener('ended', () => {
        if (resumeTrack && resumeTrack !== jingle) {
          AudioController.play(resumeTrack, { loop: wasLooping });
        } else if (fallbackTrack) {
          AudioController.play(fallbackTrack, { loop: true });
        }
      });
    } else {
      const a = createAudio(jingle);
      a.loop = false;
      state.current = a;
      state.currentTrack = jingle;
      applyVolume(a);
      a.play().catch(() => {});
      a.addEventListener('ended', () => {
        if (fallbackTrack) {
          AudioController.play(fallbackTrack, { loop: true });
        }
      });
    }
  },

  stop() {
    stopFade();
    if (state.current) {
      state.current.pause();
      state.current.src = '';
      state.current = null;
    }
    if (state.previous) {
      state.previous.pause();
      state.previous.src = '';
      state.previous = null;
    }
    state.currentTrack = null;
  },

  pause() {
    if (state.current) state.current.pause();
  },

  resume() {
    if (state.current) state.current.play().catch(() => {});
  },

  setVolume(v: number) {
    state.volume = Math.max(0, Math.min(1, v));
    if (state.current) applyVolume(state.current);
    if (state.previous) applyVolume(state.previous);
  },

  getVolume(): number {
    return state.volume;
  },

  setMuted(muted: boolean) {
    state.muted = muted;
    if (state.current) applyVolume(state.current);
    if (state.previous) applyVolume(state.previous);
  },

  isMuted(): boolean {
    return state.muted;
  },

  getCurrentTrack(): MusicTrack | null {
    return state.currentTrack;
  },
};
