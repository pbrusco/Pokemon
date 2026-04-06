# CLAUDE.md — Agent Guide for My Pokemon

## Project Snapshot

This project is currently a hybrid architecture:

- **Primary runtime owner:** `src/App.tsx`
- **Extracted responsibilities in progress:** `src/hooks/useInteractionEngine.ts` and other hooks
- **Global store exists:** `src/store/gameStore.ts`, but full migration is not complete

The remaining major technical task is final state consolidation.

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

- `src/App.tsx` — main loop: movement, encounters, trainer triggers, battle orchestration, menus
- `src/types/gamePhase.ts` — `GamePhase` + `BattlePhase` FSM
- `src/hooks/useInteractionEngine.ts` — overworld interaction behavior (NPC/item/tile)
- `src/constants.ts` — static game data (Pokemon, moves, items, evolutions, HM requirements)
- `src/lib/damage.ts` — Gen I-style damage and stat calculations
- `src/lib/sounds.ts` — synthesized SFX/music controls
- `src/components/BattleScreen.tsx` — battle presentation/UI
- `src/components/InventoryUI.tsx` — quantity-based inventory presentation
- `src/data/maps/tileParser.ts` — compact map parser (`rows: string[]`)

## State Notes

- `phase` FSM is the canonical mode switch.
- Inventory uses quantity counts (`Record<string, number>`).
- Saves are slot-based in localStorage:
  - `pokemon_save_slots`
  - `pokemon_active_slot`
- Legacy single save payload (`pokemon_save`) is migrated on load.

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
4. Prefer incremental refactors over big-bang rewrites, especially around battle flow.
5. When touching saves/inventory, include migration compatibility.
