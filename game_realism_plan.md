# Game Realism Plan — Pokémon Red Faithfulness

**Goal:** Systematically close the gap between this implementation and the original Pokémon Red,
using the pokered disassembly as the single authoritative source of truth.

Reference: https://github.com/pret/pokered

---

## Current State (baseline)

| Category | Implemented | Gen I Total | Gap |
|---|---|---|---|
| Indoor maps (registered) | 19 | ~150+ | ~130 missing |
| Wild encounter zones | 13 | ~50 | ~37 missing |
| Moves | 19 | 165 | 146 missing |
| Trainers | 17 | 400+ | 383+ missing |
| Overworld items (ball pickups) | ~22 | 150+ | ~130 missing |
| Pokédex | 151 | 151 | complete |
| Gyms playable | 3 (Brock, Misty, Lt. Surge) | 8 | 5 missing |
| Story flags | 6 booleans + 1 enum | many | partial |

---

## Phase 1 — Validation Infrastructure (do this first)

Before filling content, build the measurement tooling. You can't know what's missing
without a systematic count.

### 1A. Parse pokered object files into a richer metadata JSON

**pokered source files:**
- `data/maps/objects/*.asm` — per-map: NPC count, item ball count, warp count, sign count, trainer count
- `data/wild/landmon.asm` — land encounter species + levels per route
- `data/trainers.asm` — every trainer's class + full Pokémon team

**Action:** Write `scripts/extract-pokered-metadata.mjs`.
- Clone pokered next to this repo: `git clone https://github.com/pret/pokered ../pokered`
- Parse each `data/maps/objects/<MAP>.asm` using regex on `object`, `item`, `warp`, `sign` directives
- Output an expanded `src/data/reference/pokered_metadata.json`:

```json
{
  "ROUTE_1": {
    "npcs": 2,
    "signs": 1,
    "warps": 0,
    "items": 1,
    "trainers": 0,
    "wildLand": [
      { "species": "PIDGEY",   "minLevel": 3, "maxLevel": 5 },
      { "species": "RATTATA",  "minLevel": 3, "maxLevel": 5 }
    ]
  }
}
```

### 1B. Expand worldValidator.ts with new check categories

Add to `validateWorld()`:

- **Item count faithfulness** — compare `buildItemDatabase` output (ball-type items) per zone against `meta.items`
- **Trainer count faithfulness** — compare `buildNPCDatabase` trainer entries per zone against `meta.trainers`
- **Wild species faithfulness** — compare `WILD_POKEMON_DATABASE` species per zone against `meta.wildLand` species list (not exact slots, just presence)

The existing NPC/sign pattern in `worldValidator.ts` is the template — replicate it for items and trainers.

### 1C. Extend worldIntegrity.test.ts

The test already calls `validateWorld()` and asserts zero issues. Once the new checks are added,
the test will surface every gap automatically as a failing assertion. This makes the content work
in Phase 2 test-driven: add content → test passes.

---

## Phase 2 — Map Completeness

Maps are the container for everything else. Fill these in priority order (story progression first).

### Missing gyms (blocks story progression)

| Gym | Leader | Badge | HM Gate |
|---|---|---|---|
| Celadon Gym | Erika | Rainbow | STRENGTH |
| Fuchsia Gym | Koga | Soul | SURF |
| Saffron Gym | Sabrina | Marsh | — |
| Cinnabar Gym | Blaine | Volcano | — |
| Viridian Gym | Giovanni | Earth | — |

Each gym needs: map JSON → register in `index.ts` → warp from overworld → gym leader trainer in `npcDatabase.ts` → badge grant in `useInteractionEngine.ts`.

**pokered reference:** `maps/CELADON_GYM.blk`, `data/maps/objects/CELADON_GYM.asm`

### Missing dungeons (story-blocking or Pokédex-gating)

| Location | Floors | Required for |
|---|---|---|
| Pokémon Tower 4–7F | 4 floors | Silph Scope + Lavender story |
| Rocket Hideout | 4F | Silph Scope key item |
| Silph Co | 11F | Master Ball + Saffron story |
| Safari Zone + Warden | 4 areas | HM SURF (from warden) |
| Cerulean Cave | 3F | Post-game Mewtwo |
| Victory Road | 3F | Route to Elite Four |
| Pokémon Mansion | 4F | Cinnabar Gym key |
| Seafoam Islands | 4F | Articuno + SURF route |
| Power Plant | 1F | Zapdos |

### Missing interior buildings (NPCs, items, story)

- Celadon Dept Store (6F) — TM shop, Eevee
- Game Corner + prize corner
- SS Anne (multi-floor) — HM CUT source
- Copycat's House (Saffron)
- Pokémon Fan Club (Vermilion) — Old Rod
- Dojo (Saffron) — HM FIGHTING
- Cinnabar Lab — fossil revival
- Safari Warden's house
- Lavender Name Rater's house

---

## Phase 3 — NPC & Trainer Completeness

### 3A. Trainers on routes

Every route in Gen I has trainers with specific teams. Currently only 17 trainers exist.
The full game has 400+.

**Process per route:**
1. Read `data/maps/objects/ROUTE_N.asm` → identify `object SPRITE_<TRAINER_CLASS>, ...` lines
2. Read `data/trainers.asm` → look up that trainer's team by class + index
3. Add to `npcDatabase.ts` with correct position, direction, team

Priority: Routes 3–25 (in story order). Route 3 (Brock→Cerulean) and Route 24/25 (Cerulean→Bill) have the most trainers players encounter first.

**pokered reference:** `data/trainers.asm` — each `db TRAINER_<CLASS>_1` block lists the full team.

### 3B. Gym trainer teams

Each gym has 4–7 trainers before the leader. None are currently implemented except the leaders.

### 3C. NPC dialogue fidelity

Current NPCs have placeholder dialogue. Pokered has the exact Spanish-localizable strings in
`data/text/<MAP>_text.asm`. Dialogue is in English in pokered — translate to Spanish to match
the game's language requirement.

---

## Phase 4 — Item Ball Completeness

Gen I has ~100 item balls placed on the overworld/dungeons. Currently ~22 are implemented.

**pokered reference:** `data/maps/objects/<MAP>.asm` — lines like `item X, Y, ITEM_NAME`

**Process:**
1. Script extracts all `item X, Y, ITEM_NAME` entries from pokered objects
2. Cross-reference against `buildItemDatabase` in `npcDatabase.ts`
3. Add missing items with correct local-to-world coordinates using the `w()` helper

**Priority items** (early game, high player expectation):
- Route 1: Potion (at ~13,8)
- Route 2: Antidote, Potion
- Viridian Forest: Antidote, Poke Ball
- Mt. Moon: Escape Rope, Potion, Rare Candy, Moon Stone (×2), TM01 (Mega Punch), TM12 (Water Gun)
- Route 24: Nugget (after Nugget Bridge)

---

## Phase 5 — Wild Encounter Completeness

### 5A. Missing encounter zones

Routes 7, 8, 11–25 have no wild data. Safari Zone, Pokémon Mansion, Cerulean Cave,
Power Plant, Victory Road, Seafoam Islands also have none.

**pokered reference:** `data/wild/landmon.asm` — `db ENCOUNTER_RATE` + 10 slots of `db LEVEL, SPECIES`

**Format to add in constants.ts:**
```typescript
ROUTE_11: [
  makePokemon('ekans',    'EKANS',    12, 'poison',  [...]),  // Red version
  makePokemon('spearow',  'SPEAROW',  13, 'normal/flying', [...]),
  ...
]
```

### 5B. Encounter rate accuracy

Current rates (10, 16, 8 for overworld/forest/cave) are approximations.
Pokered stores exact rates per map (1–255). Use those exact values in `WILD_ENCOUNTER_RATES`.

### 5C. Fishing encounters (future)

Good Rod / Super Rod encounters use separate tables (`data/wild/watermon.asm`).
Not a priority until fishing items are implemented.

---

## Phase 6 — Move Pool Completeness

19 moves implemented out of 165. Missing categories entirely:

| Category | Examples | Count |
|---|---|---|
| Status (inflict) | Thunder Wave, Toxic, Confuse Ray, Leech Seed | ~20 |
| Status (self) | Swords Dance, Agility, Amnesia, Growth | ~15 |
| Recovery | Recover, Rest, Softboiled | ~8 |
| Stat-lowering | Growl variants, Tail Whip, Screech | ~10 |
| Multi-hit | Double Kick, Fury Attack, Pin Missile | ~8 |
| OHKO | Fissure, Guillotine, Horn Drill | 3 |
| Recharge | Hyper Beam, Sky Attack | 2 |
| Key damaging | Earthquake, Blizzard, Psychic, Surf | ~40 |

**pokered reference:** `data/moves/moves.asm` — each move has: power, type, accuracy, PP, effect ID.
Effect IDs map to `engine/battle/effects.asm`.

**Priority:** Moves needed for Gym Leader teams first (Misty uses Water Gun/Bubble — done;
Erika needs Mega Drain, Petal Dance; Koga needs Toxic, Smokescreen, etc.)

---

## Phase 7 — Story & Key Item Gates

### 7A. Expand storyStep

Current: `'START' | 'OAK_STOPPED' | 'IN_LAB' | 'PICKED_STARTER' | 'RIVAL_BATTLE' | 'EXPLORING'`

The full story needs checkpoints for:
- Brock defeated → CUT usable
- SS Anne visited → HM CUT obtained
- Misty defeated → SURF unlocked path
- Vermilion cleared → Thunder Badge (speed bonus)
- Silph Co cleared → Master Ball obtained
- Each Pokémon Tower floor cleared

### 7B. Missing key item flags

Add to store state:
- `hasCut: boolean` — enables CUT on trees
- `hasSurf: boolean` — enables water navigation
- `hasFlash: boolean` — Rock Tunnel shortcut
- `hasOldRod / goodRod / superRod` — fishing
- `masterBall: boolean`
- `hasLiftKey: boolean` — Silph Co elevator
- `hasBikeVoucher: boolean` — Cerulean → Bike Shop
- `badges: string[]` — already exists, expand usage

### 7C. Rival encounters (4 post-intro battles)

Currently only the initial rival battle is implemented. Full game has:
- Route 22 (after leaving Pallet — pre-Boulder Badge)
- SS Anne
- Silph Co
- Victory Road

---

## Phase 8 — Battle Mechanics Gap

From the TODO and current implementation:

| Mechanic | Status |
|---|---|
| Freeze status | Not implemented |
| Paralysis speed reduction | Not implemented |
| Substitute | Not implemented |
| Leech Seed | Not implemented |
| Multi-turn moves (Fly, Dig) | Not implemented |
| Hyper Beam recharge | Not implemented |
| Thrash/Petal Dance lock | Not implemented |
| Stat boost text feedback | Not implemented |
| Badge stat boosts (Gen I glitch faithful) | Partial |

---

## Execution Order (recommended)

1. **Phase 1** (validation infra) — enables all other phases to be test-driven
2. **Phase 2** — gyms first (they gate story progression for players)
3. **Phase 3A** — route trainers (players notice empty routes immediately)
4. **Phase 4** — item balls (players explore expecting to find things)
5. **Phase 5A** — wild encounter zones (players on routes 11–25 get nothing)
6. **Phase 6** — moves (needed to make trainer teams non-trivial)
7. **Phase 7** — story gates (needed once gyms 4–8 exist)
8. **Phase 8** — battle mechanics (polish pass)
9. **Phase 3B/3C** — gym trainers + dialogue fidelity (final polish)

---

## Pokered Quick Reference

```
pokered/
  data/maps/objects/     ← NPC positions, item positions, warps per map
  data/wild/
    landmon.asm          ← land encounter tables (species, levels, rates)
    watermon.asm         ← fishing encounter tables
  data/trainers.asm      ← all trainer teams (class + Pokémon)
  data/moves/moves.asm   ← all 165 moves (power, type, accuracy, PP, effect)
  data/items/names.asm   ← item ID → name
  maps/*.blk             ← tile layout (already consumed by stitch-kanto.mjs)
  data/text/             ← all NPC dialogue (English, translate to Spanish)
```

Clone alongside this repo and point scripts at `../pokered`.

---

## Success Criteria

A playable end-to-end run of the main story is possible when:
- [ ] All 8 gyms are enterable and completable
- [ ] Rival encounters trigger at correct story checkpoints
- [ ] HM gates (CUT, SURF, STRENGTH) block/unblock correctly
- [ ] Pokémon League (Victory Road → Elite Four → Champion) is reachable
- [ ] Wild Pokémon exist on every route the player traverses
- [ ] Key items (Silph Scope, Poké Flute) are obtainable in-world
- [ ] `worldValidator` reports 0 issues on all implemented maps
