#!/usr/bin/env node
/**
 * build-firered-pipeline.mjs
 *
 * Fully programmatic map+tileset extractor for the pokefirered disassembly.
 * Produces zero-manual-step assets under src/artifacts/firered/:
 *
 *   src/artifacts/firered/tilesets/<name>/
 *     tiles.png            — indexed-color tile sheet (copy of pokefirered .png)
 *     palettes.json        — 16 × 16 RGB palette swaps (parsed from .pal)
 *     metatiles.json       — N × 8 tile-refs per metatile
 *     attributes.json      — N × {behavior, encounter, layerType, ...}
 *
 *   src/artifacts/firered/maps/<map_id>.json
 *     {
 *       id, name,
 *       width, height,
 *       primaryTileset, secondaryTileset,
 *       grid: number[height][width]   metatile IDs (10-bit)
 *       collision: number[height][width]  0..3
 *       elevation: number[height][width]  0..15
 *       border: number[bh][bw],
 *       events: { warps, objects, bgs, coords, connections },
 *     }
 *
 * Run:
 *   node scripts/build-firered-pipeline.mjs
 *   node scripts/build-firered-pipeline.mjs --only PalletTown
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const FR = path.join(ROOT, 'pokefirered_dissasembly');
const LAYOUTS_JSON = path.join(FR, 'data/layouts/layouts.json');
const TILESETS_PRIMARY = path.join(FR, 'data/tilesets/primary');
const TILESETS_SECONDARY = path.join(FR, 'data/tilesets/secondary');
const MAPS_DIR = path.join(FR, 'data/maps');

const OUT_ROOT = path.join(ROOT, 'src/artifacts/firered');
const OUT_TILESETS = path.join(OUT_ROOT, 'tilesets');
const OUT_MAPS = path.join(OUT_ROOT, 'maps');

const only = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1]
  : null;

// ─── Tileset name → directory mapping (one-time, derived from headers.h) ────
//
// gTileset_PalletTown → data/tilesets/secondary/pallet_town
// gTileset_General    → data/tilesets/primary/general
// We just slug the name.
function tilesetSlug(label) {
  // label = "gTileset_GenericBuilding1"  →  "GenericBuilding1"  →  "generic_building_1"
  // Insert underscore between camelCase boundaries AND between letters/digits.
  return label
    .replace(/^gTileset_/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')   // camelCase → camel_Case
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2') // ABCdef → AB_Cdef
    .replace(/([A-Za-z])([0-9])/g, '$1_$2') // letter→digit
    .toLowerCase();
}

function findTilesetDir(label) {
  const slug = tilesetSlug(label);
  for (const root of [TILESETS_PRIMARY, TILESETS_SECONDARY]) {
    const p = path.join(root, slug);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
  }
  return null;
}

// ─── Palette parser (.pal JASC format) ───────────────────────────────────────
function parsePal(palText) {
  const lines = palText.trim().split(/\r?\n/);
  if (lines[0].trim() !== 'JASC-PAL') throw new Error('not JASC-PAL');
  const count = parseInt(lines[2], 10);
  const out = [];
  for (let i = 0; i < count; i++) {
    const [r, g, b] = lines[3 + i].trim().split(/\s+/).map(n => parseInt(n, 10));
    out.push([r, g, b]);
  }
  return out;
}

function loadPalettes(tilesetDir) {
  const palDir = path.join(tilesetDir, 'palettes');
  if (!fs.existsSync(palDir)) return [];
  const out = [];
  for (let i = 0; i < 16; i++) {
    const p = path.join(palDir, `${String(i).padStart(2, '0')}.pal`);
    out.push(fs.existsSync(p) ? parsePal(fs.readFileSync(p, 'utf8')) : null);
  }
  return out;
}

// ─── Metatile parser (.bin) ──────────────────────────────────────────────────
// Each metatile is 8 tile-refs of 2 bytes. Format per tile-ref (uint16 LE):
//   bits 0-9   tile id (10 bits = 1024 tiles)
//   bit 10     hflip
//   bit 11     vflip
//   bits 12-15 palette slot (16)
function parseMetatiles(buf) {
  const out = [];
  for (let i = 0; i < buf.length; i += 16) {
    const tiles = [];
    for (let t = 0; t < 8; t++) {
      const v = buf.readUInt16LE(i + t * 2);
      tiles.push({
        tile: v & 0x3ff,
        hflip: (v >> 10) & 1,
        vflip: (v >> 11) & 1,
        palette: (v >> 12) & 0xf,
      });
    }
    out.push(tiles);
  }
  return out;
}

// ─── Metatile attributes (.bin, 4 bytes per metatile in FireRed) ─────────────
function parseAttrs(buf) {
  const out = [];
  for (let i = 0; i < buf.length; i += 4) {
    const v = buf.readUInt32LE(i);
    out.push({
      behavior:   v        & 0xff,
      terrain:   (v >> 8)  & 0xf,
      encounter: (v >> 16) & 0x7,
      layerType: (v >> 29) & 0x3,
    });
  }
  return out;
}

// ─── Tileset extractor ───────────────────────────────────────────────────────
function extractTileset(label) {
  const slug = tilesetSlug(label);
  const dir = findTilesetDir(label);
  if (!dir) {
    console.warn(`  tileset ${label} (slug=${slug}): no directory found, skipping`);
    return false;
  }
  const outDir = path.join(OUT_TILESETS, slug);
  fs.mkdirSync(outDir, { recursive: true });

  // 1. tiles.png — copy as-is (indexed PNG, browser will decode)
  const tilesPng = path.join(dir, 'tiles.png');
  if (fs.existsSync(tilesPng)) {
    fs.copyFileSync(tilesPng, path.join(outDir, 'tiles.png'));
  }

  // 2. palettes.json
  const palettes = loadPalettes(dir);
  fs.writeFileSync(path.join(outDir, 'palettes.json'), JSON.stringify(palettes));

  // 3. metatiles.json
  const metatilesBin = path.join(dir, 'metatiles.bin');
  if (fs.existsSync(metatilesBin)) {
    const metatiles = parseMetatiles(fs.readFileSync(metatilesBin));
    fs.writeFileSync(path.join(outDir, 'metatiles.json'), JSON.stringify(metatiles));
  }

  // 4. attributes.json
  const attrsBin = path.join(dir, 'metatile_attributes.bin');
  if (fs.existsSync(attrsBin)) {
    const attrs = parseAttrs(fs.readFileSync(attrsBin));
    fs.writeFileSync(path.join(outDir, 'attributes.json'), JSON.stringify(attrs));
  }

  return true;
}

// ─── Map extractor ───────────────────────────────────────────────────────────
function parseMapBin(buf, w, h) {
  const grid = [];
  const collision = [];
  const elevation = [];
  let i = 0;
  for (let y = 0; y < h; y++) {
    const gRow = [], cRow = [], eRow = [];
    for (let x = 0; x < w; x++) {
      const v = buf.readUInt16LE(i);
      i += 2;
      gRow.push(v & 0x3ff);
      cRow.push((v >> 10) & 0x3);
      eRow.push((v >> 12) & 0xf);
    }
    grid.push(gRow);
    collision.push(cRow);
    elevation.push(eRow);
  }
  return { grid, collision, elevation };
}

function extractLayout(layout) {
  // layout = entry from layouts.json
  const blockdata = path.join(FR, layout.blockdata_filepath);
  const borderdata = path.join(FR, layout.border_filepath);
  if (!fs.existsSync(blockdata)) {
    console.warn(`  layout ${layout.id}: no map.bin`);
    return null;
  }
  const buf = fs.readFileSync(blockdata);
  const expectedSize = layout.width * layout.height * 2;
  if (buf.length !== expectedSize) {
    console.warn(`  layout ${layout.id}: size mismatch (${buf.length} vs ${expectedSize}), skipping`);
    return null;
  }
  const { grid, collision, elevation } = parseMapBin(buf, layout.width, layout.height);

  let border = null;
  if (fs.existsSync(borderdata)) {
    const bbuf = fs.readFileSync(borderdata);
    const bw = layout.border_width ?? 2;
    const bh = layout.border_height ?? 2;
    if (bbuf.length === bw * bh * 2) {
      border = parseMapBin(bbuf, bw, bh).grid;
    }
  }

  return {
    id: layout.id,
    name: layout.name,
    width: layout.width,
    height: layout.height,
    borderWidth: layout.border_width,
    borderHeight: layout.border_height,
    primaryTileset: layout.primary_tileset,
    secondaryTileset: layout.secondary_tileset,
    grid,
    collision,
    elevation,
    border,
  };
}

// Resolve per-cell behavior from grid + tileset attributes.
// Water: 0x10-0x1B | Boulder: 0x20 | Grass/cave: 0x02,0x0B,0x0C,0x21
// Ledge: 0x38-0x3B | Signs/bookshelf: 0x81,0x84 | Machine: 0x83
function resolveBehaviorGrid(layout) {
  const primary = loadAttrsForTileset(layout.primaryTileset);
  const secondary = layout.secondaryTileset ? loadAttrsForTileset(layout.secondaryTileset) : null;
  if (!primary && !secondary) return null;

  const h = layout.height, w = layout.width;
  const behavior = Array.from({ length: h }, () => new Array(w).fill(0));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const metaId = layout.grid[y][x];
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

function loadAttrsForTileset(label) {
  const slug = label
    .replace(/^gTileset_/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/([A-Za-z])([0-9])/g, '$1_$2')
    .toLowerCase();
  const attrPath = path.join(OUT_TILESETS, slug, 'attributes.json');
  if (!fs.existsSync(attrPath)) return null;
  return JSON.parse(fs.readFileSync(attrPath, 'utf8'));
}

// ─── Map metadata (events / connections) ─────────────────────────────────────
function extractMapMeta(mapName) {
  const mapJson = path.join(MAPS_DIR, mapName, 'map.json');
  if (!fs.existsSync(mapJson)) return null;
  const data = JSON.parse(fs.readFileSync(mapJson, 'utf8'));
  return {
    id: data.id,
    name: data.name,
    layout: data.layout,
    music: data.music,
    map_type: data.map_type,
    region_map_section: data.region_map_section,
    connections: data.connections ?? [],
    object_events: data.object_events ?? [],
    warp_events: data.warp_events ?? [],
    coord_events: data.coord_events ?? [],
    bg_events: data.bg_events ?? [],
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_TILESETS, { recursive: true });
fs.mkdirSync(OUT_MAPS, { recursive: true });

const layoutsRoot = JSON.parse(fs.readFileSync(LAYOUTS_JSON, 'utf8'));
const allLayouts = layoutsRoot.layouts.filter(l => l && l.id && l.name);

// Build map_name → layout_id index from data/maps/<Name>/map.json
const mapNameByLayoutId = {};
for (const dir of fs.readdirSync(MAPS_DIR)) {
  const meta = extractMapMeta(dir);
  if (meta?.layout) mapNameByLayoutId[meta.layout] = dir;
}

const tilesetsToExtract = new Set();
let mapCount = 0, skipCount = 0;

for (const layout of allLayouts) {
  if (only && !layout.name.includes(only)) continue;
  const parsed = extractLayout(layout);
  if (!parsed) { skipCount++; continue; }

  tilesetsToExtract.add(layout.primary_tileset);
  if (layout.secondary_tileset) tilesetsToExtract.add(layout.secondary_tileset);

  const mapDir = mapNameByLayoutId[layout.id];
  const meta = mapDir ? extractMapMeta(mapDir) : null;

  const out = { ...parsed, meta, behavior: resolveBehaviorGrid(parsed) };
  const outPath = path.join(OUT_MAPS, `${layout.id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out));
  mapCount++;
}

let tilesetCount = 0;
for (const ts of tilesetsToExtract) {
  if (extractTileset(ts)) tilesetCount++;
}

console.log(`✓ build-firered-pipeline: ${mapCount} maps, ${tilesetCount} tilesets, ${skipCount} skipped.`);
