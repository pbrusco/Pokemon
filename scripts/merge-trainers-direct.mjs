#!/usr/bin/env node

/**
 * merge-trainers-direct.mjs
 *
 * Directly inserts generated trainer entries into npcDatabase.ts.
 * Reads the buildNPCDatabase function, finds each map section,
 * and appends new trainer entries.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const NPC_FILE = join(ROOT, 'src', 'data', 'npcDatabase.ts');
const GEN_FILE = join(__dirname, 'out', 'new_trainers_to_append.txt');

let source = readFileSync(NPC_FILE, 'utf8');
const genContent = readFileSync(GEN_FILE, 'utf8');

// Parse generated entries into per-map blocks
const genBlocks = {};
let currentMap = null;
for (const line of genContent.split('\n')) {
  const mapMatch = line.match(/\/\/\s*──\s+(\w+).*generated.*──/);
  if (mapMatch) {
    currentMap = mapMatch[1];
    genBlocks[currentMap] = [];
    continue;
  }
  if (line.trim().startsWith('{') || line.trim().startsWith('id:')) {
    genBlocks[currentMap]?.push(line.trim());
  }
}

// Map IDs: generated → our internal MapID
const MAPID_MAP = {
  CELADON_GYM: 'CELADON_GYM',
  CERULEAN_GYM: 'CERULEAN_GYM',
  VERMILION_GYM: 'VERMILION_GYM',
  FUCHSIA_GYM: 'FUCHSIA_GYM',
  SAFFRON_GYM: 'SAFFRON_GYM',
  CINNABAR_GYM: 'CINNABAR_GYM',
  VIRIDIAN_GYM: 'VIRIDIAN_GYM',
  PEWTER_GYM: 'PEWTER_GYM',
  KANTO_OVERWORLD: 'KANTO_OVERWORLD',
  MT_MOON: 'MT_MOON',
  MT_MOON_B2F: 'MT_MOON_B2F',
  OAKS_LAB: 'OAKS_LAB',
  ROCK_TUNNEL_1F: 'ROCK_TUNNEL_1F',
  ROCK_TUNNEL_B1F: 'ROCK_TUNNEL_B1F',
  POKEMON_TOWER_3F: 'POKEMON_TOWER_3F',
  POKEMON_TOWER_4F: 'POKEMON_TOWER_4F',
  POKEMON_TOWER_5F: 'POKEMON_TOWER_5F',
  POKEMON_TOWER_6F: 'POKEMON_TOWER_6F',
  POKEMON_TOWER_7F: 'POKEMON_TOWER_7F',
  POKEMON_MANSION_1F: 'POKEMON_MANSION_1F',
  POKEMON_MANSION_2F: 'POKEMON_MANSION_2F',
  POKEMON_MANSION_3F: 'POKEMON_MANSION_3F',
  POKEMON_MANSION_B1F: 'POKEMON_MANSION_B_1F',
};

let totalAdded = 0;
for (const [genMap, entries] of Object.entries(genBlocks)) {
  if (!entries || entries.length === 0) continue;
  const mapID = MAPID_MAP[genMap];
  if (!mapID) {
    console.log(`Unknown map: ${genMap}, skipping`);
    continue;
  }

  // Find the map section in npcDatabase.ts
  // Pattern: `MAP_ID: [` - for the return object of buildNPCDatabase
  const sectionStartRe = new RegExp(`\\s+${mapID.replace('_','\\_')}:\\s*\\[`, 'gm');
  let match;
  let inserted = 0;

  // Reset lastIndex
  sectionStartRe.lastIndex = 0;

  while ((match = sectionStartRe.exec(source)) !== null) {
    // Find the opening bracket position
    const bracketIdx = source.indexOf('[', match.index);
    if (bracketIdx === -1) continue;

    // Find the end of this array section by tracking bracket depth
    let depth = 1;
    let pos = bracketIdx + 1;
    while (depth > 0 && pos < source.length) {
      if (source[pos] === '[') depth++;
      if (source[pos] === ']') depth--;
      pos++;
    }
    const endIdx = pos;

    // Get the section content
    const before = source.substring(0, bracketIdx);
    const sectionContent = source.substring(bracketIdx + 1, endIdx - 1);
    const after = source.substring(endIdx - 1);

    // Check for existing entries (skip duplicates by id)
    const existingIds = new Set();
    const idRe = /id:\s*['"]([^'"]+)['"]/g;
    let im;
    while ((im = idRe.exec(sectionContent)) !== null) {
      existingIds.add(im[1]);
    }

    const newEntries = entries.filter(e => {
      const idMatch = e.match(/id:\s*'([^']+)'/);
      return idMatch && !existingIds.has(idMatch[1]);
    });

    if (newEntries.length === 0) {
      console.log(`${mapID}: all entries already exist`);
      continue;
    }

    // Find the last existing entry in the section to append after
    // But we want to maintain organization: existing first, then generated
    // Find the end of existing entries before any closing
    const trimmedSect = sectionContent.trimEnd();
    const newSect = trimmedSect + (trimmedSect.endsWith(',') ? '\n        ' : ',\n        ')
      + '// ─ Generated from pokered parties ─\n        '
      + newEntries.join('\n        ') + ',';

    source = before + '[' + newSect + '\n        ' + after;
    inserted = newEntries.length;
    totalAdded += inserted;
    console.log(`${mapID}: added ${inserted} new trainers`);
    break; // Only handle first occurrence
  }
}

writeFileSync(NPC_FILE, source);
console.log(`\nTotal: ${totalAdded} new trainer entries added to ${NPC_FILE}`);
