# CLAUDE.md — Agent Guide for My Pokemon

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
| `src/App.tsx` | **Main game loop** — movement, collisions, battle orchestration, map transitions. Contains all game logic in a single component. | Large |
| `src/types/gamePhase.ts` | **Game Phase FSM** — `GamePhase` and `BattlePhase` discriminated union types. Replaces ~17 boolean useState hooks. | Small |
| `src/constants.ts` | All static game data: 151 Pokemon base stats, moves, starters, wild encounters, evolutions, items, Pokedex list. | Large |
| `src/lib/damage.ts` | Gen I damage formula, type effectiveness chart, STAB, critical hits, stat calculations. | Medium |
| `src/lib/sounds.ts` | Sound effects (Web Audio API synthesized) and background music (Howler.js streaming). | Small |
| `src/types.ts` | Core TypeScript interfaces: `Pokemon`, `Move`, `BaseStats`, `Tile`, `NPC`, `Entity`. | Small |
| `src/store/gameStore.ts` | Zustand store — all game state (position, team, inventory, progression flags). Auto-saves to localStorage. | Small |
| `src/data/maps/*.json` | 20x20 tile grid definitions for each map area. | Data |

### Game Phase FSM (`src/types/gamePhase.ts`)

The game uses a **finite state machine** with two levels to manage what mode the game is in. This replaces the old pattern of ~17 independent boolean useState hooks.

**Top-level `GamePhase`:**
```
EXPLORING → MENU | INVENTORY | TEAM | SHOP | POKEDEX | PC | EDITOR
EXPLORING → BATTLE_TRANSITION → BATTLE (with sub-phase)
EXPLORING → HEALING | BLACKOUT
```

**Nested `BattlePhase`** (only when `GamePhase.type === 'BATTLE'`):
```
CHOOSING → PLAYER_ATTACK → ENEMY_ATTACK → CHOOSING  (normal turn loop)
CHOOSING → BATTLE_INVENTORY | BATTLE_TEAM             (open bag/team mid-battle)
ENEMY_ATTACK → PLAYER_FAINTED → FORCED_SWITCH         (active pkm fainted, others alive)
PLAYER_ATTACK → ENEMY_FAINTED → LEVEL_UP → EVOLVING   (post-victory sequence)
CHOOSING → CATCHING                                    (throw pokeball)
```

**Key pattern:**
```typescript
const [phase, setPhase] = useState<GamePhase>(EXPLORING);
const inBattle = phase.type === 'BATTLE';
const battlePhase = phase.type === 'BATTLE' ? phase.sub : null;

// Transitions:
setPhase(BATTLE_TRANSITION);                    // start battle
setPhase(battle(B_CHOOSING));                   // enter battle choosing
setPhase(battle(B_FORCED_SWITCH));              // force team swap
setPhase(EXPLORING);                            // return to overworld
```

**What stays as separate state** (not in the FSM): `playerTeam`, `enemyPokemon`, `inventory`, `playerPos`, `dialogue`, `battleLog`, animation states, VFX states, progression flags.

### Battle System

Battle logic lives in **`src/App.tsx`** only — `handleAttack()` and `handleEnemyTurn()` as inline functions. The old `useBattleEngine.ts` hook was deleted (it was a stale duplicate).

### Component Structure

```
src/components/
  BattleScreen.tsx    — Battle UI rendering (HP bars, move buttons, animations)
  DialogueBox.tsx     — NPC dialogue display
  InventoryUI.tsx     — Bag/inventory screen
  TeamMenuUI.tsx      — Pokemon team management (supports forcedSwitch prop)
  PCStorageUI.tsx     — PC box storage
  PokedexUI.tsx       — Pokedex encyclopedia
  ShopUI.tsx          — Merchant interface
  MapEditor.tsx       — Dev tool for editing tile maps
  Joystick.tsx        — Mobile touch controls
```

### Maps

```
src/data/maps/
  pallet_town.json, oaks_lab.json, route_1.json, viridian_city.json,
  pokecenter.json, pokemart.json, viridian_forest.json, pewter_city.json,
  pewter_gym.json, route_3.json
  index.ts           — Exports all maps as Tile[][] arrays
```

### Movement System

- Player movement uses a **self-triggering pattern**: when `isMoving` becomes false and a key is still held, the next move fires immediately via `useEffect` (no setInterval polling).
- No "direction-first" delay — pressing a direction both faces and moves in one step.
- Move timeout (110ms) matches the animation tween duration (100ms, linear) for gap-free movement.

### Sound System (`src/lib/sounds.ts`)

- **SFX:** Synthesized via Web Audio API (square/sawtooth waves). No external audio files needed.
- **Music:** Streamed via Howler.js from Pokémon Showdown's public CDN. Three tracks: OVERWORLD, BATTLE, POKECENTER. Auto-switches based on `phase.type` and `currentMap`.

## Game Data Patterns

### Creating Pokemon

Always use `makePokemon()` from `constants.ts`. It auto-computes HP from base stats + level:

```typescript
makePokemon('geodude', 'GEODUDE', 12, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 74, {
  types: ['rock', 'ground']  // Optional dual typing
})
```

**Never create Pokemon objects with hardcoded HP values.** The `makePokemon` helper ensures HP is correctly derived from base stats via `calcHp()`.

**Important:** The `id` parameter must match a key in `BASE_STATS`. Use hyphens where needed (e.g., `'nidoran-m'`, `'nidoran-f'`).

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

Game state in App.tsx uses React `useState` + a `useRef` mirror for stale-closure safety.

- **Phase:** Single `useState<GamePhase>` controls the current mode (see FSM section above)
- **Player:** `playerPos`, `direction`, `currentMap`, `playerTeam`, `inventory`
- **Battle:** `enemyPokemon`, `battleLog`, `playerAnim`, `enemyAnim`, VFX states
- **Progression:** `storyStep`, `badges`, `defeatedTrainers`, `hasPokedex`, `hasParcel`
- **Persistence:** Auto-saves to localStorage. The `lastHealLocation` tracks respawn point.

## Common Pitfalls

1. **Phase transitions in setTimeout chains** — Battle sequences use nested `setTimeout` callbacks. Each callback should `setPhase(...)` to the correct phase. Never set multiple conflicting phases in the same chain.

2. **Side effects outside state updaters** — Never call `setPhase`, `setBattleLog`, or `setTimeout` inside a `setPlayerTeam(prev => ...)` updater. React can call updaters multiple times. Compute all data synchronously, then call state setters sequentially.

3. **Pokemon without baseStats** — The `baseStats` field is required on `Pokemon`. Any manually constructed Pokemon object must include it. Use `makePokemon()` to avoid this.

4. **Sprite IDs** — Sprites are fetched from PokeAPI via Pokedex number: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`. The `makePokemon()` helper takes a `spriteId` parameter for this.

5. **Evolution HP recalculation** — When a Pokemon evolves, its `baseStats`, `maxHp`, and `hp` must all be updated. See the evolution logic in `App.tsx` for the pattern.

6. **Game language** — All in-game text (battle logs, dialogue, UI labels) is in **Spanish**. Keep this consistent.

7. **`inBattle` vs `phase`** — Use the derived `inBattle` boolean for simple battle/not-battle checks. Use `phase.type` for specific phase comparisons. Use `battlePhase?.type` for battle sub-phase checks.
