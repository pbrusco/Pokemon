import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { AudioController, type MusicTrack } from '../lib/music';
import { getKantoRegion } from '../constants/world';
import type { MapID } from '../types';
import type { GamePhase } from '../types/gamePhase';

/** Map interior MapIDs to their ambient music tracks. */
const INTERIOR_MUSIC: Record<string, MusicTrack> = {
  PLAYERS_HOUSE_1F: 'pallet_town',
  PLAYERS_HOUSE_2F: 'pallet_town',
  RIVALS_HOUSE: 'pallet_town',
  OAKS_LAB: 'oak_lab',
  POKECENTER: 'pokecenter',
  POKEMART: 'route_1',
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
  CELADON_MART_1F: 'celadon',
  CELADON_MART_2F: 'celadon',
  CELADON_MART_3F: 'celadon',
  CELADON_MART_4F: 'celadon',
  CELADON_MART_5F: 'celadon',
  CELADON_MART_ELEVATOR: 'celadon',
  CELADON_MART_ROOF: 'celadon',
  CELADON_GAME_CORNER: 'game_corner',
};

/** Map overworld zone names (from getKantoRegion) to music tracks. */
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

function getOverworldMusic(map: MapID, playerPos: { x: number; y: number }): MusicTrack {
  if (map !== 'KANTO_OVERWORLD') return INTERIOR_MUSIC[map] ?? 'route_1';
  const zone = getKantoRegion(playerPos.x, playerPos.y);
  return ZONE_MUSIC[zone] ?? 'route_1';
}

function getBattleMusic(phase: GamePhase, isTrainerBattle: boolean): MusicTrack {
  if (phase.type !== 'BATTLE') return 'route_1';
  const sub = phase.sub.type;
  if (sub === 'CHOOSING' || sub === 'PLAYER_ATTACK' || sub === 'ENEMY_ATTACK' || sub === 'CATCHING' || sub === 'BATTLE_INVENTORY' || sub === 'BATTLE_TEAM' || sub === 'BATTLE_ITEM_TEAM_SELECT' || sub === 'TRAINER_NEXT_POKEMON') {
    if (isTrainerBattle) return 'battle_trainer';
    return 'battle_wild';
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

export function useMusicEngine() {
  const phase = useGameStore((s) => s.phase);
  const currentMap = useGameStore((s) => s.currentMap);
  const playerPos = useGameStore((s) => s.playerPos);
  const isTrainerBattle = useGameStore((s) => s.isTrainerBattle);
  const musicMuted = useGameStore((s) => s.musicMuted);
  const musicVolume = useGameStore((s) => s.musicVolume);

  const lastTrackRef = useRef<MusicTrack | null>(null);
  const wasMutedRef = useRef(musicMuted);

  // Sync mute/volume with AudioController
  useEffect(() => {
    if (musicMuted !== wasMutedRef.current) {
      AudioController.setMuted(musicMuted);
      wasMutedRef.current = musicMuted;
    }
    AudioController.setVolume(musicVolume);
  }, [musicMuted, musicVolume]);

  // React to phase / map / position changes
  useEffect(() => {
    if (musicMuted) return;

    let track: MusicTrack;
    const ph = phase;

    if (ph.type === 'BATTLE' || ph.type === 'BATTLE_TRANSITION') {
      track = getBattleMusic(ph, isTrainerBattle);
    } else if (ph.type === 'HEALING') {
      track = 'healed';
    } else if (ph.type === 'BLACKOUT') {
      // fade out is handled by stop; nothing to play
      AudioController.stop();
      return;
    } else {
      track = getOverworldMusic(currentMap, playerPos);
    }

    if (track !== lastTrackRef.current) {
      lastTrackRef.current = track;
      const isJingle = [
        'healed',
        'level_up',
        'caught',
        'evolved',
        'item',
        'key_item',
        'victory_trainer',
        'victory_wild',
        'victory_gym',
        'pokedex_eval',
      ].includes(track);

      if (isJingle) {
        const fallback = getOverworldMusic(currentMap, playerPos);
        AudioController.playJingle(track, fallback);
      } else {
        AudioController.play(track, { loop: true });
      }
    }
  }, [phase, currentMap, playerPos.x, playerPos.y, isTrainerBattle, musicMuted]);
}
