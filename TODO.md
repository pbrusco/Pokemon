# TODO

## Architecture notes (read before working)

- **All map data is auto-extracted** from `pokefirered_dissasembly/` via `npm run generate:firered` (runs automatically on `npm run dev`/`npm run build`).
- Zone offsets live in `src/data/firered/kantoZoneOffsets.generated.ts` — never hand-edit. To shift a zone, fix it in the disassembly's `connections` data and re-run the pipeline.
- NPC data: `src/data/npcDatabase.ts` → `buildNPCDatabase()`. Coordinates use `w('ZONE_NAME', lx, ly)` against the auto-generated offsets.
- The internal `MapID` ↔ FireRed `LAYOUT_*` mapping is in `scripts/generate-indoor-maps.mjs` (`MAP_ID_TO_FIRERED`). To add a new playable indoor map, add an entry there and re-run `npm run generate:firered`.
- Run `bash .githooks/pre-commit` before finishing any task (tsc + vitest + knip).

---

## Next up

### Auto-extract NPCs from FireRed `object_event` data — HIGH PRIORITY

The npcDatabase positions are mostly hand-tuned and now misaligned with FireRed coords (most NPCs may sit on walls or empty floor). Each `LAYOUT_*.json` already includes the canonical FireRed `object_events` with `x`, `y`, `graphics_id`, and `script` fields.

**Plan:**

1. Extend `scripts/generate-indoor-maps.mjs` (or add `generate-npcs.mjs`) to emit a `firedNpcs.generated.ts` file with positions extracted from each layout's `meta.object_events`.
2. `npcDatabase.ts` consumes the generated positions and overlays Spanish dialogue + custom behavior (heal, give-item, trigger-cutscene) by `local_id` or graphics class.
3. Sweep — verify each migrated map's NPC positions on a walkable tile (the `warpRoundTrip.test.ts` pattern can be extended to check NPC-on-walkable invariant).

This unblocks the rest of the game loop on FireRed coords.

### Migrate VIRIDIAN_FOREST as its own MapID

VForest has no `connections` so it didn't land in the stitched outdoor. It should be its own MapID with FireRed layout `LAYOUT_VIRIDIAN_FOREST` and warps from Route 2 → VFOREST → Route 2. Once migrated:
- Re-enable `Scenario 12` in `src/test/simulator/scenarios.test.ts` (currently `it.todo`).

### Per-city pokémon centers / marts

Right now `POKECENTER` and `POKEMART` are single shared maps. FireRed has a per-city pokémon center + mart. Split:
1. Add `POKECENTER_VIRIDIAN`, `POKECENTER_PEWTER`, etc. to the MapID enum.
2. Update `MAP_ID_TO_FIRERED` in `scripts/generate-indoor-maps.mjs` to point each one at `LAYOUT_<CITY>_POKEMON_CENTER_1F`.
3. Update warps: each city's stitched outdoor warp should target its own pokémon center.

### Battle mechanics polish

- [ ] Stat boost ±6 limit feedback text ("ya no puede mejorar más…")
- [ ] Giovanni bosses — Rocket Hideout B4F + Silph Co. 11F final encounters
- [ ] Elite Four scripted run-throughs — Lorelei, Bruno, Agatha, Lance, Champion Rival

### Story / content

- [ ] **Opening sequence**
  1. Start in PLAYERS_HOUSE_2F (the player's bedroom) instead of outside
  2. Starter-selection confirmation dialogue ("¿Quieres elegir a [NOMBRE] como tu primer POKÉMON?")
  3. Oak cutscene polish — Oak should escort all the way inside the lab (not stop at the door) and stand by the Poké Ball table
- [ ] Music auto-switching by current map (FireRed maps have a `music` field in `map.json`)

### Polish / DX

- [ ] Use FireRed metatile attributes for richer `Tile.type` (currently everything walkable is `floor`/`path`; FireRed metatile attrs distinguish grass vs water vs ledge_down/left/right vs warp surfaces)
- [ ] Re-enable strict warp suppressions in `src/data/__tests__/worldIntegrity.test.ts`
- [ ] Drop `eventLog.ts` from the DOM-globals decoupling allowlist (split into pure recorder + browser bridge)

---

## Recently completed (FireRed migration round)

- [x] Full FireRed pipeline (`build-firered-pipeline.mjs` + `stitch-firered-overworld.mjs` + `generate-indoor-maps.mjs`) — fully programmatic, no hand-maintained coords
- [x] Multi-zone Kanto stitched from connection graph (38 outdoor zones, 408×400 tiles)
- [x] Canvas-based metatile renderer (`FireredMapView.tsx`) with full color, palette flips, multi-tileset support
- [x] All 77 indoor maps switched to FireRed source
- [x] Auto-pinned exit warps for round-trip symmetry; locked by `warpRoundTrip.test.ts`
- [x] Removed `pokered_dissasembly/` (37 MB), all `src/artifacts/maps/` and `src/artifacts/tilesets/`, the autotiler-based renderer (≈1000 lines), the legacy buildingReference/blocksetData stack, and 8 one-off pokered scripts
- [x] Standalone preview routes: `?firered=KANTO`, `?firered=LAYOUT_*`
- [x] Zone offsets auto-generated to TS (`kantoZoneOffsets.generated.ts`); npcDatabase + `KANTO_ZONE_OFFSETS` consume the same source of truth

---

## Recently completed (pre-FireRed)

- [x] Trainer parties synced from canonical FireRed/Red trainer scripts
- [x] NPC sprite size + frame-height fixes
- [x] HP bar animation jump fix; rival battle dialogue ordering; minimap infinite-loop selector fix
- [x] Bag inline + party reorder UI
- [x] Music system (61 OGG tracks transcoded; mute toggle)
