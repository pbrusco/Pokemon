# FEATURES.md — Implemented Feature Catalog

## Maps & World

| Feature | Details |
|---|---|
| **Kanto overworld** | Stitched from 38 outdoor zones (408×400 tiles) via FireRed connection graph |
| **Indoor maps** | 96 interiors (PCs, Marts, gyms, caves, towers, Silph Co., SS Anne, E4 rooms) |
| **Warps** | Round-trip auto-pinned; `worldIntegrity` test enforces 0 orphan doors/warps |
| **Tile types** | Grass, water, cave, sand, door, sign, boulder, counter, warp_pad, cut_tree, ledge |
| **Ledge jumping** | FireRed passable-direction metatiles detected via `blockFrom` |
| **Walkability** | From FireRed collision bits; `behaviorMappings.ts` for all behavior→tile conversions |

## Progression & Story

| Feature | Details |
|---|---|
| **Story flow** | Bedroom start → Oak stops you → starter pick → rival battle → parcel → Pokédex → free roam |
| **8 Gym Leaders** | Brock, Misty, Lt. Surge, Erika, Koga, Sabrina, Blaine, Giovanni — all with canonical parties |
| **Badge rewards** | Each badge unlocks HMs and gated areas (Route 23, Cerulean Cave) |
| **Elite Four + Champion** | Lorelei → Bruno → Agatha → Lance → Champion Rival → Hall of Fame |
| **Blackout / Heal** | Full team faint → warp to last heal location, restore team to 50% |

## Battle System

| Feature | Details |
|---|---|
| **Gen I damage formula** | Physical/Special split by type, STAB, type chart, random factor 217–255 |
| **Critical hits** | Base speed / 512 (×8 for high-crit moves); crits ignore negative attacker / positive defender boosts |
| **Badge boost glitch** | Boulder Badge applies +12.5% per stat-change stack |
| **Status effects** | Sleep (wake on hit), burn (1/16 per turn), freeze (thaw on fire hit), paralysis (speed ÷4, 25% full para), confusion (50% self-hit), poison (1/16 per turn), bad poison (TOXIC escalates), leech seed (drain per turn) |
| **Move effects** | OHKO (level-based accuracy), partial trapping (Wrap/Bind/Fire Spin), Drain, Recoil, Rampage (Thrash/Petal Dance → confuse), Bide (2-turn absorb → unleash), Hyper Beam recharge, two-turn charge (Solar Beam), stat boosts, status applications |
| **Fainting** | Enemy faint → EXP; Player faint → forced switch or blackout if no survivors |
| **Evolution** | Level-up based; silhouette morph animation (3.7s) |
| **Move learnsets** | All 151 species have `LEARNSET_DATABASE`; trainers & wild get 4 most-recent level-up moves |
| **Stone evolution** | Fire/Water/Thunder/Leaf/Moon stones as inventory items + `STONE_EVOLUTIONS` table |
| **Pokémon cries** | Synthesized species-specific calls on battle start |
| **Low-HP alarm** | Alternating beep every 1.5s when lead ≤20% HP |

## Encounters

| Feature | Details |
|---|---|
| **Grass encounters** | Per-zone encounter rates from FireRed data; level-scaled species |
| **Water encounters** | Surf-based encounters from FireRed water tables |
| **Fishing** | Old/Good/Super Rod items; 11 zone-specific fishing encounter tables |
| **Trainer battles** | 3-tile vision cone in facing direction; spotted-by trainer cutscene |
| **Legendaries** | Articuno (Seafoam B4F), Zapdos (Power Plant), Moltres (Victory Road 2F), Mewtwo (Cerulean Cave B1F) |
| **Snorlax** | Route 12 & 16; requires PokéFlute to wake; clears from overworld on defeat |

## Items & Economy

| Feature | Details |
|---|---|
| **Shop system** | Per-city PokéMart inventories (Viridian → Cinnabar); Celadon Mart TM floors (2F–5F) |
| **HMs** | Cut, Fly, Surf, Strength, Flash — all obtainable as items; field-move prompts |
| **TMs** | 12 teachable TMs (Ice Beam, Thunderbolt, Earthquake, Psychic, Fire Blast, etc.) |
| **Healing items** | Potion → Super → Hyper → Max → Full Restore |
| **Status items** | Antidote, Awakening, Burn Heal, Ice Heal, Paralyze Heal, Full Heal |
| **Revives** | Revive (50% HP), Max Revive (100% HP) |
| **Balls** | Poké Ball, Master Ball (guaranteed catch) |
| **Key items** | Oak's Parcel, Town Map, Silph Scope, Lift Key, Poké Flute, SS Ticket, Escape Rope, Bike, Fishing Rods |
| **Money** | Earned from trainer battles; spent in shops |

## UI & Overworld

| Feature | Details |
|---|---|
| **Canvas renderer** | Metatile composer with palette flips, multi-tileset support |
| **Mini-map** | Corner overview of current zone |
| **NPC name tags** | Proximity-based fade-in (≤3 tiles); silent for generic citizens |
| **Main menu** | Pokédex, Mochila, Equipo, Guardar, Config |
| **Party screen** | FRLG-style cards with HP bars, status badges |
| **Pokédex** | Detail panel with seen/caught states |
| **Dialogue** | Typewriter effect, page chunking, speaker parsing (`"NAME: text"`), yes/no confirm |
| **Battle HUD** | FRLG-style HP bars, status badges, stat boost indicators, trainer ball strip, EXP bar |
| **Move selection** | 2×2 grid with type badge + PP strip |
| **Mobile controls** | D-pad, A/B buttons, START/SELECT |
| **Bike** | B toggle, 45% faster movement (0.06s vs 0.11s), bicycle music |
| **Transitions** | Warp flash (80ms), battle intro curtain, evolution silhouette morph, trainer exit slide |
| **Screen effects** | Level-up flash, evolution pulse, wild faint spiral, blackout/heal overlays, Flash cave darkness |

## Audio

| Feature | Details |
|---|---|
| **Music** | Per-map overworld tracks + battle themes + jingles (heal, level-up, evolution) |
| **SFX** | 30+ synthesized effects: menu, dialog, bump, hit, crit, miss, faint, heal, warp, catches |
| **Pokémon cries** | Dex-number-derived frequency sweeps + noise |

## Data Pipeline

| Feature | Details |
|---|---|
| **FireRed extraction** | 743 trainers, 639 parties, 358 maps of NPCs, 168 maps of signs, 124 encounter tables, 308 items |
| **Map stitching** | BFS walk of connection graph from Pallet Town; multi-zone bridge with zone offsets |
| **Auto-generation** | `firered/indoorMaps.generated.ts`, `mapIds.generated.ts`, `kantoZoneOffsets.generated.ts` |
