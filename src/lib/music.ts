// ---------------------------------------------------------------------------
// AudioController — singleton that manages all game music playback.
// Wraps HTMLAudioElement with cross-fading, looping, and jingle support.
// ---------------------------------------------------------------------------

import { getKantoRegion } from '../constants/world';
import { worldConfig } from '../data/worldConfig';
import type { MapID } from '../types';
import type { GamePhase } from '../types';

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

const audioCache = new Map<MusicTrack, HTMLAudioElement>();

function getAudioElement(track: MusicTrack): HTMLAudioElement {
  let a = audioCache.get(track);
  if (!a) {
    a = new Audio(resolvePath(track));
    a.preload = 'auto';
    audioCache.set(track, a);
  }
  return a;
}

function createAudio(track: MusicTrack): HTMLAudioElement {
  const a = getAudioElement(track);
  a.currentTime = 0;
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
          prev.currentTime = 0;
          prev.onended = null;
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
      
      if (prev === jingleAudio) {
        jingleAudio.currentTime = 0;
        jingleAudio.play().catch(() => {});
        return;
      }

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
          prev.currentTime = 0;
          prev.onended = null;
          state.previous = null;
          state.fading = false;
          applyVolume(jingleAudio);
        }
      }, FADE_STEP_MS);

      jingleAudio.play().catch(() => {});

      jingleAudio.onended = () => {
        jingleAudio.onended = null;
        if (resumeTrack && resumeTrack !== jingle) {
          AudioController.play(resumeTrack, { loop: wasLooping });
        } else if (fallbackTrack) {
          AudioController.play(fallbackTrack, { loop: true });
        }
      };
    } else {
      const a = createAudio(jingle);
      a.loop = false;
      state.current = a;
      state.currentTrack = jingle;
      applyVolume(a);
      a.play().catch(() => {});
      a.onended = () => {
        a.onended = null;
        if (fallbackTrack) {
          AudioController.play(fallbackTrack, { loop: true });
        }
      };
    }
  },

  stop() {
    stopFade();
    if (state.current) {
      state.current.pause();
      state.current.currentTime = 0;
      state.current.onended = null;
      state.current = null;
    }
    if (state.previous) {
      state.previous.pause();
      state.previous.currentTime = 0;
      state.previous.onended = null;
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

// Start preloading audio files in the background after a short delay
// to ensure instant playback when requested, without blocking initial page load.
if (typeof window !== 'undefined') {
  setTimeout(() => {
    for (const track of Object.keys(MUSIC_FILES) as MusicTrack[]) {
      getAudioElement(track);
    }
  }, 1000);
}

// ─── Music selection ─────────────────────────────────────────────────────────

const FIRERED_MUS_TO_TRACK: Record<string, MusicTrack> = {
  MUS_PALLET: 'pallet_town',
  MUS_SLOW_PALLET: 'pallet_town',
  MUS_OAK_LAB: 'oak_lab',
  MUS_POKE_CENTER: 'pokecenter',
  MUS_GYM: 'gym',
  MUS_PEWTER: 'pewter_city',
  MUS_CELADON: 'celadon',
  MUS_LAVENDER: 'lavender',
  MUS_FUCHSIA: 'route_1',
  MUS_CINNABAR: 'cinnabar',
  MUS_VERMILLION: 'vermilion',
  MUS_MT_MOON: 'mt_moon',
  MUS_VIRIDIAN_FOREST: 'viridian_forest',
  MUS_VICTORY_ROAD: 'victory_road',
  MUS_POKE_TOWER: 'pokemon_tower',
  MUS_POKE_MANSION: 'mansion',
  MUS_ROCKET_HIDEOUT: 'rocket_hideout',
  MUS_SILPH: 'silph_co',
  MUS_SS_ANNE: 'ss_anne',
  MUS_GAME_CORNER: 'game_corner',
  MUS_ROUTE1: 'route_1',
  MUS_ROUTE3: 'route_3',
  MUS_ROUTE11: 'route_to_lavender',
  MUS_ROUTE24: 'intro_route_24',
};

function fireredMusicForMap(map: MapID): MusicTrack | null {
  const m = worldConfig.maps[map];
  const layout = (m as { fireredLayout?: { meta?: { music?: string } } } | undefined)?.fireredLayout;
  const mus = layout?.meta?.music;
  return mus ? (FIRERED_MUS_TO_TRACK[mus] ?? null) : null;
}

const INTERIOR_MUSIC: Record<string, MusicTrack> = {
  PLAYERS_HOUSE_1F: 'pallet_town',
  PLAYERS_HOUSE_2F: 'pallet_town',
  RIVALS_HOUSE: 'pallet_town',
  OAKS_LAB: 'oak_lab',
  MT_MOON: 'mt_moon',
  MT_MOON_B1F: 'mt_moon',
  MT_MOON_B2F: 'mt_moon',
  PEWTER_GYM: 'gym',
  CERULEAN_GYM: 'gym',
  VERMILION_GYM: 'gym',
  ROCK_TUNNEL_1F: 'mt_moon',
  ROCK_TUNNEL_B1F: 'mt_moon',
  POKEMON_TOWER_1F: 'pokemon_tower',
  POKEMON_TOWER_2F: 'pokemon_tower',
  POKEMON_TOWER_3F: 'pokemon_tower',
  POKEMON_TOWER_4F: 'pokemon_tower',
  POKEMON_TOWER_5F: 'pokemon_tower',
  POKEMON_TOWER_6F: 'pokemon_tower',
  POKEMON_TOWER_7F: 'pokemon_tower',
  BILLS_HOUSE: 'cerulean',
  CELADON_GYM: 'gym',
  FUCHSIA_GYM: 'gym',
  SAFFRON_GYM: 'gym',
  CINNABAR_GYM: 'gym',
  VIRIDIAN_GYM: 'gym',
  SEAFOAM_ISLANDS_1F: 'mt_moon',
  SEAFOAM_ISLANDS_B1F: 'mt_moon',
  SEAFOAM_ISLANDS_B2F: 'mt_moon',
  SEAFOAM_ISLANDS_B3F: 'mt_moon',
  SEAFOAM_ISLANDS_B4F: 'mt_moon',
  VICTORY_ROAD_1F: 'victory_road',
  VICTORY_ROAD_2F: 'victory_road',
  VICTORY_ROAD_3F: 'victory_road',
  CERULEAN_CAVE_1F: 'mt_moon',
  CERULEAN_CAVE_2F: 'mt_moon',
  CERULEAN_CAVE_B_1F: 'mt_moon',
  DIGLETTS_CAVE: 'mt_moon',
  POWER_PLANT: 'mt_moon',
  POKEMON_MANSION_1F: 'mansion',
  POKEMON_MANSION_2F: 'mansion',
  POKEMON_MANSION_3F: 'mansion',
  POKEMON_MANSION_B1F: 'mansion',
  SAFARI_ZONE_CENTER: 'viridian_forest',
  SILPH_CO_1F: 'silph_co',
  SILPH_CO_2F: 'silph_co',
  SILPH_CO_3F: 'silph_co',
  SILPH_CO_4F: 'silph_co',
  SILPH_CO_5F: 'silph_co',
  SILPH_CO_6F: 'silph_co',
  SILPH_CO_7F: 'silph_co',
  SILPH_CO_8F: 'silph_co',
  SILPH_CO_9F: 'silph_co',
  SILPH_CO_10F: 'silph_co',
  SILPH_CO_11F: 'silph_co',
  ROCKET_HIDEOUT_B1F: 'rocket_hideout',
  ROCKET_HIDEOUT_B2F: 'rocket_hideout',
  ROCKET_HIDEOUT_B3F: 'rocket_hideout',
  ROCKET_HIDEOUT_B4F: 'rocket_hideout',
  SS_ANNE_1F: 'ss_anne',
  SS_ANNE_2F: 'ss_anne',
  SS_ANNE_3F: 'ss_anne',
  INDIGO_PLATEAU_LOBBY: 'route_1',
  ELITE_FOUR_LORELEI: 'victory_road',
  ELITE_FOUR_BRUNO: 'victory_road',
  ELITE_FOUR_AGATHA: 'victory_road',
  ELITE_FOUR_LANCE: 'victory_road',
  ELITE_FOUR_CHAMPION: 'final_battle',
  HALL_OF_FAME: 'hall_of_fame',
  CELADON_MART_1F: 'celadon',
  CELADON_MART_2F: 'celadon',
  CELADON_MART_3F: 'celadon',
  CELADON_MART_4F: 'celadon',
  CELADON_MART_5F: 'celadon',
  CELADON_MART_ELEVATOR: 'celadon',
  CELADON_MART_ROOF: 'celadon',
  CELADON_GAME_CORNER: 'game_corner',
};

const ZONE_MUSIC: Record<string, MusicTrack> = {
  PALLET_TOWN: 'pallet_town',
  ROUTE_1: 'route_1',
  VIRIDIAN_CITY: 'route_1',
  ROUTE_2: 'viridian_forest',
  VIRIDIAN_FOREST: 'viridian_forest',
  PEWTER_CITY: 'pewter_city',
  ROUTE_3: 'route_3',
  ROUTE_4: 'route_3',
  CERULEAN_CITY: 'cerulean',
  ROUTE_5: 'route_1',
  SAFFRON_CITY: 'route_1',
  ROUTE_6: 'route_to_lavender',
  ROUTE_7: 'route_to_lavender',
  ROUTE_8: 'route_to_lavender',
  ROUTE_9: 'route_3',
  ROUTE_10: 'route_3',
  ROUTE_11: 'route_to_lavender',
  ROUTE_12: 'route_to_lavender',
  ROUTE_13: 'route_to_lavender',
  ROUTE_14: 'route_to_lavender',
  ROUTE_15: 'route_to_lavender',
  ROUTE_16: 'route_to_lavender',
  ROUTE_17: 'route_to_lavender',
  ROUTE_18: 'route_to_lavender',
  ROUTE_19: 'route_1',
  ROUTE_20: 'route_1',
  ROUTE_21: 'route_1',
  ROUTE_22: 'route_1',
  ROUTE_23: 'victory_road',
  ROUTE_24: 'intro_route_24',
  ROUTE_25: 'route_to_lavender',
  VERMILION_CITY: 'vermilion',
  LAVENDER_TOWN: 'lavender',
  CELADON_CITY: 'celadon',
  FUCHSIA_CITY: 'route_1',
  CINNABAR_ISLAND: 'cinnabar',
  INDIGO_PLATEAU: 'victory_road',
};

export function getOverworldMusic(map: MapID, playerPos: { x: number; y: number }): MusicTrack {
  if (map !== 'KANTO_OVERWORLD') {
    const fromFirered = fireredMusicForMap(map);
    if (fromFirered) return fromFirered;
    if (map.startsWith('POKEMART')) return 'route_1';
    return INTERIOR_MUSIC[map] ?? 'route_1';
  }
  const zone = getKantoRegion(playerPos.x, playerPos.y);
  return ZONE_MUSIC[zone] ?? 'route_1';
}

export function getBattleMusic(phase: GamePhase, isTrainerBattle: boolean): MusicTrack {
  if (phase.type !== 'BATTLE') return 'route_1';
  const sub = phase.sub.type;
  if (sub === 'CHOOSING' || sub === 'PLAYER_ATTACK' || sub === 'ENEMY_ATTACK' || sub === 'CATCHING' || sub === 'BATTLE_INVENTORY' || sub === 'BATTLE_TEAM' || sub === 'BATTLE_ITEM_TEAM_SELECT' || sub === 'TRAINER_NEXT_POKEMON') {
    return isTrainerBattle ? 'battle_trainer' : 'battle_wild';
  }
  if (sub === 'PLAYER_FAINTED' || sub === 'FORCED_SWITCH') {
    return isTrainerBattle ? 'battle_trainer' : 'battle_wild';
  }
  if (sub === 'ENEMY_FAINTED') {
    return isTrainerBattle ? 'victory_trainer' : 'victory_wild';
  }
  if (sub === 'LEVEL_UP' || sub === 'EVOLVING') {
    return 'level_up';
  }
  return isTrainerBattle ? 'battle_trainer' : 'battle_wild';
}

export const JINGLES = new Set<MusicTrack>([
  'healed', 'level_up', 'caught', 'evolved', 'item', 'key_item',
  'victory_trainer', 'victory_wild', 'victory_gym', 'pokedex_eval',
]);
