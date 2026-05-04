#!/usr/bin/env node
/**
 * extract-tileset-assets.mjs
 *
 * Reads pokered disassembly:
 *   - gfx/tilesets/*.png        (8×8 tiles, 2-bit grayscale — copied as-is)
 *   - gfx/blocksets/*.bst       (128 blocks × 16 tile IDs)
 *   - data/tilesets/collision_tile_ids.asm
 *   - data/tilesets/door_tile_ids.asm
 *   - data/tilesets/ledge_tiles.asm
 *   - data/tilesets/tileset_headers.asm (grass tiles)
 *   - data/tilesets/warp_tile_ids.asm
 *   - data/tilesets/bookshelf_tile_ids.asm
 *
 * Emits runtime assets:
 *   src/artifacts/tilesets/<blockset>.tiles.png   (raw grayscale PNG)
 *   src/artifacts/tilesets/<blockset>.blocks.json (per-block tile IDs [128][16])
 *   src/artifacts/tilesets/<blockset>.collision.json (walkable tile IDs Set as array)
 *   src/artifacts/tilesets/<blockset>.semantics.json (per-tile-ID {type, walkable})
 *
 * Colorization happens at runtime in the browser via src/lib/tilesets.ts.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('.');
const POKERED = path.join(ROOT, 'pokered_dissasembly');
const TILESETS_PNG_DIR = path.join(POKERED, 'gfx/tilesets');
const BLOCKSETS_DIR = path.join(POKERED, 'gfx/blocksets');
const TILESETS_OUT = path.join(ROOT, 'src/artifacts/tilesets');

// ══════════════════════════════════════════════════════════════════════
// 1. Parse collision tables
// ══════════════════════════════════════════════════════════════════════
const COLLISION_FILE = path.join(POKERED, 'data/tilesets/collision_tile_ids.asm');
const collisionContent = fs.readFileSync(COLLISION_FILE, 'utf8');

const collisionTables = {};
const lines = collisionContent.split('\n');
let pendingColls = [];
for (const line of lines) {
  const collMatch = line.match(/(\w+)_Coll::/);
  if (collMatch) {
    pendingColls.push(collMatch[1].toUpperCase());
  }
  if (pendingColls.length > 0 && line.includes('coll_tiles')) {
    const vals = line.matchAll(/\$([0-9a-fA-F]+)/g);
    const tiles = [...vals].map(v => parseInt(v[1], 16));
    for (const name of pendingColls) {
      if (!collisionTables[name]) collisionTables[name] = new Set();
      for (const t of tiles) collisionTables[name].add(t);
    }
    pendingColls = [];
  }
}

// Map multiple label names to a single blockset name (shared .bst/.png)
if (collisionTables['REDSHOUSE1'] || collisionTables['REDSHOUSE2']) {
  collisionTables['REDS_HOUSE'] = new Set([
    ...(collisionTables['REDSHOUSE1'] || []),
    ...(collisionTables['REDSHOUSE2'] || []),
  ]);
}
if (collisionTables['FORESTGATE'] && !collisionTables['FOREST_GATE']) collisionTables['FOREST_GATE'] = collisionTables['FORESTGATE'];

// ══════════════════════════════════════════════════════════════════════
// 2. Parse tileset headers → grass tiles
// ══════════════════════════════════════════════════════════════════════
const HEADERS_FILE = path.join(POKERED, 'data/tilesets/tileset_headers.asm');
const headersContent = fs.readFileSync(HEADERS_FILE, 'utf8');

const grassTiles = {};
const headerRe = /tileset\s+(\w+),\s+[^,]+,\s+[^,]+,\s+[^,]+,\s+\$?(-?\w+),\s+\w+/g;
let hm;
while ((hm = headerRe.exec(headersContent)) !== null) {
  const name = hm[1].toUpperCase();
  const grassVal = hm[2];
  if (grassVal !== '-1') {
    grassTiles[name] = parseInt(grassVal.replace('$', ''), 16);
  }
}

// ══════════════════════════════════════════════════════════════════════
// 3. Parse door tile IDs per tileset
// ══════════════════════════════════════════════════════════════════════
const DOOR_FILE = path.join(POKERED, 'data/tilesets/door_tile_ids.asm');
const doorContent = fs.readFileSync(DOOR_FILE, 'utf8');

const doorTiles = {};
let currentDoorSection = null;
for (const line of doorContent.split('\n')) {
  const secMatch = line.match(/\.(\w+)DoorTileIDs:/);
  if (secMatch) {
    currentDoorSection = secMatch[1].toUpperCase();
    doorTiles[currentDoorSection] = new Set();
  }
  if (currentDoorSection) {
    const vals = line.matchAll(/\$([0-9a-fA-F]+)/g);
    for (const v of vals) doorTiles[currentDoorSection].add(parseInt(v[1], 16));
  }
}

const doorBlocksetMap = {
  'OVERWORLD': 'OVERWORLD',
  'FOREST': 'FOREST',
  'MART': 'MART',
  'HOUSE': 'HOUSE',
  'REDSHOUSE1': 'REDS_HOUSE_1',
  'REDSHOUSE2': 'REDS_HOUSE_2',
  'DOJO': 'DOJO',
  'GYM': 'GYM',
  'FORESTGATE': 'FOREST_GATE',
  'MUSEUM': 'MUSEUM',
  'GATE': 'GATE',
  'SHIP': 'SHIP',
  'LOBBY': 'LOBBY',
  'MANSION': 'MANSION',
  'LAB': 'LAB',
  'FACILITY': 'FACILITY',
  'PLATEAU': 'PLATEAU',
  'CEMETERY': 'CEMETERY',
  'UNDERGROUND': 'UNDERGROUND',
  'SHIPPORT': 'SHIP_PORT',
  'CLUB': 'CLUB',
};

const doorTilesByBlockset = {};
for (const [secName, blockset] of Object.entries(doorBlocksetMap)) {
  if (doorTiles[secName]) {
    doorTilesByBlockset[blockset] = doorTiles[secName];
  }
}

// ══════════════════════════════════════════════════════════════════════
// 4. Parse warp tile IDs per tileset
// ══════════════════════════════════════════════════════════════════════
const WARP_FILE = path.join(POKERED, 'data/tilesets/warp_tile_ids.asm');
const warpContent = fs.readFileSync(WARP_FILE, 'utf8');

const warpTiles = {};
let currentWarpSection = null;
for (const line of warpContent.split('\n')) {
  const secMatch = line.match(/\.(\w+)WarpTileIDs:/);
  if (secMatch) {
    currentWarpSection = secMatch[1].toUpperCase();
    warpTiles[currentWarpSection] = new Set();
  }
  if (currentWarpSection) {
    const vals = line.matchAll(/\$([0-9a-fA-F]+)/g);
    for (const v of vals) warpTiles[currentWarpSection].add(parseInt(v[1], 16));
  }
}

const warpTilesByBlockset = {};
for (const [secName, blockset] of Object.entries(doorBlocksetMap)) {
  if (warpTiles[secName]) {
    warpTilesByBlockset[blockset] = new Set([...(warpTilesByBlockset[blockset] || []), ...warpTiles[secName]]);
  }
}

// ══════════════════════════════════════════════════════════════════════
// 5. Parse ledge tiles
// ══════════════════════════════════════════════════════════════════════
const LEDGE_FILE = path.join(POKERED, 'data/tilesets/ledge_tiles.asm');
const ledgeContent = fs.readFileSync(LEDGE_FILE, 'utf8');

const ledgeDownTiles = new Set();
const ledgeLeftTiles = new Set();
const ledgeRightTiles = new Set();

const ledgeRe = /db\s+SPRITE_FACING_(\w+),\s+\$([0-9a-fA-F]+),\s+\$([0-9a-fA-F]+),\s+PAD_(\w+)/g;
let lm;
while ((lm = ledgeRe.exec(ledgeContent)) !== null) {
  const [, facing, standingTile, ledgeTile, padDir] = lm;
  const tileId = parseInt(ledgeTile, 16);
  if (padDir === 'DOWN') ledgeDownTiles.add(tileId);
  if (padDir === 'LEFT') ledgeLeftTiles.add(tileId);
  if (padDir === 'RIGHT') ledgeRightTiles.add(tileId);
}

// ══════════════════════════════════════════════════════════════════════
// 6. Parse bookshelf tile IDs
// ══════════════════════════════════════════════════════════════════════
const BOOKSHELF_FILE = path.join(POKERED, 'data/tilesets/bookshelf_tile_ids.asm');
const bookshelfContent = fs.readFileSync(BOOKSHELF_FILE, 'utf8');

const bookshelfTiles = {};
const bsRe = /bookshelf_tile\s+(\w+),\s+\$([0-9a-fA-F]+),\s+(\w+)/g;
let bsm;
while ((bsm = bsRe.exec(bookshelfContent)) !== null) {
  const [, tilesetName, tileId, textId] = bsm;
  const blockset = tilesetName.toUpperCase();
  if (!bookshelfTiles[blockset]) bookshelfTiles[blockset] = new Set();
  bookshelfTiles[blockset].add(parseInt(tileId, 16));
}

// ══════════════════════════════════════════════════════════════════════
// 7. Write assets for each blockset
// ══════════════════════════════════════════════════════════════════════

if (!fs.existsSync(TILESETS_OUT)) fs.mkdirSync(TILESETS_OUT, { recursive: true });

const blocksetFiles = fs.readdirSync(BLOCKSETS_DIR).filter(f => f.endsWith('.bst'));

for (const bstFile of blocksetFiles) {
  const blocksetName = path.basename(bstFile, '.bst').toUpperCase();
  const bstPath = path.join(BLOCKSETS_DIR, bstFile);
  const pngPath = path.join(TILESETS_PNG_DIR, path.basename(bstFile, '.bst') + '.png');

  // Read .bst → blocks[128][16]
  const bstData = fs.readFileSync(bstPath);
  const numBlocks = bstData.length / 16;
  const blocks = [];
  for (let b = 0; b < numBlocks; b++) {
    const tiles = [];
    for (let i = 0; i < 16; i++) tiles.push(bstData[b * 16 + i]);
    blocks.push(tiles);
  }

  // Copy PNG (grayscale, browser will colorize)
  if (fs.existsSync(pngPath)) {
    fs.copyFileSync(pngPath, path.join(TILESETS_OUT, `${blocksetName}.tiles.png`));
  }

  // Write .blocks.json
  fs.writeFileSync(
    path.join(TILESETS_OUT, `${blocksetName}.blocks.json`),
    JSON.stringify(blocks, null, 2)
  );

  // Write .collision.json
  const collSet = collisionTables[blocksetName]
    || collisionTables[blocksetName.replace('_', '')]
    || collisionTables[blocksetName.replace('S_HOUSE_', 'SHOUSE')]
    || new Set();
  fs.writeFileSync(
    path.join(TILESETS_OUT, `${blocksetName}.collision.json`),
    JSON.stringify([...collSet].sort((a, b) => a - b), null, 2)
  );

  // Outdoor-only special tile IDs (only valid in OVERWORLD/FOREST). Inside
  // a house/gym/cave the same tile IDs are tables/chairs/floor decals and
  // must NOT be classified as flowers/fences/trees/ledges or the renderer
  // draws the wrong sprite (e.g. tree inside a living room).
  const WATER_TILE = 0x14;
  const FLOWER_TILES = new Set([0x03, 0x04]);
  const FENCE_TILES  = new Set([0x0E, 0x44, 0x45, 0x46, 0x47, 0x55, 0x56, 0x57]);
  const TREE_TILES   = new Set([0x2A, 0x2B, 0x3A, 0x3B, 0x40, 0x41, 0x50, 0x51]);
  // Sign tiles 0x24/0x34 also exist in some interior blocksets, but only the
  // outdoor blocksets place them as standalone signs; indoors those IDs are
  // furniture. Restrict signs to OVERWORLD/FOREST too.
  const SIGN_TILES   = new Set([0x24, 0x34]);

  const OUTDOOR_BLOCKSETS = new Set(['OVERWORLD', 'FOREST', 'PLATEAU']);
  const isOutdoor = OUTDOOR_BLOCKSETS.has(blocksetName);

  // Write .semantics.json
  const semantics = {};
  const uniqueTileIds = new Set(blocks.flat());

  for (const tid of uniqueTileIds) {
    let type = 'unknown';
    const walkable = collSet.has(tid);

    if (grassTiles[blocksetName] === tid) {
      type = 'grass';
    } else if (doorTilesByBlockset[blocksetName]?.has(tid) || warpTilesByBlockset[blocksetName]?.has(tid)) {
      type = 'door';
    } else if (bookshelfTiles[blocksetName]?.has(tid)) {
      type = 'bookshelf';
    } else if (isOutdoor && ledgeDownTiles.has(tid)) {
      type = 'ledge_down';
    } else if (isOutdoor && ledgeLeftTiles.has(tid)) {
      type = 'ledge_left';
    } else if (isOutdoor && ledgeRightTiles.has(tid)) {
      type = 'ledge_right';
    } else if (isOutdoor && tid === WATER_TILE) {
      type = 'water';
    } else if (isOutdoor && FLOWER_TILES.has(tid)) {
      type = 'flower';
    } else if (isOutdoor && SIGN_TILES.has(tid)) {
      type = 'sign';
    } else if (isOutdoor && FENCE_TILES.has(tid)) {
      type = 'fence';
    } else if (isOutdoor && TREE_TILES.has(tid)) {
      type = 'tree';
    } else {
      // Indoors: walkable → 'floor' (wood/tile floor), non-walkable → 'wall'
      // (table/bookshelf/cabinet — anything you can't walk through).
      type = walkable ? (isOutdoor ? 'path' : 'floor') : 'wall';
    }

    semantics[tid] = { type, walkable };
  }

  fs.writeFileSync(
    path.join(TILESETS_OUT, `${blocksetName}.semantics.json`),
    JSON.stringify(semantics, null, 2)
  );

  console.log(`  ${blocksetName}: ${numBlocks} blocks, ${uniqueTileIds.size} unique tiles, ${collSet.size} walkable`);
}

console.log(`✓ extract-tileset-assets.mjs: ${blocksetFiles.length} blocksets processed.`);
