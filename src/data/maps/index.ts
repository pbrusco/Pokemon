import { parseMap } from './tileParser';

import kanto_overworld from '../../artifacts/maps/kanto_overworld.json';

import players_house_1f from '../../artifacts/maps/reds_house_1f.json';
import players_house_2f from '../../artifacts/maps/reds_house_2f.json';
import rivals_house from '../../artifacts/maps/blues_house.json';
import oaks_lab from '../../artifacts/maps/oaks_lab.json';
import pokecenter from '../../artifacts/maps/viridian_pokecenter.json';
import pokemart from '../../artifacts/maps/viridian_mart.json';
import mt_moon from '../../artifacts/maps/mt_moon_1f.json';
import mt_moon_b1f from '../../artifacts/maps/mt_moon_b1f.json';
import mt_moon_b2f from '../../artifacts/maps/mt_moon_b2f.json';
import pewter_gym from '../../artifacts/maps/pewter_gym.json';
import cerulean_gym from '../../artifacts/maps/cerulean_gym.json';
import vermilion_gym from '../../artifacts/maps/vermilion_gym.json';
import rock_tunnel_1f from '../../artifacts/maps/rock_tunnel_1f.json';
import rock_tunnel_b1f from '../../artifacts/maps/rock_tunnel_b1f.json';
import pokemon_tower_1f from '../../artifacts/maps/pokemon_tower_1f.json';
import pokemon_tower_2f from '../../artifacts/maps/pokemon_tower_2f.json';
import pokemon_tower_3f from '../../artifacts/maps/pokemon_tower_3f.json';
import bills_house from '../../artifacts/maps/bills_house.json';
import celadon_gym from '../../artifacts/maps/celadon_gym.json';
import fuchsia_gym from '../../artifacts/maps/fuchsia_gym.json';
import saffron_gym from '../../artifacts/maps/saffron_gym.json';
import cinnabar_gym from '../../artifacts/maps/cinnabar_gym.json';
import viridian_gym from '../../artifacts/maps/viridian_gym.json';
import pokemon_tower_4f from '../../artifacts/maps/pokemon_tower_4f.json';
import pokemon_tower_5f from '../../artifacts/maps/pokemon_tower_5f.json';
import pokemon_tower_6f from '../../artifacts/maps/pokemon_tower_6f.json';
import pokemon_tower_7f from '../../artifacts/maps/pokemon_tower_7f.json';
import seafoam_islands_1f from '../../artifacts/maps/seafoam_islands_1f.json';
import seafoam_islands_b1f from '../../artifacts/maps/seafoam_islands_b1f.json';
import seafoam_islands_b2f from '../../artifacts/maps/seafoam_islands_b2f.json';
import seafoam_islands_b3f from '../../artifacts/maps/seafoam_islands_b3f.json';
import seafoam_islands_b4f from '../../artifacts/maps/seafoam_islands_b4f.json';
import victory_road_1f from '../../artifacts/maps/victory_road_1f.json';
import victory_road_2f from '../../artifacts/maps/victory_road_2f.json';
import victory_road_3f from '../../artifacts/maps/victory_road_3f.json';
import cerulean_cave_1f from '../../artifacts/maps/cerulean_cave_1f.json';
import cerulean_cave_2f from '../../artifacts/maps/cerulean_cave_2f.json';
import cerulean_cave_b1f from '../../artifacts/maps/cerulean_cave_b1f.json';
import digletts_cave from '../../artifacts/maps/digletts_cave.json';
import power_plant from '../../artifacts/maps/power_plant.json';
import pokemon_mansion_1f from '../../artifacts/maps/pokemon_mansion_1f.json';
import pokemon_mansion_2f from '../../artifacts/maps/pokemon_mansion_2f.json';
import pokemon_mansion_3f from '../../artifacts/maps/pokemon_mansion_3f.json';
import pokemon_mansion_b1f from '../../artifacts/maps/pokemon_mansion_b1f.json';
import safari_zone_center from '../../artifacts/maps/safari_zone_center.json';
import silph_co_1f from '../../artifacts/maps/silph_co_1f.json';
import silph_co_2f from '../../artifacts/maps/silph_co_2f.json';
import silph_co_3f from '../../artifacts/maps/silph_co_3f.json';
import silph_co_4f from '../../artifacts/maps/silph_co_4f.json';
import silph_co_5f from '../../artifacts/maps/silph_co_5f.json';
import silph_co_6f from '../../artifacts/maps/silph_co_6f.json';
import silph_co_7f from '../../artifacts/maps/silph_co_7f.json';
import silph_co_8f from '../../artifacts/maps/silph_co_8f.json';
import silph_co_9f from '../../artifacts/maps/silph_co_9f.json';
import silph_co_10f from '../../artifacts/maps/silph_co_10f.json';
import silph_co_11f from '../../artifacts/maps/silph_co_11f.json';
import rocket_hideout_b1f from '../../artifacts/maps/rocket_hideout_b1f.json';
import rocket_hideout_b2f from '../../artifacts/maps/rocket_hideout_b2f.json';
import rocket_hideout_b3f from '../../artifacts/maps/rocket_hideout_b3f.json';
import rocket_hideout_b4f from '../../artifacts/maps/rocket_hideout_b4f.json';
import ss_anne_1f from '../../artifacts/maps/ss_anne_1f.json';
import ss_anne_2f from '../../artifacts/maps/ss_anne_2f.json';
import ss_anne_3f from '../../artifacts/maps/ss_anne_3f.json';
import indigo_plateau_lobby from '../../artifacts/maps/indigo_plateau_lobby.json';
import elite_four_lorelei from '../../artifacts/maps/loreleis_room.json';
import elite_four_bruno from '../../artifacts/maps/brunos_room.json';
import elite_four_agatha from '../../artifacts/maps/agathas_room.json';
import elite_four_lance from '../../artifacts/maps/lances_room.json';
import elite_four_champion from '../../artifacts/maps/champions_room.json';
import celadon_mart_1f from '../../artifacts/maps/celadon_mart_1f.json';
import celadon_mart_2f from '../../artifacts/maps/celadon_mart_2f.json';
import celadon_mart_3f from '../../artifacts/maps/celadon_mart_3f.json';
import celadon_mart_4f from '../../artifacts/maps/celadon_mart_4f.json';
import celadon_mart_5f from '../../artifacts/maps/celadon_mart_5f.json';
import celadon_mart_elevator from '../../artifacts/maps/celadon_mart_elevator.json';
import celadon_mart_roof from '../../artifacts/maps/celadon_mart_roof.json';
import celadon_game_corner from '../../artifacts/maps/game_corner.json';

export const MAP_KANTO_OVERWORLD  = parseMap(kanto_overworld);

export const MAP_PLAYERS_HOUSE_1F = parseMap(players_house_1f);
export const MAP_PLAYERS_HOUSE_2F = parseMap(players_house_2f);
export const MAP_RIVALS_HOUSE     = parseMap(rivals_house);
export const MAP_OAKS_LAB         = parseMap(oaks_lab);
export const MAP_POKECENTER       = parseMap(pokecenter);
export const MAP_POKEMART         = parseMap(pokemart);
export const MAP_MT_MOON          = parseMap(mt_moon);
export const MAP_MT_MOON_B1F      = parseMap(mt_moon_b1f);
export const MAP_MT_MOON_B2F      = parseMap(mt_moon_b2f);
export const MAP_PEWTER_GYM       = parseMap(pewter_gym);
export const MAP_CERULEAN_GYM     = parseMap(cerulean_gym);
export const MAP_VERMILION_GYM    = parseMap(vermilion_gym);
export const MAP_ROCK_TUNNEL_1F   = parseMap(rock_tunnel_1f);
export const MAP_ROCK_TUNNEL_B1F  = parseMap(rock_tunnel_b1f);
export const MAP_POKEMON_TOWER_1F = parseMap(pokemon_tower_1f);
export const MAP_POKEMON_TOWER_2F = parseMap(pokemon_tower_2f);
export const MAP_POKEMON_TOWER_3F = parseMap(pokemon_tower_3f);
export const MAP_BILLS_HOUSE      = parseMap(bills_house);
export const MAP_CELADON_GYM      = parseMap(celadon_gym);
export const MAP_FUCHSIA_GYM      = parseMap(fuchsia_gym);
export const MAP_SAFFRON_GYM      = parseMap(saffron_gym);
export const MAP_CINNABAR_GYM     = parseMap(cinnabar_gym);
export const MAP_VIRIDIAN_GYM     = parseMap(viridian_gym);
export const MAP_POKEMON_TOWER_4F = parseMap(pokemon_tower_4f);
export const MAP_POKEMON_TOWER_5F = parseMap(pokemon_tower_5f);
export const MAP_POKEMON_TOWER_6F = parseMap(pokemon_tower_6f);
export const MAP_POKEMON_TOWER_7F = parseMap(pokemon_tower_7f);
export const MAP_SEAFOAM_ISLANDS_1F = parseMap(seafoam_islands_1f);
export const MAP_SEAFOAM_ISLANDS_B1F = parseMap(seafoam_islands_b1f);
export const MAP_SEAFOAM_ISLANDS_B2F = parseMap(seafoam_islands_b2f);
export const MAP_SEAFOAM_ISLANDS_B3F = parseMap(seafoam_islands_b3f);
export const MAP_SEAFOAM_ISLANDS_B4F = parseMap(seafoam_islands_b4f);
export const MAP_VICTORY_ROAD_1F = parseMap(victory_road_1f);
export const MAP_VICTORY_ROAD_2F = parseMap(victory_road_2f);
export const MAP_VICTORY_ROAD_3F = parseMap(victory_road_3f);
export const MAP_CERULEAN_CAVE_1F = parseMap(cerulean_cave_1f);
export const MAP_CERULEAN_CAVE_2F = parseMap(cerulean_cave_2f);
export const MAP_CERULEAN_CAVE_B_1F = parseMap(cerulean_cave_b1f);
export const MAP_DIGLETTS_CAVE    = parseMap(digletts_cave);
export const MAP_POWER_PLANT      = parseMap(power_plant);
export const MAP_POKEMON_MANSION_1F = parseMap(pokemon_mansion_1f);
export const MAP_POKEMON_MANSION_2F = parseMap(pokemon_mansion_2f);
export const MAP_POKEMON_MANSION_3F = parseMap(pokemon_mansion_3f);
export const MAP_POKEMON_MANSION_B1F = parseMap(pokemon_mansion_b1f);
export const MAP_SAFARI_ZONE_CENTER = parseMap(safari_zone_center);
export const MAP_SILPH_CO_1F = parseMap(silph_co_1f);
export const MAP_SILPH_CO_2F = parseMap(silph_co_2f);
export const MAP_SILPH_CO_3F = parseMap(silph_co_3f);
export const MAP_SILPH_CO_4F = parseMap(silph_co_4f);
export const MAP_SILPH_CO_5F = parseMap(silph_co_5f);
export const MAP_SILPH_CO_6F = parseMap(silph_co_6f);
export const MAP_SILPH_CO_7F = parseMap(silph_co_7f);
export const MAP_SILPH_CO_8F = parseMap(silph_co_8f);
export const MAP_SILPH_CO_9F = parseMap(silph_co_9f);
export const MAP_SILPH_CO_10F = parseMap(silph_co_10f);
export const MAP_SILPH_CO_11F = parseMap(silph_co_11f);
export const MAP_ROCKET_HIDEOUT_B1F = parseMap(rocket_hideout_b1f);
export const MAP_ROCKET_HIDEOUT_B2F = parseMap(rocket_hideout_b2f);
export const MAP_ROCKET_HIDEOUT_B3F = parseMap(rocket_hideout_b3f);
export const MAP_ROCKET_HIDEOUT_B4F = parseMap(rocket_hideout_b4f);
export const MAP_SS_ANNE_1F = parseMap(ss_anne_1f);
export const MAP_SS_ANNE_2F = parseMap(ss_anne_2f);
export const MAP_SS_ANNE_3F = parseMap(ss_anne_3f);
export const MAP_INDIGO_PLATEAU_LOBBY = parseMap(indigo_plateau_lobby);
export const MAP_ELITE_FOUR_LORELEI = parseMap(elite_four_lorelei);
export const MAP_ELITE_FOUR_BRUNO = parseMap(elite_four_bruno);
export const MAP_ELITE_FOUR_AGATHA = parseMap(elite_four_agatha);
export const MAP_ELITE_FOUR_LANCE = parseMap(elite_four_lance);
export const MAP_ELITE_FOUR_CHAMPION = parseMap(elite_four_champion);
export const MAP_CELADON_MART_1F = parseMap(celadon_mart_1f);
export const MAP_CELADON_MART_2F = parseMap(celadon_mart_2f);
export const MAP_CELADON_MART_3F = parseMap(celadon_mart_3f);
export const MAP_CELADON_MART_4F = parseMap(celadon_mart_4f);
export const MAP_CELADON_MART_5F = parseMap(celadon_mart_5f);
export const MAP_CELADON_MART_ELEVATOR = parseMap(celadon_mart_elevator);
export const MAP_CELADON_MART_ROOF = parseMap(celadon_mart_roof);
export const MAP_CELADON_GAME_CORNER = parseMap(celadon_game_corner);

export const worldMaps = {
  KANTO_OVERWORLD:  MAP_KANTO_OVERWORLD,
  PLAYERS_HOUSE_1F: MAP_PLAYERS_HOUSE_1F,
  PLAYERS_HOUSE_2F: MAP_PLAYERS_HOUSE_2F,
  RIVALS_HOUSE:     MAP_RIVALS_HOUSE,
  OAKS_LAB:         MAP_OAKS_LAB,
  POKECENTER:       MAP_POKECENTER,
  POKEMART:         MAP_POKEMART,
  MT_MOON:          MAP_MT_MOON,
  MT_MOON_B1F:      MAP_MT_MOON_B1F,
  MT_MOON_B2F:      MAP_MT_MOON_B2F,
  PEWTER_GYM:       MAP_PEWTER_GYM,
  CERULEAN_GYM:     MAP_CERULEAN_GYM,
  VERMILION_GYM:    MAP_VERMILION_GYM,
  ROCK_TUNNEL_1F:   MAP_ROCK_TUNNEL_1F,
  ROCK_TUNNEL_B1F:  MAP_ROCK_TUNNEL_B1F,
  POKEMON_TOWER_1F: MAP_POKEMON_TOWER_1F,
  POKEMON_TOWER_2F: MAP_POKEMON_TOWER_2F,
  POKEMON_TOWER_3F: MAP_POKEMON_TOWER_3F,
  BILLS_HOUSE:      MAP_BILLS_HOUSE,
  CELADON_GYM:      MAP_CELADON_GYM,
  FUCHSIA_GYM:      MAP_FUCHSIA_GYM,
  SAFFRON_GYM:      MAP_SAFFRON_GYM,
  CINNABAR_GYM:     MAP_CINNABAR_GYM,
  VIRIDIAN_GYM:     MAP_VIRIDIAN_GYM,
  POKEMON_TOWER_4F: MAP_POKEMON_TOWER_4F,
  POKEMON_TOWER_5F: MAP_POKEMON_TOWER_5F,
  POKEMON_TOWER_6F: MAP_POKEMON_TOWER_6F,
  POKEMON_TOWER_7F: MAP_POKEMON_TOWER_7F,
  SEAFOAM_ISLANDS_1F: MAP_SEAFOAM_ISLANDS_1F,
  SEAFOAM_ISLANDS_B1F: MAP_SEAFOAM_ISLANDS_B1F,
  SEAFOAM_ISLANDS_B2F: MAP_SEAFOAM_ISLANDS_B2F,
  SEAFOAM_ISLANDS_B3F: MAP_SEAFOAM_ISLANDS_B3F,
  SEAFOAM_ISLANDS_B4F: MAP_SEAFOAM_ISLANDS_B4F,
  VICTORY_ROAD_1F: MAP_VICTORY_ROAD_1F,
  VICTORY_ROAD_2F: MAP_VICTORY_ROAD_2F,
  VICTORY_ROAD_3F: MAP_VICTORY_ROAD_3F,
  CERULEAN_CAVE_1F: MAP_CERULEAN_CAVE_1F,
  CERULEAN_CAVE_2F: MAP_CERULEAN_CAVE_2F,
  CERULEAN_CAVE_B_1F: MAP_CERULEAN_CAVE_B_1F,
  DIGLETTS_CAVE:    MAP_DIGLETTS_CAVE,
  POWER_PLANT:      MAP_POWER_PLANT,
  POKEMON_MANSION_1F: MAP_POKEMON_MANSION_1F,
  POKEMON_MANSION_2F: MAP_POKEMON_MANSION_2F,
  POKEMON_MANSION_3F: MAP_POKEMON_MANSION_3F,
  POKEMON_MANSION_B1F: MAP_POKEMON_MANSION_B1F,
  SAFARI_ZONE_CENTER: MAP_SAFARI_ZONE_CENTER,
  SILPH_CO_1F: MAP_SILPH_CO_1F,
  SILPH_CO_2F: MAP_SILPH_CO_2F,
  SILPH_CO_3F: MAP_SILPH_CO_3F,
  SILPH_CO_4F: MAP_SILPH_CO_4F,
  SILPH_CO_5F: MAP_SILPH_CO_5F,
  SILPH_CO_6F: MAP_SILPH_CO_6F,
  SILPH_CO_7F: MAP_SILPH_CO_7F,
  SILPH_CO_8F: MAP_SILPH_CO_8F,
  SILPH_CO_9F: MAP_SILPH_CO_9F,
  SILPH_CO_10F: MAP_SILPH_CO_10F,
  SILPH_CO_11F: MAP_SILPH_CO_11F,
  ROCKET_HIDEOUT_B1F: MAP_ROCKET_HIDEOUT_B1F,
  ROCKET_HIDEOUT_B2F: MAP_ROCKET_HIDEOUT_B2F,
  ROCKET_HIDEOUT_B3F: MAP_ROCKET_HIDEOUT_B3F,
  ROCKET_HIDEOUT_B4F: MAP_ROCKET_HIDEOUT_B4F,
  SS_ANNE_1F: MAP_SS_ANNE_1F,
  SS_ANNE_2F: MAP_SS_ANNE_2F,
  SS_ANNE_3F: MAP_SS_ANNE_3F,
  INDIGO_PLATEAU_LOBBY: MAP_INDIGO_PLATEAU_LOBBY,
  ELITE_FOUR_LORELEI: MAP_ELITE_FOUR_LORELEI,
  ELITE_FOUR_BRUNO: MAP_ELITE_FOUR_BRUNO,
  ELITE_FOUR_AGATHA: MAP_ELITE_FOUR_AGATHA,
  ELITE_FOUR_LANCE: MAP_ELITE_FOUR_LANCE,
  ELITE_FOUR_CHAMPION: MAP_ELITE_FOUR_CHAMPION,
  CELADON_MART_1F: MAP_CELADON_MART_1F,
  CELADON_MART_2F: MAP_CELADON_MART_2F,
  CELADON_MART_3F: MAP_CELADON_MART_3F,
  CELADON_MART_4F: MAP_CELADON_MART_4F,
  CELADON_MART_5F: MAP_CELADON_MART_5F,
  CELADON_MART_ELEVATOR: MAP_CELADON_MART_ELEVATOR,
  CELADON_MART_ROOF: MAP_CELADON_MART_ROOF,
  CELADON_GAME_CORNER: MAP_CELADON_GAME_CORNER,
};
