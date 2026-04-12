# Honest Review

## What's genuinely good

- **The battle engine is impressive.** Pure state machine, fully testable, covers the Gen I damage formula, type chart, STAB, crits, stat stages, the 1/256 miss bug, even the badge boost glitch. That's real craft.
- **The phase FSM** is well-designed — discriminated unions make invalid states unrepresentable. This is the architectural highlight.
- **Demo mode with BFS pathfinding** is a great dev tool. Not many hobby projects bother with that.

## What's concerning

### 1. 8 failing tests

A quarter of your battle engine tests are red. Most seem to be TICK auto-advance vs. test expectation mismatches, not real logic bugs, but it means your safety net has holes. You can't ship with failing tests and call it done.

### 2. Dual NPC databases

`npcDatabase.ts` and `worldConfig.ts` both generate NPCs with different data. App.tsx uses one, the store uses the other. This is a bug factory — trainers will have different teams depending on which path the code takes.

### 3. State duplication is the biggest architectural risk

Battle state is split across local React state (`phase`, `enemyPokemon`, `battleLog`) and the Zustand store (`isBattle`, `isCatching`, `enemyPokemon`). The same concept tracked in two places, eventually they'll disagree and you'll get phantom bugs. The `gameState` ref pattern adds a third surface — every new field must be synchronized manually.

### 4. TypeScript won't compile

Two errors in `worldConfig.ts` — `dialogue` on `Entity` type. This means you haven't run `tsc --noEmit` recently, or you're ignoring it.

### 5. Half the maps are shells

Route 2 and Mt. Moon have no NPCs, items, warps, or encounters. That's not "Kanto through Pewter City" — that's missing critical content for the claimed scope.

### 6. Several known bugs are player-facing and unfixed

The Pokeball silently failing against the rival, battle potions doing nothing, Pewter doors being dead — these break basic gameplay loops. They've been documented in TODO.md but not addressed.

### 7. No movement tests

Movement is a core loop and it has zero test coverage. The interaction hook has tests but the movement engine doesn't.

## Verdict

The foundation is strong — the battle engine architecture, the phase FSM, the Gen I fidelity — these are genuinely well-done. But the project has a "demo vs. product" gap: it proves the concept works but hasn't been hardened into something playable. The state duplication, dual NPC sources, failing tests, and compilation errors suggest velocity outpaced discipline.

## Priority fix list

1. Fix the `tsc` errors (5 minutes)
2. Merge the two NPC databases into one
3. Consolidate battle state — pick Zustand *or* local state, not both
4. Fix the 8 failing tests
5. Fix the player-facing bugs (Pokeball, potions, Pewter doors)
6. Fill in Route 2 and Mt. Moon content

The bones are solid. It needs polish, not more features.