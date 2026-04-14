# Game Mechanics

## Battle System

Battle logic is split across two files:

- **`src/lib/battleEngine.ts`** — pure state machine. `stepBattle(state, action)` takes a `BattleState` and a `BattleAction` and returns `{ state: BattleState, effects: BattleEffect[] }`. No React, no timers.
- **`src/hooks/useBattleEngine.ts`** — React side. `dispatchBattle(action)` calls `stepBattle`, drains the returned effects (animations, sounds, logs), and transitions `GamePhase` accordingly.

### Turn Order

1. Player selects a move (phase `CHOOSING`).
2. `dispatchBattle({ type: 'ATTACK', move })` → `stepBattle` executes the player's move (`PLAYER_ATTACK`), then chains into `ENEMY_ATTACK` via a recursive `TICK`.
3. Animations and logs are replayed by `playBattleEffects()` in `useBattleEngine.ts`.
4. Results are evaluated: faint, level-up, catch, flee, etc.
5. Returns to `CHOOSING` or exits battle.

### Enemy AI

`selectTrainerMove(attacker, defender)` in `battleEngine.ts`:
- Scores all damaging moves by `power × typeEffectiveness`.
- 70% chance: uses the highest-scored move.
- 30% chance: picks randomly among damaging moves.
- Falls back to a random move if no damaging moves exist.

---

## PP Tracking

Each move has `pp` (current) and `maxPp` (max) fields on the `Move` type.

- **Deduction:** PP is decremented when a move is used (`battleEngine.ts`, ATTACK case).
- **Zero-PP moves:** Selecting a move with `pp === 0` is blocked by the engine (returns no state change).
- **UI:** The battle move selector shows `PP current/max` and greys out moves at 0 PP.
- **Restore:** `fullHeal()` in `healUtils.ts` restores `pp = maxPp` for all moves. Called on Pokécenter heal and blackout recovery.

### Struggle

When all moves have `pp === 0`, the move selector shows a **Forcejeo** button instead.

- Typeless (rendered as Normal), 50 base power, always hits.
- After dealing damage, the user takes `floor(damage / 4)` recoil (minimum 1).
- Defined as `STRUGGLE_MOVE` in `constants.ts`.

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
  effectiveness: number               // raw multiplier (0, 0.5, 1, 2, 4)
  effectivenessLabel: string | null   // 'super_effective' | 'not_very_effective' | 'no_effect' | null
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

Implemented in `battleEngine.ts` (CATCH action). Gen I two-step formula:

**Step 1 — Status pre-check (R1 0–255):**
- Sleep or Frozen: caught if `R1 < 25`
- Paralyzed, Burned, or Poisoned: caught if `R1 < 12`

**Step 2 — CatchV (only if Step 1 failed):**
```
catchV = floor(speciesCatchRate × (maxHp × 3 − hp × 2) / (maxHp × 3))
caught  = floor(random(0–255)) < catchV
```

`speciesCatchRate` comes from `Pokemon.catchRate` (defaults to 45 if absent).

---

## Status Effects

Status is stored on `Pokemon.status`. Applied by moves with `statusEffect` and `statusChance` fields.

| Status | In-battle effect | Overworld effect |
|--------|-----------------|-----------------|
| `paralyzed` | 25% chance to skip turn; Speed halved in stat calc | — |
| `sleep` | Cannot act (70% chance to stay asleep each turn); wakes randomly | — |
| `poison` | Lose HP at end of each turn | Lose 1 HP every 4 steps |
| `burn` | Lose HP at end of each turn; Attack halved | — |
| `frozen` | Cannot act | — |
| `none` | Default, no effect | — |

---

## Overworld Poison

When the lead Pokémon has `status === 'poison'`:
- Takes 1 HP damage every 4 steps (implemented in `useMovementEngine.ts`).
- A screen shake plays on each damage tick.
- If the lead Pokémon's HP reaches 0, it faints.
- If all Pokémon faint from overworld poison, a **blackout** triggers (same flow as in-battle blackout).
- Poison is cleared by `fullHeal()` at any Pokécenter.

---

## Leveling & Evolution

### EXP Gain

After winning a battle:
```
expGain = floor(enemy.level × 25 × (isTrainerBattle ? 1.5 : 1))
```

`expToNextLevel` is calculated from the Pokémon's `growthRate` using `expForLevel()` in `constants.ts`.

### Level Up

When `exp >= expToNextLevel`:
1. Level increments; excess EXP carries over.
2. Stats are recalculated using `calcStat` / `calcHp`.
3. Any moves in `movesToLearn` for the new level are added (up to 4; oldest is replaced if full).
4. `LEVEL_UP` battle phase triggers the level-up display.

### Evolution

Triggered when `level >= evolutionLevel` after a level-up:

1. Phase transitions to `EVOLVING`.
2. `baseStats`, `maxHp`, `hp`, `name`, and `sprite` are updated from the `EVOLUTIONS` table in `constants.ts`.

**Important:** Evolution recomputes `maxHp` from the new `baseStats` — never copy HP values from the pre-evolution form.

---

## Movement System

Implemented in `src/hooks/useMovementEngine.ts`. Input is handled by `src/hooks/useInputHandler.ts`.

### Input Loop

```
keydown → useInputHandler dispatches direction
       → handleMove(dir) called
            → collision checks
            → setIsMoving(true), setPlayerPos(nextPos)
            → after 110ms: setIsMoving(false)
```

`useInputHandler` re-triggers movement while a key is held.

### Collision Resolution

In order:
1. Check map boundaries (0 to GRID_SIZE−1 on each axis).
2. Check tile walkability (`tile.walkable === false`).
3. Check NPC/object collision.
4. If any fail → face the direction but do not move.
5. If all pass → update player position.

### Warps

When the target tile has a matching entry in `mapData.warps`:
- `setCurrentMap`, `setPlayerPos`, optionally `setDirection` are applied after 200ms.
- A `SELECT` sound plays.

### Trainer Vision

On each move, all undefeated trainer NPCs on the current map scan up to 3 tiles in their facing direction. If the player enters that range, a trainer cutscene triggers.

---

## Blackout

When all Pokémon have HP 0 (in battle or overworld poison):
1. Phase transitions to `BLACKOUT`.
2. After 1.2 s, player is teleported to `lastHealLocation.map` / `lastHealLocation.pos`.
3. After 2.4 s, phase transitions to `HEALING`; `fullHeal()` is applied to the whole team (full HP, status cleared, PP restored).
4. After 4 s, phase returns to `EXPLORING` with a dialogue message.

---

## Sound System

`src/lib/sounds.ts` exports a singleton `soundManager`.

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
soundManager.play('HIT');
```

### Music Auto-Switching

A `useEffect` in App.tsx watches `phase.type` and `currentMap`:
- `BATTLE` → plays `BATTLE` track
- Pokécenter map → plays `POKECENTER` track
- `EXPLORING` (any other map) → plays `OVERWORLD` track
