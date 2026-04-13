# My Pokemon

Pokemon Fire Red style RPG built with React, TypeScript, Vite, and Tailwind.

## Current Status

- Overworld exploration with trainers, encounters, teleports, and map transitions
- Battle FSM with turn flow, catches, forced switch, status effects, XP, level-up, evolution
- Gen I-inspired battle math and quirks (1/256 miss, badge boost glitch)
- Difficulty balance: wild Pokémon hit softer (85% atk/special), trainer AI picks moves intelligently, trainer kills give 1.5× exp
- Data-driven map format (`rows: string[]`) with tile parser and in-game map editor
- Inventory quantities (`Record<itemId, qty>`), money rewards, shop, PC storage, Pokedex
- Multiple local save profiles (`slot1`/`slot2`/`slot3`) with metadata
- Synthesized move SFX categories (`pulse`, `noise`, `glissando`) and battle background themes

## Run

```bash
npm install
npm run dev
npm run test:run
npm run lint
```

If `npm` is not found on macOS, use:

```bash
export PATH="/opt/homebrew/bin:$PATH"
```

## Project Structure

- `src/App.tsx` — thin orchestrator (~400 lines): wires hooks together, composes top-level JSX
- `src/hooks/` — all game logic:
  - `useMovementEngine.ts` — movement, collision, teleports, trainer vision, wild encounters
  - `useBattleEngine.ts` — battle turn dispatch, VFX sequencing, win/loss/catch outcomes
  - `useInteractionEngine.ts` — overworld NPC/item/tile interaction flow
  - `useInputHandler.ts` — keyboard events + movement self-trigger loop
  - `useDebugAPI.ts` — dev-only `window.__game` console API
  - `useBattleVFX.ts` — battle animation state (anims, flash, projectile, damage numbers)
  - `useOverworldVFX.ts` — overworld VFX state (grass, trainer spotted, shake)
  - `usePokedex.ts` — Pokédex state and `updatePokedex()`
  - `useSaveSystem.ts` — slot-based save/load and play-time tracking
  - `useWindowSize.ts` — responsive window dimensions
- `src/store/gameStore.ts` — Zustand store (player, team, inventory, money, badges, flags)
- `src/lib/battleEngine.ts` — pure battle state machine (no React, no side effects)
- `src/lib/damage.ts` — damage/stat/type calculations
- `src/lib/sounds.ts` — synthesized SFX + music manager
- `src/types/gamePhase.ts` — top-level and battle sub-phase FSM types
- `src/constants.ts` — Pokemon/moves/items/evolution/static game data
- `src/components/` — UI surfaces:
  - `WorldView.tsx` — overworld viewport (tiles, player, NPCs, HUD)
  - `GameModals.tsx` — all overlay screens (battle, menus, dialogue, shop, etc.)
  - `SideMenu.tsx` — main menu panel
  - `ScreenEffects.tsx` — full-screen flash/fade effects
  - `overworld/` — `GameTile`, `PlayerSprite`, `NPCComponent`
  - `BattleScreen.tsx`, `DialogueBox.tsx`, `InventoryUI.tsx`, `TeamMenuUI.tsx`, etc.
- `src/data/npcDatabase.ts` — `buildNPCDatabase()` + `buildItemDatabase()`
- `src/data/maps/` — compact map sources + parser/export
- `src/test/simulator/` — headless game simulator for integration testing

## Map Format

Maps use compact rows:

```json
{ "rows": ["TTTT...", "TPPP..."] }
```

Legend is defined in `src/data/maps/tileParser.ts`.

Notable tiles:
- `T` tree
- `H` cut tree obstacle
- `B` boulder obstacle
- `X` table
- `S` sign

## Controls

- `Arrow Keys` move
- `Enter` / `Z` / `Space` interact
- `X` / `Shift` / `Esc` open menu
- `Shift + E` open map editor

## Testing

131 tests covering damage math, battle engine flows, interaction engine, Gen I status rules, and integration scenarios:

```bash
npm run test:run   # single run (CI)
npm test           # watch mode
```

### Game Simulator

A headless `GameSimulator` class (`src/test/simulator/`) drives the real game hooks without UI for deterministic integration testing. It uses fake timers and seeded `Math.random` so scenarios run instantly and reproducibly.

```typescript
const sim = new GameSimulator().init({ currentMap: 'OAKS_LAB', playerPos: { x: 9, y: 9 } });
sim.interact();           // pick starter
sim.tick(2000);           // advance timers
sim.skipBattleTransition();
expect(sim.team).toHaveLength(1);
sim.destroy();
```

10 predefined scenarios cover: Oak's intro, starter selection, rival battle, healing (Mom + Pokécenter), wild encounters, parcel delivery, Pokédex unlock.

See `CLAUDE.md` for implementation details and `TODO.md` for task tracking.
