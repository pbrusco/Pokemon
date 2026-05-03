# TODO

## Architecture Notes (reference before working)

- All outdoor zones live in `src/data/maps/kanto_overworld.json` as a single stitched tile grid.
  Zone offsets (top-left corner of each zone in world coords) are defined **twice** — keep them in sync:
  - `src/data/npcDatabase.ts` → `O` object (used by `w()` to place NPCs/items)
  - `src/constants.ts` → `KANTO_ZONE_OFFSETS` (used for encounter zone lookup + minimap)
- NPC data: `src/data/npcDatabase.ts` → `buildNPCDatabase()`
- Tile characters: `T`=tree, `P`=path, `G`=grass, `W`=wall, `L`=ledge_down, `~`=water, `D`=door, `S`=sign
- Canonical source for map layouts: `pokered_dissasembly/data/maps/objects/*.asm` + `tilesets/`
- Run `bash .githooks/pre-commit` before finishing any task (tsc + vitest + knip).
- Integrity test suppressions live in `src/data/__tests__/worldIntegrity.test.ts` — remove them
  once the corresponding area is built.

---

## Kanto Map Completion — HIGHEST PRIORITY

Three outdoor zones have zero tile data (all trees). They form one contiguous cluster on the far-right
section of `kanto_overworld.json` at roughly x:579-668. NPCs for these zones are already placed in
`npcDatabase.ts` with correct coordinates; they just need walkable tiles under them.

### Task: Draw Route 17 (Cycling Road)
- **Zone**: `ROUTE_17` at world `(579, 218)`, 20 wide × 144 tall tiles
- **Tile pattern**: Narrow path corridor (~6 tiles wide, `P`) flanked by `T` trees on each side.
  No grass (`G`) — Route 17 has no wild encounters in Gen I (bikes only).
  Add a small gate building (2 `D` tiles + surrounding `P`) at the north end (connects to Route 16)
  and south end (connects to Route 18 at y=361).
- **Warps**: North gate → ROUTE_16_GATE interior; South gate → ROUTE_18 (Route 18 tiles already exist at x:579, y:361)
- **Reference**: `pokered_dissasembly/data/maps/objects/Route17.asm` for trainer/object coords

### Task: Draw Route 16
- **Zone**: `ROUTE_16` at world `(579, 201)`, 40 wide × 18 tall tiles
- **Tile pattern**: Horizontal `P` path (4-6 tiles wide) with `G` grass patches near the west end.
  Gate building (the Route 16 gate) at east end connecting to Route 17 north.
  Connect west end via warp to Celadon City east exit.
- **Reference**: `pokered_dissasembly/data/maps/objects/Route16.asm`

### Task: Draw Celadon City
- **Zone**: `CELADON_CITY` at world `(618, 196)`, 50 wide × 36 tall tiles
- **Key buildings** (from pokered canonical layout):
  - Celadon Dept. Store (largest building — 6×6 footprint, `W` walls, `D` door on south face)
  - Celadon Game Corner (`W` + `D`)
  - Celadon Gym (`W` + `D`)
  - Pokémon Center (`W` + `D`)
  - Poké Mart (`W` + `D`)
  - Various houses
- **Warps**: Each `D` door tile needs a warp entry in `kanto_overworld.json` pointing to the
  interior map (CELADON_DEPT_1F, CELADON_GYM, GAME_CORNER, POKECENTER, etc.)
  West exit → Route 7 (already tiled at world x:197, y:65 — add warp there too).
  East exit → Route 16 west end.
- **NPCs already placed** in `npcDatabase.ts` (celadon_little_girl, celadon_gramps1/2/3,
  celadon_girl, celadon_fisher, celadon_poliwrath, celadon_rocket1/2 etc.) — their world coords
  are correct; they just need walkable tiles.
- **Integrity test**: Remove the `celadon_` and `route_16`/`route_17` suppressions from
  `worldIntegrity.test.ts` once tiles are drawn and NPCs land on walkable ground.
- **Reference**: `pokered_dissasembly/data/maps/objects/CeladonCity.asm`

---

## Open Bugs

- [ ] **Connector gate buildings** — Several Route connector gates (at approx world tiles
  (169,69-70), (190,70), (156,74), (160,74), (175,82), (181,82), (161,90)) have `D`/`S` tiles
  with no matching warp or sign entity. These are suppressed in the integrity test.
  Fix: add sign `object` entities and warp entries for each gate building.
  Likely affected gates: Route 5/6 gates (Cerulean↔Saffron), Route 7/8 gates (Saffron↔Lavender).

---

## Battle Mechanics

- [ ] Stat boost ±6 limit feedback text ("ya no puede mejorar más...")

---

## Story / Content

- [ ] Giovanni bosses — Rocket Hideout B4F + Silph Co. 11F
- [ ] Elite Four rooms — Lorelei, Bruno, Agatha, Lance, Champion Rival

---

## Recently Completed (for reference)

- [x] **Trainer parties** — All outdoor trainer parties synced from `pokered_dissasembly/parties.asm`
  via `scripts/generate-trainer-npcs.mjs` + `scripts/sync-canonical-trainers.mjs`.
- [x] **Trainer placement bug** — Fixed wrong zone offsets for Celadon City, Route 16, Route 17,
  Route 18 in `npcDatabase.ts` `O` object (they pointed to Viridian Forest coords, causing
  high-level Route 17 trainers like Cueball Lv29 Primeape to appear in early-game areas).
- [x] **NPC sprite size** — Doubled display width from `TILE_SIZE/2` to `TILE_SIZE` (32→64px) in
  `NPCComponent.tsx`; height scales via `frameH` field (portrait 16×32 → 64×128px, square 16×16 → 64×64px).
- [x] **NPC sprite squash** — Added `frameH: 16 | 32` to `npcSpriteMap.ts`; square sprites
  (Snorlax, Chansey, etc.) no longer get stretched to portrait aspect ratio.
- [x] **Player back sprite** — Increased from 48px to 96px in `BattleScreen.tsx`.
- [x] **3D NPC billboard scale** — Uses `frameH` for correct square vs portrait scale.
- [x] **3D signs** — Signs now render as signpost geometry (post + board) instead of spheres.
- [x] **HP bar animation** — Fixed jump artifact: tracks visual position in `visualRef` instead of
  animation target, so interrupted animations always start from where the bar visually is.
- [x] **Blue (Azul) first battle** — Dialogue now shows before battle starts (via callback); removed
  spurious `RIVAL ` prefix from rival Pokémon name.
- [x] **Minimap infinite loop** — Fixed unstable `useGameStore(s => s.getNPCs())` selector
  in `Minimap.tsx`; replaced with stable primitive selectors + `useMemo`.
- [x] **Party reorder** — Added ▲/▼ swap buttons in SideMenu party section.
- [x] **Bag inline** — Items clickable directly from side menu; removed separate Equipo/Mochila menu entries.
