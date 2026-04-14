# Adding Content Guide

This guide is for developers and AI agents extending the game with new Pokemon, moves, maps, or NPCs.

---

## Adding a New Move

Edit `src/constants.ts`, inside the `MOVES` object, using the `move()` helper (it sets `pp = maxPp` automatically):

```typescript
MOVE_NAME: move(
  'NOMBRE EN ESPAÑOL',  // displayed in battle UI
  'fire',               // elemental type
  60,                   // base power (0 for status-only)
  100,                  // accuracy 0–100
  15,                   // maxPp
  {
    // optional fields:
    statusEffect: 'burn',   // 'paralyzed' | 'sleep' | 'poison' | 'burn' | 'frozen'
    statusChance: 10,       // percent chance (0–100)
    statChange: { target: 'enemy', stat: 'attack', stages: -1 },
    highCrit: true,
  }
)
```

Then import and use `MOVES.MOVE_NAME` wherever Pokémon moves are defined.

**Naming convention:** All move names in the codebase are in Spanish. Use the official Spanish localization names.

---

## Adding a New Pokemon

### 1. Verify base stats exist

Check that `BASE_STATS` in `src/constants.ts` has an entry for the Pokemon's ID:

```typescript
BASE_STATS['geodude'] // should exist
```

If missing, add it following the same stat structure as nearby entries.

### 2. Use `makePokemon()` wherever the Pokemon appears

```typescript
// Wild encounter or trainer team
makePokemon(
  'geodude',           // BASE_STATS key (lowercase, hyphens for special chars)
  'GEODUDE',           // display name (all caps)
  12,                  // level
  'rock',              // primary type
  [MOVES.TACKLE, MOVES.ROCK_THROW],
  74,                  // PokeAPI sprite ID (Pokedex number)
  {
    types: ['rock', 'ground']  // optional: dual type
  }
)
```

### 3. Add to wild encounters (if wild)

In `WILD_POKEMON_DATABASE` in `src/constants.ts`, add the new Pokemon to the appropriate map's array:

```typescript
WILD_POKEMON_DATABASE = {
  ROUTE_1: [
    // existing entries...
    makePokemon('ekans', 'EKANS', 5, 'poison', [MOVES.TACKLE], 23)
  ]
}
```

### 4. Add evolution data (if evolves)

In `STARTERS` or the trainer/wild definition, add evolution fields to `extra`:

```typescript
makePokemon('abra', 'ABRA', 8, 'psychic', [MOVES.TACKLE], 63, {
  evolutionLevel: 16,
  evolvesTo: 'kadabra'
})
```

Add the evolved form to `EVOLUTIONS`:

```typescript
EVOLUTIONS['kadabra'] = {
  name: 'KADABRA',
  type: 'psychic',
  spriteId: 64,
  evolvesTo: 'alakazam',
  evolutionLevel: 36
}
```

---

## Adding a New NPC

Edit `src/data/npcDatabase.ts` inside `buildNPCDatabase()`, in the appropriate map's NPC array.

`buildNPCDatabase` receives `(playerTeam, hasParcel, hasPokedex, badges)` so NPCs can have dynamic behavior based on game state.

### Regular NPC

```typescript
{
  id: 'pallet_girl',             // unique ID across all maps
  name: 'CHICA',
  type: 'npc',
  position: { x: 8, y: 12 },
  direction: 'down',
  dialogue: [
    '¡Hola! ¿Vas a ser entrenador POKÉMON?',
    '¡Suerte en tu viaje!'
  ]
}
```

### Trainer NPC

```typescript
{
  id: 'youngster_chano',
  name: 'JOVEN CHANO',
  type: 'npc',
  position: { x: 12, y: 10 },
  direction: 'left',
  dialogue: ['¡Eh! ¡Mis POKÉMON son los mejores!'],
  isTrainer: true,
  trainerTeam: [
    makePokemon('rattata', 'RATTATA', 4, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19)
  ]
}
```

After defeating a trainer, their ID is added to `defeatedTrainers` in the store, and they will no longer initiate battles.

### Dynamic Dialogue

You can make NPC dialogue conditional on game state directly in the function body:

```typescript
{
  id: 'oak',
  // ...
  dialogue: hasPokedex
    ? ['Has registrado varios POKÉMON. ¡Sigue así!']
    : ['Necesito que completes la POKÉDEX.']
}
```

### Heal NPCs

To make an NPC heal the player's team (like a Nurse Joy or Mom), add `onInteract: 'heal'` to the NPC definition. The interaction engine handles the rest.

```typescript
{
  id: 'nurse_joy',
  name: 'ENFERMERA JOY',
  onInteract: 'heal',
  // ...
}
```

---

## Adding a New Map

### 1. Create the JSON file

Create `src/data/maps/new_map.json` as a 20×20 array of tiles:

```json
[
  [
    { "type": "wall", "walkable": false },
    { "type": "floor", "walkable": true },
    ...
  ],
  ...
]
```

You can also use the **MapEditor** in-game (press Escape → Editor) to paint tiles and copy the result.

Tile types and their default walkability:

| Type | Walkable | Used for |
|------|----------|---------|
| `grass` | true | Outdoor terrain (encounter zones) |
| `path` | true | Roads, dirt paths |
| `floor` | true | Indoor floors |
| `carpet` | true | Indoor carpeted areas |
| `door` | true | Doorways |
| `wall` | false | Exterior walls |
| `table` | false | Indoor furniture |
| `tree` | false | Outdoor trees/foliage |
| `water` | false | Water bodies |
| `sign` | true | Interactable signs |

### 2. Export the map

In `src/data/maps/index.ts`, add the import and export:

```typescript
import NEW_MAP from './new_map.json';

export {
  // existing maps...
  NEW_MAP
};
```

### 3. Register in worldConfig

In `src/data/worldConfig.ts`, add to `INITIAL_MAPS`:

```typescript
export const INITIAL_MAPS: Record<string, Tile[][]> = {
  // existing...
  NEW_MAP: NEW_MAP as Tile[][],
}
```

### 4. Add teleports

Teleports are defined in the `teleports` record inside `worldConfig.ts` or the store. Each teleport entity specifies:

```typescript
{
  id: 'pallet_to_route1',
  type: 'teleport',
  position: { x: 10, y: 0 },   // tile where stepping triggers teleport
  direction: 'up',
  targetMap: 'ROUTE_1',
  targetPos: { x: 10, y: 19 }  // arrival position in target map
}
```

Add a corresponding return teleport in the destination map.

### 5. Add NPCs and wild encounters

- Add NPCs to `buildNPCDatabase()` in `src/data/npcDatabase.ts` under the new map key.
- Add wild Pokemon to `WILD_POKEMON_DATABASE` in `src/constants.ts` under the same key (if the map has grass encounters).

---

## Pitfalls to Avoid

1. **Never hardcode HP values.** Always use `makePokemon()` — it auto-calculates `maxHp` and `hp`.

2. **Never call side effects inside state updaters.** Compute data synchronously, then call setters in sequence outside the updater:
   ```typescript
   // WRONG
   setPlayerTeam(prev => {
     setTimeout(() => setPhase(EXPLORING), 1000); // can fire twice!
     return newTeam;
   });

   // CORRECT
   const newTeam = [...gameState.current.playerTeam];
   setPlayerTeam(newTeam);
   setTimeout(() => setPhase(EXPLORING), 1000);
   ```

3. **Read deferred state from `useGameStore.getState()`, not from React closures.** Any code that runs inside a `setTimeout` callback must call `useGameStore.getState()` to get fresh state — never capture hook parameters or store references in closures, as they will be stale:
   ```typescript
   // CORRECT
   setTimeout(() => {
     const fs = useGameStore.getState();
     fs.setPhase(EXPLORING);
   }, 1000);
   ```

4. **All in-game text must be in Spanish.** Battle logs, dialogues, UI labels, move names.

5. **Sprite IDs are PokeAPI Pokedex numbers**, not array indices. Bulbasaur = 1, Ivysaur = 2, etc.

6. **NPC IDs must be globally unique** across all maps, since `defeatedTrainers` is a flat array of IDs.

7. **Map coordinates start at (0,0) top-left**, with x increasing right and y increasing down.
