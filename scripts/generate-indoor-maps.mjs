#!/usr/bin/env node
/**
 * generate-indoor-maps.mjs
 *
 * Auto-emits src/data/firered/indoorMaps.generated.ts — the canonical
 * MapID → FireRed layout mapping for every indoor map in the game,
 * plus its FireRed-derived entry coord (the front-door warp_event).
 *
 * Manual config = the small `MAP_ID_TO_FIRERED` table below. Everything
 * else (imports, exports, entry overrides) is mechanical.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const MAPS = path.join(ROOT, 'src/artifacts/firered/maps');
const OUT  = path.join(ROOT, 'src/data/firered/indoorMaps.generated.ts');
const ID_OUT = path.join(ROOT, 'src/data/firered/mapIds.generated.ts');

// MapID (our internal enum) → FireRed layout ID.
// Each entry maps a single canonical FireRed layout. Where multiple FireRed
// maps share an internal MapID (e.g. POKECENTER for every city's pokémon
// center), we pick the most-canonical (Viridian's) — per-city pokecenters
// would be a follow-up split.
const MAP_ID_TO_FIRERED = {
  PLAYERS_HOUSE_1F:    'LAYOUT_PALLET_TOWN_PLAYERS_HOUSE_1F',
  PLAYERS_HOUSE_2F:    'LAYOUT_PALLET_TOWN_PLAYERS_HOUSE_2F',
  RIVALS_HOUSE:        'LAYOUT_PALLET_TOWN_RIVALS_HOUSE',
  OAKS_LAB:            'LAYOUT_PALLET_TOWN_PROFESSOR_OAKS_LAB',

  POKECENTER:          'LAYOUT_POKEMON_CENTER_1F',
  POKEMART:            'LAYOUT_MART',

  MT_MOON:             'LAYOUT_MT_MOON_1F',
  MT_MOON_B1F:         'LAYOUT_MT_MOON_B1F',
  MT_MOON_B2F:         'LAYOUT_MT_MOON_B2F',

  PEWTER_GYM:          'LAYOUT_PEWTER_CITY_GYM',
  CERULEAN_GYM:        'LAYOUT_CERULEAN_CITY_GYM',
  VERMILION_GYM:       'LAYOUT_VERMILION_CITY_GYM',
  CELADON_GYM:         'LAYOUT_CELADON_CITY_GYM',
  FUCHSIA_GYM:         'LAYOUT_FUCHSIA_CITY_GYM',
  SAFFRON_GYM:         'LAYOUT_SAFFRON_CITY_GYM',
  CINNABAR_GYM:        'LAYOUT_CINNABAR_ISLAND_GYM',
  VIRIDIAN_GYM:        'LAYOUT_VIRIDIAN_CITY_GYM',

  ROCK_TUNNEL_1F:      'LAYOUT_ROCK_TUNNEL_1F',
  ROCK_TUNNEL_B1F:     'LAYOUT_ROCK_TUNNEL_B1F',

  POKEMON_TOWER_1F:    'LAYOUT_POKEMON_TOWER_1F',
  POKEMON_TOWER_2F:    'LAYOUT_POKEMON_TOWER_2F',
  POKEMON_TOWER_3F:    'LAYOUT_POKEMON_TOWER_3F',
  POKEMON_TOWER_4F:    'LAYOUT_POKEMON_TOWER_4F',
  POKEMON_TOWER_5F:    'LAYOUT_POKEMON_TOWER_5F',
  POKEMON_TOWER_6F:    'LAYOUT_POKEMON_TOWER_6F',
  POKEMON_TOWER_7F:    'LAYOUT_POKEMON_TOWER_7F',

  BILLS_HOUSE:         'LAYOUT_ROUTE25_SEA_COTTAGE',

  SEAFOAM_ISLANDS_1F:  'LAYOUT_SEAFOAM_ISLANDS_1F',
  SEAFOAM_ISLANDS_B1F: 'LAYOUT_SEAFOAM_ISLANDS_B1F',
  SEAFOAM_ISLANDS_B2F: 'LAYOUT_SEAFOAM_ISLANDS_B2F',
  SEAFOAM_ISLANDS_B3F: 'LAYOUT_SEAFOAM_ISLANDS_B3F',
  SEAFOAM_ISLANDS_B4F: 'LAYOUT_SEAFOAM_ISLANDS_B4F',

  VICTORY_ROAD_1F:     'LAYOUT_VICTORY_ROAD_1F',
  VICTORY_ROAD_2F:     'LAYOUT_VICTORY_ROAD_2F',
  VICTORY_ROAD_3F:     'LAYOUT_VICTORY_ROAD_3F',

  CERULEAN_CAVE_1F:    'LAYOUT_CERULEAN_CAVE_1F',
  CERULEAN_CAVE_2F:    'LAYOUT_CERULEAN_CAVE_2F',
  CERULEAN_CAVE_B_1F:  'LAYOUT_CERULEAN_CAVE_B1F',

  DIGLETTS_CAVE:       'LAYOUT_DIGLETTS_CAVE_B1F',
  POWER_PLANT:         'LAYOUT_POWER_PLANT',

  POKEMON_MANSION_1F:  'LAYOUT_POKEMON_MANSION_1F',
  POKEMON_MANSION_2F:  'LAYOUT_POKEMON_MANSION_2F',
  POKEMON_MANSION_3F:  'LAYOUT_POKEMON_MANSION_3F',
  POKEMON_MANSION_B1F: 'LAYOUT_POKEMON_MANSION_B1F',

  SAFARI_ZONE_CENTER:  'LAYOUT_SAFARI_ZONE_CENTER',

  SILPH_CO_1F:         'LAYOUT_SILPH_CO_1F',
  SILPH_CO_2F:         'LAYOUT_SILPH_CO_2F',
  SILPH_CO_3F:         'LAYOUT_SILPH_CO_3F',
  SILPH_CO_4F:         'LAYOUT_SILPH_CO_4F',
  SILPH_CO_5F:         'LAYOUT_SILPH_CO_5F',
  SILPH_CO_6F:         'LAYOUT_SILPH_CO_6F',
  SILPH_CO_7F:         'LAYOUT_SILPH_CO_7F',
  SILPH_CO_8F:         'LAYOUT_SILPH_CO_8F',
  SILPH_CO_9F:         'LAYOUT_SILPH_CO_9F',
  SILPH_CO_10F:        'LAYOUT_SILPH_CO_10F',
  SILPH_CO_11F:        'LAYOUT_SILPH_CO_11F',

  ROCKET_HIDEOUT_B1F:  'LAYOUT_ROCKET_HIDEOUT_B1F',
  ROCKET_HIDEOUT_B2F:  'LAYOUT_ROCKET_HIDEOUT_B2F',
  ROCKET_HIDEOUT_B3F:  'LAYOUT_ROCKET_HIDEOUT_B3F',
  ROCKET_HIDEOUT_B4F:  'LAYOUT_ROCKET_HIDEOUT_B4F',

  SS_ANNE_1F:          'LAYOUT_SSANNE_1F_CORRIDOR',
  SS_ANNE_2F:          'LAYOUT_SSANNE_2F_CORRIDOR',
  SS_ANNE_3F:          'LAYOUT_SSANNE_3F_CORRIDOR',

  INDIGO_PLATEAU_LOBBY: 'LAYOUT_INDIGO_PLATEAU_POKEMON_CENTER_1F',
  ELITE_FOUR_LORELEI:   'LAYOUT_POKEMON_LEAGUE_LORELEIS_ROOM',
  ELITE_FOUR_BRUNO:     'LAYOUT_POKEMON_LEAGUE_BRUNOS_ROOM',
  ELITE_FOUR_AGATHA:    'LAYOUT_POKEMON_LEAGUE_AGATHAS_ROOM',
  ELITE_FOUR_LANCE:     'LAYOUT_POKEMON_LEAGUE_LANCES_ROOM',
  ELITE_FOUR_CHAMPION:  'LAYOUT_POKEMON_LEAGUE_CHAMPIONS_ROOM',

  CELADON_MART_1F:        'LAYOUT_CELADON_CITY_DEPARTMENT_STORE_1F',
  CELADON_MART_2F:        'LAYOUT_CELADON_CITY_DEPARTMENT_STORE_2F',
  CELADON_MART_3F:        'LAYOUT_CELADON_CITY_DEPARTMENT_STORE_3F',
  CELADON_MART_4F:        'LAYOUT_CELADON_CITY_DEPARTMENT_STORE_4F',
  CELADON_MART_5F:        'LAYOUT_CELADON_CITY_DEPARTMENT_STORE_5F',
  CELADON_MART_ELEVATOR:  'LAYOUT_CELADON_CITY_DEPARTMENT_STORE_ELEVATOR',
  CELADON_MART_ROOF:      'LAYOUT_CELADON_CITY_DEPARTMENT_STORE_ROOF',
  CELADON_GAME_CORNER:    'LAYOUT_CELADON_CITY_GAME_CORNER',
};

const lines = [];
const importLines = [];
const exportLines = [];
const entryEntries = [];
const issues = [];

for (const [mapId, layoutId] of Object.entries(MAP_ID_TO_FIRERED)) {
  const layoutPath = path.join(MAPS, `${layoutId}.json`);
  if (!fs.existsSync(layoutPath)) {
    issues.push(`${mapId}: FireRed layout ${layoutId}.json not found`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
  const importIdent = `firered_${mapId.toLowerCase()}`;
  importLines.push(`import ${importIdent} from '../../artifacts/firered/maps/${layoutId}.json';`);
  exportLines.push(`  ${mapId}: fromFirered(${importIdent}),`);

  // Auto-derive the entry coord from FireRed warp_events: the first warp
  // pointing OUT to the parent outdoor map is the front door — landing the
  // player on it on entry is canonical (warp triggers on stepping ONTO,
  // not while stationary, so no immediate re-warp).
  const warps = data.meta?.warp_events ?? [];
  // Pick the warp whose dest is the matching outdoor map (or just the first).
  const entry = warps[0];
  if (entry) {
    entryEntries.push(`  ${mapId}: { x: ${entry.x}, y: ${entry.y} },  // FireRed warp_event[0]`);
  }
}

// FireRed map id ↔ our internal MapID enum (both directions).
const reverseEntries = [];
for (const [mapId, layoutId] of Object.entries(MAP_ID_TO_FIRERED)) {
  // The FireRed map id matches the layout id with LAYOUT_ → MAP_ swap.
  const fireredId = layoutId.replace(/^LAYOUT_/, 'MAP_');
  reverseEntries.push(`  ${fireredId}: '${mapId}',`);
}

const generated = `// AUTOGENERATED by scripts/generate-indoor-maps.mjs — do not edit.
// Maps every internal MapID to its canonical pokefirered layout.

import { bridgeFireredLayout, type FireredLayoutJson } from '../../lib/firered/bridge';
import type { MapData } from '../../types';

${importLines.join('\n')}

function fromFirered(json: unknown): MapData {
  const parsed = bridgeFireredLayout(json as FireredLayoutJson);
  return {
    tiles: parsed.tiles,
    warps: parsed.warps as MapData['warps'],
    firered: true,
    fireredLayout: parsed.layout,
  };
}

export const FIRERED_INDOOR_MAPS = {
${exportLines.join('\n')}
} as const;
`;

// Standalone module for the FireRed→internal id mapping. Kept separate from
// indoorMaps.generated.ts to avoid a circular import: bridge.ts imports the
// id table to resolve warp targetMaps, and indoorMaps.generated.ts imports
// bridge.ts. By splitting them the bridge depends only on this file (no
// runtime dependency on the indoor map factory functions).
const idsGenerated = `// AUTOGENERATED by scripts/generate-indoor-maps.mjs — do not edit.

/** FireRed map id → our internal MapID enum. */
export const FIRERED_MAP_ID_TO_INTERNAL = {
${reverseEntries.join('\n')}
} as const;
`;
fs.writeFileSync(ID_OUT, idsGenerated);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, generated);

console.log(`✓ generate-indoor-maps: ${exportLines.length} maps emitted to ${OUT}`);
if (issues.length) {
  console.log(`  ${issues.length} issue(s):`);
  issues.forEach(i => console.log('   - ' + i));
}
