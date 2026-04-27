#!/usr/bin/env node
/**
 * stitch-kanto.mjs  — run with: node scripts/stitch-kanto.mjs
 *
 * Stitches all outdoor Pokémon-Red-inspired maps into one large
 * src/data/maps/kanto_overworld.json and prints absolute offsets for NPC migration.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAPS_DIR  = resolve(__dirname, '../src/data/maps');

function load(name) {
  const data = JSON.parse(readFileSync(join(MAPS_DIR, `${name}.json`), 'utf8'));
  const h = data.rows.length;
  const w = data.rows[0].length;
  return { name, rows: data.rows, w, h, warps: data.warps || [] };
}

// ─── Load all outdoor maps ────────────────────────────────────────────────────
const pallet         = load('pallet_town');
const route1         = load('route_1');
const viridian       = load('viridian_city');
const route2         = load('route_2');
const viridianForest = load('viridian_forest');
const pewter         = load('pewter_city');
const route3         = load('route_3');
const route4         = load('route_4');
const cerulean       = load('cerulean_city');
const route5         = load('route_5');
const saffron        = load('saffron_city');
const route7         = load('route_7');
const route8         = load('route_8');
const route6         = load('route_6');
const vermilion      = load('vermilion_city');
const route9         = load('route_9');
const route10        = load('route_10');
const lavender       = load('lavender_town');
const celadon        = load('celadon_city');
const fuchsia        = load('fuchsia_city');
const cinnabar       = load('cinnabar_island');

// ─── Derive offsets from warp connections ─────────────────────────────────────
// For a warp A(ax,ay) → B(bx,by):  offB.x = offA.x + ax - bx
function from(aOff, ax, ay, bx, by) {
  return { x: aOff.x + ax - bx, y: aOff.y + ay - by };
}

const palletOff         = { x: 0, y: 0 };
const route1Off         = from(palletOff,        10,   0,  10,  35);
const viridianOff       = from(route1Off,        10,   0,  20,  35);
const route2Off         = from(viridianOff,      20,   0,   4,  39);
const viridianForestOff = from(route2Off,         4,   0,  16,  47);
const pewterOff         = from(viridianForestOff,16,   0,  20,  35);
const route3Off         = from(pewterOff,        39,  19,   0,   8);
// Route 4 is east of Mt Moon — align so its path row matches route3's north exit
const route4Off         = { x: route3Off.x + 30, y: route3Off.y - 4 };
const ceruleanOff       = from(route4Off,        39,   4,   0,  16);
const route5Off         = from(ceruleanOff,      20,  35,   4,   0);
const saffronOff        = from(route5Off,         4,  17,  20,   1);
const route7Off         = from(saffronOff,        0,  18,  19,   4);
const route8Off         = from(saffronOff,       39,  18,   0,   4);
const route6Off         = from(saffronOff,       20,  35,   4,   0);
const vermilionOff      = from(route6Off,         4,  17,  20,   1);
const route9Off         = from(ceruleanOff,      39,  16,   0,   4);
const route10Off        = from(route9Off,        19,   4,   4,   0);
const lavenderOff       = from(route10Off,        4,  23,  10,   0);
const route11        = load('route_11');
const route12        = load('route_12');
const route13        = load('route_13');
const route14        = load('route_14');
const route15        = load('route_15');
const route16        = load('route_16');
const route17        = load('route_17');
const route18        = load('route_18');
const route19        = load('route_19');
const route20        = load('route_20');
const route21        = load('route_21');
const route22        = load('route_22');
const route23        = load('route_23');
const route24        = load('route_24');
const route25        = load('route_25');
const indigo         = load('indigo_plateau');

// Offsets
const route11Off     = from(vermilionOff, 39, 17, 0, 4);
const route12Off     = from(lavenderOff,  10, 17, 10, 0);
const route13Off     = from(route12Off,   10, 107, 49, 0);
const route14Off     = from(route13Off,   0,  17, 19, 0);
const route15Off     = from(route14Off,   0,  53, 59, 9);
const fuchsiaOff     = from(route15Off,   0,  9,  39, 17);
const route19Off     = from(fuchsiaOff,   20, 35, 10, 0);
const route20Off     = from(route19Off,   0,  53, 99, 4);
const cinnabarOff    = from(route20Off,   0,  4,  19, 4);
const route21Off     = from(cinnabarOff,  10, 0,  10, 89);

const celadonOff     = { x: 500, y: 0 }; // Far away
const route16Off     = from(celadonOff,   0,  9,  39, 4);
const route17Off     = from(route16Off,   0,  17, 0,  0);
const route18Off     = from(route17Off,   0,  143,0,  0);

const route22Off     = { x: 500, y: 200 }; // Far away
const route23Off     = from(route22Off,   0,  4,  10, 143);
const indigoOff      = from(route23Off,   10, 0,  10, 17);

const route24Off     = { x: 500, y: 400 }; // Far away
const route25Off     = from(route24Off,   19, 0,  0,  0);

const SEGMENTS = [
  { map: pallet,          off: palletOff,         label: 'PALLET_TOWN'     },
  { map: route1,          off: route1Off,          label: 'ROUTE_1'         },
  { map: viridian,        off: viridianOff,        label: 'VIRIDIAN_CITY'   },
  { map: route2,          off: route2Off,          label: 'ROUTE_2'         },
  { map: viridianForest,  off: viridianForestOff,  label: 'VIRIDIAN_FOREST' },
  { map: pewter,          off: pewterOff,          label: 'PEWTER_CITY'     },
  { map: route3,          off: route3Off,          label: 'ROUTE_3'         },
  { map: route4,          off: route4Off,          label: 'ROUTE_4'         },
  { map: cerulean,        off: ceruleanOff,        label: 'CERULEAN_CITY'   },
  { map: route5,          off: route5Off,          label: 'ROUTE_5'         },
  { map: saffron,         off: saffronOff,         label: 'SAFFRON_CITY'    },
  { map: route7,          off: route7Off,          label: 'ROUTE_7'         },
  { map: route8,          off: route8Off,          label: 'ROUTE_8'         },
  { map: route6,          off: route6Off,          label: 'ROUTE_6'         },
  { map: vermilion,       off: vermilionOff,       label: 'VERMILION_CITY'  },
  { map: route9,          off: route9Off,          label: 'ROUTE_9'         },
  { map: route10,         off: route10Off,         label: 'ROUTE_10'        },
  { map: lavender,        off: lavenderOff,        label: 'LAVENDER_TOWN'   },
  { map: route11,         off: route11Off,         label: 'ROUTE_11'        },
  { map: route12,         off: route12Off,         label: 'ROUTE_12'        },
  { map: route13,         off: route13Off,         label: 'ROUTE_13'        },
  { map: route14,         off: route14Off,         label: 'ROUTE_14'        },
  { map: route15,         off: route15Off,         label: 'ROUTE_15'        },
  { map: fuchsia,         off: fuchsiaOff,         label: 'FUCHSIA_CITY'    },
  { map: route19,         off: route19Off,         label: 'ROUTE_19'        },
  { map: route20,         off: route20Off,         label: 'ROUTE_20'        },
  { map: cinnabar,        off: cinnabarOff,        label: 'CINNABAR_ISLAND' },
  { map: route21,         off: route21Off,         label: 'ROUTE_21'        },
  { map: celadon,         off: celadonOff,         label: 'CELADON_CITY'    },
  { map: route16,         off: route16Off,         label: 'ROUTE_16'        },
  { map: route17,         off: route17Off,         label: 'ROUTE_17'        },
  { map: route18,         off: route18Off,         label: 'ROUTE_18'        },
  { map: route22,         off: route22Off,         label: 'ROUTE_22'        },
  { map: route23,         off: route23Off,         label: 'ROUTE_23'        },
  { map: indigo,          off: indigoOff,          label: 'INDIGO_PLATEAU'  },
  { map: route24,         off: route24Off,         label: 'ROUTE_24'        },
  { map: route25,         off: route25Off,         label: 'ROUTE_25'        },
];

// ─── Compute canvas bounds ────────────────────────────────────────────────────
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const { map, off } of SEGMENTS) {
  minX = Math.min(minX, off.x);
  minY = Math.min(minY, off.y);
  maxX = Math.max(maxX, off.x + map.w);
  maxY = Math.max(maxY, off.y + map.h);
}
const shiftX = -minX, shiftY = -minY;
for (const seg of SEGMENTS) { seg.off.x += shiftX; seg.off.y += shiftY; }
const canvasW = maxX - minX, canvasH = maxY - minY;

// ─── Stitch onto canvas (default tile = 'T' = tree wall) ─────────────────────
const canvas = Array.from({ length: canvasH }, () => Array(canvasW).fill('T'));
for (const { map, off } of SEGMENTS) {
  for (let row = 0; row < map.h; row++) {
    for (let col = 0; col < map.w; col++) {
      canvas[off.y + row][off.x + col] = map.rows[row][col];
    }
  }
}
const rows = canvas.map(r => r.join(''));

// ─── Indoor warps only (caves, buildings) ────────────────────────────────────
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

// ─── Output ───────────────────────────────────────────────────────────────────
const outPath = join(MAPS_DIR, 'kanto_overworld.json');
writeFileSync(outPath, JSON.stringify({ rows, warps: mergedWarps }, null, 2));

console.log(`✓ kanto_overworld.json  ${canvasW}×${canvasH} tiles  (${mergedWarps.length} indoor warps)`);
console.log('\n// KANTO_OFFSETS — paste into npcDatabase.ts:');
for (const { label, off } of SEGMENTS) {
  console.log(`  ${label.padEnd(18)}: { x: ${String(off.x).padStart(3)}, y: ${String(off.y).padStart(3)} },`);
}

// ─── Verify warp alignment (sanity check) ─────────────────────────────────────
console.log('\n// Indoor warps in world coords:');
for (const w of mergedWarps) {
  console.log(`  (${String(w.x).padStart(3)},${String(w.y).padStart(3)}) → ${w.targetMap}`);
}
