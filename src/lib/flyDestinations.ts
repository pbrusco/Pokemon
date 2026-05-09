/**
 * flyDestinations.ts — Canonical Fly HM landing coordinates.
 *
 * When the player uses Fly, they land in front of the destination city's
 * Pokémon Center entrance, facing up (ready to walk in). These positions
 * are derived from the canonical FireRed PC layout data:
 *   - The PC entrance warp tiles are at (6,8), (7,8), (8,8)
 *   - Landing one tile south at y=9, centered at x=7, facing up.
 */

import type { MapID, Position } from '../types';

export interface FlyDestination {
  map: MapID;
  pos: Position;
  dir: 'up' | 'down' | 'left' | 'right';
}

/** Map town id → canonical PC landing spot. */
export const FLY_DESTINATIONS: Record<string, FlyDestination> = {
  PALLET_TOWN:       { map: 'KANTO_OVERWORLD', pos: { x: 76, y: 274 }, dir: 'up' },   // Oak's Lab door
  VIRIDIAN_CITY:     { map: 'POKECENTER_VIRIDIAN', pos: { x: 7, y: 9 }, dir: 'up' },
  PEWTER_CITY:       { map: 'POKECENTER_PEWTER', pos: { x: 7, y: 9 }, dir: 'up' },
  CERULEAN_CITY:     { map: 'POKECENTER_CERULEAN', pos: { x: 7, y: 9 }, dir: 'up' },
  LAVENDER_TOWN:     { map: 'POKECENTER_LAVENDER', pos: { x: 7, y: 9 }, dir: 'up' },
  VERMILION_CITY:    { map: 'POKECENTER_VERMILION', pos: { x: 7, y: 9 }, dir: 'up' },
  CELADON_CITY:      { map: 'POKECENTER_CELADON', pos: { x: 7, y: 9 }, dir: 'up' },
  FUCHSIA_CITY:      { map: 'POKECENTER_FUCHSIA', pos: { x: 7, y: 9 }, dir: 'up' },
  SAFFRON_CITY:      { map: 'POKECENTER_SAFFRON', pos: { x: 7, y: 9 }, dir: 'up' },
  CINNABAR_ISLAND:   { map: 'POKECENTER_CINNABAR', pos: { x: 7, y: 9 }, dir: 'up' },
  INDIGO_PLATEAU:    { map: 'INDIGO_PLATEAU_LOBBY', pos: { x: 11, y: 15 }, dir: 'up' }, // lobby entrance is roughly center-bottom
  ROUTE_4:           { map: 'POKECENTER_ROUTE4', pos: { x: 7, y: 9 }, dir: 'up' },
  ROUTE_10:          { map: 'POKECENTER_ROUTE10', pos: { x: 7, y: 9 }, dir: 'up' },
};
