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

- `src/App.tsx` — main runtime orchestrator (movement, phase transitions, menus); drives battle via `dispatchBattle()` → `battleEngine.ts`
- `src/hooks/` — extracted state slices:
  - `useInteractionEngine.ts` — overworld NPC/item/tile interaction flow
  - `useBattleVFX.ts` — battle animation state (anims, flash, projectile, damage numbers)
  - `useOverworldVFX.ts` — overworld VFX state (grass, trainer spotted, shake)
  - `usePokedex.ts` — Pokédex state and `updatePokedex()`
  - `useSaveSystem.ts` — slot-based save/load effects and play-time tracking
  - `useWindowSize.ts` — responsive window dimensions
- `src/store/gameStore.ts` — Zustand store (player, team, inventory, money, badges, flags)
- `src/lib/battleEngine.ts` — pure battle state machine (no React, no side effects)
- `src/lib/damage.ts` — damage/stat/type calculations
- `src/lib/sounds.ts` — synthesized SFX + music manager
- `src/types/gamePhase.ts` — top-level and battle sub-phase FSM types
- `src/constants.ts` — Pokemon/moves/items/evolution/static game data
- `src/components/` — UI surfaces (battle, inventory, team, pokedex, PC, map editor, dialogue)
- `src/data/maps/` — compact map sources + parser/export

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

118 unit and scenario tests covering damage math, battle engine flows, interaction engine, and Gen I status rules:

```bash
npm run test:run   # single run (CI)
npm test           # watch mode
```

See `CLAUDE.md` for implementation details and `TODO.md` for task tracking.
