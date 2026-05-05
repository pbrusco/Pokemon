import { type Pokemon } from '../types';

/** Gen I encounter rate per map (0–255). Roll 0–255; if roll < rate, battle starts. */
export const WILD_ENCOUNTER_RATES: Record<string, number> = {
  KANTO_OVERWORLD: 10,   // fallback; per-zone rates applied in tryWildEncounter
  ROUTE_1: 10,
  ROUTE_2: 10,
  VIRIDIAN_FOREST: 16,
  ROUTE_3: 10,
  MT_MOON: 8,
  MT_MOON_B1F: 8,
  MT_MOON_B2F: 8,
  ROUTE_4: 10,
  ROUTE_5: 10,
  ROUTE_6: 10,
  ROUTE_9: 10,
  ROUTE_10: 10,
  ROCK_TUNNEL_1F: 15,
  POKEMON_TOWER_3F: 10,
  ROUTE_7: 15,
  ROUTE_8: 15,
  ROUTE_11: 15,
  ROUTE_12: 15,
  ROUTE_13: 20,
  ROUTE_14: 15,
  ROUTE_15: 15,
  ROUTE_16: 25,
  ROUTE_17: 25,
  ROUTE_18: 25,
  ROUTE_21: 25,
  ROUTE_22: 25,
  ROUTE_24: 25,
  ROUTE_25: 15,
  VICTORY_ROAD_1F: 15,
  VICTORY_ROAD_2F: 10,
  VICTORY_ROAD_3F: 15,
  SEAFOAM_ISLANDS_1F: 15,
  POKEMON_MANSION_1F: 10,
  POKEMON_MANSION_2F: 10,
  POKEMON_MANSION_3F: 10,
  CERULEAN_CAVE_1F: 10,
  CERULEAN_CAVE_2F: 15,
  CERULEAN_CAVE_B_1F: 25,
  DIGLETTS_CAVE: 20,
  POWER_PLANT: 10,
  POKEMON_TOWER_4F: 10,
  POKEMON_TOWER_5F: 10,
  POKEMON_TOWER_6F: 15,
  POKEMON_TOWER_7F: 15,
  SAFARI_ZONE_CENTER: 30,
  SAFARI_ZONE_EAST: 30,
  SAFARI_ZONE_NORTH: 30,
  SAFARI_ZONE_WEST: 30,
};
/**
 * Offsets of each outdoor zone inside KANTO_OVERWORLD — auto-generated from
 * pokefirered's connection graph by scripts/stitch-firered-overworld.mjs.
 * Used to map an absolute (x,y) back to the legacy zone name so per-zone
 * encounter tables and minimap still work.
 */
import { KANTO_FIRERED_ZONE_OFFSETS } from '../data/firered/kantoZoneOffsets.generated';
const KANTO_ZONE_OFFSETS: Record<string, { x: number; y: number; w: number; h: number }> = {
  ...KANTO_FIRERED_ZONE_OFFSETS,
};
/** Given an absolute (x,y) in KANTO_OVERWORLD, return the legacy zone name. */
export function getKantoRegion(x: number, y: number): string {
  for (const [zone, r] of Object.entries(KANTO_ZONE_OFFSETS)) {
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return zone;
  }
  return 'ROUTE_1'; // fallback
}

// Wild encounter tables auto-built from pokefirered's wild_encounters.json
// (extracted into FIRERED_WILD_ENCOUNTERS by scripts/extract-game-data.mjs).
// Each species' base stats, types, and catch rate come from the canonical
// FIRERED_SPECIES table.
import { buildAutoWildEncounters } from '../data/firered/runtime';
export const WILD_POKEMON_DATABASE: Record<string, Pokemon[]> = buildAutoWildEncounters();
