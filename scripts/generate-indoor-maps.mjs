#!/usr/bin/env node
/**
 * generate-indoor-maps.mjs
 *
 * Auto-emits src/data/firered/indoorMaps.generated.ts — the canonical
 * MapID → FireRed layout mapping for every indoor map in the game,
 * plus its FireRed-derived entry coord (the front-door warp_event).
 *
 * Manual config = the small `MAP_ID_TO_FIRERED` table below. Two value forms:
 *   - String: 'LAYOUT_FOO' — layout id; FireRed map id is auto-derived as
 *     'MAP_FOO' (swap LAYOUT_→MAP_). Used when there is exactly one FireRed
 *     map per layout (the common case).
 *   - Object: { layout: 'LAYOUT_X', map: 'MAP_Y' } — when a single FireRed
 *     layout is reused across multiple maps (e.g. the shared Pokémon Center
 *     and Mart layouts). The script reads the per-map map.json directly from
 *     the disassembly to capture that map's events (warps, NPCs) and writes
 *     a per-MapID overlay artifact under src/artifacts/firered/maps/MAPID_*.json.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const MAPS = path.join(ROOT, 'src/artifacts/firered/maps');
const TILESETS_DIR = path.join(ROOT, 'src/artifacts/firered/tilesets');
const FR_MAPS_DIR = path.join(ROOT, 'pokefirered_dissasembly/data/maps');
const OUT  = path.join(ROOT, 'src/data/firered/indoorMaps.generated.ts');
const ID_OUT = path.join(ROOT, 'src/data/firered/mapIds.generated.ts');

function tilesetSlug(label) {
  return label
    .replace(/^gTileset_/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/([A-Za-z])([0-9])/g, '$1_$2')
    .toLowerCase();
}

function loadAttrs(tilesetLabel) {
  const slug = tilesetSlug(tilesetLabel);
  const attrPath = path.join(TILESETS_DIR, slug, 'attributes.json');
  if (!fs.existsSync(attrPath)) return null;
  return JSON.parse(fs.readFileSync(attrPath, 'utf8'));
}

function resolveBehaviorGrid(layoutData) {
  const primary = loadAttrs(layoutData.primaryTileset);
  const secondary = layoutData.secondaryTileset ? loadAttrs(layoutData.secondaryTileset) : null;
  if (!primary && !secondary) return null;
  const h = layoutData.height, w = layoutData.width;
  const behavior = Array.from({ length: h }, () => new Array(w).fill(0));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const metaId = layoutData.grid[y][x];
      if (metaId >= 640) {
        const localId = metaId - 640;
        if (secondary && localId < secondary.length) behavior[y][x] = secondary[localId].behavior;
      } else {
        if (primary && metaId < primary.length) behavior[y][x] = primary[metaId].behavior;
      }
    }
  }
  return behavior;
}

// MapID (our internal enum) → FireRed layout/map.
const MAP_ID_TO_FIRERED = {
  PLAYERS_HOUSE_1F:    'LAYOUT_PALLET_TOWN_PLAYERS_HOUSE_1F',
  PLAYERS_HOUSE_2F:    'LAYOUT_PALLET_TOWN_PLAYERS_HOUSE_2F',
  RIVALS_HOUSE:        'LAYOUT_PALLET_TOWN_RIVALS_HOUSE',
  OAKS_LAB:            'LAYOUT_PALLET_TOWN_PROFESSOR_OAKS_LAB',

  // Per-city Pokémon Centers (all share LAYOUT_POKEMON_CENTER_1F).
  POKECENTER_VIRIDIAN:  { layout: 'LAYOUT_POKEMON_CENTER_1F', map: 'MAP_VIRIDIAN_CITY_POKEMON_CENTER_1F' },
  POKECENTER_PEWTER:    { layout: 'LAYOUT_POKEMON_CENTER_1F', map: 'MAP_PEWTER_CITY_POKEMON_CENTER_1F' },
  POKECENTER_CERULEAN:  { layout: 'LAYOUT_POKEMON_CENTER_1F', map: 'MAP_CERULEAN_CITY_POKEMON_CENTER_1F' },
  POKECENTER_LAVENDER:  { layout: 'LAYOUT_POKEMON_CENTER_1F', map: 'MAP_LAVENDER_TOWN_POKEMON_CENTER_1F' },
  POKECENTER_VERMILION: { layout: 'LAYOUT_POKEMON_CENTER_1F', map: 'MAP_VERMILION_CITY_POKEMON_CENTER_1F' },
  POKECENTER_CELADON:   { layout: 'LAYOUT_POKEMON_CENTER_1F', map: 'MAP_CELADON_CITY_POKEMON_CENTER_1F' },
  POKECENTER_FUCHSIA:   { layout: 'LAYOUT_POKEMON_CENTER_1F', map: 'MAP_FUCHSIA_CITY_POKEMON_CENTER_1F' },
  POKECENTER_SAFFRON:   { layout: 'LAYOUT_POKEMON_CENTER_1F', map: 'MAP_SAFFRON_CITY_POKEMON_CENTER_1F' },
  POKECENTER_CINNABAR:  { layout: 'LAYOUT_POKEMON_CENTER_1F', map: 'MAP_CINNABAR_ISLAND_POKEMON_CENTER_1F' },
  POKECENTER_ROUTE4:    { layout: 'LAYOUT_POKEMON_CENTER_1F', map: 'MAP_ROUTE4_POKEMON_CENTER_1F' },
  POKECENTER_ROUTE10:   { layout: 'LAYOUT_POKEMON_CENTER_1F', map: 'MAP_ROUTE10_POKEMON_CENTER_1F' },

  // Per-city Marts (all share LAYOUT_MART).
  POKEMART_VIRIDIAN:  { layout: 'LAYOUT_MART', map: 'MAP_VIRIDIAN_CITY_MART' },
  POKEMART_PEWTER:    { layout: 'LAYOUT_MART', map: 'MAP_PEWTER_CITY_MART' },
  POKEMART_CERULEAN:  { layout: 'LAYOUT_MART', map: 'MAP_CERULEAN_CITY_MART' },
  POKEMART_LAVENDER:  { layout: 'LAYOUT_MART', map: 'MAP_LAVENDER_TOWN_MART' },
  POKEMART_VERMILION: { layout: 'LAYOUT_MART', map: 'MAP_VERMILION_CITY_MART' },
  POKEMART_FUCHSIA:   { layout: 'LAYOUT_MART', map: 'MAP_FUCHSIA_CITY_MART' },
  POKEMART_SAFFRON:   { layout: 'LAYOUT_MART', map: 'MAP_SAFFRON_CITY_MART' },
  POKEMART_CINNABAR:  { layout: 'LAYOUT_MART', map: 'MAP_CINNABAR_ISLAND_MART' },

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

  VIRIDIAN_FOREST:        'LAYOUT_VIRIDIAN_FOREST',
};

// Index pokefirered map.json files by their `id` (e.g. MAP_PEWTER_CITY_MART)
// so we can fetch per-map events for shared-layout overlays.
const fireredMapById = {};
for (const dir of fs.readdirSync(FR_MAPS_DIR)) {
  const mapJsonPath = path.join(FR_MAPS_DIR, dir, 'map.json');
  if (!fs.existsSync(mapJsonPath)) continue;
  try {
    const data = JSON.parse(fs.readFileSync(mapJsonPath, 'utf8'));
    if (data.id) fireredMapById[data.id] = data;
  } catch {/* ignore unparseable */}
}

function normalizeMeta(rawMap) {
  return {
    id: rawMap.id,
    name: rawMap.name,
    layout: rawMap.layout,
    music: rawMap.music ?? null,
    map_type: rawMap.map_type ?? null,
    region_map_section: rawMap.region_map_section ?? null,
    connections: rawMap.connections ?? [],
    object_events: rawMap.object_events ?? [],
    warp_events: rawMap.warp_events ?? [],
    coord_events: rawMap.coord_events ?? [],
    bg_events: rawMap.bg_events ?? [],
  };
}

const importLines = [];
const exportLines = [];
const entryEntries = [];
const reverseEntries = [];
const issues = [];

for (const [mapId, value] of Object.entries(MAP_ID_TO_FIRERED)) {
  const layoutId = typeof value === 'string' ? value : value.layout;
  const overrideMapId = typeof value === 'string' ? null : value.map;
  const fireredMapId = overrideMapId ?? layoutId.replace(/^LAYOUT_/, 'MAP_');

  const layoutPath = path.join(MAPS, `${layoutId}.json`);
  if (!fs.existsSync(layoutPath)) {
    issues.push(`${mapId}: FireRed layout ${layoutId}.json not found`);
    continue;
  }

  const importIdent = `firered_${mapId.toLowerCase()}`;
  let artifactRel; // path used in the import statement
  let entryCoord = null;

  if (overrideMapId) {
    // Shared-layout: write a per-MapID overlay artifact combining the layout
    // grid with the per-map events.
    const fireredMap = fireredMapById[overrideMapId];
    if (!fireredMap) {
      issues.push(`${mapId}: pokefirered map.json with id="${overrideMapId}" not found`);
      continue;
    }
    const layoutData = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
    const overlay = {
      ...layoutData,
      id: overrideMapId,        // surface the map id, not the layout id
      name: fireredMap.name,
      meta: normalizeMeta(fireredMap),
      behavior: layoutData.behavior ?? resolveBehaviorGrid(layoutData),
    };
    const overlayName = `MAPID_${mapId}.json`;
    fs.writeFileSync(path.join(MAPS, overlayName), JSON.stringify(overlay));
    artifactRel = `../../artifacts/firered/maps/${overlayName}`;
    const w = overlay.meta.warp_events?.[0];
    if (w) entryCoord = { x: w.x, y: w.y };
  } else {
    artifactRel = `../../artifacts/firered/maps/${layoutId}.json`;
    const layoutData = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
    const w = layoutData.meta?.warp_events?.[0];
    if (w) entryCoord = { x: w.x, y: w.y };
  }

  importLines.push(`import ${importIdent} from '${artifactRel}';`);
  exportLines.push(`  ${mapId}: fromFirered(${importIdent}),`);
  if (entryCoord) {
    entryEntries.push(`  ${mapId}: { x: ${entryCoord.x}, y: ${entryCoord.y} },  // FireRed warp_event[0]`);
  }
  reverseEntries.push(`  ${fireredMapId}: '${mapId}',`);
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
