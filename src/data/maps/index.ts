import { parseTileMap } from './tileParser';

import kanto_overworld  from './kanto_overworld.json';
import players_house_1f from './players_house_1f.json';
import players_house_2f from './players_house_2f.json';
import rivals_house     from './rivals_house.json';
import oaks_lab         from './oaks_lab.json';
import pokecenter       from './pokecenter.json';
import pokemart         from './pokemart.json';
import mt_moon          from './mt_moon.json';
import mt_moon_b1f      from './mt_moon_b1f.json';
import mt_moon_b2f      from './mt_moon_b2f.json';
import pewter_gym       from './pewter_gym.json';
import cerulean_gym     from './cerulean_gym.json';
import vermilion_gym    from './vermilion_gym.json';
import rock_tunnel_1f   from './rock_tunnel_1f.json';
import rock_tunnel_b1f  from './rock_tunnel_b1f.json';
import pokemon_tower_1f from './pokemon_tower_1f.json';
import pokemon_tower_2f from './pokemon_tower_2f.json';
import pokemon_tower_3f from './pokemon_tower_3f.json';
import bills_house from './bills_house.json';
import celadon_gym     from './celadon_gym.json';
import fuchsia_gym     from './fuchsia_gym.json';
import saffron_gym     from './saffron_gym.json';
import cinnabar_gym    from './cinnabar_gym.json';
import viridian_gym    from './viridian_gym.json';

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
export const MAP_ROCK_TUNNEL_B1F  = parseTileMap(rock_tunnel_b1f);
export const MAP_POKEMON_TOWER_1F = parseTileMap(pokemon_tower_1f);
export const MAP_POKEMON_TOWER_2F = parseTileMap(pokemon_tower_2f);
export const MAP_POKEMON_TOWER_3F = parseTileMap(pokemon_tower_3f);
export const MAP_BILLS_HOUSE = parseTileMap(bills_house);
export const MAP_CELADON_GYM  = parseTileMap(celadon_gym);
export const MAP_FUCHSIA_GYM  = parseTileMap(fuchsia_gym);
export const MAP_SAFFRON_GYM  = parseTileMap(saffron_gym);
export const MAP_CINNABAR_GYM = parseTileMap(cinnabar_gym);
export const MAP_VIRIDIAN_GYM = parseTileMap(viridian_gym);

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
};
