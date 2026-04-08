# CLAUDE.md — Agent Guide for My Pokemon

## Architecture in One Paragraph

`App.tsx` (~400 lines) is a thin orchestrator: it owns React state, creates two shared refs (`gameState`, `battleStateRef`), calls hooks, and composes top-level JSX from presentation components. Game logic lives in hooks. `useBattleEngine` drives `battleEngine.ts` (pure state machine) via `dispatchBattle()`. `useMovementEngine` handles all overworld movement, collision, and encounter triggering. `useInteractionEngine` handles NPC/item/tile interactions. `useInputHandler` manages the keyboard + continuous movement loop.

## Commands

```bash
npm run dev
npm run build
npm run test:run   # single run (CI)
npm run lint
export PATH="/opt/homebrew/bin:$PATH"  # if npm not found on macOS
```

## File Responsibilities

| File | What it owns |
|------|-------------|
| `src/App.tsx` | State, `gameState` ref, `battleStateRef`, hook wiring, JSX |
| `src/lib/battleEngine.ts` | Pure battle state machine — `stepBattle()`, `createBattleState()` |
| `src/types/gamePhase.ts` | `GamePhase` / `BattlePhase` FSM types + `battle(sub)` factory |
| `src/store/gameStore.ts` | Zustand store — all persistent game state |
| `src/hooks/useMovementEngine.ts` | Movement, collision, warps, trainer spotting, encounters → `{ handleMove, initBattle }` |
| `src/hooks/useBattleEngine.ts` | Battle turn dispatch, VFX sequencing, outcomes → `{ dispatchBattle }` |
| `src/hooks/useInteractionEngine.ts` | NPC/item/tile interaction (heal, shop, dialogue, pick up) |
| `src/hooks/useInputHandler.ts` | Keyboard events + self-trigger movement loop (side-effect only) |
| `src/hooks/useDebugAPI.ts` | Dev-only `window.__game` API (side-effect only) |
| `src/data/npcDatabase.ts` | `buildNPCDatabase(playerTeam, hasParcel, hasPokedex, badges)` + `buildItemDatabase(pickedItemIds)` |
| `src/data/worldConfig.ts` | `INITIAL_MAPS`, teleports, static world config (not NPCs) |
| `src/constants.ts` | 151 Pokémon, moves, items, evolutions, `WILD_POKEMON_DATABASE` |
| `src/components/WorldView.tsx` | Overworld viewport — tile grid, player, NPCs, items, HUD |
| `src/components/GameModals.tsx` | All overlay screens — battle, menus, dialogue, shop, etc. |
| `src/components/overworld/` | `GameTile`, `PlayerSprite`, `NPCComponent` (used only by WorldView) |

## The `gameState` Ref

App.tsx keeps a single snapshot ref that all hooks read inside `setTimeout` callbacks (to avoid stale closures). Its shape:

```typescript
gameState.current = {
  playerPos, direction, isMoving, dialogue,
  inBattle,           // boolean
  phaseType,          // phase.type string
  battleSubPhase,     // phase.sub.type string | null
  currentMap, playerTeam, maps, npcs, items,
  defeatedTrainers, inventory, storyStep,
  pcStorage, badges, lastHealLocation
}
```

`battleStateRef` is a separate ref holding the mutable `BattleState` during a fight. It is initialized by `useMovementEngine` (via `initBattle`) and driven by `useBattleEngine`.

**Rule:** Any code inside a `setTimeout` must read game state from `gameState.current`, not from closure-captured hook params.

## Phase FSM Quick Reference

```
EXPLORING → MENU | INVENTORY | TEAM | SHOP | POKEDEX | PC | EDITOR
         → BATTLE_TRANSITION → BATTLE(sub)
         → HEALING | BLACKOUT

BATTLE sub-phases:
  CHOOSING → PLAYER_ATTACK → ENEMY_ATTACK → CHOOSING (loop)
           → PLAYER_FAINTED → FORCED_SWITCH
           → ENEMY_FAINTED → LEVEL_UP → [EVOLVING] → CHOOSING / EXPLORING
           → CATCHING
  BATTLE_INVENTORY / BATTLE_TEAM (sub-menus, return to CHOOSING)
```

Helper constants: `EXPLORING`, `MENU`, `INVENTORY`, `TEAM`, `SHOP`, `POKEDEX`, `PC`, `EDITOR`  
Battle factory: `battle(B_CHOOSING)`, `battle({ type: 'BATTLE_INVENTORY' })`, etc.  
All from `src/types/gamePhase.ts`.

## Common Pitfalls

**Wrong import sources** — these are the ones that bite:
- `GRID_SIZE`, `TILE_SIZE`, `Position`, `Direction`, `NPC`, `Entity`, `Pokemon`, `MapID` → `src/types.ts`
- `BattleAction`, `BattleState`, `stepBattle`, `createBattleState` → `src/lib/battleEngine.ts`
- `GamePhase`, `BattlePhase`, `EXPLORING`, `battle()`, `B_CHOOSING`, etc. → `src/types/gamePhase.ts`
- `GRID_SIZE` is **not** in `src/constants.ts`; `BattleAction` is **not** in `src/types/gamePhase.ts`

**Side effects in state updaters** — React may call updaters twice in Strict Mode:
```typescript
// WRONG — setTimeout inside updater can fire twice
setPlayerTeam(prev => { setTimeout(() => setPhase(EXPLORING), 1000); return newTeam; });

// CORRECT — compute first, side-effect after
const newTeam = [...gameState.current.playerTeam];
setPlayerTeam(newTeam);
setTimeout(() => setPhase(EXPLORING), 1000);
```

**NPC placement** — Add NPCs to `buildNPCDatabase()` in `src/data/npcDatabase.ts`, not `worldConfig.ts`. `worldConfig.ts` owns static map/warp config only.

## Dead Code Checks

Run these two commands after completing any task to catch unused variables, dead imports, and unused dependencies:

```bash
# 1. TypeScript unused locals/parameters (no new errors should appear)
npx tsc --noEmit --noUnusedLocals --noUnusedParameters 2>&1 | grep -E "error TS(6133|6192|6196|6198)" | grep -v node_modules

# 2. Unused exports and dependencies
npx knip --no-progress 2>&1
```

**What to do with findings:**
- Unused imports/locals → delete them
- Unused `export` on internal constants/functions → remove the `export` keyword
- Unused dependencies in `package.json` → remove them
- Setter exists but value never read → either wire the value into JSX or remove the whole state

## Invariants

- All in-game text (dialogue, battle logs, UI labels, move names) must be in **Spanish**.
- Inventory is `Record<itemId, number>` (quantities), not an array.
- When evolving a Pokémon: recompute `baseStats`, `maxHp`, and `hp` — do not copy them from the pre-evolution.
- NPC IDs are globally unique across all maps (used in flat `defeatedTrainers` array).
- Sprite IDs are PokeAPI Pokédex numbers (Bulbasaur = 1, not 0).
- Map coordinates: `(0,0)` is top-left, x increases right, y increases down.
- No backward compatibility. Delete old code; don't add shims or migration paths.
