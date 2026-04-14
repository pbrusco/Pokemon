# State Management & FSM

## Overview

All game state lives in a single Zustand store (`src/store/gameStore.ts`) with `zustand/persist` for localStorage save/load. `App.tsx` is a thin shell that wires hooks and renders components.

---

## Zustand Store (`src/store/gameStore.ts`)

### State Shape (key fields)

```typescript
interface GameState {
  // Location & Movement
  playerPos: Position           // { x, y } in tile coordinates
  direction: Direction          // 'up' | 'down' | 'left' | 'right'
  currentMap: MapID
  isMoving: boolean

  // Story Progression
  storyStep: StoryStep
  badges: string[]
  defeatedTrainers: string[]    // NPC IDs of beaten trainers
  hasPokedex: boolean
  hasParcel: boolean
  lastHealLocation: { map: MapID; pos: Position }
  money: number

  // Inventories & Teams
  inventory: InventoryCounts    // Record<itemId, number>, e.g. { POTION: 5, POKEBALL: 2 }
  playerTeam: Pokemon[]         // Active party (max 6)
  pcStorage: Pokemon[]

  // Battle
  activeBattle: BattleState | null
  enemyPokemon: Pokemon | null
  isTrainerBattle: boolean
  battleLog: string
  battleLogs: BattleMessage[]
  catchResult: boolean | null

  // World
  worldMaps: Record<MapID, { tiles: Tile[][]; warps: Warp[] }>

  // Derived
  getNPCs: () => Record<MapID, NPC[]>
  getItems: () => Record<MapID, Item[]>
}
```

### Key Mutations

```typescript
// Movement
store.setPlayerPos(pos)
store.setDirection(dir)
store.setCurrentMap(mapId)
store.setIsMoving(bool)

// Progression
store.setStoryStep(step)
store.setBadges(prev => [...prev, 'BOULDER'])
store.setDefeatedTrainers(prev => [...prev, trainerId])
store.setMoney(prev => prev + reward)

// Team & Inventory
store.setPlayerTeam(newTeam)          // accepts value or updater function
store.setInventory(newInventory)
store.addInventoryItem('POTION')
store.removeInventoryItem('POTION')
store.setPcStorage(newPc)

// Battle
store.setActiveBattle(battleState)
store.setEnemyPokemon(pokemon)
store.setPhase(phase)
```

### Reading State Inside Timers

Inside `setTimeout` callbacks, always read fresh state from `useGameStore.getState()` — never capture hook parameters in closures:

```typescript
// CORRECT
setTimeout(() => {
  const fs = useGameStore.getState();
  fs.setPhase(EXPLORING);
}, 1000);

// WRONG — stale closure
setTimeout(() => store.setPhase(EXPLORING), 1000);
```

### Initial State

- Player at Pallet Town `(7, 11)`, facing `'down'`
- Inventory: `{ POTION: 5, POKEBALL: 10 }`
- `storyStep: 'START'`

### Dynamic NPC Generation

NPCs are not stored statically — `getNPCs()` calls `buildNPCDatabase()` from `src/data/npcDatabase.ts`, which receives current story state and returns NPCs with dialogue and availability that reflect progression.

---

## Game Phase FSM (`src/types/gamePhase.ts`)

`GamePhase` is stored in the Zustand store (`store.phase`) as a discriminated union. This replaces the old pattern of many independent boolean flags.

### Top-Level `GamePhase`

```typescript
type GamePhase =
  | { type: 'EXPLORING' }
  | { type: 'MENU' }
  | { type: 'INVENTORY' }
  | { type: 'TEAM' }
  | { type: 'SHOP' }
  | { type: 'POKEDEX' }
  | { type: 'PC' }
  | { type: 'EDITOR' }
  | { type: 'BATTLE_TRANSITION' }
  | { type: 'BATTLE'; sub: BattleSubPhase }
  | { type: 'BLACKOUT' }
  | { type: 'HEALING' }
```

### Battle Sub-Phases (`BattleSubPhase`)

Only valid when `GamePhase.type === 'BATTLE'`.

```typescript
type BattleSubPhase =
  | 'CHOOSING'              // Player picks an action
  | 'PLAYER_ATTACK'         // Player's move executing
  | 'ENEMY_ATTACK'          // Enemy's move executing
  | 'PLAYER_FAINTED'        // Active Pokémon fainted (team still alive)
  | 'FORCED_SWITCH'         // Player must pick a replacement
  | 'ENEMY_FAINTED'         // Enemy defeated
  | 'CATCHING'              // Pokéball thrown, catch animation
  | 'LEVEL_UP'              // Level-up message displaying
  | 'EVOLVING'              // Evolution animation
  | 'BATTLE_INVENTORY'      // Bag opened mid-battle
  | 'BATTLE_TEAM'           // Team menu opened mid-battle
  | 'TRAINER_NEXT_POKEMON'  // Trainer sends out their next Pokémon
```

### State Transitions

```
EXPLORING ──────────────────────────────→ MENU / INVENTORY / TEAM / SHOP / POKEDEX / PC / EDITOR
EXPLORING ──────────────────────────────→ BATTLE_TRANSITION
BATTLE_TRANSITION ───────────────────────→ BATTLE (CHOOSING)

BATTLE CHOOSING ─────────────────────────→ PLAYER_ATTACK → ENEMY_ATTACK → CHOOSING
BATTLE ENEMY_ATTACK ─────────────────────→ PLAYER_FAINTED → FORCED_SWITCH → CHOOSING
BATTLE PLAYER_ATTACK ────────────────────→ ENEMY_FAINTED → LEVEL_UP → [EVOLVING] → CHOOSING
BATTLE PLAYER_ATTACK ────────────────────→ ENEMY_FAINTED → TRAINER_NEXT_POKEMON → CHOOSING
BATTLE CHOOSING ─────────────────────────→ BATTLE_INVENTORY / BATTLE_TEAM → CHOOSING

BATTLE (player_win) ─────────────────────→ EXPLORING
BATTLE (player_blackout) ────────────────→ BLACKOUT → HEALING → EXPLORING
BATTLE (fled) ───────────────────────────→ EXPLORING
```

### Helper Constants & Factory

```typescript
// Pre-built phase instances
export const EXPLORING: GamePhase = { type: 'EXPLORING' };
export const BATTLE_TRANSITION: GamePhase = { type: 'BATTLE_TRANSITION' };
export const BLACKOUT: GamePhase = { type: 'BLACKOUT' };
export const HEALING: GamePhase = { type: 'HEALING' };

// Battle sub-phase constants
export const B_CHOOSING = 'CHOOSING';
export const B_PLAYER_ATTACK = 'PLAYER_ATTACK';
// ...etc

// Factory: creates a BATTLE phase with a given sub-phase
export function battle(sub: BattleSubPhase): GamePhase {
  return { type: 'BATTLE', sub };
}
```

### Usage

```typescript
const s = useGameStore.getState();

s.setPhase(BATTLE_TRANSITION);         // start the battle animation
s.setPhase(battle(B_CHOOSING));        // enter the choosing state
s.setPhase(battle(B_FORCED_SWITCH));   // force a team swap after faint
s.setPhase(EXPLORING);                 // return to overworld
```

### Why This Pattern?

Before the FSM, the game had many booleans: `isBattle`, `isChoosingMove`, `isPlayerAttacking`, etc. Problems:
- Multiple could be `true` simultaneously (impossible states).
- Every transition required setting several flags.
- Conditional rendering was a chain of `&&` checks.

With the FSM, impossible combinations are rejected by TypeScript at compile time.
