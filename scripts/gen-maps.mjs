#!/usr/bin/env node

/**
 * Generate faithful interior map JSONs from pokered BLK + object .asm files.
 * Outputs the `rows` string[] format (W=wall, F=floor, D=door) matching
 * the existing map JSON convention.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = '/Users/pbrusco/projects/poke';
const BLK_DIR = join(ROOT, 'pokered_dissasembly/maps');
const OBJ_DIR = join(ROOT, 'pokered_dissasembly/data/maps/objects');
const OUT_DIR = join(ROOT, 'src/data/maps');

// [pokeredName, ourMapID, width, height]
const MAPS = [
  ['SilphCo1F', 'SILPH_CO_1F', 15, 9],
  ['SilphCo2F', 'SILPH_CO_2F', 15, 9],
  ['SilphCo3F', 'SILPH_CO_3F', 15, 9],
  ['SilphCo4F', 'SILPH_CO_4F', 15, 9],
  ['SilphCo5F', 'SILPH_CO_5F', 15, 9],
  ['SilphCo6F', 'SILPH_CO_6F', 13, 9],
  ['SilphCo7F', 'SILPH_CO_7F', 13, 9],
  ['SilphCo8F', 'SILPH_CO_8F', 13, 9],
  ['SilphCo9F', 'SILPH_CO_9F', 13, 9],
  ['SilphCo10F', 'SILPH_CO_10F', 8, 9],
  ['SilphCo11F', 'SILPH_CO_11F', 9, 9],
  ['SilphCoElevator', 'SILPH_CO_ELEVATOR', 2, 2],
  ['RocketHideoutB1F', 'ROCKET_HIDEOUT_B1F', 15, 14],
  ['RocketHideoutB2F', 'ROCKET_HIDEOUT_B2F', 15, 14],
  ['RocketHideoutB3F', 'ROCKET_HIDEOUT_B3F', 15, 14],
  ['RocketHideoutB4F', 'ROCKET_HIDEOUT_B4F', 15, 12],
  ['SSAnne1F', 'SS_ANNE_1F', 20, 9],
  ['SSAnne2F', 'SS_ANNE_2F', 20, 9],
  ['SSAnne3F', 'SS_ANNE_3F', 10, 3],
  ['IndigoPlateauLobby', 'INDIGO_PLATEAU_LOBBY', 8, 6],
  ['LoreleisRoom', 'ELITE_FOUR_LORELEI', 5, 6],
  ['BrunosRoom', 'ELITE_FOUR_BRUNO', 5, 6],
  ['AgathasRoom', 'ELITE_FOUR_AGATHA', 5, 6],
  ['LancesRoom', 'ELITE_FOUR_LANCE', 13, 13],
  ['ChampionsRoom', 'ELITE_FOUR_CHAMPION', 4, 4],
  ['CeladonMart1F', 'CELADON_MART_1F', 10, 4],
  ['CeladonMart2F', 'CELADON_MART_2F', 10, 4],
  ['CeladonMart3F', 'CELADON_MART_3F', 10, 4],
  ['CeladonMart4F', 'CELADON_MART_4F', 10, 4],
  ['CeladonMart5F', 'CELADON_MART_5F', 10, 4],
  ['CeladonMartElevator', 'CELADON_MART_ELEVATOR', 2, 2],
  ['CeladonMartRoof', 'CELADON_MART_ROOF', 10, 4],
  ['GameCorner', 'CELADON_GAME_CORNER', 10, 9],
];

function parseWarps(asmContent) {
  const warps = [];
  const re = /warp_event\s+(\d+),\s*(\d+),\s*(\w+),\s*(\d+)/g;
  let m;
  while ((m = re.exec(asmContent)) !== null) {
    warps.push({ x: parseInt(m[1]), y: parseInt(m[2]), targetZone: m[3] });
  }
  return warps;
}

// Map pokered zone name → our internal MapID
function pkTarget(zone) {
  const m = {
    SILPH_CO_1F: 'SILPH_CO_1F', SILPH_CO_2F: 'SILPH_CO_2F',
    SILPH_CO_3F: 'SILPH_CO_3F', SILPH_CO_4F: 'SILPH_CO_4F',
    SILPH_CO_5F: 'SILPH_CO_5F', SILPH_CO_6F: 'SILPH_CO_6F',
    SILPH_CO_7F: 'SILPH_CO_7F', SILPH_CO_8F: 'SILPH_CO_8F',
    SILPH_CO_9F: 'SILPH_CO_9F', SILPH_CO_10F: 'SILPH_CO_10F',
    SILPH_CO_11F: 'SILPH_CO_11F', SILPH_CO_ELEVATOR: 'SILPH_CO_ELEVATOR',
    ROCKET_HIDEOUT_B1F: 'ROCKET_HIDEOUT_B1F', ROCKET_HIDEOUT_B2F: 'ROCKET_HIDEOUT_B2F',
    ROCKET_HIDEOUT_B3F: 'ROCKET_HIDEOUT_B3F', ROCKET_HIDEOUT_B4F: 'ROCKET_HIDEOUT_B4F',
    SS_ANNE_1F: 'SS_ANNE_1F', SS_ANNE_2F: 'SS_ANNE_2F', SS_ANNE_3F: 'SS_ANNE_3F',
    INDIGO_PLATEAU_LOBBY: 'INDIGO_PLATEAU_LOBBY',
    LORELEIS_ROOM: 'ELITE_FOUR_LORELEI', BRUNOS_ROOM: 'ELITE_FOUR_BRUNO',
    AGATHAS_ROOM: 'ELITE_FOUR_AGATHA', LANCES_ROOM: 'ELITE_FOUR_LANCE',
    CHAMPIONS_ROOM: 'ELITE_FOUR_CHAMPION',
    CELADON_MART_1F: 'CELADON_MART_1F', CELADON_MART_2F: 'CELADON_MART_2F',
    CELADON_MART_3F: 'CELADON_MART_3F', CELADON_MART_4F: 'CELADON_MART_4F',
    CELADON_MART_5F: 'CELADON_MART_5F', CELADON_MART_ELEVATOR: 'CELADON_MART_ELEVATOR',
    CELADON_MART_ROOF: 'CELADON_MART_ROOF', GAME_CORNER: 'CELADON_GAME_CORNER',
  };
  if (m[zone]) return m[zone];
  // LAST_MAP / overworld exits → KANTO_OVERWORLD
  if (['LAST_MAP', 'UNUSED_MAP_ED'].includes(zone)) return 'KANTO_OVERWORLD';
  console.warn(`Unknown target zone: ${zone}`);
  return 'KANTO_OVERWORLD';
}

// Classify each BLK block as wall or floor based on context
// Strategy: a block that appears at map borders is a wall.
// A block that appears in the interior is floor.
function classify(grid) {
  const h = grid.length, w = grid[0].length;
  const borderBlocks = new Set();
  const interiorBlocks = new Set();
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const isBorder = (x === 0 || x === w - 1 || y === 0 || y === h - 1);
      if (isBorder) borderBlocks.add(grid[y][x]);
      else interiorBlocks.add(grid[y][x]);
    }
  }
  
  // Border-only blocks → walls. Interior-only → floor.
  // Blocks on BOTH → floor (they're structural floor tiles that appear at entries)
  const walls = new Set([...borderBlocks].filter(b => !interiorBlocks.has(b)));
  
  return { walls };
}

mkdirSync(OUT_DIR, { recursive: true });
let done = 0;

for (const [pkName, mapID, w, h] of MAPS) {
  const blkPath = join(BLK_DIR, pkName + '.blk');
  const asmPath = join(OBJ_DIR, pkName + '.asm');
  
  if (!existsSync(blkPath)) { console.warn(`No BLK: ${pkName}`); continue; }
  if (!existsSync(asmPath)) { console.warn(`No ASM: ${pkName}`); continue; }
  
  const blk = readFileSync(blkPath);
  const asm = readFileSync(asmPath, 'utf8');
  
  // Build 2D grid of BLK block IDs
  const grid = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      row.push(blk[y * w + x] || 0);
    }
    grid.push(row);
  }
  
  const { walls } = classify(grid);
  const warps = parseWarps(asm);
  
  // Mark warp positions
  const warpSet = new Set(warps.map(w => `${w.x},${w.y}`));
  
  // Build rows (character strings)
  const rows = [];
  for (let y = 0; y < h; y++) {
    let line = '';
    for (let x = 0; x < w; x++) {
      if (warpSet.has(`${x},${y}`)) {
        line += 'D'; // door
      } else if (walls.has(grid[y][x])) {
        line += 'W'; // wall
      } else {
        line += 'F'; // floor
      }
    }
    rows.push(line);
  }
  
  // Build warps for output
  const warpOut = warps.map(w => ({
    x: w.x,
    y: w.y,
    targetMap: pkTarget(w.targetZone),
    targetPos: { x: w.x, y: w.y + 1 },
    targetDir: 'down',
  }));
  
  const out = { rows, warps: warpOut };
  writeFileSync(join(OUT_DIR, mapID.toLowerCase() + '.json'), JSON.stringify(out, null, 2));
  console.log(`  ${mapID}: ${w}x${h}, ${warps.length} warps`);
  done++;
}

console.log(`\nDone: ${done} faithful maps`);
