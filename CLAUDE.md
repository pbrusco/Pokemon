# CLAUDE.md — Agent Guide for My Pokemon

## Vision

This is a faithful recreation of Pokémon Red / Fire Red (Gen I) built with modern web tech (React 19, TypeScript, Vite, Zustand). The goal is to reproduce the original gameplay feel — turn-based battles, tile movement, Kanto story — not to clone the visuals pixel-for-pixel. Mechanics (damage formula, type chart, stat calc, status effects) follow Gen I rules. All in-game text is in Spanish. Scope is limited to Gen I: 151 Pokémon, Kanto region, condensed storyline from Pallet Town through Pewter City.

## Architecture

All game state lives in a Zustand store (`src/store/gameStore.ts`) with `zustand/persist` for localStorage save/load. `App.tsx` is a thin shell that wires hooks and renders components. Logic lives in hooks: `useBattleEngine` drives `battleEngine.ts` (pure state machine), `useMovementEngine` handles movement/collision/encounters, `useInteractionEngine` handles NPC/item/tile interactions, `useInputHandler` manages keyboard + movement loop. Hooks read state via `useGameStore.getState()` inside `setTimeout` to avoid stale closures.

`battleStateRef` holds mutable `BattleState` during fights (initialized by `initBattle`, driven by `useBattleEngine`).

## Tileset Rendering

Maps are rendered via a canvas-generated pixel art tileset (`src/data/tileset/tilesetGenerator.ts`). The autotiler (`src/data/tileset/autotiler.ts`) converts the semantic `Tile[][]` grid into three rendering layers:
- **ground** — base terrain (grass, path, floor, roof, walls)
- **objects** — tree trunks, furniture, signs (z-indexed by row, below player/NPCs)
- **overhead** — tree canopies (z-indexed above player for walk-behind depth)

`GameTile` is a `React.memo` component that renders a single `<div>` with `background-position` on the tileset spritesheet. Tile IDs are defined in `tilesetGenerator.ts` as `T.GRASS`, `T.ROOF_M`, etc.

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
- The game uses `@testing-library/react` to render hooks and test state machines efficiently without the overhead of a headless browser.

### Game Simulator (integration tests)

`src/test/simulator/` contains a headless `GameSimulator` that composes all three game hooks (`useMovementEngine`, `useBattleEngine`, `useInteractionEngine`) via a single `useGameLoop` hook rendered with `renderHook`. It drives the real game logic without UI, using fake timers and seeded `Math.random` for deterministic, instant execution.

**Key files:**
- `src/test/simulator/GameSimulator.ts` — Simulator class: commands (`move`, `interact`, `battleAction`, `tick`, `skipBattleTransition`), state queries (`phase`, `map`, `team`, `dialogue`), event log, random seeding
- `src/test/simulator/useGameLoop.ts` — Composite hook wiring all three engines with stubbed visual callbacks
- `src/test/simulator/scenarios.test.ts` — 10 predefined scenarios from game start through mid-game

**Writing a new scenario:**
```typescript
it('my scenario', () => {
  const sim = new GameSimulator().init({
    currentMap: 'OAKS_LAB',
    playerPos: { x: 9, y: 9 },
    direction: 'up',
    playerTeam: [],
  });
  sim.interact();                    // press action button
  sim.dismissDialogue();             // clear dialogue
  sim.tick(2000);                    // advance fake timers
  sim.skipBattleTransition();        // skip animation-based transition
  expect(sim.phase.type).toBe('BATTLE');
  expect(sim.dialogueContains('AZUL')).toBe(true);
  sim.destroy();
});
```

**Simulator gotchas:**
- `BATTLE_TRANSITION → BATTLE(CHOOSING)` requires a DOM animation callback. Call `sim.skipBattleTransition()` to advance past it in headless mode.
- `sim.setRandomSequence([0.05, ...])` to control encounter/crit/status RNG.
- `sim.phaseHistory()` returns all phase transitions as strings for easy assertion.

### Unit tests

- `src/hooks/__tests__/useInteractionEngine.test.ts` — Tests NPC/item/tile interactions via Zustand store overrides. Uses `setup()` helper that configures the store and renders the hook.
- `src/lib/__tests__/battleEngine.test.ts` — Pure state-machine tests for the battle engine.
- `src/lib/__tests__/damage.test.ts` — Damage formula, type effectiveness, stat calculations.
- `src/lib/__tests__/statusRules.test.ts` — Gen I status effect rules.
