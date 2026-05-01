#!/usr/bin/env node

/**
 * fix-npc-positions.mjs
 *
 * Reads npcDatabase.ts, checks each outdoor (KANTO_OVERWORLD) trainer NPC
 * against the actual overworld map tiles, and removes any NPC placed
 * on a non-walkable tile (wall, tree, water, etc).
 * Also fixes duplicate IDs.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const npcFile = join(ROOT, 'src', 'data', 'npcDatabase.ts');
const overworldFile = join(ROOT, 'src', 'data', 'maps', 'kanto_overworld.json');

const overworld = JSON.parse(readFileSync(overworldFile, 'utf8'));
const rows = overworld.rows;

// Unwalkable tile characters from the kanto_overworld.json rows
// T=tree, W=wall/building, ~=water, S=sign
const UNWALKABLE_CHARS = new Set(['T', 'W', '~', 'S', '*']);

function isWalkable(x, y) {
  if (!rows[y]) return false;
  const ch = rows[y][x];
  return ch !== undefined && !UNWALKABLE_CHARS.has(ch);
}

// Parse NPC entries from npcDatabase.ts and filter
let source = readFileSync(npcFile, 'utf8');

// Find all KANTO_OVERWORLD entries in buildNPCDatabase
const kantoSectionStart = source.indexOf("KANTO_OVERWORLD: [");
if (kantoSectionStart === -1) {
  console.log("No KANTO_OVERWORLD section found in buildNPCDatabase");
  process.exit(1);
}

// Find the end of the KANTO_OVERWORLD array in buildNPCDatabase
let depth = 0;
let arrayStart = source.indexOf('[', kantoSectionStart);
let pos = arrayStart + 1;
let arrayEnd = -1;
while (pos < source.length) {
  if (source[pos] === '[') depth++;
  if (source[pos] === ']') {
    if (depth === 0) { arrayEnd = pos; break; }
    depth--;
  }
  pos++;
}

const before = source.substring(0, arrayStart + 1);
const sectionContent = source.substring(arrayStart + 1, arrayEnd);
const after = source.substring(arrayEnd);

// Parse individual NPC entries
const lines = sectionContent.split('\n');
const validEntries = [];
const removedEntries = [];
let removedCount = 0;
const seenIds = new Set();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Keep non-entry lines (comments, empty)
  if (!line.trim().startsWith('{')) {
    validEntries.push(line);
    continue;
  }

  // Check ID for duplicates
  const idMatch = line.match(/id:\s*'([^']+)'/);
  if (idMatch) {
    if (seenIds.has(idMatch[1])) {
      removedEntries.push(`DUPLICATE: ${idMatch[1]} at line ${i}`);
      removedCount++;
      continue;
    }
    seenIds.add(idMatch[1]);
  }

  // Check position for walkability - only for w() calls in KANTO_OVERWORLD
  const wMatch = line.match(/w\('(\w+)',\s*(\d+),\s*(\d+)\)/);
  if (wMatch) {
    const zone = wMatch[1];
    const lx = parseInt(wMatch[2]);
    const ly = parseInt(wMatch[3]);

    // Get world coordinates using zone offsets
    const O = {
      PALLET_TOWN:     { x: 118, y: 196 },
      ROUTE_1:         { x: 118, y: 161 },
      VIRIDIAN_CITY:   { x: 108, y: 126 },
      ROUTE_2:         { x: 124, y:  87 },
      VIRIDIAN_FOREST: { x: 112, y:  40 },
      PEWTER_CITY:     { x: 108, y:   5 },
      ROUTE_3:         { x: 147, y:  16 },
      ROUTE_4:         { x: 177, y:  12 },
      CERULEAN_CITY:   { x: 216, y:   0 },
      ROUTE_5:         { x: 232, y:  35 },
      SAFFRON_CITY:    { x: 216, y:  51 },
      ROUTE_7:         { x: 197, y:  65 },
      ROUTE_8:         { x: 255, y:  65 },
      ROUTE_6:         { x: 232, y:  86 },
      VERMILION_CITY:  { x: 216, y: 102 },
      ROUTE_9:         { x: 255, y:  12 },
      ROUTE_10:        { x: 270, y:  16 },
      LAVENDER_TOWN:   { x: 264, y:  39 },
      ROUTE_11:        { x: 255, y: 115 },
      ROUTE_12:        { x: 264, y:  56 },
      ROUTE_13:        { x: 225, y: 163 },
      ROUTE_14:        { x: 206, y: 180 },
      ROUTE_15:        { x: 147, y: 224 },
      FUCHSIA_CITY:    { x: 108, y: 216 },
      ROUTE_16:        { x: 109, y:  66 },
      ROUTE_17:        { x: 109, y:  83 },
      ROUTE_18:        { x: 109, y: 226 },
      ROUTE_22:        { x: 618, y: 396 },
      ROUTE_24:        { x: 618, y: 596 },
      ROUTE_25:        { x: 637, y: 596 },
      CELADON_CITY:    { x: 148, y:  61 },
      ROUTE_19:        { x: 118, y: 251 },
      ROUTE_20:        { x:  19, y: 300 },
      CINNABAR_ISLAND: { x:   0, y: 300 },
      ROUTE_21:        { x:   0, y: 211 },
    };

    const offset = O[zone];
    if (!offset) {
      validEntries.push(line);
      continue;
    }

    const wx = offset.x + lx;
    const wy = offset.y + ly;

    if (!isWalkable(wx, wy)) {
      removedEntries.push(`UNWALKABLE: ${idMatch?.[1] || '?'} at w('${zone}', ${lx}, ${ly}) => world(${wx},${wy}) tile=${rows[wy]?.[wx] || 'OOB'}`);
      removedCount++;
      continue;
    }
  }

  validEntries.push(line);
}

// Rebuild the section
const newSection = validEntries.join('\n');
source = before + newSection + after;

writeFileSync(npcFile, source);
console.log(`Removed ${removedCount} problematic NPC entries:`);
for (const r of removedEntries) {
  console.log(`  ${r}`);
}
console.log(`\nWrote cleaned npcDatabase.ts`);
