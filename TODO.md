# TODO

## Performance Optimization (in progress)

### Done
- [x] App.tsx — granular store selectors (was subscribing to full 100+ prop store, re-rendering on every player step, camera drag, and wildPokemon tick)
- [x] useWildPokemonEngine — removed playerPos + wildPokemon from useEffect deps, reads from getState() inside tick instead of destroying/recreating setInterval every step
- [x] Minimap — background tiles cached in offscreen canvas, only redraws on map change (not every player step)
- [x] React.memo added: DialogueBox, GameHeader, NPCComponent, ScreenEffects, BattleTransition, PlayerSprite, BattleScreen

### Done (this session)
- [x] Add React.memo to: GameModals, MobileControls, MenuButton, SideMenu, InventoryUI, TeamMenuUI, PCStorageUI, PokedexUI, ShopUI, MapEditor
- [x] Memoize vision indicators and warp indicators in WorldView.tsx (useMemo)
- [x] Removed zoom-out efficiency patches (cullRadius, cullStep, useStaticMap, useColorMode) — replaced with useMemo on tile arrays, rebuilds only on map change not player step
- [x] Added `will-change: transform` and `contain: strict` to map container
- [x] HP bar in team HUD now uses `scaleX` transform instead of `width` (GPU-composited)
- [x] Deleted unused StaticMap component
- [x] Fixed pre-existing tsc error: VIRIDIAN_CITY type in buildingReference.ts

### Remaining
- [ ] Add `itemUtils.test.ts` — pure function with high edge-case density: Potion on full HP fails, Antidote on non-poisoned fails, Revive on alive fails, combined effects
- [ ] Add movement unit tests — ledge one-way constraint, warp trigger, poison chip damage on step (movement engine has zero direct tests)
- [ ] Add Struggle move test — verify that when all PP = 0, STRUGGLE is used and deals recoil damage to the user

## Building Restoration (complete)

All city building tiles restored, warps added, and reciprocal checks passing. World validator: 0 issues. Tests: 174/174 passing.

---

## Ongoing Map Migration & Expansion
- [ ] Stage 6 — Grab all missing Kanto locations:
  - [ ] Dungeons/multi-floor: Rock Tunnel (B1F), Pokémon Tower (2-7F) [Partially: 2-3F], Seafoam Islands (4F), Victory Road (3F), Cerulean Cave (3F), Silph Co. (11F), Power Plant, Pokémon Mansion (4F), Safari Zone (4 areas + warden), Indigo Plateau lobby + 5 Elite Four rooms
  - [ ] Routes: 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25 (+ gates: Saffron 5/6/7/8, Route 2 gate, 11/12/15/16 gates) [Partially: 7 and 8 added]
  - [ ] Cities/towns: Cerulean, Vermilion, Lavender, Celadon, Fuchsia, Saffron, Cinnabar Island, Indigo Plateau
  - [ ] Gyms: Cerulean, Vermilion, Celadon, Fuchsia, Saffron, Cinnabar, Viridian
  - [ ] Interiors: Bill's House, Daycare, SS Anne (multi-floor), Celadon Dept Store (6F), Game Corner, Rocket Hideout (4F), Copycat's House, Pokémon Fan Club, Dojo, Cinnabar Lab, Safari Warden
- [ ] Stage 7 — Faithfulness pass on existing maps
  - [ ] Add missing overworld items (Pokéballs, Potions, etc.) as interactables on the map
  - [ ] Adjust trainer level curves so trainers on a route stay within ±1 level, and Gym Leaders cap at +2

## Inventory & Items
- [x] Update item usage UI to target specific Pokémon in the party (currently heals all)
- [x] Implement new items and their effects in battle and overworld (Antidote, Revive, etc.)

## Battle Mechanics & Move Variety
- [ ] Implement unreachable status effects: Freeze status
- [ ] Implement missing status effect mechanics: Paralysis speed reduction
- [ ] Expand move pool (~20 currently): Add key status/tactical moves like Thunder Wave, Confuse Ray, Leech Seed, Toxic
- [ ] Add battle text feedback for invisible states: E.g. when stat boosts hit their maximum/minimum limits (±6 stages)

## Story Events & Progression Items
- [ ] Implement Rival encounters beyond the early game
- [ ] Implement Team Rocket events (Mt. Moon, Game Corner, Silph Co.)
- [ ] Implement Key Items and HM gates (e.g., CUT for gyms, Poké Flute for Snorlax, Silph Scope)

## Playtesting
- [ ] Manual browser playtest of pilot + Stage 2 interiors

