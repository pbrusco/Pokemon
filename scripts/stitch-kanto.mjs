#!/usr/bin/env node
/**
 * stitch-kanto.mjs
 *
 * Stitches all outdoor Pokémon-Red block-based maps into one large
 * src/artifacts/maps/kanto_overworld.json.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
import fs from 'fs';

const MAPS_DIR  = resolve(__dirname, '../src/artifacts/maps');

function load(name) {
  const p = join(MAPS_DIR, `${name}.json`);
  const data = JSON.parse(readFileSync(p, 'utf8'));

  // Support both old char-grid and new block-based formats
  if (data.rows) {
    return {
      name,
      format: 'char',
      rows: data.rows,
      w: data.rows[0]?.length ?? 0,
      h: data.rows.length,
      warps: data.warps || [],
    };
  }

  // Block-based
  return {
    name,
    format: 'block',
      blockset: data.blockset,
    width: data.width,
    height: data.height,
    blocks: data.blocks,
    borderBlock: data.borderBlock,
    w: data.width * 2,   // tile width
    h: data.height * 2,  // tile height
    warps: data.warps || [],
  };
}

// ─── Load all outdoor maps ────────────────────────────────────────────────────
const maps = [
  { key: 'pallet_town',      label: 'PALLET_TOWN',     off: { x: 118, y: 196 } },
  { key: 'route_1',          label: 'ROUTE_1',         off: { x: 118, y: 161 } },
  { key: 'viridian_city',    label: 'VIRIDIAN_CITY',   off: { x: 108, y: 126 } },
  { key: 'route_2',          label: 'ROUTE_2',         off: { x: 124, y:  87 } },
  { key: 'viridian_forest',  label: 'VIRIDIAN_FOREST', off: { x: 112, y:  40 } },
  { key: 'pewter_city',      label: 'PEWTER_CITY',     off: { x: 108, y:   5 } },
  { key: 'route_3',          label: 'ROUTE_3',         off: { x: 147, y:  16 } },
  { key: 'route_4',          label: 'ROUTE_4',         off: { x: 177, y:  12 } },
  { key: 'cerulean_city',    label: 'CERULEAN_CITY',   off: { x: 216, y:   0 } },
  { key: 'route_5',          label: 'ROUTE_5',         off: { x: 232, y:  35 } },
  { key: 'saffron_city',     label: 'SAFFRON_CITY',    off: { x: 216, y:  51 } },
  { key: 'route_7',          label: 'ROUTE_7',         off: { x: 197, y:  65 } },
  { key: 'route_8',          label: 'ROUTE_8',         off: { x: 255, y:  65 } },
  { key: 'route_6',          label: 'ROUTE_6',         off: { x: 232, y:  86 } },
  { key: 'vermilion_city',   label: 'VERMILION_CITY',  off: { x: 216, y: 102 } },
  { key: 'route_9',          label: 'ROUTE_9',         off: { x: 255, y:  12 } },
  { key: 'route_10',         label: 'ROUTE_10',        off: { x: 270, y:  16 } },
  { key: 'lavender_town',    label: 'LAVENDER_TOWN',   off: { x: 264, y:  39 } },
  { key: 'route_11',         label: 'ROUTE_11',        off: { x: 255, y: 115 } },
  { key: 'route_12',         label: 'ROUTE_12',        off: { x: 264, y:  56 } },
  { key: 'route_13',         label: 'ROUTE_13',        off: { x: 225, y: 163 } },
  { key: 'route_14',         label: 'ROUTE_14',        off: { x: 206, y: 180 } },
  { key: 'route_15',         label: 'ROUTE_15',        off: { x: 147, y: 224 } },
  { key: 'fuchsia_city',     label: 'FUCHSIA_CITY',    off: { x: 228, y: 270 } },
  { key: 'route_19',         label: 'ROUTE_19',        off: { x: 238, y: 306 } },
  { key: 'route_20',         label: 'ROUTE_20',        off: { x: 138, y: 308 } },
  { key: 'cinnabar_island', label: 'CINNABAR_ISLAND', off: { x: 118, y: 304 } },
  { key: 'route_21',         label: 'ROUTE_21',        off: { x: 118, y: 214 } },
  { key: 'route_22',         label: 'ROUTE_22',        off: { x: 618, y: 396 } },
  { key: 'route_23',         label: 'ROUTE_23',        off: { x: 608, y: 257 } },
  { key: 'indigo_plateau',   label: 'INDIGO_PLATEAU',  off: { x: 608, y: 240 } },
  { key: 'route_24',         label: 'ROUTE_24',        off: { x: 618, y: 596 } },
  { key: 'route_25',         label: 'ROUTE_25',        off: { x: 637, y: 596 } },
  { key: 'celadon_city',     label: 'CELADON_CITY',    off: { x: 618, y: 196 } },
  { key: 'route_16',         label: 'ROUTE_16',        off: { x: 579, y: 201 } },
  { key: 'route_17',         label: 'ROUTE_17',        off: { x: 579, y: 218 } },
  { key: 'route_18',         label: 'ROUTE_18',        off: { x: 579, y: 361 } },
];

const SEGMENTS = [];
for (const m of maps) {
  const data = load(m.key);
  SEGMENTS.push({ map: data, label: m.label, off: m.off });
}

// ─── Compute canvas bounds ────────────────────────────────────────────────────
let maxX = -Infinity, maxY = -Infinity;
for (const { map, off } of SEGMENTS) {
  if (off.x < 0 || off.y < 0) {
    throw new Error(`Negative offset for ${off.x},${off.y}; absolute coords required`);
  }
  maxX = Math.max(maxX, off.x + map.w);
  maxY = Math.max(maxY, off.y + map.h);
}
const canvasW = maxX, canvasH = maxY;

// ─── Stitch onto canvas (default tile block = borderBlock from first map or 11=trees) ───
const defaultBorder = SEGMENTS[0]?.map?.borderBlock ?? 11; // 11 = tree border block
const canvasBlocks = Array.from({ length: Math.ceil(canvasH / 2) }, () => Array(Math.ceil(canvasW / 2)).fill(defaultBorder));

for (const { map, off } of SEGMENTS) {
  if (map.format === 'block') {
    for (let by = 0; by < map.height; by++) {
      for (let bx = 0; bx < map.width; bx++) {
        const targetX = Math.floor(off.x / 2) + bx;
        const targetY = Math.floor(off.y / 2) + by;
        if (targetY >= 0 && targetY < canvasBlocks.length && targetX >= 0 && targetX < canvasBlocks[0].length) {
          canvasBlocks[targetY][targetX] = map.blocks[by][bx];
        }
      }
    }
  } else {
    // Old char-grid: convert chars to block IDs (we just use a simple mapping for border fill compat)
    for (let row = 0; row < map.h; row++) {
      for (let col = 0; col < map.w; col++) {
        const char = map.rows[row][col];
        // Approximate block ID mapping for old char grid during transition
        const blockId = char === 'T' ? 11 : char === 'P' ? 1 : char === 'W' ? 0 : char === 'D' ? 1 : char === 'G' ? 1 : char === '~' ? 6 : defaultBorder;
        const targetX = Math.floor(off.x / 2) + Math.floor(col / 2);
        const targetY = Math.floor(off.y / 2) + Math.floor(row / 2);
        if (targetY >= 0 && targetY < canvasBlocks.length && targetX >= 0 && targetX < canvasBlocks[0].length) {
          canvasBlocks[targetY][targetX] = blockId;
        }
      }
    }
  }
}

// ─── Warp stitching (only indoor warps) ──────────────────────────────────────
const OUTDOOR = new Set(SEGMENTS.map(s => s.label));
const mergedWarps = [];
for (const { map, off, label } of SEGMENTS) {
  for (const w of map.warps) {
    if (!OUTDOOR.has(w.targetMap) && w.targetMap !== 'KANTO_OVERWORLD') {
      mergedWarps.push({
        x: off.x + w.x,
        y: off.y + w.y,
        targetMap: w.targetMap,
        targetPos: w.targetPos,
        ...(w.targetDir ? { targetDir: w.targetDir } : {}),
      });
    }
  }
}

// ─── Output block-based kanto_overworld.json ──────────────────────────────────
const outJson = {
  _comment: 'AUTOGENERATED FROM stitched outdoor maps',
  blockset: 'OVERWORLD',
  borderBlock: defaultBorder,
  width: canvasBlocks[0].length,
  height: canvasBlocks.length,
  blocks: canvasBlocks,
  warps: mergedWarps,
  objects: [],
};

const outPath = join(MAPS_DIR, 'kanto_overworld.json');
writeFileSync(outPath, JSON.stringify(outJson, null, 2));

console.log(`✓ kanto_overworld.json  ${canvasBlocks[0].length}×${canvasBlocks.length} blocks  (${mergedWarps.length} indoor warps)`);
console.log('\n// KANTO_OFFSETS — paste into npcDatabase.ts:');
for (const { label, off } of SEGMENTS) {
  console.log(`  ${label.padEnd(18)}: { x: ${String(off.x).padStart(3)}, y: ${String(off.y).padStart(3)} },`);
}

// ─── Verify warp alignment ─────────────────────────────────────────
console.log('\n// Indoor warps in world coords:');
for (const w of mergedWarps) {
  console.log(`  (${String(w.x).padStart(3)},${String(w.y).padStart(3)}) → ${w.targetMap}`);
}
