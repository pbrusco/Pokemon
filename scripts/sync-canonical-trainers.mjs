#!/usr/bin/env node
/**
 * sync-canonical-trainers.mjs
 *
 * Replaces the wrong/duplicate trainer sections in npcDatabase.ts with canonical
 * pokered data. Run after modifying pokered source or to reset trainer correctness.
 *
 * Usage: node scripts/sync-canonical-trainers.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// 1. Re-generate canonical entries from pokered source
console.log('Running generator...');
execSync('node scripts/generate-trainer-npcs.mjs', { cwd: ROOT, stdio: 'inherit' });

// 2. Read generated output and extract KANTO_OVERWORLD trainer entries.
//    Only keep entries for ROUTE_* and VIRIDIAN_FOREST zones — city trainers
//    (Cerulean Rocket, etc.) are handled separately as story NPCs.
const generated = readFileSync(join(ROOT, 'scripts/out/trainer_entries.txt'), 'utf8');
const allLines = generated.split('\n');

let inKanto = false;
const canonicalLines = [];
for (const line of allLines) {
  if (line.includes('// ── KANTO_OVERWORLD ──')) { inKanto = true; continue; }
  if (inKanto && line.startsWith('// ──')) { inKanto = false; continue; }
  if (!inKanto || !line.trim()) continue;

  // Only include outdoor route/forest entries; skip city trainers
  const isRouteOrForest = /w\('(?:ROUTE_\d+|VIRIDIAN_FOREST)'/.test(line);
  if (isRouteOrForest) {
    canonicalLines.push('      ' + line.trim());
  }
}

const canonicalBlock = canonicalLines.join('\n');
console.log(`Extracted ${canonicalLines.length} canonical route/forest trainer entries`);

// 3. Read npcDatabase.ts
const dbPath = join(ROOT, 'src/data/npcDatabase.ts');
let db = readFileSync(dbPath, 'utf8');

// ── Replacement A: Route 2 comment + Viridian Forest section ─────────────────
// Remove "// ── Route 2 ──" through (but not including) "// ── Pewter City ──"
// The canonical Viridian Forest entries are already included in canonicalBlock.
const route2Marker = "      // ── Route 2 ──\n";
const pewterMarker  = "      // ── Pewter City ──\n";
const r2Start = db.indexOf(route2Marker);
const pewterStart = db.indexOf(pewterMarker);
if (r2Start !== -1 && pewterStart !== -1 && pewterStart > r2Start) {
  db = db.slice(0, r2Start) + db.slice(pewterStart);
  console.log('Removed Route 2 comment + old Viridian Forest trainers');
} else {
  console.warn('WARNING: Could not find Route 2 / Pewter City markers');
}

// ── Replacement B: Early route trainers (Route 3 through Route 11) ───────────
// Remove "// ── Route 3 ──" through (but not including) "// ── Route 12 / 16 Snorlax ──"
// These are all correctly regenerated in the canonical kanto_overworld_* block.
const route3Marker  = "      // ── Route 3 ──\n";
const snorlaxMarker = "      // ── Route 12 / 16 Snorlax ──\n";
const rt3Start  = db.indexOf(route3Marker);
const snorlaxStart = db.indexOf(snorlaxMarker);
if (rt3Start !== -1 && snorlaxStart !== -1 && snorlaxStart > rt3Start) {
  db = db.slice(0, rt3Start) + db.slice(snorlaxStart);
  console.log('Removed early route trainers (Routes 3-11)');
} else {
  console.warn('WARNING: Could not find Route 3 / Snorlax markers');
}

// ── Replacement C: bulk kanto_overworld_* trainer block ──────────────────────
// Find the first entry in the block (after the Lavender Town sign entries)
// and replace everything up to (not including) the badge check guards section.
const blockStartPattern = /\n      \{ id: '[a-z]+_kanto_overworld_\d+'/;
const badgeGuardMarker  = "      // ── Route 23 badge check guards ──\n";

const blockMatch = blockStartPattern.exec(db);
const badgeStart = db.indexOf(badgeGuardMarker);

if (blockMatch && badgeStart !== -1 && badgeStart > blockMatch.index) {
  // Trim the block: from the matched entry start (include the newline) to just before badge guards
  const blockStart = blockMatch.index + 1; // skip the leading \n
  db = db.slice(0, blockStart) + canonicalBlock + '\n' + db.slice(badgeStart);
  console.log('Replaced kanto_overworld_* trainer block with canonical data');
} else {
  console.warn('WARNING: Could not find kanto_overworld block boundaries');
  console.warn(`  blockMatch: ${blockMatch ? blockMatch.index : 'NOT FOUND'}`);
  console.warn(`  badgeStart: ${badgeStart}`);
}

// 4. Write back
writeFileSync(dbPath, db);
console.log('\nDone. Run tsc + tests to verify.');
