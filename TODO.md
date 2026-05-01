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

### Done
- [x] itemUtils.test.ts — Potion on full HP, Antidote on non-poisoned, Revive on alive, combined effects (11 tests)
- [x] Struggle move test — verify STRUGGLE recoil damage to user

## Building Restoration (complete)

All city building tiles restored, warps added, and reciprocal checks passing. World validator: 0 issues. Tests: 174/174 passing.

---

## Ongoing Map Migration & Expansion
- [x] Stage 6 — All Kanto locations registered:
  - [x] Silph Co. (11 floors), Rocket Hideout (4 floors), SS Anne (3 floors)
  - [x] Indigo Plateau lobby + 5 Elite Four rooms
  - [x] Celadon Dept Store (5F + elevator + roof)
  - [x] Game Corner
  - [x] All 8 gyms + 22 dungeon maps registered
  - [ ] Map JSONs are placeholders — need faithful tile layouts + proper warp wiring
- [x] Stage 7 — Faithfulness pass
  - [x] 208 route trainers with pokered parties (151 outdoor + 57 indoor)
  - [x] NPCs validated: duplicate IDs and unwalkable tiles filtered
  - [x] 77 moves with Gen I flags (recoil, drain, multi-hit, fixed-dmg, etc.)

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

