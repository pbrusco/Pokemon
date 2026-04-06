# CLAUDE.md — Agent Guide for Pokemon Fire Red RPG

## Project Overview

A Pokemon Fire Red-style RPG built with React 19, TypeScript, Vite, Tailwind CSS, and Zustand. The game features tile-based movement, turn-based battles using the Generation I damage formula, NPC interactions, and persistent state via localStorage.

## Quick Commands

```bash
npm run dev       # Dev server on http://localhost:3000
npm run build     # Production build to dist/
npm run lint      # TypeScript type-check (tsc --noEmit)
npm run preview   # Preview production build
```

**Note on PATH:** The Node.js binary lives at `/opt/homebrew/bin/node`. You may need `export PATH="/opt/homebrew/bin:$PATH"` before running npm/npx commands.

## Architecture

### Key Files

| File | Role | Size |
|------|------|------|
| `src/App.tsx` | **Main game loop** — movement, collisions, battle orchestration, map transitions. This is a monolith (~72KB) and the primary source of complexity. | Large |
| `src/constants.ts` | All static game data: 151 Pokemon base stats, moves, starters, wild encounters, evolutions, items, Pokedex list. | Large |
| `src/lib/damage.ts` | Gen I damage formula, type effectiveness chart, STAB, critical hits, stat calculations. | Medium |
| `src/types.ts` | Core TypeScript interfaces: `Pokemon`, `Move`, `BaseStats`, `Tile`, `NPC`, `Entity`. | Small |
| `src/store/gameStore.ts` | Zustand store — all game state (position, team, inventory, progression flags). Auto-saves to localStorage. | Small |
| `src/data/worldConfig.ts` | NPC definitions, teleport connections, item pickups per map. Uses `makePokemon()` for trainer teams. | Medium |
| `src/data/maps/*.json` | 20x20 tile grid definitions for each map area. | Data |

### Battle System — Two Code Paths (Important!)

The battle logic exists in **two places** due to incremental refactoring:

1. **`src/App.tsx`** — The active battle logic used by the game. Contains `handleAttack()` and `handleEnemyTurn()` as inline functions within the main component.
2. **`src/hooks/useBattleEngine.ts`** — A refactored hook version of the same logic. Currently **not wired up** to the main app (only imported in `App.tsx.backup`).

**When modifying battle behavior, update BOTH files** to keep them in sync, or complete the migration to the hook.

### Component Structure

```
src/components/
  BattleScreen.tsx    — Battle UI rendering (HP bars, move buttons, animations)
  DialogueBox.tsx     — NPC dialogue display
  InventoryUI.tsx     — Bag/inventory screen
  TeamMenuUI.tsx      — Pokemon team management
  PCStorageUI.tsx     — PC box storage
  PokedexUI.tsx       — Pokedex encyclopedia
  ShopUI.tsx          — Merchant interface
  MapEditor.tsx       — Dev tool for editing tile maps
  Joystick.tsx        — Mobile touch controls
```

### Custom Hooks

```
src/hooks/
  usePlayerMovement.ts     — Keyboard/touch input, collision detection
  useInteractionEngine.ts  — NPC dialogue, item pickup, teleportation
  useBattleEngine.ts       — Battle logic (not yet wired to App.tsx)
```

## Game Data Patterns

### Creating Pokemon

Always use `makePokemon()` from `constants.ts`. It auto-computes HP from base stats + level:

```typescript
makePokemon('geodude', 'GEODUDE', 12, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 74, {
  types: ['rock', 'ground']  // Optional dual typing
})
```

**Never create Pokemon objects with hardcoded HP values.** The `makePokemon` helper ensures HP is correctly derived from base stats via `calcHp()`.

### Base Stats

All 151 Gen I Pokemon have entries in `BASE_STATS` (in `constants.ts`). The stats use the original Gen I values with a single `special` stat (not the Gen II+ Sp.Atk/Sp.Def split).

### Adding New Moves

Add to the `MOVES` record in `constants.ts`:
```typescript
MOVE_NAME: { name: 'DISPLAY NAME', type: 'fire', power: 60, accuracy: 100 }
```

Move names displayed in-game are in Spanish (the game's UI language).

### Type System

- Pokemon can have single type (`type: 'fire'`) or dual types (`types: ['rock', 'ground']`).
- The `type` field is always present (primary type); `types` is optional and overrides for damage calc.
- Gen I physical types: normal, fighting, flying, poison, ground, rock, bug, ghost.
- Gen I special types: water, grass, fire, ice, electric, psychic, dragon.

## Gen I Damage Formula

```
Damage = ((2 * Level * Critical / 5 + 2) * Power * A / D / 50 + 2) * STAB * Type * random
```

Implemented in `src/lib/damage.ts`. Key functions:
- `calculateDamage(attacker, defender, move)` — Returns `{ damage, isCritical, effectiveness, effectivenessLabel }`
- `calcHp(baseHp, level)` — Compute max HP from base stat
- `calcStat(base, level)` — Compute effective stat from base stat
- `getTypeEffectiveness(moveType, defenderTypes)` — Type multiplier lookup

## State Management

Zustand store in `src/store/gameStore.ts`. Key state slices:

- **Player:** `playerPos`, `direction`, `currentMap`, `playerTeam`, `inventory`
- **Battle:** `isBattle`, `enemyPokemon`, `showBattleTransition`, `isCatching`
- **Progression:** `storyStep`, `badges`, `defeatedTrainers`, `hasPokedex`, `hasParcel`
- **Persistence:** Auto-saves to localStorage. The `lastHealLocation` tracks respawn point.

## Common Pitfalls

1. **Dual battle code paths** — Changes to battle logic in `App.tsx` must also be reflected in `useBattleEngine.ts` (and vice versa). This is the #1 source of inconsistency.

2. **Variable declaration order in callbacks** — In `useBattleEngine.ts`, state is fetched inside nested `setTimeout` callbacks. Be careful about variable declaration order — variables from `useGameStore.getState()` must be declared before use (no hoisting with `const`).

3. **Pokemon without baseStats** — The `baseStats` field is required on `Pokemon`. Any manually constructed Pokemon object (e.g., in trainer teams or test data) must include it. Use `makePokemon()` to avoid this.

4. **Sprite IDs** — Sprites are fetched from PokeAPI via Pokedex number: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`. The `makePokemon()` helper takes a `spriteId` parameter for this.

5. **Evolution HP recalculation** — When a Pokemon evolves, its `baseStats`, `maxHp`, and `hp` must all be updated. See the evolution logic in `App.tsx` for the pattern.

6. **Game language** — All in-game text (battle logs, dialogue, UI labels) is in **Spanish**. Keep this consistent.
