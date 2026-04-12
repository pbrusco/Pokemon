# DESIGN.md — Game Design Document

## Vision

A faithful browser-based recreation of **Pokémon Red / Fire Red** (Gen I) built with modern web technology. The goal is to reproduce the original *feel* — tile-based movement, turn-based battles, Kanto story progression — not to clone the visuals pixel-for-pixel. Players who grew up with Gen I should find the mechanics familiar; everything else (rendering, state management, tooling) is modern.

---

## Design Principles

1. **Mechanics over aesthetics.** The damage formula, type chart, stat calculation, and status effects follow Gen I rules exactly. Visual presentation can deviate; mechanical behavior should not.
2. **Spanish language.** All in-game text (dialogue, move names, battle logs, UI labels) is in Spanish, following the official Spanish localization of the games.
3. **Condensed but complete.** The story is shorter than the original, but all major beats are present: starter selection, rival battle, gym badges, blackout/heal loop.

---

## Scope

### In scope

- **151 Pokémon** — full Gen I roster with original base stats
- **Core battle systems** — turn-based combat, moves, STAB, type effectiveness, critical hits, status effects, catch mechanics, EXP, level-up, evolution
- **Gen I damage formula** — including the physical/special split by type (not the Gen IV stat split)
- **Overworld systems** — tile movement, collision, NPC interaction, trainer vision cones, wild encounters in tall grass, teleports/warps
- **Progression systems** — badges, Pokédex, party management, PC box storage, inventory, money
- **Sound** — synthesized SFX and looping background music per map/phase

### Out of scope

- Gen II+ Pokémon, moves, or mechanics (no Dark/Steel types, no held items, no breeding)
- Multiplayer or trading
- Abilities (introduced in Gen III)
- IV/EV systems (simplified stat formula used instead)
- Day/night cycle
- Move animations beyond simple flash/projectile VFX
- Pokémon following the player in the overworld

---

## Deviations from the Original

| Original behavior | This game |
|-------------------|-----------|
| English text | All text in Spanish |

---

## Battle System Design

- **Turn order:** player always goes first within a turn (no speed-based priority)
- **Enemy AI:** wild Pokémon pick moves at random; trainers pick intelligently (prefer effective moves)
- **Fleeing:** always succeeds in wild battles; not available in trainer battles
- **Catching:** only in wild battles; three-shake animation before reveal
- **Blackout:** teleports player to last heal location; team restored to 50% HP

## Progression Design

- Story gated by `storyStep` flag — Oak stops you, starter selection, rival battle, free exploration
- Badges tracked as array; each badge unlocks map access (currently: Boulder Badge from Brock)
- Pokédex marks seen/caught per Pokémon
- PC box has unlimited storage (no Box 1/Box 2 limit)

---

## Tech Stack Decisions

| Decision | Rationale |
|----------|-----------|
| React 19 + Zustand | Familiar ecosystem; Zustand avoids prop-drilling for global game state |
| Pure state machine in `battleEngine.ts` | Testable without React; no side effects in battle logic |
| `gameState` ref for setTimeout callbacks | Avoids stale closure bugs in deferred callbacks |
| Tile maps as JSON arrays | Simple to edit; parsed at load time; editable in-game via MapEditor |
| PokeAPI sprites | Free, reliable, all 151 available by Pokédex number |
| Web Audio API for SFX | No asset files needed; synthesized on the fly |
