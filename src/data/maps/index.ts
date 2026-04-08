import { parseTileMap } from './tileParser';

import pallet_town   from './pallet_town.json';
import oaks_lab      from './oaks_lab.json';
import route_1       from './route_1.json';
import route_2       from './route_2.json';
import viridian_city from './viridian_city.json';
import pokecenter    from './pokecenter.json';
import pokemart      from './pokemart.json';
import viridian_forest from './viridian_forest.json';
import mt_moon       from './mt_moon.json';
import pewter_city   from './pewter_city.json';
import pewter_gym    from './pewter_gym.json';
import route_3       from './route_3.json';

export const MAP_PALLET_TOWN    = parseTileMap(pallet_town);
export const MAP_OAKS_LAB       = parseTileMap(oaks_lab);
export const MAP_ROUTE_1        = parseTileMap(route_1);
export const MAP_ROUTE_2        = parseTileMap(route_2);
export const MAP_VIRIDIAN_CITY  = parseTileMap(viridian_city);
export const MAP_POKECENTER     = parseTileMap(pokecenter);
export const MAP_POKEMART       = parseTileMap(pokemart);
export const MAP_VIRIDIAN_FOREST = parseTileMap(viridian_forest);
export const MAP_MT_MOON        = parseTileMap(mt_moon);
export const MAP_PEWTER_CITY    = parseTileMap(pewter_city);
export const MAP_PEWTER_GYM     = parseTileMap(pewter_gym);
export const MAP_ROUTE_3        = parseTileMap(route_3);

export const worldMaps = {
  PALLET_TOWN: MAP_PALLET_TOWN,
  OAKS_LAB: MAP_OAKS_LAB,
  ROUTE_1: MAP_ROUTE_1,
  ROUTE_2: MAP_ROUTE_2,
  VIRIDIAN_CITY: MAP_VIRIDIAN_CITY,
  POKECENTER: MAP_POKECENTER,
  POKEMART: MAP_POKEMART,
  VIRIDIAN_FOREST: MAP_VIRIDIAN_FOREST,
  MT_MOON: MAP_MT_MOON,
  PEWTER_CITY: MAP_PEWTER_CITY,
  PEWTER_GYM: MAP_PEWTER_GYM,
  ROUTE_3: MAP_ROUTE_3,
};