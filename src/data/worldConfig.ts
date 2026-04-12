import { MAP_PALLET_TOWN, MAP_OAKS_LAB, MAP_ROUTE_1, MAP_VIRIDIAN_CITY, MAP_POKECENTER, MAP_POKEMART, MAP_VIRIDIAN_FOREST, MAP_PEWTER_CITY, MAP_PEWTER_GYM } from './maps';
import { Entity } from '../types';

export const INITIAL_MAPS = {
  PALLET_TOWN: MAP_PALLET_TOWN,
  OAKS_LAB: MAP_OAKS_LAB,
  ROUTE_1: MAP_ROUTE_1,
  VIRIDIAN_CITY: MAP_VIRIDIAN_CITY,
  POKECENTER: MAP_POKECENTER,
  POKEMART: MAP_POKEMART,
  VIRIDIAN_FOREST: MAP_VIRIDIAN_FOREST,
  PEWTER_CITY: MAP_PEWTER_CITY,
  PEWTER_GYM: MAP_PEWTER_GYM
};

export const INITIAL_TELEPORTS: Record<string, Entity[]> = {
  PALLET_TOWN: [
    { id: 'to_lab', type: 'teleport', position: { x: 12, y: 14 }, direction: 'up', targetMap: 'OAKS_LAB', targetPos: { x: 10, y: 14 } },
    { id: 'to_route1', type: 'teleport', position: { x: 10, y: 5 }, direction: 'up', targetMap: 'ROUTE_1', targetPos: { x: 10, y: 19 } }
  ],
  OAKS_LAB: [
    { id: 'to_pallet', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'PALLET_TOWN', targetPos: { x: 10, y: 14 } }
  ],
  ROUTE_1: [
    { id: 'to_pallet_from_route1', type: 'teleport', position: { x: 10, y: 19 }, direction: 'down', targetMap: 'PALLET_TOWN', targetPos: { x: 10, y: 6 } },
    { id: 'to_viridian', type: 'teleport', position: { x: 10, y: 0 }, direction: 'up', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 10, y: 19 } }
  ],
  VIRIDIAN_CITY: [
    { id: 'to_route1_from_viridian', type: 'teleport', position: { x: 10, y: 19 }, direction: 'down', targetMap: 'ROUTE_1', targetPos: { x: 10, y: 1 } },
    { id: 'to_center', type: 'teleport', position: { x: 7, y: 8 }, direction: 'up', targetMap: 'POKECENTER', targetPos: { x: 10, y: 14 } },
    { id: 'to_mart', type: 'teleport', position: { x: 14, y: 8 }, direction: 'up', targetMap: 'POKEMART', targetPos: { x: 10, y: 14 } },
    { id: 'to_forest', type: 'teleport', position: { x: 10, y: 0 }, direction: 'up', targetMap: 'VIRIDIAN_FOREST', targetPos: { x: 10, y: 17 } }
  ],
  POKECENTER: [
    { id: 'to_viridian', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 7, y: 9 } }
  ],
  POKEMART: [
    { id: 'to_viridian', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 14, y: 9 } }
  ],
  VIRIDIAN_FOREST: [
    { id: 'to_viridian_from_forest', type: 'teleport', position: { x: 10, y: 18 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 10, y: 1 } },
    { id: 'to_pewter', type: 'teleport', position: { x: 10, y: 0 }, direction: 'up', targetMap: 'PEWTER_CITY', targetPos: { x: 10, y: 17 } }
  ],
  PEWTER_CITY: [
    { id: 'to_forest_from_pewter', type: 'teleport', position: { x: 10, y: 18 }, direction: 'down', targetMap: 'VIRIDIAN_FOREST', targetPos: { x: 10, y: 1 } },
    { id: 'to_gym', type: 'teleport', position: { x: 10, y: 13 }, direction: 'up', targetMap: 'PEWTER_GYM', targetPos: { x: 10, y: 14 } }
  ],
  PEWTER_GYM: [
    { id: 'to_pewter_from_gym', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'PEWTER_CITY', targetPos: { x: 10, y: 14 } }
  ]
};

export const worldConfig = {
  maps: INITIAL_MAPS,
  teleports: INITIAL_TELEPORTS
};