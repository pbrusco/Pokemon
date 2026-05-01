#!/usr/bin/env node

/**
 * merge-trainers.mjs
 *
 * Merges generated trainer NPCs into npcDatabase.ts.
 * - Keeps existing manually-written trainers (with better dialogue)
 * - Adds only NEW trainers that don't already exist in the file
 * - Maps to buildNPCDatabase output format
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(__dirname, 'out');

const generatedFile = join(OUT_DIR, 'trainer_entries.txt');
const generated = readFileSync(generatedFile, 'utf8');

// Parse generated entries into { mapID: entryStrings[] }
const genEntries = {};
let currentMap = null;
for (const line of generated.split('\n')) {
  const mapMatch = line.match(/^\/\/\s*──\s+(\w+)\s*──/);
  if (mapMatch) {
    currentMap = mapMatch[1];
    genEntries[currentMap] = [];
    continue;
  }
  if (line.trim().startsWith('{')) {
    genEntries[currentMap]?.push(line.trim());
  }
}

// Count existing trainers per map (from npcDatabase.ts)
const npcFile = readFileSync(join(ROOT, 'src', 'data', 'npcDatabase.ts'), 'utf8');

// Check existing trainer IDs to avoid dupes
const existingIds = new Set();
const idRe = /id:\s*['"]([^'"]+)['"]/g;
let m;
while ((m = idRe.exec(npcFile)) !== null) {
  existingIds.add(m[1]);
}

// Filter generated entries: keep only those whose id isn't already in the file
for (const [map, entries] of Object.entries(genEntries)) {
  const filtered = entries.filter(e => {
    const idMatch = e.match(/id:\s*'([^']+)'/);
    return idMatch && !existingIds.has(idMatch[1]);
  });
  genEntries[map] = filtered;
}

// Build the merge report
const total = Object.values(genEntries).reduce((s, e) => s + e.length, 0);
console.log(`New trainers to add: ${total}`);
for (const [map, entries] of Object.entries(genEntries)) {
  if (entries.length > 0) {
    console.log(`  ${map}: ${entries.length} new trainers`);
  }
}

// Build TypeScript code to append
let tsOut = '';
for (const [map, entries] of Object.entries(genEntries)) {
  if (entries.length === 0) continue;

  // Map to our map ID format
  let mapID;
  if (map === 'KANTO_OVERWORLD') {
    // These go in KANTO_OVERWORLD section of buildNPCDatabase
    // Filter out entries that use w() with zones we already have coverage for
    mapID = 'KANTO_OVERWORLD';
  } else {
    mapID = map;
  }

  tsOut += `\n      // ── ${mapID} (generated from pokered) ──\n`;
  for (const e of entries) {
    tsOut += `      ${e}\n`;
  }
}

// Write the appendable code
const appendFile = join(OUT_DIR, 'new_trainers_to_append.txt');
writeFileSync(appendFile, tsOut);
console.log(`\nWrote appendable trainer code to ${appendFile}`);

// Now produce a structured summary for manual integration
const integrationGuide = [];
for (const [map, entries] of Object.entries(genEntries)) {
  if (entries.length === 0) continue;
  integrationGuide.push(`## ${map}: ${entries.length} new trainers to add`);
}

writeFileSync(join(OUT_DIR, 'integration_guide.txt'), integrationGuide.join('\n'));
console.log('Done.');
