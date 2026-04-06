# Component Reference

All components live in `src/components/`. They are UI-only — no game logic, no direct store access. Props are passed from `App.tsx`.

---

## BattleScreen

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
  playerTeam: Pokemon[]
  battleLog: string
  showMoves: boolean
  isPlayerTurn: boolean
  handleAttack: (move: Move) => void
  setShowMoves: (v: boolean) => void
  setShowInventory: (v: boolean) => void
  setShowTeam: (v: boolean) => void
  setIsBattle: (v: boolean) => void   // triggers flee
}
```

**Layout:**
- Enemy Pokemon at top-right with HP bar and level
- Player Pokemon at bottom-left with HP bar, status badge, and HP numbers
- Battle log in the center
- Bottom bar: move list (when `showMoves`) or action buttons (Attack / Mochila / Equipo / Huir)

**HP color coding:** green (>50%), yellow (20–50%), red (<20%)

**Animations (Framer Motion):**
- Idle: gentle hover loop
- Attack: slides toward opponent
- Hit: white flash
- Faint: fade out downward
- Projectile: animates across screen
- Damage number: floats up and fades

---

## DialogueBox

`src/components/DialogueBox.tsx`

Displays NPC dialogue text with a dismiss interaction.

```typescript
interface DialogueBoxProps {
  text: string
  onComplete: () => void
}
```

**Behavior:**
- Slides up from bottom with a blurred backdrop
- Bouncing arrow indicates "tap to continue"
- Click/tap anywhere → plays `SELECT` sound → calls `onComplete()`
- Responsive: `95vw` on mobile, `max-w-3xl` on desktop

---

## InventoryUI

`src/components/InventoryUI.tsx`

Bag/inventory screen.

```typescript
interface InventoryUIProps {
  items: string[]           // Array of item IDs
  onClose: () => void
  onUse?: (itemId: string) => void
}
```

**Behavior:**
- Grid of all items in inventory, showing icon, name, and description from `ITEMS_DATABASE`
- Clicking an item calls `onUse(itemId)` if provided
- Shows "mochila vacía" when empty
- Slides in from bottom

---

## TeamMenuUI

`src/components/TeamMenuUI.tsx`

Pokemon party management screen.

```typescript
interface TeamMenuUIProps {
  team: Pokemon[]
  onClose: () => void
  onSwap: (index: number) => void   // select this Pokemon as active
  forcedSwitch?: boolean            // if true, cannot close without picking a living Pokemon
}
```

**Behavior:**
- Lists all party Pokemon
- Active Pokemon (index 0) highlighted in green
- Fainted Pokemon grayed out with "KO" badge
- Status badges shown (paralizado, dormido, etc.)
- HP bar and HP/maxHP per Pokemon
- When `forcedSwitch=true`: close button is hidden and only Pokemon with HP > 0 are selectable
- Slides in from right

---

## PCStorageUI

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

**Behavior:**
- Left column: party (list view, select one)
- Right column: PC box (grid view, select one)
- When both sides have a selection: "Swap" button activates with preview text ("¿Intercambiar X por Y?")
- Blue color scheme

---

## PokedexUI

`src/components/PokedexUI.tsx`

Pokedex encyclopedia browser.

```typescript
interface PokedexUIProps {
  pokedex: Record<string, { seen: boolean; caught: boolean }>
  onClose: () => void
}
```

**Behavior:**
- Grid of all 151 Pokemon (3 columns on desktop)
- Unseen entries shown as "?" in grayscale
- Seen entries show sprite, name, Dex number (#001–#151)
- Badges: "Visto" (blue) / "Atrapado" (green)
- Footer: total seen / caught counts
- Red header

---

## ShopUI

`src/components/ShopUI.tsx`

Pokemart purchase screen.

```typescript
interface ShopUIProps {
  onBuy: (itemId: string) => void
  onClose: () => void
}
```

**Behavior:**
- Lists POTION and POKEBALL, each $200
- Click to purchase → plays `SELECT` sound → calls `onBuy(itemId)`
- Scale-in animation on open

---

## Joystick

`src/components/Joystick.tsx`

Mobile/touch directional input.

```typescript
interface JoystickProps {
  onMove: (direction: Direction | null) => void
}
```

**Behavior:**
- Circular knob constrained within 40px radius
- Drag → computes dominant axis direction (left/right if `|dx| > |dy|`, else up/down)
- Only registers if displacement > 10px (dead zone)
- Release → snaps back to center, calls `onMove(null)`

---

## MapEditor

`src/components/MapEditor.tsx`

Developer tool for painting tile maps. Only shown when `phase.type === 'EDITOR'`.

```typescript
interface MapEditorProps {
  onClose: () => void
}
```

**Behavior:**
- Dropdown selects which map to edit
- Tile type palette: grass, path, wall, door, floor, carpet, table, tree, sign
- 20×20 grid — click or drag to paint tiles
- Walkability is auto-set based on tile type
- "Copy to Clipboard" button generates a TypeScript array literal
- Saves edits to `store.worldMaps` (persisted in localStorage)

---

## Internal Components (defined in App.tsx)

These smaller components are defined inline in `App.tsx` and not exported:

| Component | Description |
|-----------|-------------|
| `GameTile` | Renders one tile cell with appropriate color/texture |
| `Player` | Player sprite with directional animation |
| `NPCComponent` | NPC sprite with name label |
| `BattleTransition` | "BATTLE!" splash screen animation |
