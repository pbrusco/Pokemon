# CLAUDE.md — Agent Guide for My Pokemon

## Project Snapshot

- **Orchestrator:** `src/App.tsx` (~400 lines) — wires hooks together, owns `gameState` ref and `battleStateRef`, composes top-level JSX
- **Battle logic:** `src/lib/battleEngine.ts` — pure state machine; `useBattleEngine` drives it via `dispatchBattle(action)`
- **Global store:** `src/store/gameStore.ts` for overworld state; battle state lives in `battleStateRef` during fights

## Commands

```bash
npm run dev
npm run build
npm run test:run
npm run lint
```

If needed on macOS:

```bash
export PATH="/opt/homebrew/bin:$PATH"
```

## Core Files

- `src/App.tsx` — thin orchestrator; wires hooks, passes `gameState` ref, composes JSX
- `src/lib/battleEngine.ts` — pure battle state machine (damage, AI, exp, status, catch, flee)
- `src/types/gamePhase.ts` — `GamePhase` + `BattlePhase` FSM
- `src/hooks/useMovementEngine.ts` — movement, collision, teleports, encounters → `handleMove`, `initBattle`
- `src/hooks/useBattleEngine.ts` — battle orchestration, VFX sequencing, outcomes → `dispatchBattle`
- `src/hooks/useInteractionEngine.ts` — overworld interaction behavior (NPC/item/tile)
- `src/hooks/useInputHandler.ts` — keyboard events + self-trigger movement loop
- `src/hooks/useDebugAPI.ts` — dev console API (`window.__game`)
- `src/data/npcDatabase.ts` — `buildNPCDatabase()` + `buildItemDatabase()`
- `src/constants.ts` — static game data (Pokemon, moves, items, evolutions, HM requirements)
- `src/lib/damage.ts` — Gen I-style damage and stat calculations
- `src/lib/sounds.ts` — synthesized SFX/music controls
- `src/components/WorldView.tsx` — overworld viewport (tiles, player, NPCs, items, HUD)
- `src/components/GameModals.tsx` — all overlay screens (battle, menus, dialogue, shop, etc.)
- `src/components/BattleScreen.tsx` — battle presentation/UI
- `src/components/InventoryUI.tsx` — quantity-based inventory presentation
- `src/data/maps/tileParser.ts` — compact map parser (`rows: string[]`)

## State Notes

- `phase` FSM is the canonical mode switch.
- Inventory uses quantity counts (`Record<string, number>`).
- Saves are slot-based in localStorage: `pokemon_save_slots` / `pokemon_active_slot`.
- `gameState` ref in App.tsx is a snapshot of all reactive state, updated every render. Pass it into hooks that run code inside `setTimeout` — read from `gameState.current`, not from hook params, to avoid stale closures.

## Battle Notes

- Includes 1/256 miss behavior.
- Includes prize money, leveling/evolution flow, and forced switches.
- Includes synthesized move SFX categories (`pulse`, `noise`, `glissando`).

## Map/Tiles Notes

Tile parser includes HM obstacle tiles:

- `H` -> `cut_tree`
- `B` -> `boulder`

Interactive obstacle checks are handled via overworld interaction logic with badge/move gates.

## Rules of Thumb

1. Keep in-game text in Spanish.
2. Avoid side effects inside state updater callbacks.
3. When evolving Pokemon, recompute `baseStats`, `maxHp`, and `hp`.
4. No backward compatibility. Delete old code, don't keep shims or migration paths.
5. Add NPCs to `buildNPCDatabase()` in `src/data/npcDatabase.ts`, not `worldConfig.ts`.
