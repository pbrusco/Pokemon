# CLAUDE.md — Agent Guide for My Pokemon

## Vision

This is a faithful recreation of Pokémon Red / Fire Red (Gen I) built with modern web tech (React 19, TypeScript, Vite, Zustand). The goal is to reproduce the original gameplay feel — turn-based battles, tile movement, Kanto story — not to clone the visuals pixel-for-pixel. Mechanics (damage formula, type chart, stat calc, status effects) follow Gen I rules. All in-game text is in Spanish. Scope is limited to Gen I: 151 Pokémon, Kanto region, condensed storyline from Pallet Town through Pewter City.

## Architecture

`App.tsx` owns React state, two shared refs (`gameState`, `battleStateRef`), hook wiring, and JSX. Logic lives in hooks: `useBattleEngine` drives `battleEngine.ts` (pure state machine), `useMovementEngine` handles movement/collision/encounters, `useInteractionEngine` handles NPC/item/tile interactions, `useInputHandler` manages keyboard + movement loop.

## The `gameState` Ref

All hooks read this inside `setTimeout` to avoid stale closures. **Never** read closure-captured hook params inside `setTimeout` — always use `gameState.current`.

```typescript
gameState.current = {
  playerPos, direction, isMoving, dialogue,
  inBattle, phaseType, battleSubPhase,
  currentMap, playerTeam, maps, npcs, items,
  defeatedTrainers, inventory, storyStep,
  pcStorage, badges, lastHealLocation
}
```

`battleStateRef` holds mutable `BattleState` during fights (initialized by `initBattle`, driven by `useBattleEngine`).

## Phase FSM

```
EXPLORING → MENU | INVENTORY | TEAM | SHOP | POKEDEX | PC | EDITOR
         → BATTLE_TRANSITION → BATTLE(sub)
         → HEALING | BLACKOUT

BATTLE sub-phases:
  CHOOSING → PLAYER_ATTACK → ENEMY_ATTACK → CHOOSING
           → PLAYER_FAINTED → FORCED_SWITCH
           → ENEMY_FAINTED → LEVEL_UP → [EVOLVING] → CHOOSING / EXPLORING
           → CATCHING
  BATTLE_INVENTORY / BATTLE_TEAM → CHOOSING
```

Imports: `EXPLORING`, `MENU`, `INVENTORY`, `TEAM`, `SHOP`, `POKEDEX`, `PC`, `EDITOR`, `battle()`, `B_CHOOSING` → `src/types/gamePhase.ts`

## Common Pitfalls

**Wrong imports:**
- `GRID_SIZE`, `TILE_SIZE`, `Position`, `Direction`, `NPC`, `Entity`, `Pokemon`, `MapID` → `src/types.ts`
- `BattleAction`, `BattleState`, `stepBattle`, `createBattleState` → `src/lib/battleEngine.ts`
- `GRID_SIZE` is NOT in `src/constants.ts`; `BattleAction` is NOT in `src/types/gamePhase.ts`

**Side effects in state updaters** (React Strict Mode calls updaters twice):
```typescript
// WRONG
setPlayerTeam(prev => { setTimeout(() => setPhase(EXPLORING), 1000); return newTeam; });
// CORRECT
const newTeam = [...gameState.current.playerTeam];
setPlayerTeam(newTeam);
setTimeout(() => setPhase(EXPLORING), 1000);
```

**NPC placement** — use `buildNPCDatabase()` in `npcDatabase.ts`, not `worldConfig.ts`.

## Invariants

- All in-game text must be in **Spanish**.
- Inventory is `Record<itemId, number>`, not an array.
- On evolution: recompute `baseStats`, `maxHp`, `hp` — don't copy from pre-evolution.
- NPC IDs are globally unique (used in flat `defeatedTrainers` array).
- Sprite IDs = PokeAPI Pokédex numbers (Bulbasaur = 1).
- Coordinates: `(0,0)` top-left, x→right, y→down.
- No backward compatibility — delete old code, no shims.
- If npm is not found on macOS: `export PATH="/opt/homebrew/bin:$PATH"`
- After every task run: `npx tsc --noEmit`, `npx tsc --noEmit --noUnusedLocals --noUnusedParameters 2>&1 | grep -E "error TS(6133|6192|6196|6198)" | grep -v node_modules`, `npx knip --no-progress 2>&1` — delete unused imports/exports/deps.

## Testing

When testing UX, interactions, or game logic, prioritize using the existing **Vitest** implementation over interacting manually via the browser. 
- Run tests via `npm run test:run`.
- The game uses `@testing-library/react` to render hooks and test state machines efficiently without the overhead of a headless browser. See `src/hooks/__tests__/useInteractionEngine.test.ts` for examples.
