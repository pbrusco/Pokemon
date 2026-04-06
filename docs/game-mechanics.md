# Game Mechanics

## Battle System

Battle logic lives entirely in `src/App.tsx` — in the `handleAttack()` and `handleEnemyTurn()` functions. There is no separate battle engine module.

### Turn Order

1. Player selects a move (phase `CHOOSING`).
2. `handleAttack(move)` executes the player's move (`PLAYER_ATTACK` phase).
3. After animations, `handleEnemyTurn()` runs the enemy's move (`ENEMY_ATTACK` phase).
4. Results are evaluated: faint, level up, catch, etc.
5. Returns to `CHOOSING` or exits battle.

The enemy always picks a move at random from its move list.

---

## Damage Formula

Implemented in `src/lib/damage.ts`.

### Gen I Formula

```
Damage = floor(((2 × Level × Critical / 5 + 2) × Power × A / D) / 50 + 2) × STAB × Type × Random
```

Where:
- **Level** — attacker's level
- **Critical** — 1 (normal) or 2 (critical hit)
- **Power** — base power of the move
- **A** — attacker's relevant stat (Attack for physical, Special for special moves)
- **D** — defender's relevant stat (Defense for physical, Special for special moves)
- **STAB** — 1.5 if move type matches attacker's type(s), else 1.0
- **Type** — type effectiveness multiplier (0, 0.25, 0.5, 1, 2, 4)
- **Random** — random integer 217–255 divided by 255

### Critical Hits

```typescript
critChance = attacker.baseStats.speed / 512  // capped at ~99.6%
isCritical = Math.random() < critChance
```

### Physical vs Special Split (Gen I)

Move type determines which stats are used:

| Category | Types |
|----------|-------|
| Physical | Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost |
| Special | Water, Grass, Fire, Ice, Electric, Psychic, Dragon |

### Stat Calculation

```typescript
// Attack, Defense, Speed, Special
calcStat(base, level) = floor((base * 2 * level) / 100) + 5

// HP (different formula)
calcHp(base, level) = floor((base * 2 * level) / 100) + level + 10
```

### Function Signature

```typescript
calculateDamage(attacker: Pokemon, defender: Pokemon, move: Move): DamageResult

interface DamageResult {
  damage: number
  isCritical: boolean
  effectiveness: number           // the raw multiplier (0.5, 1, 2, etc.)
  effectivenessLabel: string      // '¡Es muy eficaz!' | 'No es muy eficaz...' | etc.
}
```

---

## Type Effectiveness

Full Gen I chart implemented in `src/lib/damage.ts`. Key rules:

- Multipliers stack for dual-type defenders (e.g., Water move vs Water/Grass = 0.5 × 0.5 = 0.25)
- Ghost is immune to Normal and Fighting (0×)
- Electric is immune to Ground moves (0×)

```typescript
getTypeEffectiveness(moveType: string, defenderTypes: string[]): number
```

---

## Catch Rate

Calculated in `App.tsx` when a Pokeball is thrown:

```typescript
catchRate = 1 - (enemy.hp / enemy.maxHp) * 0.8   // ~20% minimum, 100% at 0 HP
caught = Math.random() < catchRate
```

A three-shake animation plays before the result is revealed. On success, the Pokemon is added to the party (if space) or PC.

---

## Status Effects

Status effects are stored on `Pokemon.status` and are applied by moves with `statusEffect` and `statusChance` fields.

| Status | Applied by | Battle effect |
|--------|-----------|---------------|
| `paralyzed` | Thundershock, Thunder Wave | Speed halved in stat calc |
| `sleep` | Sleep Powder | Cannot act each turn |
| `poison` | Poison Powder | Lose HP at end of each turn |
| `burn` | Ember | Lose HP + Attack halved |
| `frozen` | Blizzard, Ice Beam | Cannot act |
| `none` | — | Default, no effect |

---

## Leveling & Evolution

### EXP Gain

After winning a battle, the active Pokemon gains EXP equal to `enemy.level * 10` (simplified formula).

`expToNextLevel` starts at `level * level` and is recalculated after each level-up.

### Level Up

When `exp >= expToNextLevel`:
1. Level increments.
2. Stats are recalculated using `calcStat` / `calcHp`.
3. Any moves in `movesToLearn` for the new level are added to the move list (up to 4 moves).
4. `LEVEL_UP` battle phase triggers the level-up display.

### Evolution

Triggered when `level >= evolutionLevel` after a level-up:

1. Phase transitions to `EVOLVING`.
2. `baseStats`, `maxHp`, `hp`, `name`, and `sprite` are updated from the `EVOLUTIONS` table in `constants.ts`.
3. A LEVEL_UP sound plays and a message displays (e.g., "¡BULBASAUR está evolucionando en IVYSAUR!").

**Important:** Evolution requires updating `baseStats` and recalculating `maxHp`. Partial updates cause HP inconsistencies. The pattern in `App.tsx` updates all fields atomically.

---

## Movement System

Implemented in `src/hooks/usePlayerMovement.ts`.

### Self-Triggering Loop

```
keydown → keysRef.add(key)
       → handleMove()
            → sets isMoving = true
            → animates tile movement (100ms)
            → after 110ms: setIsMoving(false)

useEffect([isMoving]) → if (!isMoving && keysRef has key)
                      → handleMove() again
```

This produces continuous movement while a key is held, without polling.

### Collision Resolution

In order:
1. Check map boundaries (0–19 on each axis).
2. Check tile walkability (`tile.walkable === false`).
3. Check NPC/object collision.
4. If any fail → face the direction but do not move.
5. If all pass → update player position in store.

### Teleports

When the target tile contains a teleport entity:
- Wait 150ms for the tile step animation.
- Set `currentMap` to `entity.targetMap`.
- Set `playerPos` to `entity.targetPos`.
- Play a transition sound.

### Trainer Vision

When the player moves, all trainer NPCs in the current map check their vision cone:
- Trainers scan up to 3 tiles ahead in their facing direction.
- If the player is in that range, the trainer initiates dialogue → battle sequence.
- Defeated trainers (in `defeatedTrainers` store) are skipped.

---

## Blackout

When all Pokemon in the party have HP ≤ 0:
1. Phase transitions to `BLACKOUT`.
2. A fade-to-black animation plays with the message "¡Te has quedado sin POKÉMON!".
3. After 3 seconds, the player is teleported to `lastHealLocation.pos` on `lastHealLocation.map`.
4. Each team Pokemon is restored to `floor(maxHp / 2)` HP.
5. Phase returns to `EXPLORING`.

---

## Sound System

`src/lib/sounds.ts` exports a singleton `SoundManager`.

### SFX Keys

| Key | Triggered by |
|-----|-------------|
| `MOVE` | Player moves a tile |
| `SELECT` | Menu selection / dialogue dismiss |
| `BATTLE_START` | Battle transition |
| `HIT` | Attack lands |
| `FAINT` | Pokemon faints |
| `LEVEL_UP` | Level-up sequence |

```typescript
SoundManager.play('HIT');
SoundManager.playMusic('BATTLE');
SoundManager.stopMusic();
```

### Music Auto-Switching

In `App.tsx`, a `useEffect` watches `phase.type` and `currentMap`:
- `BATTLE` → plays `BATTLE` track
- `pokecenter` map → plays `POKECENTER` track
- `EXPLORING` (any other map) → plays `OVERWORLD` track
