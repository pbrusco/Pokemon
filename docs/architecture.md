# Architecture

## File Map

```
src/
├── main.tsx                    # React DOM entry point
├── App.tsx                     # Main game loop (1900+ lines)
├── types.ts                    # Core TypeScript interfaces
│
├── types/
│   └── gamePhase.ts            # FSM state types (GamePhase + BattlePhase)
│
├── constants.ts                # All static game data (151 Pokemon, moves, items, encounters)
│
├── store/
│   └── gameStore.ts            # Zustand store — global game state + localStorage persistence
│
├── lib/
│   ├── damage.ts               # Gen I damage formula + type chart
│   └── sounds.ts               # SFX (Web Audio API) + BGM (Howler.js)
│
├── hooks/
│   ├── usePlayerMovement.ts    # Movement, collision, teleports, trainer vision
│   └── useInteractionEngine.ts # Interaction (NPCs, items, tile triggers)
│
├── components/
│   ├── BattleScreen.tsx        # Battle UI
│   ├── DialogueBox.tsx         # NPC dialogue display
│   ├── InventoryUI.tsx         # Bag screen
│   ├── TeamMenuUI.tsx          # Party management
│   ├── PCStorageUI.tsx         # PC box
│   ├── PokedexUI.tsx           # Pokedex
│   ├── ShopUI.tsx              # Shop
│   ├── Joystick.tsx            # Mobile touch controls
│   └── MapEditor.tsx           # Dev tool for painting tile maps
│
└── data/
    ├── worldConfig.ts          # NPC definitions + dynamic generation per map
    └── maps/
        ├── index.ts            # Barrel export of all maps
        └── *.json              # 20×20 tile grids (one file per map)
```

---

## Key Patterns

### 1. Single Orchestrator Component

`App.tsx` is intentionally monolithic. It owns:
- Input handling (keyboard + touch)
- Rendering the tile grid, player, and NPCs
- Battle turn logic (`handleAttack`, `handleEnemyTurn`)
- Level-up and evolution sequences (chained `setTimeout` callbacks)
- Overlay rendering via `AnimatePresence` (menus, battle UI, dialogue)

Battle logic is **not** extracted into a hook — a previous `useBattleEngine.ts` hook was deleted because it created stale closure bugs. All battle state setters run sequentially inside `App.tsx`.

### 2. State in Zustand, Derived Logic in App.tsx

The Zustand store (`gameStore.ts`) is the single source of truth. `App.tsx` reads from the store and computes everything else as local React state:

- `phase` / `battlePhase` — the FSM (local `useState` in App.tsx)
- `battleLog` — log messages for the current battle
- `enemyPokemon` — the current opponent
- Animation states (`playerAnim`, `enemyAnim`, `projectile`, etc.)

### 3. Avoiding Stale Closures

React state inside `setTimeout` callbacks can be stale. The pattern used throughout `App.tsx`:

```typescript
// In App.tsx
const playerTeamRef = useRef(playerTeam);
useEffect(() => { playerTeamRef.current = playerTeam; }, [playerTeam]);

// Inside a setTimeout:
const currentTeam = playerTeamRef.current; // always fresh
```

All pieces of game state that are read inside async callbacks have a corresponding `useRef` mirror.

### 4. Side-Effect Safety in State Updaters

React may call `setState(prev => ...)` updaters multiple times in Strict Mode. Never run side effects (setPhase, setTimeout, setBattleLog) inside an updater function:

```typescript
// WRONG
setPlayerTeam(prev => {
  setTimeout(() => setPhase(EXPLORING), 1000); // can fire twice!
  return newTeam;
});

// CORRECT
const newTeam = computeNewTeam(playerTeamRef.current);
setPlayerTeam(newTeam);          // pure data update
setTimeout(() => setPhase(...), 1000); // side effect after
```

### 5. Movement: Self-Triggering Pattern

There is no polling loop for movement. Instead:

1. A keydown event sets `keysRef.current.add(key)`.
2. `handleMove()` fires, moves the player, then sets `isMoving = true`.
3. A `useEffect` watches `isMoving`. When it becomes `false`, if a key is still held, it calls `handleMove()` again.
4. A 110ms timeout clears `isMoving` (matching the 100ms CSS animation).

This produces gap-free movement without `setInterval`.

### 6. Audio Strategy

- **SFX** — synthesized via Web Audio API oscillators. No audio files ship with the game.
- **BGM** — streamed from Pokémon Showdown's public CDN via Howler.js. Three tracks: `OVERWORLD`, `BATTLE`, `POKECENTER`. Music switches automatically based on `phase.type` and `currentMap`.

---

## Data Flow

```
User Input (keyboard/joystick)
    │
    ▼
usePlayerMovement / useInteractionEngine   ← reads from gameStore
    │
    ▼
gameStore mutations (setPlayerPos, etc.)   ← triggers React re-renders
    │
    ▼
App.tsx re-renders (game phase transitions, battle logic)
    │
    ▼
Component tree renders (BattleScreen, DialogueBox, menus, tile grid)
```

---

## Rendering the World

The overworld is rendered as a scrolling viewport centered on the player. The visible 20×20 grid is clipped with `overflow-hidden` and the tile grid is offset using CSS `translate` to follow the player.

Each tile is rendered as a `<GameTile>` component with a background color/image based on `tile.type`. Walkable decorations (grass particles, water shimmer) are CSS animations.

The player and NPCs are absolutely positioned within the grid using `left: x * TILE_SIZE` / `top: y * TILE_SIZE`.

---

## Persistence

Auto-save runs every 30 seconds via `setInterval` in a `useEffect`. The saved payload includes:

- `playerPos`, `direction`, `currentMap`
- `playerTeam`, `pcStorage`
- `inventory`
- `storyStep`, `badges`, `defeatedTrainers`, `hasPokedex`, `hasParcel`
- `lastHealLocation`
- `worldMaps` (if edited via MapEditor)

On load, `localStorage.getItem('pokemon_save')` is read and `loadPersistedState(payload)` is dispatched to the store.
