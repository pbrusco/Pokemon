# Architecture

## File Map

```
src/
├── main.tsx                    # React DOM entry point
├── App.tsx                     # Orchestrator (~400 lines): state, hook wiring, JSX composition
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
│   ├── battleEngine.ts         # Pure battle state machine (no React, no side effects)
│   ├── damage.ts               # Gen I damage formula + type chart
│   ├── sounds.ts               # SFX (Web Audio API) + BGM (Howler.js)
│   └── gameSpeed.ts            # Speed multipliers (sd/sdur helpers)
│
├── hooks/
│   ├── useMovementEngine.ts    # Movement, collision, teleports, trainer vision, wild encounters
│   ├── useBattleEngine.ts      # Battle turn orchestration, VFX sequencing → dispatchBattle()
│   ├── useInteractionEngine.ts # Overworld interaction (NPCs, items, tile triggers)
│   ├── useInputHandler.ts      # Keyboard events + movement self-trigger loop
│   ├── useDebugAPI.ts          # Dev-only window.__game debug API
│   ├── useBattleVFX.ts         # Battle animation state (anims, flash, projectile, damage numbers)
│   ├── useOverworldVFX.ts      # Overworld VFX state (grass, trainer spotted, shake)
│   ├── usePokedex.ts           # Pokédex state and updatePokedex()
│   ├── useSaveSystem.ts        # Slot-based save/load and play-time tracking
│   └── useWindowSize.ts        # Responsive window dimensions
│
├── components/
│   ├── GameHeader.tsx          # Top bar: title, play time, mute button
│   ├── WorldView.tsx           # Overworld viewport: tile grid, player, NPCs, items, HUD
│   ├── MobileControls.tsx      # Touch joystick + action buttons
│   ├── SideMenu.tsx            # Main menu panel (Pokédex, team, bag, PC, save, reset, profiles)
│   ├── GameModals.tsx          # All overlay modals: battle, dialogue, inventory, shop, etc.
│   ├── ScreenEffects.tsx       # Full-screen flash/fade effects (level-up, evolution, blackout, heal)
│   ├── overworld/
│   │   ├── GameTile.tsx        # Single tile cell renderer
│   │   ├── PlayerSprite.tsx    # Player sprite with directional animation
│   │   └── NPCComponent.tsx    # NPC sprite with name label and spotted exclamation
│   ├── BattleScreen.tsx        # Battle UI (enemy/player info, moves, action buttons)
│   ├── BattleTransition.tsx    # "BATTLE!" flash animation
│   ├── DialogueBox.tsx         # NPC dialogue with dismiss interaction
│   ├── InventoryUI.tsx         # Bag/item screen
│   ├── TeamMenuUI.tsx          # Party management screen
│   ├── PCStorageUI.tsx         # PC box + party swap
│   ├── PokedexUI.tsx           # Pokédex encyclopedia browser
│   ├── ShopUI.tsx              # Pokemart purchase screen
│   ├── Joystick.tsx            # Touch directional input
│   └── MapEditor.tsx           # Developer tile map painter
│
├── test/
│   ├── setup.ts                # Test setup (jest-dom matchers)
│   └── simulator/
│       ├── GameSimulator.ts    # Headless game driver (commands, queries, event log)
│       ├── useGameLoop.ts      # Composite hook wiring all engines for headless testing
│       └── scenarios.test.ts   # 10 integration scenarios (start → mid-game)
│
└── data/
    ├── npcDatabase.ts          # buildNPCDatabase() + buildItemDatabase() — live NPC/item data
    ├── worldConfig.ts          # INITIAL_MAPS, teleports, static world config
    └── maps/
        ├── index.ts            # Barrel export of all map JSON files
        └── *.json              # Tile grids of varying sizes (Kanto master grid + interiors)
```

---

## Key Patterns

### 1. Layered Architecture

`App.tsx` is a thin orchestrator (~400 lines). It:
- Reads state from Zustand and `useState`
- Wires up hooks by passing setters as parameters
- Composes the top-level JSX from presentation components

Game logic lives in dedicated hooks:

| Hook | Responsibility |
|------|---------------|
| `useMovementEngine` | Collision, teleports, poison, trainer spotting, wild encounters |
| `useBattleEngine` | Battle turn dispatch, VFX sequencing, win/loss/catch outcomes |
| `useInteractionEngine` | NPC dialogue, item pickup, tile interaction (heal, shop, etc.) |
| `useInputHandler` | Keyboard events, movement repeat loop |
| `useDebugAPI` | Dev console API (`window.__game`) |

Presentation is split into focused components. `WorldView` renders the overworld map. `GameModals` renders all overlay screens. `ScreenEffects` renders full-screen flash/fade effects.

### 2. State in Zustand, Ephemeral State in Hooks

The Zustand store (`gameStore.ts`) owns both persistent game state and runtime state (phase, dialogue, flags). Battle-specific ephemeral state lives in `useBattleEngine`:

- `battleLog` — log text for the current turn
- `enemyPokemon` — the current opponent
- `isTrainerBattle` — whether the current battle is a trainer battle
- `catchResult` — result of a catch attempt

Animation state (`playerAnim`, `enemyAnim`, `battleShake`) lives in `useBattleVFX` / `useOverworldVFX`.

### 3. Avoiding Stale Closures: `useGameStore.getState()`

React state inside `setTimeout` callbacks can be stale. All hooks that use deferred callbacks (battle effects, trainer approach animation, poison damage) call `useGameStore.getState()` at the point of use to get fresh state:

```typescript
// Inside a hook's setTimeout:
setTimeout(() => {
  const store = useGameStore.getState(); // always fresh
  store.setPhase(EXPLORING);
  store.setDialogue('¡Tus POKÉMON están en plena forma!');
}, sd(1600));
```

`battleStateRef` is a separate ref holding the mutable `BattleState` during a fight. It is owned by App.tsx and shared between `useMovementEngine` (to initialize it) and `useBattleEngine` (to drive it).

### 4. Side-Effect Safety in State Updaters

React may call `setState(prev => ...)` updaters multiple times in Strict Mode. Never run side effects (setPhase, setTimeout, setBattleLog) inside an updater function:

```typescript
// WRONG
setPlayerTeam(prev => {
  setTimeout(() => setPhase(EXPLORING), 1000); // can fire twice!
  return newTeam;
});

// CORRECT
const newTeam = computeNewTeam(gameState.current.playerTeam);
setPlayerTeam(newTeam);          // pure data update
setTimeout(() => setPhase(...), 1000); // side effect after
```

### 5. Movement: Self-Triggering Pattern

There is no polling loop for movement. Instead:

1. A keydown event adds the key to `pressedKeys` ref (inside `useInputHandler`).
2. `handleMove()` fires, moves the player, sets `isMoving = true`.
3. A `useEffect` in `useInputHandler` watches `isMoving`. When it becomes `false`, if a key is still held, it calls `handleMove()` again.
4. A 110ms timeout inside `useMovementEngine` clears `isMoving` (matching the 100ms CSS animation).

This produces gap-free movement without `setInterval`.

### 6. Audio Strategy

- **SFX** — synthesized via Web Audio API oscillators. No audio files ship with the game.
- **BGM** — streamed from Pokémon Showdown's public CDN via Howler.js. Three tracks: `OVERWORLD`, `BATTLE`, `POKECENTER`. Music switches automatically based on `phase.type` and `currentMap`.

---

## Data Flow

```
User Input (keyboard / joystick)
    │
    ▼
useInputHandler → handleMove() / handleAction() / dispatchBattle()
    │
    ├─ useMovementEngine    (collision, warps, encounters)
    ├─ useInteractionEngine (NPC/item/tile triggers)
    └─ useBattleEngine      (turn steps, VFX, outcomes)
    │
    ▼
Zustand store mutations (setPlayerPos, setPlayerTeam, etc.)
    │
    ▼
App.tsx re-renders → passes props to presentation components
    │
    ▼
WorldView / GameModals / SideMenu / ScreenEffects render
```

---

## Rendering the World

The overworld is rendered inside `WorldView`. The visible ~16×16 tile region is culled around the player (full map is 20×20 but only nearby tiles are rendered). The tile grid is offset using Framer Motion `animate` to follow the player.

Each tile is rendered as a `<GameTile>` component from `src/components/overworld/GameTile.tsx`. The player and NPCs are absolutely positioned within the grid using `left: x * TILE_SIZE` / `top: y * TILE_SIZE`.

Tree trunks render at the tile position; the canopy overlay renders at `z-index: 40 + y` to layer above the player when they walk "behind" a tree.

---

## Persistence

Auto-save runs every 30 seconds via `setInterval` in `useSaveSystem`. The saved payload includes:

- `playerPos`, `direction`, `currentMap`
- `playerTeam`, `pcStorage`
- `inventory`
- `storyStep`, `badges`, `defeatedTrainers`, `hasPokedex`, `hasParcel`
- `lastHealLocation`

Three named save slots are supported (`slot1` / `slot2` / `slot3`), stored under `pokemon_save_slots` in localStorage. The active slot key is tracked in `pokemon_active_slot`.
