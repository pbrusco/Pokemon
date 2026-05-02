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
  - [x] Map JSONs are now faithful — generated from pokered BLK files with correct dimensions + warp coordinates
- [x] Stage 7 — Faithfulness pass
  - [x] 208 route trainers with pokered parties (151 outdoor + 57 indoor)
  - [x] NPCs validated: duplicate IDs and unwalkable tiles filtered
  - [x] 77 moves with Gen I flags (recoil, drain, multi-hit, fixed-dmg, etc.)

## Inventory & Items
- [x] Update item usage UI to target specific Pokémon in the party (currently heals all)
- [x] Implement new items and their effects in battle and overworld (Antidote, Revive, etc.)

## Battle Mechanics & Move Variety
- [x] Freeze status — fully implemented (20% thaw chance per turn, skip turn while frozen)
- [x] Paralysis speed reduction — quartered speed in escape, applied to turn-order comparison
- [x] Expand move pool — 77 moves (up from 19) with Gen I flags: recoil, drain, multi-hit, rampage, recharge, two-turn, fixed-dmg, confuse, priority
- [x] Thunder Wave, Confusion/Psybeam, Leech Seed, Toxic — all implemented
- [ ] Add battle text feedback for invisible states: stat boosts at ±6 limits

## Story Events & Progression Items
- [x] Rival encounters: Route 22, Cerulean, SS Anne, Pokémon Tower (4 encounters)
- [x] Team Rocket: Mt. Moon grunt, Cerulean burglar, Saffron occupation (placeholders)
- [x] Key Items and HM gates: CUT (Route 25 pickup + cascade badge gate), SURF (Vermilion pickup + soul badge gate), Silph Scope (Tower 2F pickup), Poké Flute (Mr. Fuji after Silph Scope)
- [ ] Rocket Hideout boss Giovanni + Silph Co boss Giovanni
- [ ] Elite Four NPC rooms (Lorelei, Bruno, Agatha, Lance, Champion Rival)

## Playtesting
- [ ] Manual browser playtest

---

## UI / UX Fixes (from review session)

- [ ] **#1 — Remove lock/reset-view icons**: Remove the lock-character and reset-view buttons from the HUD (and their underlying functionality). Zoom-out removal is already in progress.
- [ ] **#2 — Remove Team menu entry; add reorder in party screen**: The party is already shown at the bottom of the side menu — remove the redundant "Equipo" menu item. Add drag-to-reorder (or up/down swap buttons) directly in the party-screen view.
- [ ] **#3 — Bag inline in menu, no modal**: Items are already visible in the menu; make each item row directly clickable/usable from there. Remove the separate bag/inventory modal.
- [ ] **#4 — NPC sprite squash fix**: NPC sprites are vertically squashed ("stepped on by an elephant"). Audit sprite container dimensions and `object-fit` / `image-rendering` for all NPC sprites in `NPCComponent.tsx` and `WorldView.tsx`.
- [ ] **#5 — Player battle sprite too small**: After the spritesheet-clip fix for Red's back sprite, the rendered sprite is tiny. Fix the wrapper/clip dimensions in `BattleScreen.tsx` so the player character appears at the correct size (matching Pokémon sprite scale).
- [ ] **#6 — 3D view sprites wrong size/aspect**: Sprites in `WorldView3D.tsx` are incorrectly sized or stretched. Apply the same sprite-dimension fix as #4/#5 to the 3D billboard sprites.
- [ ] **#7 — 3D signs rendered as balls**: Sign tiles appear as spheres in 3D mode. Replace the sign mesh/geometry in `WorldView3D.tsx` with a flat billboard or signpost shape matching the 2D tile art.
- [ ] **#8 — First battle should be vs. Blue (Azul), not a blank trainer**: When the player first steps into the starter-selection area (Oak's Lab), the scripted battle must be against Blue/Azul. Currently fighting an unnamed trainer, then Blue triggers a second battle via line-of-sight. Fix the battle-init logic so only one Blue battle fires, with the correct trainer data.
- [ ] **#9 — HP bar jumps up then down on damage**: When the opponent takes damage, the HP bar sometimes animates upward before going down (likely a color-threshold re-render resetting the `scaleX` origin). Audit the HP bar animation in `BattleScreen.tsx` — ensure the bar only ever transitions from current → new value without re-mounting or resetting transform on color change.
- [ ] **#10 — Trainer parties are wrong**: Trainers around Kanto have incorrect Pokémon and/or levels (e.g. "Golfo" on Route 1 with a Primeape lvl 29). Audit the trainer database and verify every trainer's party matches the canonical Pokémon Red data from the pokered source. Clean up any invented or misassigned parties.

