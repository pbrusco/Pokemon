# Gameplay Guide

## Controls

### Keyboard (Desktop)

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move player |
| Z / Enter / Space | Interact (talk, pick up items) |
| Escape | Open / close menu |

### Mobile (Touch)

- On-screen **joystick** (bottom-left) for movement
- **A button** (bottom-right) to interact
- Tap menu buttons to navigate UI screens

---

## Story Progression

The game follows the original Kanto storyline, condensed:

1. **Pallet Town** — Start at home. Professor Oak stops you before you leave town.
2. **Oak's Lab** — Choose your starter Pokémon (Bulbasaur, Charmander, or Squirtle). Battle your rival.
3. **Route 1 → Viridian City** — First wild encounters and trainer battles. Deliver Oak's Parcel from the Pokémart to receive your Pokédex.
4. **Viridian Forest** — Explore the forest for Bug-type Pokémon.
5. **Pewter City** — Reach the first Gym. Battle Brock for the Boulder Badge.
6. **Route 3** — Continue east toward Mount Moon.

### Story Flags

Progress is tracked via the `storyStep` field:

| Value | Meaning |
|-------|---------|
| `START` | Game just began |
| `OAK_STOPPED` | Oak stopped you at the edge of town |
| `IN_LAB` | Inside Oak's lab |
| `PICKED_STARTER` | Chose your starter |
| `RIVAL_BATTLE` | Defeated (or lost to) your rival |
| `EXPLORING` | Free exploration mode |

---

## Core Systems

### Movement

- Movement is tile-based: each step moves the player one full tile.
- You cannot walk into walls, trees, water, or NPCs.
- Stepping onto a **warp tile** transitions to another map.

### Encounters

- Walking through **tall grass** tiles on encounter-enabled maps triggers wild Pokémon battles.
- Encounter rates and Pokémon tables are defined per map in `constants.ts`.

### Healing

- Talk to the nurse at any **Pokémon Center** to fully heal your team (HP, status, and PP all restored).
- The last Pokémon Center you visited becomes your **respawn point** if you black out.

### Blackout

- If all your Pokémon faint (in battle or from overworld poison), you black out.
- You are teleported to your last heal location with your team fully restored.

---

## Menus (press Escape)

| Menu | Description |
|------|-------------|
| **Mochila** (Bag) | View and use items |
| **Equipo** (Team) | View your Pokémon party, check stats |
| **Pokédex** | Browse all 151 Pokémon (seen / caught) |
| **PC** | Swap Pokémon between your party and PC box storage |
| **Tienda** | Opens nearby shop (only available in Pokémart) |

---

## Battle System

See [game-mechanics.md](./game-mechanics.md) for full technical details.

### Battle Turn Flow

1. **Choose action** — Pick a move, open your bag, or swap Pokémon.
2. **Player attacks** — Your selected move executes.
3. **Enemy attacks** — The enemy picks a move (AI prefers effective moves).
4. Repeat until one side faints.

### Actions

| Action | Effect |
|--------|--------|
| Use a move | Deal damage or apply status effects |
| **Mochila** (Bag) | Use a Potion (heals HP) or throw a Pokéball |
| **Equipo** (Team) | Swap to a different Pokémon (uses your turn) |
| **Huir** (Run) | Flee wild battles (always succeeds; not available vs trainers) |

### PP and Struggle

Each move has limited PP. When a move runs out of PP, it is greyed out and cannot be selected. When **all** moves reach 0 PP, the move menu is replaced by a single **Forcejeo** (Struggle) button — a 50-power attack that also deals 1/4 recoil damage to the user.

### Catching Pokémon

- Only works in wild battles.
- Throw a **Pokéball** from your bag.
- Catch rate uses the Gen I formula: based on the species' base catch rate, the wild Pokémon's remaining HP, and its status condition (sleep/frozen are best).
- Caught Pokémon are added to your party (if < 6) or PC box.

### Status Effects

| Status | In-battle effect | Overworld effect |
|--------|----------------|-----------------|
| Paralyzed | 25% chance to skip turn; Speed halved | — |
| Sleep | Cannot act (wakes randomly) | — |
| Poison | Lose HP each turn | Lose 1 HP every 4 steps; can faint |
| Burn | Lose HP each turn + Attack halved | — |
| Frozen | Cannot act | — |

---

## Items

| Item | Type | Effect |
|------|------|--------|
| Poción | Medicine | Restores HP to one Pokémon |
| Pokéball | Capture | Throw in wild battles to catch Pokémon |
| Paquete de Oak | Key Item | Deliver to Professor Oak in Pallet Town |

---

## Pokémon Management

- Your **party** holds up to 6 Pokémon.
- Extra Pokémon are stored in the **PC** (unlimited boxes).
- Open the **Equipo** menu to check HP, status, moves, and level.
- Access **PC** from the menu to swap party members with box Pokémon.

### Leveling Up

- Pokémon gain EXP after winning battles (more EXP from trainer battles).
- When enough EXP is accumulated, they level up — stats increase and new moves may be learned.
- At certain levels, Pokémon **evolve** into stronger forms with updated stats and appearance.
