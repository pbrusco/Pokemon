#!/usr/bin/env node
/**
 * stitch-firered-overworld.mjs
 *
 * Computes absolute world-coord offsets for every Kanto outdoor FireRed
 * layout by BFS-traversing each map's `connections` data, then emits a
 * stitched layout descriptor at:
 *
 *   src/artifacts/firered/maps/STITCHED_KANTO_OVERWORLD.json
 *
 * Output shape:
 *   {
 *     width, height,           // total stitched grid in tile units
 *     zones: [
 *       { layoutId, mapId, primaryTileset, secondaryTileset,
 *         offsetX, offsetY, width, height, warps[], objects[], bgs[] }
 *     ],
 *   }
 *
 * Fully programmatic — connection offsets come from the disassembly's
 * map.json files; no hardcoded coordinates.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const FIRERED_MAPS = path.join(ROOT, 'src/artifacts/firered/maps');
const FIRERED_TILESETS = path.join(ROOT, 'src/artifacts/firered/tilesets');
const OUT = path.join(FIRERED_MAPS, 'STITCHED_KANTO_OVERWORLD.json');

// Water behavior bytes from pokefirered/include/constants/metatile_behaviors.h
const WATER_BEHAVIORS = new Set([0x10, 0x11, 0x12, 0x13, 0x15, 0x16, 0x17, 0x19, 0x1A, 0x1B]);

// Metatile split: 0-639 = primary, 640+ = secondary
const NUM_METATILES_IN_PRIMARY = 640;

function tilesetSlug(label) {
  return label
    .replace(/^gTileset_/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/([A-Za-z])([0-9])/g, '$1_$2')
    .toLowerCase();
}

// Cache loaded attribute arrays by tileset slug
const attrCache = new Map();

function loadAttrs(tilesetLabel) {
  const slug = tilesetSlug(tilesetLabel);
  if (attrCache.has(slug)) return attrCache.get(slug);
  const attrPath = path.join(FIRERED_TILESETS, slug, 'attributes.json');
  if (!fs.existsSync(attrPath)) return null;
  const attrs = JSON.parse(fs.readFileSync(attrPath, 'utf8'));
  attrCache.set(slug, attrs);
  return attrs;
}

function buildBehaviorGrid(layout) {
  const primaryAttrs = loadAttrs(layout.primaryTileset);
  const secondaryAttrs = loadAttrs(layout.secondaryTileset);
  if (!primaryAttrs && !secondaryAttrs) return null;
  const h = layout.height, w = layout.width;
  const behavior = Array.from({ length: h }, () => new Array(w).fill(0));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const metaId = layout.grid[y][x];
      if (metaId >= NUM_METATILES_IN_PRIMARY) {
        const localId = metaId - NUM_METATILES_IN_PRIMARY;
        if (secondaryAttrs && localId < secondaryAttrs.length) {
          behavior[y][x] = secondaryAttrs[localId].behavior;
        }
      } else {
        if (primaryAttrs && metaId < primaryAttrs.length) {
          behavior[y][x] = primaryAttrs[metaId].behavior;
        }
      }
    }
  }
  return behavior;
}

// Outdoor map types per pokefirered/include/constants/map_types.h.
// VIRIDIAN_FOREST is type UNDERGROUND but we still want it stitched, so
// keep it as an explicit allow.
const OUTDOOR_MAP_TYPES = new Set(['MAP_TYPE_TOWN', 'MAP_TYPE_CITY', 'MAP_TYPE_ROUTE']);
const ALWAYS_OUTDOOR = new Set(['MAP_VIRIDIAN_FOREST']);
function isOutdoor(layout) {
  if (!layout?.meta) return false;
  return OUTDOOR_MAP_TYPES.has(layout.meta.map_type) || ALWAYS_OUTDOOR.has(layout.meta.id);
}

// FireRed sometimes uses a "connection stub" — a smaller version of a city
// used to align route connections — alongside the full-size city map. The
// routes connect to the stub; the city renders on top.
//   stub map ID  →  full city map ID (rendered overlay)
const STUB_TO_CITY = {
  MAP_SAFFRON_CITY_CONNECTION: 'MAP_SAFFRON_CITY',
};
const CITY_TO_STUB = Object.fromEntries(Object.entries(STUB_TO_CITY).map(([s, c]) => [c, s]));

// Build mapId → layout-record index by scanning every layout JSON we extracted.
// We index ALL maps (outdoor + indoor) so the BFS can discover what's outdoor
// purely from the map_type field.
const layoutsByMapId = new Map();
const layoutFiles = fs.readdirSync(FIRERED_MAPS).filter(f => f.startsWith('LAYOUT_') && f.endsWith('.json'));
for (const f of layoutFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(FIRERED_MAPS, f), 'utf8'));
  if (!data.meta?.id) continue;
  // Skip the bigger city when it has a stub — the stub is what routes
  // connect to. We re-introduce the city later as a render overlay.
  if (CITY_TO_STUB[data.meta.id]) continue;
  layoutsByMapId.set(data.meta.id, { ...data, layoutFile: f });
}

if (!layoutsByMapId.has('MAP_PALLET_TOWN')) {
  console.error('FATAL: MAP_PALLET_TOWN not found in FireRed layouts');
  process.exit(1);
}

// BFS placement. Pallet Town anchors at a placeholder origin; we shift to
// non-negative coords at the end.
const placed = new Map(); // mapId → { x, y, w, h, layout }
const queue = [];

function place(mapId, x, y) {
  const layout = layoutsByMapId.get(mapId);
  if (!layout) return;
  if (placed.has(mapId)) return;
  if (!isOutdoor(layout)) return;
  placed.set(mapId, { x, y, w: layout.width, h: layout.height, layout });
  queue.push(mapId);
}

place('MAP_PALLET_TOWN', 0, 0);

// Reverse-connection lookup: pokefirered occasionally lists asymmetric
// connections — e.g. Route 5 says it connects "down" to SAFFRON_CITY_CONNECTION
// (a gate), but Saffron City itself says "up" to Route 5. To stitch maps that
// only declare the link from their own side, we build the reverse index too.
function reverseConnectionsToPlaced(unplacedMapId) {
  const layout = layoutsByMapId.get(unplacedMapId);
  if (!layout?.meta?.connections) return null;
  for (const c of layout.meta.connections) {
    if (!placed.has(c.map)) continue;
    // Place `unplacedMapId` relative to `c.map`. The connection direction is
    // FROM unplacedMapId TO c.map, so we invert it.
    const anchor = placed.get(c.map);
    const w = layout.width, h = layout.height;
    if (c.direction === 'up')    return { x: anchor.x - c.offset, y: anchor.y + anchor.h };
    if (c.direction === 'down')  return { x: anchor.x - c.offset, y: anchor.y - h };
    if (c.direction === 'left')  return { x: anchor.x + anchor.w, y: anchor.y - c.offset };
    if (c.direction === 'right') return { x: anchor.x - w, y: anchor.y - c.offset };
  }
  return null;
}

while (queue.length) {
  const mapId = queue.shift();
  const me = placed.get(mapId);
  const conns = me.layout.meta?.connections ?? [];
  for (const c of conns) {
    const cMapId = c.map;
    const neighbor = layoutsByMapId.get(cMapId);
    if (!neighbor) continue;
    if (!isOutdoor(neighbor)) continue;
    if (placed.has(c.map)) continue;

    // FireRed convention:
    //   direction "up"    → neighbor sits above me, neighbor.x = me.x + offset, neighbor.y = me.y - neighbor.h
    //   direction "down"  → neighbor sits below me, neighbor.x = me.x + offset, neighbor.y = me.y + me.h
    //   direction "left"  → neighbor sits left of me, neighbor.x = me.x - neighbor.w, neighbor.y = me.y + offset
    //   direction "right" → neighbor sits right of me, neighbor.x = me.x + me.w, neighbor.y = me.y + offset
    let nx = 0, ny = 0;
    if (c.direction === 'up')    { nx = me.x + c.offset; ny = me.y - neighbor.height; }
    if (c.direction === 'down')  { nx = me.x + c.offset; ny = me.y + me.h; }
    if (c.direction === 'left')  { nx = me.x - neighbor.width; ny = me.y + c.offset; }
    if (c.direction === 'right') { nx = me.x + me.w; ny = me.y + c.offset; }

    place(cMapId, nx, ny);
  }
}

// Second pass: place maps whose connection links are only declared from their
// own side (the routes point to gates instead of to them). Loop until no
// progress so a chain of asymmetric maps still resolves in dependency order.
let progressed = true;
while (progressed) {
  progressed = false;
  for (const [id, layout] of layoutsByMapId.entries()) {
    if (placed.has(id)) continue;
    if (!isOutdoor(layout)) continue;
    const pos = reverseConnectionsToPlaced(id);
    if (!pos) continue;
    place(id, pos.x, pos.y);
    progressed = true;
  }
}

// Shift all coords so the world is non-negative.
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const z of placed.values()) {
  minX = Math.min(minX, z.x);
  minY = Math.min(minY, z.y);
  maxX = Math.max(maxX, z.x + z.w);
  maxY = Math.max(maxY, z.y + z.h);
}
const dx = -minX, dy = -minY;
const totalW = maxX + dx;
const totalH = maxY + dy;

// Resolve each FireRed zone into the stitched output. Local warps + bg/object
// events are translated to world coords.
function buildZone(mapId, layout, x, y, w, h) {
  return {
    mapId,
    layoutId: layout.id,
    primaryTileset: layout.primaryTileset,
    secondaryTileset: layout.secondaryTileset,
    offsetX: x + dx,
    offsetY: y + dy,
    width: w,
    height: h,
    // Embed the full layout payload so the runtime bridge + renderer don't
    // need to reload each layout JSON separately. This makes the stitched
    // descriptor self-contained at the cost of duplicating data.
    layout: {
      id: layout.id,
      width: layout.width,
      height: layout.height,
      primaryTileset: layout.primaryTileset,
      secondaryTileset: layout.secondaryTileset,
      grid: layout.grid,
      collision: layout.collision,
      elevation: layout.elevation,
      behavior: buildBehaviorGrid(layout),
    },
    warps: (layout.meta?.warp_events ?? []).map(wx => ({ ...wx, worldX: x + dx + wx.x, worldY: y + dy + wx.y })),
    objects: (layout.meta?.object_events ?? []).map(o => ({ ...o, worldX: x + dx + o.x, worldY: y + dy + o.y })),
    bgs: (layout.meta?.bg_events ?? []).map(b => ({ ...b, worldX: x + dx + b.x, worldY: y + dy + b.y })),
  };
}

const zones = [];
const skipped = [];
for (const [mapId, z] of placed.entries()) {
  zones.push(buildZone(mapId, z.layout, z.x, z.y, z.w, z.h));

  // For "stub" cities (e.g. SAFFRON_CITY_CONNECTION), add the full-size
  // city as a render overlay at the same origin so the bigger map's tiles
  // (gardens, copycat house, gym, etc.) appear on top of the stub. Routes
  // that overshoot into the overlay are visually masked.
  const cityId = STUB_TO_CITY[mapId];
  if (cityId) {
    const cityFile = path.join(FIRERED_MAPS, `LAYOUT_${cityId.replace(/^MAP_/, '')}.json`);
    if (fs.existsSync(cityFile)) {
      const cityLayout = JSON.parse(fs.readFileSync(cityFile, 'utf8'));
      zones.push(buildZone(cityId, cityLayout, z.x, z.y, cityLayout.width, cityLayout.height));
    }
  }
}
// Outdoor maps that have a layout but weren't reached by BFS — they're
// disconnected from Pallet Town in the data (e.g., One Island after the
// Pokémon League). We surface them so any future migration knows.
for (const [id, layout] of layoutsByMapId.entries()) {
  if (placed.has(id)) continue;
  if (!isOutdoor(layout)) continue;
  // Skip non-Kanto regions: Sevii, Battle Frontier, etc. Those are reachable
  // only via ferry warps so they're never connected via overworld edges.
  // We just don't count them as skipped.
  const sec = layout.meta?.region_map_section;
  // Filter out Sevii/Safari/Mt Ember/etc. — they're separate regions reached
  // by ferry, not part of the Kanto mainland stitch.
  if (!sec) continue;
  const NON_KANTO_SECTION_PATTERNS = [
    'SEVII', 'NAVEL', 'BIRTH', 'TANOBY', 'BOND', 'TRAINER_TOWER', 'UNDEFINED',
    'ONE_ISLE', 'TWO_ISLE', 'THREE_ISLE', 'FOUR_ISLE', 'FIVE_ISLE', 'SIX_ISLE', 'SEVEN_ISLE',
    'ONE_ISLAND', 'TWO_ISLAND', 'THREE_ISLAND', 'FOUR_ISLAND', 'FIVE_ISLAND', 'SIX_ISLAND', 'SEVEN_ISLAND',
    'KINDLE_ROAD', 'KANTO_SAFARI_ZONE', 'MT_EMBER',
    'CAPE_BRINK', 'TREASURE_BEACH', 'WATER_LABYRINTH', 'RESORT_GORGEOUS',
    'OUTCAST_ISLAND', 'GREEN_PATH', 'WATER_PATH', 'RUIN_VALLEY', 'PATTERN_BUSH',
    'SEVAULT_CANYON', 'BERRY_FOREST', 'MEMORIAL_PILLAR', 'TANOBY', 'CANYON_ENTRANCE',
  ];
  if (NON_KANTO_SECTION_PATTERNS.some(p => sec.includes(p))) continue;
  // Special case: Viridian Forest is dungeon-style outdoor — only entered
  // through gates, no overworld connection. Don't list it as skipped.
  if (id === 'MAP_VIRIDIAN_FOREST') continue;
  skipped.push(id);
}

zones.sort((a, b) => a.offsetY - b.offsetY || a.offsetX - b.offsetX);

const out = {
  _comment: 'AUTOGENERATED FROM stitch-firered-overworld.mjs',
  width: totalW,
  height: totalH,
  zones,
  skipped,
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

// Emit a TS file with zone offsets so npcDatabase / world.ts pick them up
// without ever hand-maintaining offsets again. Keys match our internal MapID
// enum (the legacy zone names).
const FIRERED_TO_OURS = {
  MAP_PALLET_TOWN: 'PALLET_TOWN',
  MAP_VIRIDIAN_CITY: 'VIRIDIAN_CITY',
  MAP_PEWTER_CITY: 'PEWTER_CITY',
  MAP_CERULEAN_CITY: 'CERULEAN_CITY',
  MAP_LAVENDER_TOWN: 'LAVENDER_TOWN',
  MAP_VERMILION_CITY: 'VERMILION_CITY',
  MAP_CELADON_CITY: 'CELADON_CITY',
  MAP_FUCHSIA_CITY: 'FUCHSIA_CITY',
  MAP_CINNABAR_ISLAND: 'CINNABAR_ISLAND',
  MAP_INDIGO_PLATEAU_EXTERIOR: 'INDIGO_PLATEAU',
  MAP_SAFFRON_CITY: 'SAFFRON_CITY',
  MAP_ROUTE1: 'ROUTE_1', MAP_ROUTE2: 'ROUTE_2', MAP_ROUTE3: 'ROUTE_3',
  MAP_ROUTE4: 'ROUTE_4', MAP_ROUTE5: 'ROUTE_5', MAP_ROUTE6: 'ROUTE_6',
  MAP_ROUTE7: 'ROUTE_7', MAP_ROUTE8: 'ROUTE_8', MAP_ROUTE9: 'ROUTE_9',
  MAP_ROUTE10: 'ROUTE_10', MAP_ROUTE11: 'ROUTE_11', MAP_ROUTE12: 'ROUTE_12',
  MAP_ROUTE13: 'ROUTE_13', MAP_ROUTE14: 'ROUTE_14', MAP_ROUTE15: 'ROUTE_15',
  MAP_ROUTE16: 'ROUTE_16', MAP_ROUTE17: 'ROUTE_17', MAP_ROUTE18: 'ROUTE_18',
  MAP_ROUTE19: 'ROUTE_19', MAP_ROUTE20: 'ROUTE_20',
  MAP_ROUTE21_NORTH: 'ROUTE_21', MAP_ROUTE22: 'ROUTE_22',
  MAP_ROUTE23: 'ROUTE_23', MAP_ROUTE24: 'ROUTE_24', MAP_ROUTE25: 'ROUTE_25',
};
const offsetEntries = zones
  .filter(z => FIRERED_TO_OURS[z.mapId])
  .map(z => `  ${FIRERED_TO_OURS[z.mapId]}: { x: ${z.offsetX}, y: ${z.offsetY}, w: ${z.width}, h: ${z.height} },`)
  .sort()
  .join('\n');
const tsOut = path.join(ROOT, 'src/data/firered/kantoZoneOffsets.generated.ts');
fs.mkdirSync(path.dirname(tsOut), { recursive: true });
fs.writeFileSync(
  tsOut,
  `// AUTOGENERATED by scripts/stitch-firered-overworld.mjs — do not edit.\n` +
  `// Offsets are computed by BFS through pokefirered's connection graph.\n\n` +
  `export const KANTO_FIRERED_ZONE_OFFSETS = {\n${offsetEntries}\n} as const;\n` +
  `\nexport const KANTO_FIRERED_WORLD_SIZE = { width: ${totalW}, height: ${totalH} } as const;\n`
);

console.log(`✓ stitch-firered-overworld: ${zones.length} zones placed, ${totalW}×${totalH} tiles total.`);
console.log(`  → ${OUT}`);
console.log(`  → ${tsOut}`);
if (skipped.length) console.log(`  skipped (no path from PalletTown via connections): ${skipped.join(', ')}`);
