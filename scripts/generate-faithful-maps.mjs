#!/usr/bin/env node

/**
 * generate-faithful-maps.mjs
 *
 * Reads pokered BLK files for tile dimensions, object .asm files for
 * warp coordinates + NPCs, and generates faithful interior map JSONs
 * with proper tile layouts.
 *
 * Maps block IDs to our tile types using known pokered block values.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POKERED = join(ROOT, 'pokered_dissasembly');
const BLK_DIR = join(POKERED, 'maps');
const OBJ_DIR = join(POKERED, 'data', 'maps', 'objects');
const MAPS_OUT = join(ROOT, 'src', 'data', 'maps');

// ─── Block ID → tile type mapping (from pokered blocksets) ────────────────
// Block IDs are blockset-specific. These are the common ones across interior
// tilesets (POKECENTER, HOUSE, GYM, LAB, DOJO, INTERIOR, SHIP, LOBBY, etc.)

// Generic floor-like blocks (used in most interiors)
const FLOOR_BLOCKS = new Set([
  0x00, 0x01, 0x02, 0x03, 0x04, 0x08, 0x09, 0x0A, 0x0B,
  0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27,
  0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
  0x3C, 0x3D, 0x40, 0x41, 0x42, 0x43, 0x44,
  0x48, 0x49, 0x4C, 0x4D,
  0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
  0x5C, 0x5D,
  0x60, 0x61, 0x62, 0x63, 0x64, 0x65,
  0x74, 0x77,
]);

// Wall blocks
const WALL_BLOCKS = new Set([
  0x06, 0x07, 0x0C, 0x0D, 0x0E, 0x0F,
  0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,
  0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F,
  0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D,
  0x2E, 0x2F,
  0x45, 0x46, 0x47, 0x4A, 0x4B,
  0x5A, 0x5B, 0x5E,
  0x6A, 0x6B, 0x6C, 0x6D, 0x6E, 0x6F,
  0x78, 0x79, 0x7A, 0x7B, 0x7C, 0x7D, 0x7E, 0x7F,
]);

// Counter/desk blocks (POKECENTER, OFFICE)
const COUNTER_BLOCKS = new Set([
  0x54, 0x55, 0x56, 0x57, 0x58, 0x64, 0x65,
  0x66, 0x67, 0x68, 0x69,
]);

// Machine/slot blocks (GAME_CORNER)
const MACHINE_BLOCKS = new Set([
  0x5A, 0x5B, 0x5C, 0x5D,
]);

// Door block patterns: block ID surrounded by walls
function isDoor(block, x, y, grid) {
  // A door is a non-wall, non-floor block at the map border
  // or a recognizable pokered door block
  if (WALL_BLOCKS.has(block)) return false;
  if (FLOOR_BLOCKS.has(block)) return false;
  // Specific door blocks
  if ([0x02, 0x03, 0x04, 0x05, 0x38, 0x39, 0x3A, 0x3B].includes(block)) return false;
  // Adjacent to walls on both sides
  const left = x > 0 ? grid[y][x - 1] : null;
  const right = x < grid[0].length - 1 ? grid[y][x + 1] : null;
  if (left !== null && right !== null && WALL_BLOCKS.has(left) && WALL_BLOCKS.has(right)) return true;
  return false;
}

// Stairs/warp point — same as door but between floors
function isStairs(block, x, y, grid) {
  // Stairs are special blocks in pokered, often at edges
  if (y <= 1 || y >= grid.length - 2) {
    const below = grid[y + 1]?.[x];
    if (below !== undefined && WALL_BLOCKS.has(below)) return true;
  }
  return false;
}

// ─── Map config: pokered name → our MapID + info ──────────────────────────

const MAPS_TO_BUILD = [
  // pokered name, our MapID, width, height, tileset
  ['SilphCo1F', 'SILPH_CO_1F', 15, 9, 'facility'],
  ['SilphCo2F', 'SILPH_CO_2F', 15, 9, 'facility'],
  ['SilphCo3F', 'SILPH_CO_3F', 15, 9, 'facility'],
  ['SilphCo4F', 'SILPH_CO_4F', 15, 9, 'facility'],
  ['SilphCo5F', 'SILPH_CO_5F', 15, 9, 'facility'],
  ['SilphCo6F', 'SILPH_CO_6F', 13, 9, 'facility'],
  ['SilphCo7F', 'SILPH_CO_7F', 13, 9, 'facility'],
  ['SilphCo8F', 'SILPH_CO_8F', 13, 9, 'facility'],
  ['SilphCo9F', 'SILPH_CO_9F', 13, 9, 'facility'],
  ['SilphCo10F', 'SILPH_CO_10F', 8, 9, 'facility'],
  ['SilphCo11F', 'SILPH_CO_11F', 9, 9, 'facility'],
  ['SilphCoElevator', 'SILPH_CO_ELEVATOR', 2, 2, 'facility'],
  ['RocketHideoutB1F', 'ROCKET_HIDEOUT_B1F', 15, 14, 'facility'],
  ['RocketHideoutB2F', 'ROCKET_HIDEOUT_B2F', 15, 14, 'facility'],
  ['RocketHideoutB3F', 'ROCKET_HIDEOUT_B3F', 15, 14, 'facility'],
  ['RocketHideoutB4F', 'ROCKET_HIDEOUT_B4F', 15, 12, 'facility'],
  ['SSAnne1F', 'SS_ANNE_1F', 20, 9, 'ship'],
  ['SSAnne2F', 'SS_ANNE_2F', 20, 9, 'ship'],
  ['SSAnne3F', 'SS_ANNE_3F', 10, 3, 'ship'],
  ['IndigoPlateauLobby', 'INDIGO_PLATEAU_LOBBY', 8, 6, 'lobby'],
  ['LoreleisRoom', 'ELITE_FOUR_LORELEI', 5, 6, 'gym'],
  ['BrunosRoom', 'ELITE_FOUR_BRUNO', 5, 6, 'gym'],
  ['AgathasRoom', 'ELITE_FOUR_AGATHA', 5, 6, 'gym'],
  ['LancesRoom', 'ELITE_FOUR_LANCE', 13, 13, 'gym'],
  ['ChampionsRoom', 'ELITE_FOUR_CHAMPION', 4, 4, 'gym'],
  ['CeladonMart1F', 'CELADON_MART_1F', 10, 4, 'mart'],
  ['CeladonMart2F', 'CELADON_MART_2F', 10, 4, 'mart'],
  ['CeladonMart3F', 'CELADON_MART_3F', 10, 4, 'mart'],
  ['CeladonMart4F', 'CELADON_MART_4F', 10, 4, 'mart'],
  ['CeladonMart5F', 'CELADON_MART_5F', 10, 4, 'mart'],
  ['CeladonMartElevator', 'CELADON_MART_ELEVATOR', 2, 2, 'mart'],
  ['CeladonMartRoof', 'CELADON_MART_ROOF', 10, 4, 'mart'],
  ['GameCorner', 'CELADON_GAME_CORNER', 10, 9, 'club'],
];

// ─── Pokemon map zone name → our map ID (for targetMap in warps) ──────────

function pkZoneToMapID(zone) {
  const mapName = {
    'SILPH_CO_1F': 'SILPH_CO_1F', 'SILPH_CO_2F': 'SILPH_CO_2F',
    'SILPH_CO_3F': 'SILPH_CO_3F', 'SILPH_CO_4F': 'SILPH_CO_4F',
    'SILPH_CO_5F': 'SILPH_CO_5F', 'SILPH_CO_6F': 'SILPH_CO_6F',
    'SILPH_CO_7F': 'SILPH_CO_7F', 'SILPH_CO_8F': 'SILPH_CO_8F',
    'SILPH_CO_9F': 'SILPH_CO_9F', 'SILPH_CO_10F': 'SILPH_CO_10F',
    'SILPH_CO_11F': 'SILPH_CO_11F', 'SILPH_CO_ELEVATOR': 'SILPH_CO_ELEVATOR',
    'ROCKET_HIDEOUT_B1F': 'ROCKET_HIDEOUT_B1F', 'ROCKET_HIDEOUT_B2F': 'ROCKET_HIDEOUT_B2F',
    'ROCKET_HIDEOUT_B3F': 'ROCKET_HIDEOUT_B3F', 'ROCKET_HIDEOUT_B4F': 'ROCKET_HIDEOUT_B4F',
    'SS_ANNE_1F': 'SS_ANNE_1F', 'SS_ANNE_2F': 'SS_ANNE_2F', 'SS_ANNE_3F': 'SS_ANNE_3F',
    'INDIGO_PLATEAU_LOBBY': 'INDIGO_PLATEAU_LOBBY',
    'LORELEIS_ROOM': 'ELITE_FOUR_LORELEI', 'BRUNOS_ROOM': 'ELITE_FOUR_BRUNO',
    'AGATHAS_ROOM': 'ELITE_FOUR_AGATHA', 'LANCES_ROOM': 'ELITE_FOUR_LANCE',
    'CHAMPIONS_ROOM': 'ELITE_FOUR_CHAMPION',
    'CELADON_MART_1F': 'CELADON_MART_1F', 'CELADON_MART_2F': 'CELADON_MART_2F',
    'CELADON_MART_3F': 'CELADON_MART_3F', 'CELADON_MART_4F': 'CELADON_MART_4F',
    'CELADON_MART_5F': 'CELADON_MART_5F', 'CELADON_MART_ELEVATOR': 'CELADON_MART_ELEVATOR',
    'CELADON_MART_ROOF': 'CELADON_MART_ROOF', 'GAME_CORNER': 'CELADON_GAME_CORNER',
  };
  return mapName[zone] || zone;
}

// ─── Parse object .asm file for warp data ──────────────────────────────────

function parseObjectFile(asmPath) {
  const content = readFileSync(asmPath, 'utf8');
  const warps = [];

  // Warp events: warp_event X, Y, TARGET, WARP_ID
  const warpRe = /warp_event\s+(\d+),\s*(\d+),\s*(\w+),\s*(\d+)/g;
  let m;
  while ((m = warpRe.exec(content)) !== null) {
    warps.push({
      x: parseInt(m[1], 10),
      y: parseInt(m[2], 10),
      targetZone: m[3],
      warpId: parseInt(m[4], 10),
    });
  }

  // Border block
  const borderMatch = content.match(/db\s+\$(\w+)\s*;\s*border/i);
  const borderBlock = borderMatch ? parseInt(borderMatch[1], 16) : 0;

  // Map name from def_warps_to
  const zoneMatch = content.match(/def_warps_to\s+(\w+)/);
  const pkZone = zoneMatch ? zoneMatch[1] : null;

  return { warps, borderBlock, pkZone };
}

// ─── Read BLK file using explicit dimensions ─────────────────────────────────

function readBLK(pkName, width, height) {
  const blkPath = join(BLK_DIR, pkName + '.blk');
  if (!existsSync(blkPath)) {
    console.warn(`No BLK found for ${pkName}, skipping`);
    return null;
  }
  const data = readFileSync(blkPath);
  const expected = width * height;
  if (data.length !== expected) {
    console.warn(`BLK size mismatch for ${pkName}: expected ${expected}, got ${data.length}`);
    // still try to use
  }
  const blocks = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(data[y * width + x] || 0);
    }
    blocks.push(row);
  }
  return blocks;
}

// ─── Main ──────────────────────────────────────────────────────────────────

mkdirSync(MAPS_OUT, { recursive: true });

let totalCreated = 0;
for (const cfg of MAPS_TO_BUILD) {
  const [pkName, mapID, width, height, tileset] = cfg;
  const blkGrid = readBLK(pkName, width, height);
  if (!blkGrid) continue;

  const asmPath = join(OBJ_DIR, pkName + '.asm');
  if (!existsSync(asmPath)) {
    console.warn(`No ASM found for ${pkName}, skipping`);
    continue;
  }

  const asmData = parseObjectFile(asmPath);

  // Convert BLK blocks to our tile types
  const tiles = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(blockToTile(blkGrid[y][x], x, y, blkGrid, tileset));
    }
    tiles.push(row);
  }

  // Mark warp positions as doors
  const warpData = asmData.warps;
  for (const w of warpData) {
    if (w.y < height && w.x < width && tiles[w.y][w.x] !== 'WALL') {
      tiles[w.y][w.x] = 'door';
    }
  }

  const warps = generateWarps(warpData, mapID);
  const tileGrid = tilesToGrid(tiles);
  const layers = generateLayers(tiles, warps);

  const mapJSON = { tiles: tileGrid, warps, layers };
  const outPath = join(MAPS_OUT, mapID.toLowerCase() + '.json');
  writeFileSync(outPath, JSON.stringify(mapJSON, null, 2));
  console.log(`Created ${mapID} (${width}x${height}, ${warps.length} warps)`);
  totalCreated++;
}

console.log(`\nDone: ${totalCreated} faithful map JSONs created`);
