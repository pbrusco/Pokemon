# Game Data Reference

All static game data lives in `src/constants.ts` and `src/data/worldConfig.ts`.

---

## Pokemon

### Base Stats (`BASE_STATS`)

All 151 Gen I Pokemon are present with their original base stats:

```typescript
interface BaseStats {
  hp: number
  attack: number
  defense: number
  special: number   // Gen I unified Special stat (not split into SpAtk/SpDef)
  speed: number
}
```

Keyed by lowercase ID with hyphens where needed:

```typescript
BASE_STATS['bulbasaur']   // { hp: 45, attack: 49, defense: 49, special: 65, speed: 45 }
BASE_STATS['nidoran-m']   // hyphenated IDs
BASE_STATS['mr-mime']
```

### Creating Pokemon (`makePokemon`)

**Always use `makePokemon()` — never construct Pokemon objects by hand.**

```typescript
function makePokemon(
  id: string,          // must match a key in BASE_STATS
  name: string,        // display name (all caps, in Spanish)
  level: number,
  type: string,        // primary type
  moves: Move[],
  spriteId?: number,   // PokeAPI Pokedex number for sprite URL
  extra?: Partial<Pokemon>  // optional overrides (types, evolutionLevel, etc.)
): Pokemon
```

Examples:

```typescript
// Single type
makePokemon('charmander', 'CHARMANDER', 5, 'fire', [MOVES.SCRATCH, MOVES.EMBER], 4, {
  evolutionLevel: 16,
  evolvesTo: 'charmeleon'
})

// Dual type
makePokemon('geodude', 'GEODUDE', 12, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 74, {
  types: ['rock', 'ground']
})
```

`makePokemon` automatically:
- Looks up `BASE_STATS[id]` and attaches it
- Calculates `maxHp` via `calcHp(baseStats.hp, level)`
- Sets `hp = maxHp`
- Calculates `expToNextLevel = level * level`
- Builds sprite URL: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{spriteId}.png`

### Starters

```typescript
STARTERS = [
  makePokemon('bulbasaur',  'BULBASAUR',  5, 'grass',  [...], 1,  { evolutionLevel: 16, evolvesTo: 'ivysaur'     })
  makePokemon('charmander', 'CHARMANDER', 5, 'fire',   [...], 4,  { evolutionLevel: 16, evolvesTo: 'charmeleon'  })
  makePokemon('squirtle',   'SQUIRTLE',   5, 'water',  [...], 7,  { evolutionLevel: 16, evolvesTo: 'wartortle'   })
]
```

### Evolutions (`EVOLUTIONS`)

```typescript
EVOLUTIONS['ivysaur']   = { name: 'IVYSAUR',   type: 'grass', spriteId: 2, evolvesTo: 'venusaur',    evolutionLevel: 32 }
EVOLUTIONS['charmeleon'] = { name: 'CHARMELEON', type: 'fire', spriteId: 5, evolvesTo: 'charizard',   evolutionLevel: 36 }
// ...etc
```

When a Pokemon evolves, these fields are merged into the existing Pokemon object along with recalculated `baseStats`, `maxHp`, and `hp`.

---

## Moves (`MOVES`)

```typescript
interface Move {
  name: string           // Display name (Spanish)
  type: string           // elemental type
  power: number          // base power (0 for status-only moves)
  accuracy: number       // 0–100
  statusEffect?: string  // 'paralyzed' | 'sleep' | 'poison' | 'burn' | 'frozen'
  statusChance?: number  // 0–100 percent chance to inflict
}
```

Currently implemented moves:

| Key | Name (ES) | Type | Power | Notes |
|-----|-----------|------|-------|-------|
| `TACKLE` | PLACAJE | Normal | 40 | |
| `SCRATCH` | ARAÑAZO | Normal | 40 | |
| `GROWL` | GRUÑIDO | Normal | 0 | Status only |
| `TAIL_WHIP` | LÁTIGO | Normal | 0 | Status only |
| `VINE_WHIP` | LÁTIGO CEPA | Grass | 45 | |
| `RAZOR_LEAF` | HOJA AFILADA | Grass | 55 | |
| `EMBER` | ASCUAS | Fire | 40 | 10% burn |
| `FLAMETHROWER` | LLAMARADA | Fire | 95 | 10% burn |
| `WATER_GUN` | PISTOLA AGUA | Water | 40 | |
| `BUBBLE_BEAM` | BURBUJA | Water | 65 | |
| `THUNDERSHOCK` | IMPACTRUENO | Electric | 40 | 10% paralysis |
| `THUNDER` | TRUENO | Electric | 110 | 10% paralysis |
| `PECK` | PICOTAZO | Flying | 35 | |
| `SLEEP_POWDER` | SOMNÍFERO | Grass | 0 | 75% sleep |
| `ROCK_THROW` | LANZARROCAS | Rock | 50 | |

---

## Items (`ITEMS_DATABASE`)

```typescript
interface Item {
  name: string
  description: string
  type: 'potion' | 'pokeball' | 'key_item'
  icon: string    // emoji
}
```

| ID | Name | Type | Effect |
|----|------|------|--------|
| `POTION` | Poción | potion | Restores 20 HP |
| `POKEBALL` | Pokeball | pokeball | Used to catch wild Pokemon |
| `OAK_PARCEL` | Paquete del Prof. Oak | key_item | Deliver to Oak for Pokedex |

---

## Wild Pokemon (`WILD_POKEMON_DATABASE`)

Per-map encounter tables. Each entry is a `Pokemon` instance created with `makePokemon`.

| Map Key | Pokemon |
|---------|---------|
| `ROUTE_1` | Pidgey, Rattata, Caterpie, Weedle, Spearow, Mankey, Pikachu |
| `VIRIDIAN_FOREST` | Caterpie, Weedle, Metapod, Pikachu |
| `ROUTE_3` | Spearow, Jigglypuff, Mankey, Nidoran-M, Nidoran-F |

Other maps (Pallet Town, Viridian City, etc.) have no wild encounters.

---

## Maps

All maps are 20×20 tile grids stored as `Tile[][]` JSON files in `src/data/maps/`.

```typescript
interface Tile {
  type: TileType
  walkable: boolean
}

type TileType =
  | 'grass' | 'water' | 'path' | 'wall'
  | 'door' | 'floor' | 'carpet' | 'table'
  | 'tree' | 'sign'
```

### Map IDs

| ID | File | Description |
|----|------|-------------|
| `PALLET_TOWN` | `pallet_town.json` | Starting town |
| `OAKS_LAB` | `oaks_lab.json` | Starter selection |
| `ROUTE_1` | `route_1.json` | First route |
| `VIRIDIAN_CITY` | `viridian_city.json` | Hub town |
| `POKECENTER` | `pokecenter.json` | Healing center |
| `POKEMART` | `pokemart.json` | Item shop |
| `VIRIDIAN_FOREST` | `viridian_forest.json` | Forest dungeon |
| `PEWTER_CITY` | `pewter_city.json` | First city with gym |
| `PEWTER_GYM` | `pewter_gym.json` | Brock's gym |
| `ROUTE_3` | `route_3.json` | Route to Mt. Moon |

---

## Pokedex List (`POKEMON_LIST`)

An array of all 151 Pokemon for the Pokedex UI:

```typescript
interface PokemonListEntry {
  id: number       // Pokedex number (1–151)
  name: string     // Display name
  sprite: string   // PokeAPI sprite URL
}
```

This list is separate from `BASE_STATS` — it only drives the Pokedex display screen, not battle data.

---

## NPCs & World Config (`src/data/worldConfig.ts`)

### `INITIAL_MAPS`

Maps all 10 map IDs to their imported `Tile[][]` grids.

### `generateWorldNPCs(hasParcel, hasPokedex, badges)`

Returns `Record<string, NPC[]>` — a map from map ID to NPC array.

NPC structure:

```typescript
interface NPC extends Entity {
  name: string
  dialogue: string[]      // Array of lines (shown one at a time)
  isTrainer?: boolean
  trainerTeam?: Pokemon[]
  isRival?: boolean
  questId?: string
}
```

Notable NPCs:
- **Professor Oak** — dialogue changes based on `storyStep`
- **Mom** — heals your team on talk
- **Nurse Joy** — heals your team + sets `lastHealLocation`
- **Pokemart Clerk** — gives Oak's Parcel or opens shop
- **Rival (Blue)** — trainer battle at Oak's lab
- **Brock** — gym leader trainer battle in Pewter Gym
- Various trainers on routes (Youngsters, Lasses, Bug Catchers)
