import { parseTileMap } from './tileParser';

import kanto_overworld  from './kanto_overworld.json';
import pallet_town      from './pallet_town.json';
import players_house_1f from './players_house_1f.json';
import players_house_2f from './players_house_2f.json';
import rivals_house     from './rivals_house.json';
import oaks_lab         from './oaks_lab.json';
import route_1          from './route_1.json';
import route_2          from './route_2.json';
import viridian_city    from './viridian_city.json';
import pokecenter       from './pokecenter.json';
import pokemart         from './pokemart.json';
import viridian_forest  from './viridian_forest.json';
import mt_moon          from './mt_moon.json';
import mt_moon_b1f      from './mt_moon_b1f.json';
import mt_moon_b2f      from './mt_moon_b2f.json';
import pewter_city      from './pewter_city.json';
import pewter_gym       from './pewter_gym.json';
import route_3          from './route_3.json';
import route_4          from './route_4.json';
import cerulean_city    from './cerulean_city.json';
import cerulean_gym     from './cerulean_gym.json';
import route_5          from './route_5.json';
import route_6          from './route_6.json';
import saffron_city     from './saffron_city.json';
import vermilion_city   from './vermilion_city.json';
import vermilion_gym    from './vermilion_gym.json';
import route_9          from './route_9.json';
import route_10         from './route_10.json';
import rock_tunnel_1f   from './rock_tunnel_1f.json';
import lavender_town    from './lavender_town.json';
import pokemon_tower_1f from './pokemon_tower_1f.json';

export const MAP_KANTO_OVERWORLD  = parseTileMap(kanto_overworld);

export const MAP_PLAYERS_HOUSE_1F = parseTileMap(players_house_1f);
export const MAP_PLAYERS_HOUSE_2F = parseTileMap(players_house_2f);
export const MAP_RIVALS_HOUSE     = parseTileMap(rivals_house);
export const MAP_OAKS_LAB         = parseTileMap(oaks_lab);
export const MAP_POKECENTER       = parseTileMap(pokecenter);
export const MAP_POKEMART         = parseTileMap(pokemart);
export const MAP_MT_MOON          = parseTileMap(mt_moon);
export const MAP_MT_MOON_B1F      = parseTileMap(mt_moon_b1f);
export const MAP_MT_MOON_B2F      = parseTileMap(mt_moon_b2f);
export const MAP_PEWTER_GYM       = parseTileMap(pewter_gym);
export const MAP_CERULEAN_GYM     = parseTileMap(cerulean_gym);
export const MAP_VERMILION_GYM    = parseTileMap(vermilion_gym);
export const MAP_ROCK_TUNNEL_1F   = parseTileMap(rock_tunnel_1f);
export const MAP_POKEMON_TOWER_1F = parseTileMap(pokemon_tower_1f);

// Legacy per-map exports kept for reference (not used in worldMaps)
export const MAP_PALLET_TOWN      = parseTileMap(pallet_town);
export const MAP_ROUTE_1          = parseTileMap(route_1);
export const MAP_ROUTE_2          = parseTileMap(route_2);
export const MAP_VIRIDIAN_CITY    = parseTileMap(viridian_city);
export const MAP_VIRIDIAN_FOREST  = parseTileMap(viridian_forest);
export const MAP_PEWTER_CITY      = parseTileMap(pewter_city);
export const MAP_ROUTE_3          = parseTileMap(route_3);
export const MAP_ROUTE_4          = parseTileMap(route_4);
export const MAP_CERULEAN_CITY    = parseTileMap(cerulean_city);
export const MAP_ROUTE_5          = parseTileMap(route_5);
export const MAP_ROUTE_6          = parseTileMap(route_6);
export const MAP_SAFFRON_CITY     = parseTileMap(saffron_city);
export const MAP_VERMILION_CITY   = parseTileMap(vermilion_city);
export const MAP_ROUTE_9          = parseTileMap(route_9);
export const MAP_ROUTE_10         = parseTileMap(route_10);
export const MAP_LAVENDER_TOWN    = parseTileMap(lavender_town);

export const worldMaps = {
  // ── Single unified outdoor map ──
  KANTO_OVERWORLD:  MAP_KANTO_OVERWORLD,
  // ── Indoor maps ──
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
  POKEMON_TOWER_1F: MAP_POKEMON_TOWER_1F,
};