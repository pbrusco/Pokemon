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

The game follows the original Kanto storyline, but condensed:

1. **Pallet Town** — Start at home. Professor Oak stops you before you leave town.
2. **Oak's Lab** — Choose your starter Pokemon (Bulbasaur, Charmander, or Squirtle). Battle your rival.
3. **Route 1 → Viridian City** — First wild encounters and trainer battles. Deliver Oak's Parcel from the Pokemart to receive your Pokedex.
4. **Viridian Forest** — Explore the forest for bug-type Pokemon.
5. **Pewter City** — Reach the first Gym. Battle Brock for your first Badge.
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

- Movement is tile-based: each step moves the player one full tile (64×64 px).
- Pressing a direction first turns the player, then moves them.
- You cannot walk into walls, trees, water, or NPCs.
- Stepping onto a **door** or **teleport tile** transitions to another map.

### Encounters

- Walking through **tall grass** tiles on encounter-enabled maps triggers wild Pokemon battles.
- Encounter rates and Pokemon tables are defined per map in `constants.ts`.

### Healing

- Talk to the nurse at any **Pokemon Center** to fully heal your team (HP restored, status cured).
- The last Pokemon Center you visited becomes your **respawn point** if you black out.

### Blackout

- If all your Pokemon faint in battle, you black out and are teleported to your last heal location with your team restored to minimal HP.

---

## Menus (press Escape)

| Menu | Description |
|------|-------------|
| **Mochila** (Bag) | View and use items |
| **Equipo** (Team) | View your Pokemon party, check stats |
| **Pokédex** | Browse all 151 Pokemon (seen / caught) |
| **PC** | Swap Pokemon between your party and PC box storage |
| **Tienda** | Opens nearby shop (only available in Pokemart) |

---

## Battle System

See [game-mechanics.md](./game-mechanics.md) for full technical details.

### Battle Turn Flow

1. **Choose action** — Pick a move, open your bag, or swap Pokemon.
2. **Player attacks** — Your selected move executes.
3. **Enemy attacks** — The enemy picks a random move.
4. Repeat until one side faints.

### Actions

| Action | Effect |
|--------|--------|
| Use a move | Deal damage or apply status effects |
| **Mochila** (Bag) | Use a Potion (heals 20 HP) or throw a Pokeball |
| **Equipo** (Team) | Swap to a different Pokemon (uses your turn) |
| **Huir** (Run) | Attempt to flee wild battles (always succeeds; not available vs trainers) |

### Catching Pokemon

- Only works in wild battles.
- Throw a **Pokeball** from your bag.
- Catch rate is based on the wild Pokemon's remaining HP — lower HP = higher chance.
- Caught Pokemon are added to your party (if < 6) or PC box.

### Status Effects

| Status | Effect |
|--------|--------|
| Paralyzed | Speed halved |
| Sleep | Cannot act |
| Poison | Lose HP each turn |
| Burn | Lose HP each turn + Attack halved |
| Frozen | Cannot act |

---

## Items

| Item | Type | Effect |
|------|------|--------|
| Potion | Medicine | Restores 20 HP to one Pokemon |
| Pokeball | Capture | Throw in wild battles to catch Pokemon |
| Oak's Parcel | Key Item | Deliver to Professor Oak in Pallet Town |

---

## Pokemon Management

- Your **party** holds up to 6 Pokemon.
- Extra Pokemon are stored in the **PC** (unlimited boxes).
- Open the **Equipo** menu to check HP, status, moves, and level.
- Access **PC** from the menu to swap party members with box Pokemon.

### Leveling Up

- Pokemon gain EXP after winning battles.
- When enough EXP is accumulated, they level up — stats increase and new moves may be learned.
- At certain levels, Pokemon **evolve** into stronger forms with updated stats and appearance.
