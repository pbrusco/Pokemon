# TODO

1. Battle initiation duplicated in 3 places
Battle creation happens in initBattle (useMovementEngine:33), inline in handleMove (useMovementEngine:187-200), AND in processBattle (runner.ts:198). Each creates a BattleState slightly differently — this is exactly what caused the bug we just fixed (processBattle couldn't set battleStateRef).

2. handleMove is a 150-line god function
useMovementEngine.ts:52-202 handles collision, warps, poison damage, grass effects, trainer vision, AND wild encounter creation — all in a single useCallback. Each concern should be its own extracted function.

3. ~~resolveBattleOutcome trainer lookup is fragile~~
Fixed: now uses `newState.trainerName` (the trainer ID) for direct lookup instead of matching by Pokémon species.

4. Nested setTimeout chains in useBattleEngine
dispatchBattle → playBattleEffects → finalize → resolveBattleOutcome creates 3-4 levels of nested timeouts with mixed closure captures (s at one level, useGameStore.getState() at another). This was the root cause of confusing state bugs.

5. GameModals receives ~25 props
App.tsx:184-213 passes 25+ props to GameModals despite the Zustand store being available. Most of these could be read directly from the store inside the component.

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
