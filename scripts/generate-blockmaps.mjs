#!/usr/bin/env node
/**
 * generate-blockmaps.mjs
 *
 * Reads pokered disassembly .blk files, headers, and object files to emit
 * canonical block-ID maps in the new JSON format.
 *
 * Usage:
 *   node scripts/generate-blockmaps.mjs           # all 225 maps
 *   node scripts/generate-blockmaps.mjs --only PalletTown
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const POKERED = path.join(ROOT, 'pokered_dissasembly');
const BLK_DIR = path.join(POKERED, 'maps');
const OBJ_DIR = path.join(POKERED, 'data/maps/objects');
const HEADERS_DIR = path.join(POKERED, 'data/maps/headers');
const CONSTANTS_FILE = path.join(POKERED, 'constants/map_constants.asm');
const MAPS_OUT = path.join(ROOT, 'src/artifacts/maps');

// ══════════════════════════════════════════════════════════════════════
// 1. Parse map dimensions from constants
// ══════════════════════════════════════════════════════════════════════
const dims = {};
const consts = fs.readFileSync(CONSTANTS_FILE, 'utf8');
const reDims = /map_const\s+(\w+),\s*(\d+),\s*(\d+)/g;
let m;
while ((m = reDims.exec(consts))) {
  dims[m[1]] = { w: parseInt(m[2], 10), h: parseInt(m[3], 10) };
}

// ══════════════════════════════════════════════════════════════════════
// 2. Parse headers → tileset per map
// ══════════════════════════════════════════════════════════════════════
const mapHeaders = {}; // mapID → { blkName, tileset }
const blkToMapID = {}; // blkName → mapID
const mapIDToBlk = {}; // mapID → blkName

// Several tileset constants in pokered share the same .bst file (see
// pokered_dissasembly/gfx/tilesets.asm). Normalize aliases to a single
// blockset name so the parser can find pre-extracted assets.
const TILESET_ALIASES = {
  REDS_HOUSE_1: 'REDS_HOUSE',
  REDS_HOUSE_2: 'REDS_HOUSE',
  DOJO: 'GYM',
  MART: 'POKECENTER',
  FOREST_GATE: 'GATE',
  MUSEUM: 'GATE',
};

for (const file of fs.readdirSync(HEADERS_DIR)) {
  const content = fs.readFileSync(path.join(HEADERS_DIR, file), 'utf8');
  const match = content.match(/map_header\s+(\w+),\s*(\w+),\s*(\w+),/);
  if (!match) continue;
  const [_, blkName, mapID, tileset] = match;
  const tilesetName = tileset.toUpperCase();
  mapHeaders[mapID] = { blkName, tileset: TILESET_ALIASES[tilesetName] || tilesetName };
  blkToMapID[blkName] = mapID;
  mapIDToBlk[mapID] = blkName;
}

// ══════════════════════════════════════════════════════════════════════
// 3. Parse object files → border block, warps, bg_events (signs)
// ══════════════════════════════════════════════════════════════════════

function parseObjectFile(blkName) {
  const asmPath = path.join(OBJ_DIR, `${blkName}.asm`);
  if (!fs.existsSync(asmPath)) return null;

  const content = fs.readFileSync(asmPath, 'utf8');

  // Border block: db $X ; border block
  const borderMatch = content.match(/db\s+\$([0-9a-fA-F]+)\s*;\s*border block/);
  const borderBlock = borderMatch ? parseInt(borderMatch[1], 16) : 0;

  // Warps: warp_event x, y, targetMap, warpId
  const warps = [];
  const warpRe = /warp_event\s+(\d+),\s*(\d+),\s*(\w+),\s*(\d+)/g;
  let wm;
  while ((wm = warpRe.exec(content)) !== null) {
    warps.push({
      x: parseInt(wm[1], 10),
      y: parseInt(wm[2], 10),
      targetMap: wm[3],
      warpId: parseInt(wm[4], 10),
    });
  }

  // BG events (signs): bg_event x, y, textId
  const objects = [];
  const bgRe = /bg_event\s+(\d+),\s*(\d+),\s*(\w+)/g;
  let bm;
  while ((bm = bgRe.exec(content)) !== null) {
    objects.push({
      x: parseInt(bm[1], 10),
      y: parseInt(bm[2], 10),
      text: bm[3],
    });
  }

  return { borderBlock, warps, objects };
}

// ══════════════════════════════════════════════════════════════════════
// 4. Resolve warp landing positions
// ══════════════════════════════════════════════════════════════════════

function resolveZoneName(zone) {
  return {
    'REDS_HOUSE_1F': 'PLAYERS_HOUSE_1F',
    'REDS_HOUSE_2F': 'PLAYERS_HOUSE_2F',
    'BLUES_HOUSE': 'RIVALS_HOUSE',
  }[zone] || zone;
}

function resolveWarp(w, _sourceMapID) {
  const targetMap = resolveZoneName(w.targetMap);
  let targetPos = undefined;

  // Find target map's blk name
  const targetBlk = mapIDToBlk[w.targetMap];
  if (targetBlk && w.warpId > 0) {
    const targetObj = parseObjectFile(targetBlk);
    if (targetObj && w.warpId <= targetObj.warps.length) {
      const tw = targetObj.warps[w.warpId - 1];
      // Land on the destination warp tile itself. Pokered's behavior: warps
      // trigger on stepping ONTO the tile, not while stationary on it, so the
      // player can stand on a door/staircase after teleporting and walk off
      // without immediately re-warping. This is canonical for both door
      // warps (interior bottom row) and stair warps (no displacement).
      targetPos = { x: tw.x, y: tw.y };
    }
  }

  const warpObj = { x: w.x, y: w.y, targetMap };
  if (targetPos) warpObj.targetPos = targetPos;
  return warpObj;
}

// ══════════════════════════════════════════════════════════════════════
// 5. Generate map JSON
// ══════════════════════════════════════════════════════════════════════

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;

if (!fs.existsSync(MAPS_OUT)) fs.mkdirSync(MAPS_OUT, { recursive: true });

let generated = 0;
let skipped = 0;

for (const [mapID, header] of Object.entries(mapHeaders)) {
  const { blkName, tileset } = header;

  // Skip if --only specified
  if (only && blkName !== only) continue;

  const dim = dims[mapID];
  if (!dim) {
    console.warn(`  Skip ${mapID}: no dimensions in map_constants.asm`);
    skipped++;
    continue;
  }

  const blkPath = path.join(BLK_DIR, `${blkName}.blk`);
  if (!fs.existsSync(blkPath)) {
    console.warn(`  Skip ${mapID}: no .blk file`);
    skipped++;
    continue;
  }

  // Read raw block data
  const blkData = fs.readFileSync(blkPath);
  const expectedSize = dim.w * dim.h;
  if (blkData.length !== expectedSize) {
    console.warn(`  Skip ${mapID}: .blk size mismatch (${blkData.length} vs ${expectedSize})`);
    skipped++;
    continue;
  }

  // Build blocks[y][x]
  const blocks = [];
  for (let y = 0; y < dim.h; y++) {
    const row = [];
    for (let x = 0; x < dim.w; x++) {
      row.push(blkData[y * dim.w + x]);
    }
    blocks.push(row);
  }

  // Parse objects
  const objData = parseObjectFile(blkName) || { borderBlock: 0, warps: [], objects: [] };

  // Resolve warps
  const warps = objData.warps.map(w => resolveWarp(w, mapID));

  // Build output
  const outJson = {
    _comment: `AUTOGENERATED FROM pokered_dissasembly/maps/${blkName}.blk`,
    blockset: tileset,
    borderBlock: objData.borderBlock,
    width: dim.w,
    height: dim.h,
    blocks,
    warps,
    objects: objData.objects,
  };

  const outName = mapID.toLowerCase() + '.json';
  fs.writeFileSync(path.join(MAPS_OUT, outName), JSON.stringify(outJson, null, 2));
  generated++;
  if (only) console.log(`Generated ${outName} (${dim.w}x${dim.h} blocks, ${tileset})`);
}

console.log(`✓ generate-blockmaps.mjs: ${generated} maps generated, ${skipped} skipped.`);
if (only) {
  console.log(`  (only mode: ${only})`);
}
