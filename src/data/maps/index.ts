import { parseTileMap } from './tileParser';

import pallet_town   from './pallet_town.json';
import oaks_lab      from './oaks_lab.json';
import route_1       from './route_1.json';
import viridian_city from './viridian_city.json';
import pokecenter    from './pokecenter.json';
import pokemart      from './pokemart.json';
import viridian_forest from './viridian_forest.json';
import pewter_city   from './pewter_city.json';
import pewter_gym    from './pewter_gym.json';
import route_3       from './route_3.json';

export const MAP_PALLET_TOWN    = parseTileMap(pallet_town);
export const MAP_OAKS_LAB       = parseTileMap(oaks_lab);
export const MAP_ROUTE_1        = parseTileMap(route_1);
export const MAP_VIRIDIAN_CITY  = parseTileMap(viridian_city);
export const MAP_POKECENTER     = parseTileMap(pokecenter);
export const MAP_POKEMART       = parseTileMap(pokemart);
export const MAP_VIRIDIAN_FOREST = parseTileMap(viridian_forest);
export const MAP_PEWTER_CITY    = parseTileMap(pewter_city);
export const MAP_PEWTER_GYM     = parseTileMap(pewter_gym);
export const MAP_ROUTE_3        = parseTileMap(route_3);
