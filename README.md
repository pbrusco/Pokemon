# My Pokemon

A Pokemon Fire Red-style RPG built with React 19, TypeScript, Vite, and Tailwind CSS.

## Features

- Tile-based overworld with smooth movement and NPC interactions
- Turn-based battles using the Generation I damage formula
- Multi-Pokemon battles with forced switch on faint
- XP/leveling system with evolution support
- Wild encounters, trainer battles, and gym leader (Brock)
- Inventory system (potions, pokeballs), Pokedex, PC storage
- Blackout/heal mechanics with auto-transport to last heal location
- Background music and synthesized retro sound effects
- Auto-save to localStorage

## Setup

```bash
npm install
npm run dev       # Dev server on http://localhost:3000
npm run build     # Production build
npm run lint      # TypeScript type-check
```

## Architecture

### Game Phase FSM

The game uses a **finite state machine** (defined in `src/types/gamePhase.ts`) to control which mode is active. This replaces the old pattern of ~17 independent boolean flags, making impossible states unrepresentable.

```
GamePhase: EXPLORING | MENU | INVENTORY | TEAM | SHOP | POKEDEX | PC | EDITOR
           | BATTLE_TRANSITION | BATTLE (with BattlePhase sub-FSM)
           | BLACKOUT | HEALING

BattlePhase: CHOOSING | PLAYER_ATTACK | ENEMY_ATTACK | PLAYER_FAINTED
             | FORCED_SWITCH | ENEMY_FAINTED | CATCHING | LEVEL_UP | EVOLVING
             | BATTLE_INVENTORY | BATTLE_TEAM
```

### Key Files

| File | Role |
|------|------|
| `src/App.tsx` | Main game loop — movement, collisions, battle orchestration, all game logic |
| `src/types/gamePhase.ts` | GamePhase + BattlePhase discriminated union types and helpers |
| `src/constants.ts` | Static data: 151 Pokemon base stats, moves, wild encounters, evolutions |
| `src/lib/damage.ts` | Gen I damage formula, type effectiveness, stat calculations |
| `src/lib/sounds.ts` | Web Audio API SFX + Howler.js background music |
| `src/types.ts` | Core interfaces: Pokemon, Move, BaseStats, Tile, NPC, Entity |
| `src/data/maps/*.json` | 20x20 tile grid definitions for each map area |

### Maps

Pallet Town, Oak's Lab, Route 1, Viridian City, Pokecenter, Pokemart, Viridian Forest, Pewter City, Pewter Gym, Route 3.

### Components

```
src/components/
  BattleScreen.tsx    — Battle UI (HP bars, moves, animations)
  DialogueBox.tsx     — NPC dialogue
  InventoryUI.tsx     — Bag/inventory screen
  TeamMenuUI.tsx      — Pokemon team management
  PCStorageUI.tsx     — PC box storage
  PokedexUI.tsx       — Pokedex encyclopedia
  ShopUI.tsx          — Merchant interface
  MapEditor.tsx       — Dev tool for editing tile maps
  Joystick.tsx        — Mobile touch controls
```

## Controls

- **Arrow keys** — Move
- **Enter / Z / Space** — Interact / confirm
- **X / Shift / Escape** — Menu toggle
- **Shift+E** — Map editor (dev tool)

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion (animations)
- Howler.js (music streaming)
- Web Audio API (synthesized SFX)
- Zustand (shared game state)

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guide.
