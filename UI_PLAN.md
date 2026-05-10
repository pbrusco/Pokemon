# UI Plan — GBA Soul, Web Body

**North star:** Every screen should feel like FireRed/LeafGreen running in a browser.
Story = Pokémon Red. Visuals = FRLG. Medium = the web.

**Primary reference:** Pokémon FireRed / LeafGreen (GBA, Gen 3)
**Secondary references:** HGSS touch-screen layout (mobile), B/W animated sprites (battle), Cassette Beasts / Coromon (modern GBA-on-web execution)

---

## Roadmap

| # | Area | Files | Status |
|---|------|-------|--------|
| 1 | Color tokens — CSS variables + tile palette | `index.css`, `tilesetGenerator.ts` | ✅ done |
| 2 | Tile refinement — tree depth, water shimmer, path warmth | `tilesetGenerator.ts`, `index.css` | ✅ done |
| 3 | NPC name tags — show on proximity, not always | `NPCComponent.tsx`, `WorldView.tsx` | ✅ done |
| 4 | Battle: Red's back sprite + battle backgrounds per terrain | `BattleScreen.tsx`, map data | ✅ done |
| 5 | Battle HUD — FRLG HP bar, status badges, no enemy HP number | `BattleScreen.tsx` | ✅ done |
| 6 | Battle moves — 2×2 grid + type/PP panel | `BattleScreen.tsx` | ✅ done |
| 7 | Dialogue — speaker portrait for key NPCs, page chunking | `DialogueBox.tsx` | ✅ done |
| 8 | Mobile — B button wired, START/SELECT centering, button feel | `MobileControls.tsx`, `DPad.tsx`, `useInputHandler.ts` | ✅ done |
| 9 | Main menu restyle — typography-first, FRLG cursor | `SideMenu.tsx`, `MenuButton.tsx` | ✅ done |
| 10 | Party screen — FRLG navy background, per-slot cards | `TeamMenuUI.tsx` | ✅ done |
| — | Remove overworld team HUD (now in menu) | `WorldView.tsx`, `App.tsx` | ✅ done |
| — | Fix Red back sprite (64×320 spritesheet → clip first frame) | `BattleScreen.tsx` | ✅ done |
| 11 | Pokédex — detail panel on select, proper seen/caught states | `PokedexUI.tsx` | ✅ done |
| 12 | Battle log — pixel font, speaker label, ◆ cursor | `BattleScreen.tsx` | ✅ done |
| 13 | Transitions — warp flash, win sequence, evolution silhouette | `BattleTransition.tsx`, `ScreenEffects.tsx` | ✅ done |
| 14 | Speaker portraits in dialogue (stretch) | `DialogueBox.tsx`, sprite mapping | ⬜ stretch |

---

## Stage 1 — Color Tokens

### CSS Variables (`src/index.css`)

```
Tile palette   → --pk-*   (reference only; canvas uses hex in tilesetGenerator.ts)
UI palette     → --ui-*   (used in all React components)
Battle palette → --battle-* (BattleScreen.tsx)
HP colors      → --hp-*
```

**Tile colors** (canonical hex values for `tilesetGenerator.ts`):
- Grass: `#78C840` (slightly more saturated than current `#88C858`)
- Path: `#C8A848` (warmer/more golden than current `#D8C078`)
- Water: `#4870C8` (deeper than current `#5888C8`)
- Roof: `#C84838` (same)
- Wall: `#F0E8D0` (same)

**UI palette** (for React component Tailwind/inline styles):
- `--ui-bg: #F8F8F0` — menu background (warm near-white)
- `--ui-border: #383838` — all thick borders
- `--ui-border-lt: #A8A8A8` — inner / lighter borders
- `--ui-accent: #4878D8` — selection highlight blue
- `--ui-red: #D03030` — Pokéball red

**Battle palette**:
- `--battle-bg: #202850` — deep navy for bottom panel
- `--battle-panel: #F8F8F0` — HUD cards
- `--battle-log-bg: #101830` — battle log box
- `--battle-log-border: #F0C830` — gold log border

**HP bars** (saturated, no gradients):
- `--hp-high: #00C000`
- `--hp-mid: #F8C000`
- `--hp-low: #F02000`

**Status badges**:
- PSN (veneno): `#B060D0`
- PAR (parálisis): `#C8C000`
- QUE (quemadura): `#F04000`
- HLO (hielo): `#90C0F8`
- DOR (sueño): `#908090`
- CON (confusión): `#E080E0`

---

## Stage 2 — Tile Refinement

### Trees
- Canopy center: `#50B030` (brighter than `#48A030`)
- Canopy outline: `#183808` (near-black green, 1px edge ring)
- Trunk: `#805030` with a 1px lighter highlight at top-left

### Water shimmer
- Two water variants (`WATER` tile 6 / `WATER_ALT` tile 7) already exist in the spritesheet
- `.water-shimmer` CSS class animates `background-position-x` between `-384px` (tile 6 × TILE_SIZE 64) and `-448px` (tile 7 × 64)
- `GameTile.tsx` sets only `backgroundPositionY` inline for water tiles so CSS animation can drive X
- Period: 1.2s, `step-end` (GBA-style instant swap). Staggered delay `((x*3 + y*7) % 12) * 0.1s` so tiles don't all flash in sync
- ⚠️ These pixel values are hardcoded — if TILE_SIZE ever changes from 64, update the CSS keyframes

### Path
- More texture variation — subtle warm-golden dithering
- Less green-tinted than current

---

## Stage 3 — NPC Name Tags

Current: white pill badge always visible above every NPC — clutters the screen.

**Implemented behavior:**
- `SILENT_CLASSES` set: `citizen`, `old_man`, `old_woman`, `man`, `woman` — never show label
- Wild Pokémon NPCs: no `playerPos` prop passed → never show label
- All other NPCs: label fades in (150ms) when Chebyshev distance to player ≤ 3 tiles (facing direction not checked — distance alone is enough)
- Style: dark navy `#0d1b2a` background, white border, `font-game` at 6px — matches DialogueBox aesthetic

**Implementation:**
- `WorldView.tsx` passes `playerPos` to real NPCs, omits it for `wildPokemon.map()`
- `NPCComponent.tsx` computes `isNearby`, wraps label in `AnimatePresence`

---

## Stage 4 — Battle: Red's Back Sprite + Terrain Backgrounds

### Red's back sprite
- `red_back_pic.png` in `/public/sprites/battle/` — **64×320 spritesheet, 5 walk frames of 64×64**
- ⚠️ NOT a single-frame image like other battle sprites. Using `<img object-contain>` shows all 5 frames
- Fix: `overflow-hidden` wrapper div sized 64×64 (or scaled), img inside at full 64×320 height — clips to first frame
- Displayed as a small companion figure alongside the player Pokémon (not replacing the Pokémon sprite)
- `CinematicPanel` still uses the Pokémon back sprite from PokeAPI (correct — cinematic shots show the Pokémon)

### Battle backgrounds
- Each map gets a `battleBg` property: `'grass' | 'cave' | 'gym' | 'water' | 'building'`
- `BattleScreen.tsx` renders a tiled CSS pattern behind the arena
- All patterns are CSS-only (no image assets):
  - `grass` — diagonal stripes, #78C840 / #60A830, ground platform on brown
  - `cave` — dark rocky grey (#505050 / #404040) grid-dashed pattern
  - `gym` — colored checkered floor based on gym type (electric=yellow, etc.)
  - `water` — animated blue stripes (same shimmer as overworld water)
  - `building` — warm wood planks (#C09060 / #A07848)

---

## Stage 5 — Battle HUD (FRLG Style)

### Enemy HUD
```
┌───────────────────────────┐
│ CHARIZARD      ♂    Nv.36 │
│ PS ████████████░░░   [QUE]│
└───────────────────────────┘
```
- No HP number (enemy HP always hidden — matches all mainline games)
- Gender symbol after name
- Status badge as colored pill (see color tokens above)
- HP bar: solid color fill, dark border, no gradient

### Player HUD
```
┌───────────────────────────┐
│ CHARMANDER     ♂    Nv.12 │
│ PS ███████░░░░░    29/45  │
│ EXP ▒▒▒▒▒░░░░░░░░░░░░░░  │
└───────────────────────────┘
```
- HP number shown
- EXP bar below HP, thin, blue, no number

### HP Bar component
- Replace gradient width animation with `scaleX` (already doing this ✓)
- Color based on ratio: >50% → `--hp-high`, 20-50% → `--hp-mid`, <20% → `--hp-low`
- Solid fill, no gradient

---

## Stage 6 — Move Selection (2×2 Grid)

### Layout
```
┌─────────────────────────────────────────┐
│  ASCUAS         │   SOFOCO              │
│  DRAGALIAS      │   GIRO ROCA           │
├─────────────────────────────────────────┤
│  [FUEGO]   PP  12 / 20                  │
└─────────────────────────────────────────┘
```
- 2×2 grid of move buttons (matches FRLG exactly)
- Bottom strip shows selected move's type badge + PP
- Type badge: colored rounded pill using type color constants
- Cursor ▶ appears left of hovered/selected move
- Out-of-PP moves shown in gray, not interactive

### Type colors (FRLG palette)
- Normal `#A8A878`, Fire `#F08030`, Water `#6890F0`, Grass `#78C850`
- Electric `#F8D030`, Ice `#98D8D8`, Fighting `#C03028`, Poison `#A040A0`
- Ground `#E0C068`, Flying `#A890F0`, Psychic `#F85888`, Bug `#A8B820`
- Rock `#B8A038`, Ghost `#705898`, Dragon `#7038F8`, Dark `#705848`

---

## Stage 7 — Dialogue

### Short-term: page chunking
- If text exceeds ~120 chars, split at the last word boundary before the limit
- Show first chunk → ▼ to advance → show next chunk
- Already partially there with the typewriter; needs a `pages: string[]` concept

### Speaker label
- No new prop needed — all existing dialogue already uses `"NAME: text"` format (e.g. `"PROF. OAK: ¡Oh! ..."`)
- `parseSpeaker()` regex extracts the prefix automatically: `/^([A-Z...]{1,25}):\s*([\s\S]+)/`
- Speaker rendered in gold `#f8d830` pixel font above the body text

### Medium-term: portraits (stretch)
- Small 48×48 portrait in top-left corner of dialogue box
- Only for named characters: Oak, rival, gym leaders, Giovanni
- Portrait source: the existing `/public/sprites/battle/*.png` files, cropped/scaled

---

## Stage 8 — Mobile Controls

### B button
- Currently does nothing
- Should fire `Escape` behavior: dismiss dialogue, back from menus, etc.
- Wire in `MobileControls.tsx` → call `onAction()` with a special flag, or dispatch directly

### Layout restyle — GBA-inspired
```
[D-PAD]    [SEL] [STA]    [B] [A]
```
- START/SELECT: small horizontal pills in the center (between pad and A/B)
- SELECT is currently absent — add it (maps to opening Pokédex or map, TBD)
- A button: slightly higher than B (GBA angled layout)

### Button feel
- A/B: radial gradient from top-left (`highlight`) to bottom-right (`shadow`) for molded-plastic look
- Active state: `scale(0.92)` + brightness drop (already done ✓)
- D-pad: deeper cross-groove effect using `box-shadow` inset

---

## Stage 9 — Main Menu (Typography-First)

Current: colored icon circles + font-bold labels.

FRLG style: no decorative icons, just text with cursor ▶.

```
▶ Pokédex
  Mochila
  Equipo
  Guardar
  Config
```

- Background: `--ui-bg` (#F8F8F0)
- Border: 3px solid `--ui-border` (#383838), no border-radius (or 2px max)
- Cursor `▶` in `--ui-red` (#D03030), animates left-right on press
- Labels: Rajdhani 600 weight, 16px
- Active label: `--ui-accent` (#4878D8) color
- No icons (or very small monochrome icons, not colored circles)
- Section dividers: thin 1px `--ui-border-lt` lines

---

## Stage 10 — Party Screen

FRLG party screen aesthetic:
- Full-screen overlay with dark teal background (`#203048`)
- Each party slot: rounded card (`#304060` border, `#1A2840` background)
- Pokémon sprite (48×48) on the left, name/level/HP on the right
- First slot slightly taller (lead Pokémon emphasis)
- Status condition overlay badge
- `CANCELAR` button at bottom in the style of the main menu

---

## Stage 11 — Pokédex Detail Panel

When a Pokémon entry is selected:
- Slide in a detail panel (from right, or expand in place)
- Shows: larger sprite, Pokédex number, type badges, height/weight (if available), one-line description
- Seen state: grayscale sprite, "???" name
- Caught state: colored sprite, full name + data

---

## Stage 12 — Battle Log

- Text: `Press Start 2P` at 10px (currently slightly larger)
- Speaker label: when a trainer speaks, their name appears above the text
- Cursor: blinking `◆` instead of `▼` triangle
- Log history: subtle divider lines between turns

---

## Stage 13 — Transitions & Effects

### Warp flash
- On map transition: single-frame white flash before the new map renders
- Implementation: `setPhase` → brief `opacity: 1` white overlay → resolve → remove
- ~80ms total

### Battle win sequence
- Wild Pokémon fainted: brief gray spiral (CSS conic-gradient spin, 0.4s) before EXP gain
- Trainer battle won: trainer sprite slides off-screen left (exit animation) before dialogue

### Evolution
- Pokémon silhouette (CSS `brightness(0)` filter) pulses, grows, morphs into new silhouette
- White flash → new silhouette → white flash → colored new Pokémon
- Approximate: 3 seconds total

---

## Design Tokens Reference

See `src/index.css` for the canonical `:root { --pk-*, --ui-*, --battle-*, --hp-* }` values.
See `src/data/tileset/tilesetGenerator.ts` for tile draw colors (canvas-based, not CSS vars).

---

## Implementation Gotchas

- **`red_back_pic.png` is a spritesheet** (64×320, 5 frames). All other `/public/sprites/battle/*.png` are 64×64 singles. Always use `overflow-hidden` wrapper to clip to frame 0.
- **Water shimmer pixel values are hardcoded** (`-384px` / `-448px` in `index.css`). Derived from `TILE_SIZE=64 × tileId`. Must update if `TILE_SIZE` ever changes.
- **`font-game` → Press Start 2P** is defined in `@theme` in `index.css`. `BattleScreen.tsx` uses `font-game`.
- **`STATUS_INFO` and `TYPE_COLORS`** are defined locally in `BattleScreen.tsx` and `STATUS_BADGE` duplicated in `TeamMenuUI.tsx`. Consider extracting to a shared `src/lib/typeColors.ts` in a future cleanup pass.
- **Overworld team HUD removed** — team is now accessed via MENÚ → Equipo. `WorldView.tsx` no longer accepts `playerTeam` prop.
- **Dialogue speaker format** — all existing `setDialogue()` calls embed the speaker as `"NAME: text"`. No call-site changes needed for speaker display to work.
- **`MoveMenu` extracted** from `BattleScreen` — hover state lives inside the component. `getMoveDescription` removed (replaced by type/PP strip).
- **SELECT button** → toggles Pokédex (if player has one). B button → dismiss dialogue / close menu / close moves menu.
