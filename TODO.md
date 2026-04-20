# TODO

1. ~~Battle initiation duplicated in 3 places~~
Fixed: unified into `src/lib/launchBattle.ts`. All three sites (initBattle, wild encounter, processBattle) now call `launchBattle()`.

2. ~~handleMove is a 150-line god function~~
Fixed: extracted `checkTrainerVision()`, `tryWildEncounter()`, and `applyOverworldPoison()` from handleMove. Core function is now ~50 lines.

3. ~~resolveBattleOutcome trainer lookup is fragile~~
Fixed: now uses `newState.trainerName` (the trainer ID) for direct lookup instead of matching by Pokémon species.

4. ~~Nested setTimeout chains in useBattleEngine~~
Fixed: flattened nested timeouts in `resolveBattleOutcome` (blackout flow uses absolute offsets instead of nesting). Extracted catch flow into `handleCatchAction` helper. All setTimeout callbacks use fresh `useGameStore.getState()`.

5. ~~GameModals receives ~25 props~~
Fixed: GameModals now reads store directly via `useGameStore()`. Interface reduced from 28 props to 6 (only local React state + non-store callbacks remain as props).

## Faithful map migration (in progress)
- [x] Stage 1 — Pallet Town + interiors (Oak's Lab, Red's 1F/2F, Rival's House)
- [x] Stage 2 — Small interiors (Pokécenter 14×8, Pokémart 10×8, Pewter Gym 10×14)
- [x] Stage 3 — Routes: Route 1 (10×36), Route 2 (10×40), Route 3 (40×18); warps coordinated with adjacent cities
- [x] Stage 4 — Cities & dungeons: Viridian City (30×27), Pewter City (30×27), Viridian Forest (24×36), Mt. Moon (warps updated)
- [x] Stage 5 — Expand existing maps to full pret dimensions
  - [x] 5a. Viridian City → 40×36
  - [x] 5b. Pewter City → 40×36
  - [x] 5c. Viridian Forest → 34×48
  - [x] 5d. Mt. Moon → split into 1F / B1F / B2F
- [ ] Stage 6 — Grab all missing Kanto locations:
  - Dungeons/multi-floor: Rock Tunnel (1F, B1F), Pokémon Tower (7F), Seafoam Islands (4F), Victory Road (3F), Cerulean Cave (3F), Silph Co. (11F), Power Plant, Pokémon Mansion (4F), Safari Zone (4 areas + warden), Indigo Plateau lobby + 5 Elite Four rooms
  - Routes: 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25 (+ gates: Saffron 5/6/7/8, Route 2 gate, 11/12/15/16 gates)
  - Cities/towns: Cerulean, Vermilion, Lavender, Celadon, Fuchsia, Saffron, Cinnabar Island, Indigo Plateau
  - Gyms: Cerulean, Vermilion, Celadon, Fuchsia, Saffron, Cinnabar, Viridian
  - Interiors: Bill's House, Daycare, SS Anne (multi-floor), Celadon Dept Store (6F), Game Corner, Rocket Hideout (4F), Copycat's House, Pokémon Fan Club, Dojo, Cinnabar Lab, Safari Warden
- [ ] Manual browser playtest of pilot + Stage 2 interiors

## PP tracking in battle
- [x] Decrement PP when a move is used in `battleEngine.ts`
- [x] Prevent selecting moves with 0 PP
- [x] Implement Struggle (used when all moves have 0 PP): typeless, 50 power, 1/4 recoil damage
- [x] Restore PP on heal at Pokécenter
- [x] Display current/max PP in the battle move selection UI

## More map content

## Overworld poison damage
- [x] Tick 1 HP every 4 steps for poisoned Pokémon while walking
- [x] Faint poisoned Pokémon at 0 HP (Gen I: poison can kill outside battle)
- [x] Show poison damage visual/text feedback on the overworld
- [x] Clear poison on heal at Pokécenter

## Battle fixes
- [x] Team order preserved after blackout — `useBattleEngine.ts` now heals `store.playerTeam` (original order) instead of `newState.playerTeam` (battle order)
- [x] Fainted lead Pokémon can no longer start a battle — `createBattleState` enters `FORCED_SWITCH` phase when `playerTeam[0].hp === 0`
- [x] Key-repeat no longer auto-dismisses dialogues — `useInputHandler.ts` ignores `e.repeat` events for dialogue dismissal
- [x] Oak greeting dialogue added before the escort walk
