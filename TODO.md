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
