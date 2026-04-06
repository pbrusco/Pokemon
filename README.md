# My Pokemon

A Pokemon Fire Red-style RPG built with React 19, TypeScript, Vite, and Tailwind CSS.

## Features

- Tile-based overworld with smooth movement and NPC interactions
- Turn-based battles using the Generation I damage formula (STAB, type effectiveness, critical hits)
- Multi-Pokemon teams with forced switch on faint, PP tracking per move
- XP/leveling system with evolution support
- Wild encounters (Gen I flee formula), trainer battles, and gym leader (Brock)
- Trainer vision cones with red shadow overlay; `!` exclamation on detection
- Inventory system (potions, pokeballs), Pokedex, PC storage
- Money system with shop purchases
- Blackout/heal mechanics with auto-transport to last heal location
- Background music (Howler.js) and synthesized retro SFX (Web Audio API)
- Auto-save to localStorage (position, team, inventory, Pokedex, money)
- Mobile touch controls (on-screen joystick)

## Setup

```bash
npm install
npm run dev       # Dev server on http://localhost:3000
npm run build     # Production build
npm run lint      # TypeScript type-check
```

> **Note:** Node.js lives at `/opt/homebrew/bin/node`. Prepend `export PATH="/opt/homebrew/bin:$PATH"` if npm isn't found.

---

## Architecture

### Game Phase FSM

The game uses a **finite state machine** (`src/types/gamePhase.ts`) to control which mode is active. This replaces the old pattern of ~17 independent boolean flags, making impossible states unrepresentable at the type level.

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
| `src/data/maps/tileParser.ts` | Compact map format parser |
| `src/data/maps/*.json` | 20×20 tile maps in compact string format (see below) |

### Map Format

Maps are stored as compact string grids — about **40× smaller** than the previous per-tile JSON format and easy to edit by hand.

```json
{
  "rows": [
    "TTTTTTTTTTTTTTTTTTTT",
    "TTTPPPPPPPPPPPPPPPTT",
    "TTTPPPWWWPPWWWPPPPTT",
    "TTTPPPWDWPPWDWPPPPTT"
  ]
}
```

**Legend** (defined in `src/data/maps/tileParser.ts`):

| Char | Tile | Walkable |
|------|------|---------|
| `T` | tree | no |
| `G` | grass (flat, no encounters) | yes |
| `P` | path | yes |
| `W` | wall | no |
| `D` | door | yes |
| `F` | floor (indoors) | yes |
| `C` | carpet (indoors) | yes |
| `X` | table | no |
| `S` | sign | yes |
| `~` | water | no |

To add a new map: create a `name.json` with a `rows` array (20 strings of exactly 20 chars), then import and export it via `src/data/maps/index.ts`.

### Maps

| ID | File | Description |
|----|------|-------------|
| `PALLET_TOWN` | `pallet_town.json` | Starting town |
| `OAKS_LAB` | `oaks_lab.json` | Starter selection & rival battle |
| `ROUTE_1` | `route_1.json` | First route with wild encounters |
| `VIRIDIAN_CITY` | `viridian_city.json` | Hub town with Pokecenter & Pokemart |
| `POKECENTER` | `pokecenter.json` | Healing location |
| `POKEMART` | `pokemart.json` | Item shop & Oak's Parcel quest |
| `VIRIDIAN_FOREST` | `viridian_forest.json` | Forest with bug-type encounters |
| `PEWTER_CITY` | `pewter_city.json` | First city with gym |
| `PEWTER_GYM` | `pewter_gym.json` | Brock's gym |
| `ROUTE_3` | `route_3.json` | Route east toward Mt. Moon |

### Components

```
src/components/
  BattleScreen.tsx    — Battle UI (HP bars, moves, PP, animations, debug stats)
  DialogueBox.tsx     — NPC dialogue
  InventoryUI.tsx     — Bag/inventory screen
  TeamMenuUI.tsx      — Pokemon team management (supports forced switch)
  PCStorageUI.tsx     — PC box storage
  PokedexUI.tsx       — Pokedex encyclopedia (seen / caught)
  ShopUI.tsx          — Merchant interface with money display
  MapEditor.tsx       — Dev tool for editing tile maps (Shift+E)
  Joystick.tsx        — Mobile touch controls
```

---

## Player Sprite

The player character uses `/public/player.png` — a 256×192 RGBA spritesheet (4 columns × 3 rows, 64×64px per cell):

| Row | Direction |
|-----|-----------|
| 0 | Down |
| 1 | Up |
| 2 | Left |

Right-facing is the Left row mirrored via `scaleX(-1)`. Background must be fully transparent (RGBA PNG).

---

## Controls

| Input | Action |
|-------|--------|
| Arrow keys | Move |
| Enter / Z / Space | Interact / confirm |
| X / Shift / Escape | Menu toggle |
| Shift+E | Map editor (dev tool) |

---

## Tech Stack

| | |
|-|-|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Music | Howler.js (streamed from Pokémon Showdown CDN) |
| SFX | Web Audio API (synthesized, no files) |
| State | Zustand |

See [CLAUDE.md](./CLAUDE.md) for the full architecture and agent development guide.
See [docs/](./docs/) for user-facing and technical documentation.
