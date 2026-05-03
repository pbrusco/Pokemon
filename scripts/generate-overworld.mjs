#!/usr/bin/env node
/**
 * generate-overworld.mjs
 *
 * Reads the ACTUAL pokered disassembly data to generate overworld maps:
 *   - overworld.bst blockset (128 blocks × 16 tiles each = 4×4 tile grid)
 *   - Overworld_Coll collision data (which tile IDs are walkable)
 *   - Door, warp, grass, water, ledge tile definitions
 *
 * For each .blk map file, converts block IDs to 2×2 character grids
 * using the real tile data instead of hardcoded guesses.
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
// STEP 1: Read the REAL blockset from overworld.bst
// Each block = 16 bytes = 4×4 tile IDs
// ══════════════════════════════════════════════════════════════════════
const bstData = fs.readFileSync(path.join(POKERED, 'gfx/blocksets/overworld.bst'));
const NUM_BLOCKS = bstData.length / 16; // 128

const blocks = [];
for (let b = 0; b < NUM_BLOCKS; b++) {
  const tiles = [];
  for (let i = 0; i < 16; i++) tiles.push(bstData[b * 16 + i]);
  blocks.push(tiles);
}

// ══════════════════════════════════════════════════════════════════════
// STEP 2: Tile classification from disassembly source data
// ══════════════════════════════════════════════════════════════════════

// Walkable tile IDs (from data/tilesets/collision_tile_ids.asm → Overworld_Coll)
const walkable = new Set([
  0x00, 0x10, 0x1b, 0x20, 0x21, 0x23, 0x2c, 0x2d, 0x2e, 0x30,
  0x31, 0x33, 0x39, 0x3c, 0x3e, 0x52, 0x54, 0x58, 0x5b
]);

const GRASS_TILE = 0x52;  // tileset_headers.asm → Overworld grass=$52
const WATER_TILE = 0x14;  // engine/battle/wild_encounters.asm → all tilesets water=$14
const DOOR_TILES = new Set([0x1B, 0x58]); // door_tile_ids.asm → Overworld
const LEDGE_DOWN_TILES = new Set([0x36, 0x37]); // ledge_tiles.asm
const LEDGE_LEFT_TILES = new Set([0x27]);
const LEDGE_RIGHT_TILES = new Set([0x0D, 0x1D]);
const FLOWER_TILES = new Set([0x03, 0x04]);
const SIGN_TILES = new Set([0x24, 0x34]); // Sign post tile IDs
const FENCE_TILES = new Set([0x0E, 0x44, 0x45, 0x46, 0x47, 0x55, 0x56, 0x57]);
// Rocky coastline/cliff tiles — non-walkable terrain that borders water.
// These are NOT buildings despite being non-walkable. They must be classified
// separately to avoid the building heuristic turning shorelines into red roofs.
const COAST_TILES = new Set([
  0x2a, 0x2b, 0x3a, 0x3b, // Rocky cliff face tiles
  0x40, 0x41, 0x50, 0x51, // Cliff top/bottom edge tiles
]);

// ══════════════════════════════════════════════════════════════════════
// STEP 3: Structural analysis — identify building blocks from map data
//
// The Game Boy reuses the same tile graphics for tree canopies and
// building rooftops. They're literally the same tile IDs. The ONLY way
// to distinguish them is by looking at their structural context in maps.
//
// Strategy: scan ALL overworld .blk files to find which blocks appear
// adjacent to door-containing blocks. Those are building blocks.
// ══════════════════════════════════════════════════════════════════════

// Parse map dimensions
const dims = {};
const consts = fs.readFileSync(CONSTANTS_FILE, 'utf8');
const reDims = /map_const\s+(\w+),\s*(\d+),\s*(\d+)/g;
let mDims;
while ((mDims = reDims.exec(consts))) {
  dims[mDims[1]] = { w: parseInt(mDims[2], 10), h: parseInt(mDims[3], 10) };
}

const mapNames = {};
const overworldMaps = [];
for (const file of fs.readdirSync(HEADERS_DIR)) {
  const content = fs.readFileSync(path.join(HEADERS_DIR, file), 'utf8');
  const match = content.match(/map_header\s+(\w+),\s*(\w+),/);
  if (match) mapNames[match[2]] = match[1];
  if (content.includes(', OVERWORLD,') && match) {
    overworldMaps.push({ blkName: match[1], mapID: match[2] });
  }
}

// Find door-containing blocks
const doorBlocks = new Set();
for (let b = 0; b < NUM_BLOCKS; b++) {
  if (blocks[b].some(t => DOOR_TILES.has(t))) doorBlocks.add(b);
}

// Scan all overworld maps to find blocks adjacent to door blocks
const buildingBlockCounts = new Map(); // blockId -> number of times it appears next to a door block

for (const map of overworldMaps) {
  const dim = dims[map.mapID];
  if (!dim) continue;
  const blkPath = path.join(BLK_DIR, `${map.blkName}.blk`);
  if (!fs.existsSync(blkPath)) continue;
  const data = fs.readFileSync(blkPath);

  for (let y = 0; y < dim.h; y++) {
    for (let x = 0; x < dim.w; x++) {
      const bid = data[y * dim.w + x];
      if (!doorBlocks.has(bid)) continue;

      // Check all 8 neighbors + the block 2 above (for roofs)
      const neighbors = [
        [y-1, x], [y-2, x],  // above, 2 above (roof)
        [y+1, x],             // below
        [y, x-1], [y, x+1],  // left, right
        [y-1, x-1], [y-1, x+1], // diagonals above
      ];

      for (const [ny, nx] of neighbors) {
        if (ny >= 0 && ny < dim.h && nx >= 0 && nx < dim.w) {
          const nid = data[ny * dim.w + nx];
          buildingBlockCounts.set(nid, (buildingBlockCounts.get(nid) || 0) + 1);
        }
      }
    }
  }
}

// A block is classified as "building" if:
// 1. It appears near door blocks frequently enough (threshold >= 2)
// 2. It actually contains non-walkable, non-water tiles (i.e., it has solid content)
// This prevents pure path/grass blocks from being mis-classified.
const buildingBlocks = new Set();
for (const [bid, count] of buildingBlockCounts) {
  if (count >= 2 && !doorBlocks.has(bid)) {
    // Check if this block has any non-walkable, non-water, non-grass tiles
    const hasSolid = blocks[bid].some(t =>
      !walkable.has(t) && t !== WATER_TILE && !LEDGE_DOWN_TILES.has(t) &&
      !LEDGE_LEFT_TILES.has(t) && !LEDGE_RIGHT_TILES.has(t) &&
      !FLOWER_TILES.has(t) && !SIGN_TILES.has(t) && !FENCE_TILES.has(t) &&
      !COAST_TILES.has(t)
    );
    if (hasSolid) buildingBlocks.add(bid);
  }
}
// Door blocks themselves are also building blocks
for (const b of doorBlocks) buildingBlocks.add(b);

// ══════════════════════════════════════════════════════════════════════
// STEP 4: Classify each block's 2×2 quadrants
// ══════════════════════════════════════════════════════════════════════

function classifyTile(tileId) {
  if (tileId === WATER_TILE) return '~';
  if (tileId === GRASS_TILE) return 'G';
  if (DOOR_TILES.has(tileId)) return 'D';
  if (LEDGE_DOWN_TILES.has(tileId)) return 'L';
  if (LEDGE_LEFT_TILES.has(tileId)) return '<';
  if (LEDGE_RIGHT_TILES.has(tileId)) return '>';
  if (FLOWER_TILES.has(tileId)) return '*';
  if (SIGN_TILES.has(tileId)) return 'S';
  if (FENCE_TILES.has(tileId)) return '+';
  if (COAST_TILES.has(tileId)) return 'C'; // Coast/cliff — non-walkable terrain
  if (walkable.has(tileId)) return 'P';
  return 'X'; // Non-walkable, type TBD (tree or wall)
}

function classifyQuadrant(tiles4x4, qRow, qCol, blockId) {
  const t = [];
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      t.push(tiles4x4[(qRow * 2 + dy) * 4 + (qCol * 2 + dx)]);
    }
  }

  const chars = t.map(classifyTile);

  // Priority-based classification
  if (chars.includes('D')) return 'D';

  const waterCount = chars.filter(c => c === '~').length;
  if (waterCount >= 2) return '~';

  if (chars.includes('L')) return 'L';
  if (chars.includes('<')) return '<';
  if (chars.includes('>')) return '>';

  const grassCount = chars.filter(c => c === 'G').length;
  if (grassCount >= 2) return 'G';

  const flowerCount = chars.filter(c => c === '*').length;
  if (flowerCount >= 2) return '*';

  const signCount = chars.filter(c => c === 'S').length;
  if (signCount >= 1) return 'S';

  const fenceCount = chars.filter(c => c === '+').length;
  if (fenceCount >= 2) return '+';

  const walkCount = chars.filter(c => 'PG*SD'.includes(c)).length;
  if (walkCount >= 3) return 'P';

  // Coast/cliff quadrants → terrain (not building)
  const coastCount = chars.filter(c => c === 'C').length;
  if (coastCount >= 1) return 'T';

  // Non-walkable quadrant — is it a building wall or a tree?
  const unknownCount = chars.filter(c => c === 'X').length;
  if (unknownCount >= 1) {
    // Use the structural analysis: if this block is a building block, use 'W'
    if (buildingBlocks.has(blockId)) return 'W';
    return 'T'; // Default non-walkable = tree
  }

  if (walkCount >= 2) return 'P';
  return 'W';
}

// Build the 2×2 map for all 128 blocks
const map2x2 = [];
for (let b = 0; b < NUM_BLOCKS; b++) {
  const tiles = blocks[b];
  let tl = classifyQuadrant(tiles, 0, 0, b);
  let tr = classifyQuadrant(tiles, 0, 1, b);
  const bl = classifyQuadrant(tiles, 1, 0, b);
  const br = classifyQuadrant(tiles, 1, 1, b);

  if (buildingBlocks.has(b)) {
    // When bottom-half is W/D, force top-half to W (visual roof rows are not "path")
    if (bl === 'W' || bl === 'D') tl = 'W';
    if (br === 'W' || br === 'D') tr = 'W';
  }

  map2x2.push([tl + tr, bl + br]);
}

// Debug output
if (process.argv.includes('--debug')) {
  console.log('Door blocks:', [...doorBlocks].map(b => '0x' + b.toString(16).padStart(2, '0')).join(', '));
  console.log('Building blocks:', [...buildingBlocks].map(b => '0x' + b.toString(16).padStart(2, '0')).join(', '));
  console.log('');
  for (let b = 0; b < NUM_BLOCKS; b++) {
    console.log(`Block 0x${b.toString(16).padStart(2,'0')}: [${map2x2[b][0]}, ${map2x2[b][1]}] ${buildingBlocks.has(b) ? '(BUILDING)' : doorBlocks.has(b) ? '(DOOR)' : ''}`);
  }
  process.exit(0);
}

// ══════════════════════════════════════════════════════════════════════
// STEP 5: Warp parsing
// ══════════════════════════════════════════════════════════════════════

function parseWarps(asmPath) {
  if (!fs.existsSync(asmPath)) return [];
  const content = fs.readFileSync(asmPath, 'utf8');
  const warps = [];
  const re = /warp_event\s+(\d+),\s*(\d+),\s*(\w+),\s*(\d+)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    warps.push({ x: parseInt(m[1]), y: parseInt(m[2]), targetZone: m[3], warpId: parseInt(m[4]) });
  }
  return warps;
}

function resolveZoneName(zone) {
  return { 'REDS_HOUSE_1F': 'PLAYERS_HOUSE_1F', 'REDS_HOUSE_2F': 'PLAYERS_HOUSE_2F', 'BLUES_HOUSE': 'RIVALS_HOUSE' }[zone] || zone;
}

// ══════════════════════════════════════════════════════════════════════
// STEP 6: Generate all overworld map JSON files
// ══════════════════════════════════════════════════════════════════════

if (!fs.existsSync(MAPS_OUT)) fs.mkdirSync(MAPS_OUT, { recursive: true });

for (const map of overworldMaps) {
  const dim = dims[map.mapID];
  if (!dim) continue;

  const blkPath = path.join(BLK_DIR, `${map.blkName}.blk`);
  if (!fs.existsSync(blkPath)) continue;

  const blkData = fs.readFileSync(blkPath);
  const rows = [];
  for (let y = 0; y < dim.h; y++) {
    let rowTop = '';
    let rowBot = '';
    for (let x = 0; x < dim.w; x++) {
      const bId = blkData[y * dim.w + x];
      const chunk = map2x2[bId] || ['PP', 'PP'];
      rowTop += chunk[0];
      rowBot += chunk[1];
    }
    rows.push(rowTop);
    rows.push(rowBot);
  }

  const asmPath = path.join(OBJ_DIR, `${map.blkName}.asm`);
  const rawWarps = parseWarps(asmPath);

  const finalWarps = [];
  for (const w of rawWarps) {
    const targetPkName = mapNames[w.targetZone];
    let targetPos = undefined;

    if (targetPkName) {
      const targetAsmPath = path.join(OBJ_DIR, `${targetPkName}.asm`);
      const tWarps = parseWarps(targetAsmPath);
      if (w.warpId > 0 && w.warpId <= tWarps.length) {
        const tw = tWarps[w.warpId - 1];
        targetPos = { x: tw.x, y: tw.y - 1 };
      }
    }

    const warpObj = { x: w.x, y: w.y, targetMap: resolveZoneName(w.targetZone) };
    if (targetPos) warpObj.targetPos = targetPos;
    finalWarps.push(warpObj);

    if (w.y < dim.h * 2 && w.x < dim.w * 2) {
      const rowArr = rows[w.y].split('');
      rowArr[w.x] = 'D';
      rows[w.y] = rowArr.join('');
    }
  }

  const outJson = { _comment: "AUTOGENERATED FILE - DO NOT EDIT BY HAND", rows, warps: finalWarps };
  fs.writeFileSync(path.join(MAPS_OUT, map.mapID.toLowerCase() + '.json'), JSON.stringify(outJson, null, 2));
}
