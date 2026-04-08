# Component Reference

All components live in `src/components/`. They are UI-only — no game logic, no direct store access. Props are passed from `App.tsx` (or from a parent component that itself receives them from App.tsx).

---

## Layout Components

These six components are the direct children of App.tsx's root `<div>`.

### GameHeader

`src/components/GameHeader.tsx`

Top bar showing the game title, elapsed play time, and a mute toggle.

```typescript
interface GameHeaderProps {
  isMuted: boolean
  onToggleMute: () => void
}
```

---

### WorldView

`src/components/WorldView.tsx`

The entire overworld viewport: tile grid, player sprite, NPCs, items, trainer vision cones, warp indicators, tree canopy overlay, HP HUD, and the interaction "A" bubble.

```typescript
interface WorldViewProps {
  playerPos: Position
  direction: Direction
  isMoving: boolean
  currentMap: MapID
  maps: Record<MapID, MapData>
  npcs: Record<MapID, NPC[]>
  items: Record<MapID, Entity[]>
  grassEffect: Position | null
  overworldShake: boolean
  windowSize: { width: number; height: number }
  spottedTrainerId: string | null
  spottedTrainerPos: Position | null
  defeatedTrainers: string[]
  inBattle: boolean
  dialogue: string | null
  playerTeam: Pokemon[]
}
```

Uses three sub-components from `src/components/overworld/`:
- `GameTile` — renders one tile cell
- `PlayerSprite` — player with directional walking animation
- `NPCComponent` — NPC sprite with name label and spotted exclamation

---

### MobileControls

`src/components/MobileControls.tsx`

Touch controls shown on mobile: a `Joystick` for movement and an `A` button for interaction. Also renders the menu open button.

```typescript
interface MobileControlsProps {
  onMove: (dir: Direction) => void
  onAction: () => void
  setPhase: Dispatch<SetStateAction<GamePhase>>
}
```

---

### SideMenu

`src/components/SideMenu.tsx`

The main menu panel (slides in from the right). Buttons for Pokédex, team, bag, PC, save, and reset. Also shows story step, team HP bars, inventory summary, and save profile switcher.

```typescript
interface SideMenuProps {
  phase: GamePhase
  playerTeam: Pokemon[]
  storyStep: string
  inventory: InventoryCounts
  activeSaveSlot: string
  hasPokedex: boolean
  setPhase: Dispatch<SetStateAction<GamePhase>>
  setDialogue: (d: string | null) => void
  setActiveSaveSlot: (slot: string) => void
  resetGame: () => void
}
```

---

### GameModals

`src/components/GameModals.tsx`

All overlay modals in one place: BattleScreen, BattleTransition, MapEditor, DialogueBox, InventoryUI, TeamMenuUI, ShopUI, PokedexUI, PCStorageUI. Conditionally renders each based on `phase.type` / `battlePhase.type`.

```typescript
interface GameModalsProps {
  phase: GamePhase
  battlePhase: BattlePhase | null
  inBattle: boolean
  currentMap: MapID
  battleShake: boolean
  enemyPokemon: Pokemon | null
  enemyAnim: string
  catchResult: boolean | null
  projectile: any
  hitEffect: any
  damageNumber: any
  healNumber: any
  playerTeam: Pokemon[]
  playerAnim: string
  battleLog: string
  showMoves: boolean
  isTrainerBattle: boolean
  dialogue: string | null
  inventory: InventoryCounts
  pcStorage: Pokemon[]
  money: number
  pokedex: Record<string, { seen: boolean; caught: boolean }>
  setShowMoves: Dispatch<SetStateAction<boolean>>
  setPhase: Dispatch<SetStateAction<GamePhase>>
  setDialogue: (d: string | null) => void
  setPlayerTeam: (fn: (prev: Pokemon[]) => Pokemon[]) => void
  setMoney: (fn: (prev: number) => number) => void
  addInventoryItem: (id: string) => void
  handlePCSwap: (teamIdx: number, pcIdx: number) => void
  handleUseItem: (itemId: string) => void
  dispatchBattle: (action: BattleAction) => void
}
```

---

### ScreenEffects

`src/components/ScreenEffects.tsx`

Full-screen animated overlays for level-up (yellow flash), evolution (white flash), blackout (black fade), and heal (white pulse). Also renders the permanent vignette.

```typescript
interface ScreenEffectsProps {
  phaseType: string
  battlePhase: BattlePhase | null
}
```

---

## Overworld Sub-Components

These live in `src/components/overworld/` and are used exclusively by `WorldView`.

### GameTile

`src/components/overworld/GameTile.tsx`

Renders one tile cell with the appropriate color, texture, and optional grass animation.

```typescript
interface TileProps {
  type: string
  isGrassActive?: boolean
  hasEncounters?: boolean
}
```

Tile types and their visual treatment: `grass`, `water`, `path`, `wall`, `door`, `floor`, `carpet`, `table`, `tree`, `sign`, `cut_tree`, `boulder`.

---

### PlayerSprite

`src/components/overworld/PlayerSprite.tsx`

Player character with a 4-frame directional walking cycle (up/down/left/right) implemented via CSS transforms.

```typescript
interface PlayerSpriteProps {
  position: Position
  direction: Direction
  isMoving: boolean
}
```

---

### NPCComponent

`src/components/overworld/NPCComponent.tsx`

NPC sprite with a colored avatar, name label below, and an animated "!" exclamation mark that appears when the trainer spots the player.

```typescript
interface NPCComponentProps {
  npc: NPC
  isSpotted: boolean
}
```

---

## Battle Components

### BattleScreen

`src/components/BattleScreen.tsx`

Renders the full battle UI: enemy info, player info, battle log, move buttons, and action buttons.

```typescript
interface BattleScreenProps {
  battleShake: boolean
  enemyPokemon: Pokemon | null
  enemyAnim: 'idle' | 'attack' | 'hit' | 'faint'
  playerAnim: 'idle' | 'attack' | 'hit' | 'faint'
  isCatching: boolean
  projectile: { type: string; from: 'player' | 'enemy' } | null
  hitEffect: boolean
  damageNumber: { value: number; isEnemy: boolean } | null
  healNumber: { value: number; isEnemy: boolean } | null
  playerTeam: Pokemon[]
  battleLog: string
  showMoves: boolean
  isPlayerTurn: boolean
  isTrainerBattle: boolean
  handleAttack: (move: Move) => void
  setShowMoves: (v: boolean) => void
  setShowInventory: () => void
  setShowTeam: () => void
  onFlee: () => void
  setIsBattle: (v: boolean) => void
}
```

**Layout:**
- Enemy Pokemon at top-right with HP bar and level
- Player Pokemon at bottom-left with HP bar, status badge, and HP numbers
- Battle log in the center
- Bottom bar: move list (when `showMoves`) or action buttons (Atacar / Mochila / Equipo / Huir)

**HP color coding:** green (>50%), yellow (20–50%), red (<20%)

---

### BattleTransition

`src/components/BattleTransition.tsx`

"¡BATALLA!" flash animation that plays when a battle starts. Calls `onComplete` when finished.

```typescript
interface BattleTransitionProps {
  onComplete: () => void
}
```

---

## Menu / Overlay Components

### DialogueBox

`src/components/DialogueBox.tsx`

Displays NPC dialogue text with a dismiss interaction.

```typescript
interface DialogueBoxProps {
  text: string
  onComplete: () => void
}
```

Slides up from bottom. Click/tap anywhere → plays `SELECT` sound → calls `onComplete()`.

---

### InventoryUI

`src/components/InventoryUI.tsx`

Bag/inventory screen. Shows item quantities from `InventoryCounts` (`Record<itemId, qty>`).

```typescript
interface InventoryUIProps {
  items: InventoryCounts
  onClose: () => void
  onUse?: (itemId: string) => void
}
```

---

### TeamMenuUI

`src/components/TeamMenuUI.tsx`

Pokemon party management screen.

```typescript
interface TeamMenuUIProps {
  team: Pokemon[]
  onClose: () => void
  onSwap: (index: number) => void
  forcedSwitch?: boolean  // if true, cannot close without picking a living Pokemon
}
```

When `forcedSwitch=true`: close button is hidden; only Pokemon with HP > 0 are selectable.

---

### PCStorageUI

`src/components/PCStorageUI.tsx`

Split-screen PC box and party swap interface.

```typescript
interface PCStorageUIProps {
  team: Pokemon[]
  pc: Pokemon[]
  onClose: () => void
  onSwap: (teamIndex: number, pcIndex: number) => void
}
```

---

### PokedexUI

`src/components/PokedexUI.tsx`

Pokédex encyclopedia browser. Grid of all 151 Pokemon with seen/caught badges.

```typescript
interface PokedexUIProps {
  pokedex: Record<string, { seen: boolean; caught: boolean }>
  onClose: () => void
}
```

---

### ShopUI

`src/components/ShopUI.tsx`

Pokemart purchase screen. Also exports `SHOP_PRICES` used by App.tsx's buy handler.

```typescript
interface ShopUIProps {
  money: number
  onBuy: (itemId: string) => void
  onClose: () => void
}
```

---

## Other Components

### Joystick

`src/components/Joystick.tsx`

Mobile/touch directional input. Circular knob constrained to 40px radius with a 10px dead zone.

```typescript
interface JoystickProps {
  onMove: (direction: Direction | null) => void
}
```

---

### MapEditor

`src/components/MapEditor.tsx`

Developer tool for painting tile maps. Only shown when `phase.type === 'EDITOR'` (toggle with Shift+E).

```typescript
interface MapEditorProps {
  onClose: () => void
}
```

Saves edits to `store.worldMaps` (persisted in localStorage). "Copy to Clipboard" generates a TypeScript array literal.
