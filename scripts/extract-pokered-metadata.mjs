#!/usr/bin/env node

/**
 * extract-pokered-metadata.mjs
 *
 * Parses the pokered disassembly to produce a comprehensive metadata JSON
 * that maps every Gen I location to its expected NPCs, signs, warps, items,
 * wild encounters, and trainers.
 *
 * Usage:  node scripts/extract-pokered-metadata.mjs
 * Output: src/data/reference/pokered_metadata.json
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POKERED = join(ROOT, 'pokered_dissasembly');
const OBJECTS_DIR = join(POKERED, 'data', 'maps', 'objects');
const WILD_MAPS_DIR = join(POKERED, 'data', 'wild', 'maps');
const TRAINERS_DIR = join(POKERED, 'data', 'trainers');
const OUT = join(ROOT, 'src', 'data', 'reference', 'pokered_metadata.json');

// ─── Map name normalization ──────────────────────────────────────────────────
function toSnakeUpper(name) {
  // Insert underscore before each uppercase letter preceded by lowercase or before digit groups
  let result = '';
  for (let i = 0; i < name.length; i++) {
    const ch = name[i];
    if (i > 0 && /[A-Z]/.test(ch) && /[a-z]/.test(name[i - 1])) {
      result += '_' + ch;
    } else if (i > 0 && /\d/.test(ch) && /[A-Za-z]/.test(name[i - 1])) {
      result += '_' + ch;
    } else {
      result += ch;
    }
  }
  return result.toUpperCase();
}

function pokeredNameToZone(pokeredName) {
  // pokered object files use PascalCase; our JSON zones use UPPER_SNAKE_CASE
  const special = {
    'RedsHouse1F': 'PLAYERS_HOUSE_1F',
    'RedsHouse2F': 'PLAYERS_HOUSE_2F',
    'BluesHouse': 'RIVALS_HOUSE',
    'OaksLab': 'OAKS_LAB',
    'PewterPokecenter': 'PEWTER_POKECENTER',
    'PewterMart': 'PEWTER_MART',
    'CeruleanPokecenter': 'CERULEAN_POKECENTER',
    'CeruleanMart': 'CERULEAN_MART',
    'VermilionPokecenter': 'VERMILION_POKECENTER',
    'VermilionMart': 'VERMILION_MART',
    'CeladonPokecenter': 'CELADON_POKECENTER',
    'CeladonMart1F': 'CELADON_MART_1F',
    'CeladonMart2F': 'CELADON_MART_2F',
    'CeladonMart3F': 'CELADON_MART_3F',
    'CeladonMart4F': 'CELADON_MART_4F',
    'CeladonMart5F': 'CELADON_MART_5F',
    'CeladonMartElevator': 'CELADON_MART_ELEVATOR',
    'CeladonMartRoof': 'CELADON_MART_ROOF',
    'LavenderMart': 'LAVENDER_MART',
    'LavenderPokecenter': 'LAVENDER_POKECENTER',
    'IndigoPlateauLobby': 'INDIGO_PLATEAU_LOBBY',
  };

  if (special[pokeredName]) return special[pokeredName];

  const routeMatch = pokeredName.match(/^Route(\d+)$/);
  if (routeMatch) return `ROUTE_${routeMatch[1]}`;

  return toSnakeUpper(pokeredName);
}

// ─── Parse object files ─────────────────────────────────────────────────────
function parseObjectFile(content, _filename) {
  const result = {
    npcs: 0,
    signs: 0,
    warps: 0,
    items: 0,
    trainers: 0,
  };

  // Count warps
  const warpMatches = content.match(/warp_event\s+\d+/g);
  if (warpMatches) result.warps = warpMatches.length;

  // Count signs (bg_events)
  const bgMatches = content.match(/bg_event\s+\d+/g);
  if (bgMatches) result.signs = bgMatches.length;

  // Count object events (NPCs + items)
  const objMatches = content.match(/object_event\s+\d+/g);
  if (objMatches) {
    // Distinguish NPCs from items: items use SPRITE_POKE_BALL or SPRITE_ITEM
    const lines = content.split('\n');
    for (const line of lines) {
      if (/object_event\s+\d+/.test(line)) {
        if (/SPRITE_POKE_BALL|SPRITE_ITEM/i.test(line)) {
          result.items += 1;
        } else {
          result.npcs += 1;
        }
      }
    }
  }

  return result;
}

// ─── Parse wild encounter tables ────────────────────────────────────────────
function parseWildFile(content) {
  const result = { encounterRate: 0, slots: [] };

  const rateMatch = content.match(/def_grass_wildmons\s+(\d+)/);
  if (rateMatch) {
    result.encounterRate = parseInt(rateMatch[1], 10);

    const slotPattern = /^\s*db\s+(\d+),\s*(\w+)/gm;
    let m;
    while ((m = slotPattern.exec(content)) !== null) {
      result.slots.push({
        level: parseInt(m[1], 10),
        species: m[2],
      });
    }
  }

  return result;
}

// ─── Parse trainer parties ──────────────────────────────────────────────────
function parseTrainerParties() {
  const content = readFileSync(join(TRAINERS_DIR, 'parties.asm'), 'utf8');

  // Parse trainer class pointer table
  const pointerTable = [];
  const ptrPattern = /^\s*dw\s+(\w+Data)/gm;
  let m;
  while ((m = ptrPattern.exec(content)) !== null) {
    pointerTable.push(m[1].replace('Data', ''));
  }

  // Parse each class section
  const trainers = {};

  for (const className of pointerTable) {
    const sectionStart = content.indexOf(`${className}Data:`);
    if (sectionStart === -1) continue;

    // Find the next class section or end
    const nextSection = pointerTable
      .map(c => content.indexOf(`${c}Data:`, sectionStart + 1))
      .filter(i => i > 0)
      .sort((a, b) => a - b)[0];

    const section = nextSection
      ? content.slice(sectionStart, nextSection)
      : content.slice(sectionStart);

    // Extract all `db ...` lines that contain teams
    const dbLines = [];
    const dbLinePattern = /\s*db\s+(.+)/g;
    let dbMatch;
    while ((dbMatch = dbLinePattern.exec(section)) !== null) {
      const line = dbMatch[1].trim();
      if (line === '0') continue;
      dbLines.push(line);
    }

    // Parse teams from db lines (they represent sequential teams)
    // Format: LEVEL, SPECIES1, SPECIES2, ..., 0 (shared level)
    // or: $FF, LEV1, SPEC1, LEV2, SPEC2, ..., 0 (per-mon levels)
    const teams = [];
    for (const line of dbLines) {
      const parts = line.split(',').map(s => s.trim());
      const team = [];

      if (parts[0].toUpperCase() === '$FF') {
        // Mixed levels: pairs of (level, species)
        for (let i = 1; i < parts.length - 1; i += 2) {
          if (parts[i] === '0') break;
          const lev = parseInt(parts[i], 10);
          if (isNaN(lev) || !parts[i + 1]) break;
          team.push({ level: lev, species: parts[i + 1] });
        }
      } else {
        // Shared level: level then species list
        const level = parseInt(parts[0], 10);
        if (isNaN(level)) continue;
        for (let i = 1; i < parts.length; i++) {
          if (parts[i] === '0') break;
          team.push({ level, species: parts[i] });
        }
      }

      if (team.length > 0) teams.push(team);
    }

    if (teams.length > 0) {
      trainers[className] = teams;
    }
  }

  return trainers;
}

// ─── Parse item positions from each map ─────────────────────────────────────
function parseItemPositions(content) {
  const items = [];
  const itemPattern = /^\s*(?:hidden_item|object_event)\s+([^,]*)x?,\s*(\d+),\s*(\d+)/gm;
  // Actually for our purposes, the item positions from object files:
  // For visible items: object_event X, Y, SPRITE_POKE_BALL
  // We already count them in parseObjectFile. This collects positions.

  const visiblePattern = /object_event\s+(\d+),\s+(\d+),\s*(\w+)/g;
  let m;
  while ((m = visiblePattern.exec(content)) !== null) {
    if (['SPRITE_POKE_BALL', 'SPRITE_ITEM'].some(s => m[3].includes(s))) {
      items.push({ x: parseInt(m[1], 10), y: parseInt(m[2], 10), type: 'visible' });
    }
  }

  return items;
}

// ─── Parse grass_water.asm for map→wild table mapping ────────────────────────
function parseWildPointerTable() {
  const content = readFileSync(join(POKERED, 'data', 'wild', 'grass_water.asm'), 'utf8');
  const entries = [];

  const linePattern = /^\s*dw\s+(\w+)\s*;\s*(.*)$/gm;
  let m;
  while ((m = linePattern.exec(content)) !== null) {
    const pointer = m[1];
    const comment = m[2].trim();
    entries.push({ pointer, comment });
  }

  return entries;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const metadata = {};

// 1. Parse object files
console.log(`Parsing ${OBJECTS_DIR}/*.asm …`);
const objFiles = readdirSync(OBJECTS_DIR).filter(f => f.endsWith('.asm'));
for (const file of objFiles) {
  const basename = file.replace('.asm', '');
  const zoneName = pokeredNameToZone(basename);

  const content = readFileSync(join(OBJECTS_DIR, file), 'utf8');
  const parsed = parseObjectFile(content, file);
  const items = parseItemPositions(content);

  metadata[zoneName] = {
    ...(metadata[zoneName] || {}),
    npcs: parsed.npcs,
    signs: parsed.signs,
    warps: parsed.warps,
    items: parsed.items,
    trainers: parsed.trainers,
    hasTrainers: parsed.trainers > 0,
    itemPositions: items,
  };
}

// 2. Parse wild encounters
console.log(`Parsing ${WILD_MAPS_DIR}/*.asm …`);
const wildFiles = readdirSync(WILD_MAPS_DIR).filter(f => f.endsWith('.asm'));
for (const file of wildFiles) {
  const basename = file.replace('.asm', '');
  const zoneName = pokeredNameToZone(basename);

  const content = readFileSync(join(WILD_MAPS_DIR, file), 'utf8');
  const wild = parseWildFile(content);

  if (wild.slots.length > 0) {
    const slotSummary = wild.slots.map(s => ({
      species: s.species,
      minLevel: s.level,
      maxLevel: s.level,
    }));

    // Deduplicate by species, keeping min/max levels
    const seen = new Map();
    for (const s of wild.slots) {
      const existing = seen.get(s.species);
      if (existing) {
        existing.minLevel = Math.min(existing.minLevel, s.level);
        existing.maxLevel = Math.max(existing.maxLevel, s.level);
      } else {
        seen.set(s.species, { minLevel: s.level, maxLevel: s.level });
      }
    }

    metadata[zoneName] = {
      ...(metadata[zoneName] || {}),
      wildLand: [...seen.entries()].map(([species, { minLevel, maxLevel }]) => ({
        species,
        minLevel,
        maxLevel,
      })),
      wildRate: wild.encounterRate,
      wildSlots: wild.slots,
    };
  }
}

// 3. Parse hidden items
console.log('Parsing hidden items…');
const hiddenContent = readFileSync(join(POKERED, 'data', 'events', 'hidden_item_coords.asm'), 'utf8');
const hiddenPattern = /hidden_item\s+(\w+),\s*(\d+),\s*(\d+)/g;
let hm;
while ((hm = hiddenPattern.exec(hiddenContent)) !== null) {
  const name = hm[1];
  const zoneName = pokeredNameToZone(name);
  metadata[zoneName] = {
    ...(metadata[zoneName] || {}),
    hiddenItems: [...(metadata[zoneName]?.hiddenItems || []), { x: parseInt(hm[2], 10), y: parseInt(hm[3], 10) }],
  };
}

// 4. Parse trainer parties
console.log('Parsing trainer parties.asm …');
const trainerClasses = parseTrainerParties();

// ─── Write output ────────────────────────────────────────────────────────────
mkdirSync(dirname(OUT), { recursive: true });

const out = {
  _meta: {
    generated: new Date().toISOString(),
    source: 'pokered_dissasembly',
    pokeredNameToZone: 'See script for mapping logic.',
  },
  maps: Object.entries(metadata)
    .sort()
    .filter(([k]) => k && !k.startsWith('_'))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
  trainerClasses: Object.fromEntries(
    Object.entries(trainerClasses).sort()
  ),
};

writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`\nWrote ${Object.keys(out.maps).length} maps + ${Object.keys(out.trainerClasses).length} trainer classes to ${OUT}`);
