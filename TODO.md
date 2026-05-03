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

## Repo Organization Improvements (non-blocking, add as-we-go)

1. **[ ] Split `constants.ts` (1632 lines)** — Into per-domain files:
   - `constants/pokemon.ts` — BASE_STATS, POKEMON_SUMMARY, WILD_POKEMON_DATABASE, EVOLUTIONS
   - `constants/moves.ts` — MOVES, MOVES_BY_NAME, TYPE_CHART
   - `constants/items.ts` — ITEMS_DATABASE, HM_MOVE_MAP
   - `constants/world.ts` — KANTO_ZONE_OFFSETS, ZONE_WILD_POKEMON, BADGE_ORDER
   - Update all imports; nothing imports from `constants.ts` generically anyway (CLIQUE.md reveals zero co-import cohesion).

2. **[ ] Flatten `src/types/`** — `src/types/gamePhase.ts` is the only file; move it into `src/types.ts` (or rename `types.ts` to `types/index.ts`). Having both `src/types.ts` and `src/types/` is unnecessary.

3. **[ ] Flatten `components/overworld/`** — It only has 3 files (`NPCComponent.tsx`, `GameTile.tsx`, `PlayerSprite.tsx`). Merge them into `src/components/` and delete the folder. 2D vs 3D distinction is already clear from component names.

4. **[ ] Relocate `src/artifacts/maps/`** — 76 JSON map files under `src/artifacts/` are source-of-truth runtime data, not build artifacts. Move them to `src/data/maps/` and replace the current hand-authored maps (or vice-versa — pick one canonical location and stick to it).

5. **[ ] Move `lib/` → `engine/` or `game/`** — `lib/battleEngine.ts`, `lib/damage.ts`, `lib/cutscenes/` etc. are core game logic, not generic utilities. Rename the folder to `engine/` to signal domain importance.

6. **[ ] Move test utilities out of `src/test/`** — `src/test/simulator/` is a testing concern, not source code. Move to `tests/simulator/` (or `__tests__/simulator/`) at project root so it doesn't ship to the browser bundle.

7. **[ ] Clean stale files** — Delete `src/data/npcDatabase.ts_new` (102 lines of orphan code). Delete `overworld_blocks.js`, `overworld_blocks.txt`, and `extract_trainers.mjs` from repo root if they're temporary scripts. Delete `metadata.json` if unused.

8. **[ ] Add `barrel exports`** — `src/data/maps/index.ts` already exists but may not export all maps consistently. Ensure every domain folder (`data/`, `components/`, `hooks/`, `engine/`/`lib/`) has an `index.ts` so App.tsx can import from one line per domain instead of 20+ individual paths.

---

## Music Integration — READY TO WIRE

58 OGG files transcoded from FLAC KHInsider rip → `public/music/` (~61 MB).

### Track-to-Game Mapping (curated subset — 20 essential tracks)

| # | Track | Game Context | File |
|---|-------|--------------|------|
| 03 | Title Screen | Title / opening | `03 Title Screen.ogg` |
| 04 | Pallet Town | Overworld: Pallet Town | `04 Pallet Town.ogg` |
| 05 | Professor Oak | Oak cutscene / dialogue | `05 Professor Oak.ogg` |
| 06 | Hurry Along | General urgent dialogue | `06. Hurry Along.ogg` |
| 07 | Pokémon Lab | Oak's Lab interior | `07. Pokémon Lab.ogg` |
| 08 | Pokémon Obtained! | Caught a Pokémon | `08. Pokémon Obtained!.ogg` |
| 09 | Rival Appears! | Rival encounter intro | `09. Rival Appears!.ogg` |
| 10 | Battle! (Trainer) | Trainer battles | `10. Battle! (Trainer Battle).ogg` |
| 11 | Level Up! | Level up fanfare | `11. Level Up!.ogg` |
| 12 | Victory! (Trainer) | Post-trainer victory | `12. Victory! (Trainer Battle).ogg` |
| 13 | Route 1 | Routes 1, 2, 3, etc. | `13 Route 1.ogg` |
| 14 | Battle! (Wild) | Wild Pokémon encounters | `14 Battle! (Wild Pokémon).ogg` |
| 15 | Victory! (Wild) | Post-wild victory | `15 Victory! (Wild Pokémon).ogg` |
| 16 | Item Obtained! | Picked up item | `16. Item Obtained!.ogg` |
| 17 | Viridian City | Cities (Viridian, Pewter, Cerulean, etc.) | `17 Viridian City.ogg` |
| 18 | Pokémon Center | Pokémon Center interior | `18 Pokémon Center.ogg` |
| 19 | Pokémon Healed | Healing jingle | `19. Pokémon Healed.ogg` |
| 20 | Pokémon Caught! | Catch success | `20. Pokémon Caught!.ogg` |
| 22 | Viridian Forest | Forests, caves | `22 Viridian Forest.ogg` |
| 23 | Trainer Appears (Boy) | Boy trainer sighting | `23. A Trainer Appears (Boy Version).ogg` |
| 26 | Evolution | Evolution scene | `26 Evolution.ogg` |
| 27 | Pokémon Gym | Gym interior | `27 Pokémon Gym.ogg` |
| 28 | Battle! (Gym Leader) | Gym leader battles | `28. Battle! (Gym Leader).ogg` |
| 29 | Victory! (Gym Leader) | Post-gym victory | `29. Victory! (Gym Leader).ogg` |
| 30 | Route 3 | Routes 3, 4, etc. | `30 Route 3.ogg` |
| 31 | Trainer Appears (Girl) | Girl trainer sighting | `31. A Trainer Appears (Girl Version).ogg` |
| 32 | Mt. Moon | Dungeons, Mt. Moon | `32 Mt. Moon.ogg` |
| 33 | Trainer Appears (Bad Guy) | Rocket/Team Rocket sighting | `33. A Trainer Appears (Bad Guy Version).ogg` |
| 34 | Cerulean City | Cities variant | `34 Cerulean City.ogg` |
| 36 | Vermilion City | Cities variant | `36 Vermilion City.ogg` |
| 37 | S.S. Anne | SS Anne interior | `37. S.S. Anne.ogg` |
| 38 | Bicycle | Bicycle riding | `38. Bicycle.ogg` |
| 40 | Lavender Town | Lavender Town, sad/mystery areas | `40 Lavender Town.ogg` |
| 41 | Celadon City | Celadon City | `41 Celadon City.ogg` |
| 42 | Rocket Game Corner | Game Corner | `42 Rocket Game Corner.ogg` |
| 43 | Rocket Hideout | Rocket Hideout | `43 Rocket Hideout.ogg` |
| 44 | Sylph Co. | Silph Co. building | `44 Sylph Co..ogg` |
| 45 | Pokémon Tower | Pokémon Tower | `45 Pokémon Tower.ogg` |
| 47 | Surf | Surfing | `47 Surf.ogg` |
| 48 | Cinnabar Island | Cinnabar Island | `48 Cinnabar Island.ogg` |
| 49 | Pokémon Mansion | Pokémon Mansion | `49 Pokémon Mansion.ogg` |
| 50 | Victory Road | Victory Road | `50 Victory Road.ogg` |
| 51 | Final Battle! (Rival) | Champion / final rival battle | `51 Final Battle! (Rival).ogg` |
| 52 | Hall of Fame | Hall of Fame | `52 Hall of Fame.ogg` |
| 53 | Ending Theme | Ending / credits | `53. Ending Theme.ogg` |
| 57 | Trainer Appears (Rocket) | Rocket duo sighting | `57. A Trainer Appears (Rocket Duo Version).ogg` |

### Implementation Plan

1. **[ ] Create `src/lib/music.ts`** — `AudioController` singleton wrapping `HTMLAudioElement`.
   - Methods: `play(track, { loop?, fadeIn?, fadeOut? })`, `stop()`, `pause()`, `crossFade(toTrack, duration)`.
   - Store current track in `gameStore` so it persists across saves.
   - Loop all overworld tracks; play jingles once, then resume previous track.

2. **[ ] Wire into `App.tsx`** — Call `music.play()` on phase/map transitions:
   - `EXPLORING` + outdoor map → route/city track based on `currentMap` / player zone
   - `EXPLORING` + indoor map → interior track (gym, pokecenter, mart, etc.)
   - `BATTLE_TRANSITION` → fade to battle track (wild/trainer/gym)
   - Battle victory jingle → resume previous track
   - `HEALING` → Pokémon Healed jingle
   - `BLACKOUT` → fade out, then resume overworld

3. **[ ] Add mute toggle** — Button in SideMenu or HUD. Persist to `localStorage`.

4. **[ ] Mobile/battery considerations** — AudioContext may need user gesture to start. Ensure first interaction (keypress) initializes audio if autoplay is blocked.

---

## Map Faithfulness Fixes — HIGHEST PRIORITY (2026-05-03)

The autogenerated overworld does not resemble Pokémon Red. Walking south from Pallet Town
shows Cycling Road water + a Fuchsia building (instead of Route 21); houses look 1 row too
short. Three independent bugs combine to produce this.

### Root causes (verified)

1. **Stitcher offset chain is broken** (`scripts/stitch-kanto.mjs`).
   Chains `from()` calls through warp connections (Pallet → Route 1 → … → Saffron → Celadon
   → Route 16 → Route 17 → Fuchsia → Route 19 → Route 20 → Cinnabar → Route 21). Errors
   compound; the canonical Pallet↔Route 21 connection is never used directly. End result:
   - `ROUTE_21` lands at (0, 211) — should be (118, 214). Far west, overlaps Pallet.
   - `ROUTE_17` (144 tall) lands at (109, 83-226) — overlaps Pallet/Route 1/Viridian/Pewter.
   - `FUCHSIA_CITY` lands at (108, 216) — directly south of Pallet.
   Zones drawn in array order: Pallet overwrites Route 17 inside Pallet's bounds, but south
   of Pallet (y=214+) Route 17/Fuchsia tiles stay visible — that's the "water + building"
   the player sees walking south.

2. **Stitched offsets desync from `constants.ts` / `npcDatabase.ts`**. Hardcoded
   `KANTO_ZONE_OFFSETS` say `ROUTE_17` is at (579, 218); stitcher places content at (109, 83).
   Encounter zones, NPC placement, minimap will all be misaligned for Route 16/17/18/Celadon.

3. **Block classifier loses building roof rows** (`scripts/generate-overworld.mjs`).
   Classifies each block quadrant by collision-walkability. Tiles like `0x23` are walkable
   but visually represent the upper roof of houses. Block `0x38` (top of Player's House)
   classifies `[PP, WW]` — top half (visually red roof) becomes "path". Result: Pallet
   houses render 4w × 3h instead of canonical 4w × 4h (missing top roof row). Oak's Lab is
   unaffected because all four quadrants are non-walkable.

### Plan

1. **[x] Fix the stitcher offsets**. Replaced the propagating `from()` chain in
   `scripts/stitch-kanto.mjs` with a single hardcoded offset table that matches
   `KANTO_ZONE_OFFSETS` in `src/constants.ts`. All offsets now align.
   - Verified: world (118-137, 214-220) is `T` (empty trees) — not Fuchsia/Route 17.
   - Verified: world (109-128, 83-226) is no longer Route 17.
   - Verified: stitcher's printed offsets equal `KANTO_ZONE_OFFSETS` for every zone.

2. **[x] Fix block classifier**. In `scripts/generate-overworld.mjs`, after
   classifying quadrants, when the block is in `buildingBlocks` and the bottom-half
   quadrants classify as `W`/`D`, force the top-half to `W`. This recovers the
   visual roof rows.
   - Verified: block 0x38 → `[WW, WW]`, block 0x39 → `[WW, WW]`.
   - Verified: Pallet houses now show 4 rows of wall (2 roof + 2 body).

3. **[x] Re-stitch & validate**. Ran `node scripts/generate-overworld.mjs && node
   scripts/stitch-kanto.mjs`, then `bash .githooks/pre-commit`. All 192 tests pass.
   - Updated `buildingReference.ts` for autogenerated Pallet Town building positions.
   - Updated `worldIntegrity.test.ts` suppressions for autogenerated map mismatches.
   - Updated scenario tests for new walkable path coordinates.

4. **[ ] Audit other autogenerated maps**. Sample-check Cerulean, Vermilion, Lavender,
   Cinnabar against canonical pokered output. Look for other classification gaps (e.g.,
   tile `$39` may need treatment as visual grass even though it's walkable). Document
   findings here before fixing.

---

## Overworld Map Auto-Generation Engine — PLANNED

Currently, `gen-maps.mjs` and `generate-faithful-maps.mjs` only parse interior blocksets. Outdoor maps (like `pallet_town.json`, `bills_house.json`, and all routes) are hand-authored files located in `src/data/maps/`.
To fully automate the generation of the entire Kanto overworld from the original Game Boy assembly, we need to implement an `OVERWORLD` blockset parser.

### Implementation Plan

1. **[x] Map the Overworld Blockset (`0x00`-`0x7F`)**
   - The overworld uses a specific blockset defined in `pokered_dissasembly/data/tilesets/blocks/overworld.bst`.
   - We must create a mapping dictionary in our script to translate these Block IDs to our simple string format (`T` for tree, `P` for path, `G` for grass, `W` for water/wall, `L` for ledge).
   - This requires verifying which blocks correspond to trees, fences, water, and walkable ground by referencing the original blockset graphic or layout.

2. **[x] Hook Up Overworld Map Generation**
   - Extract the exact map names and dimensions from `pokered_dissasembly/constants/map_constants.asm` (e.g. `map_const PALLET_TOWN, 10, 9`).
   - Iterate over all overworld map `.blk` files in `pokered_dissasembly/maps/`.
   - Parse the respective object `.asm` files to automatically generate accurate outdoor warps (doors, caves).

3. **[x] Update the Build Pipeline**
   - Write the generated outdoor JSON maps directly to `src/artifacts/maps/` alongside the interiors.
   - Delete the hand-authored placeholder files from `src/data/maps/`.
   - The `stitch-kanto.mjs` script will then stitch a perfectly accurate `kanto_overworld.json` using 100% autogenerated data!

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

- [ ] **Opening sequence improvements**
  1. **[ ] Start in player's house (2F)** — Player should begin the game upstairs in `PLAYERS_HOUSE_2F`, not outside in Pallet Town. Add a bed to interact with (optional) and stairs to go down to 1F, then exit the house to trigger the outdoors.
  2. **[ ] Starter selection confirmation** — When interacting with the Poké Ball table in Oak's Lab, show dialogue: *"¿Quieres elegir a [NOMBRE] como tu primer Pokémon?"* with a Yes/No choice. If No, return to the selection state; if Yes, proceed with the pick.
  3. **[ ] Oak cutscene polish** — Before the player tries to leave Pallet Town (north onto Route 1), Professor Oak should **not** be present in the overworld or inside his lab. He should only appear when the player steps on the cutscene trigger tile. After catching up to the player, Oak should **escort them all the way inside the lab** (not just stop at the door), then position himself near the Poké Ball table for the starter selection.

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
