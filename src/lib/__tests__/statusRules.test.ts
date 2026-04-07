/**
 * statusRules.test.ts — Gen I status and volatile rules audit
 *
 * Validates edge cases in status/turn behaviour using the pure battleEngine.
 * Each test pins a specific Gen I rule and will catch regressions if the
 * engine behaviour diverges from it.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stepBattle, createBattleState } from '../battleEngine';
import type { BattleState } from '../battleEngine';
import type { Pokemon, Move } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMove(overrides: Partial<Move> = {}): Move {
  return { name: 'TACKLE', type: 'normal', power: 40, accuracy: 100, pp: 10, maxPp: 10, ...overrides };
}

function makePkmn(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: 'pikachu', name: 'PIKACHU', level: 10,
    hp: 23, maxHp: 23,
    type: 'electric',
    baseStats: { hp: 35, attack: 55, defense: 30, special: 50, speed: 90 },
    moves: [makeMove()],
    sprite: '', status: 'none', exp: 0, expToNextLevel: 1000,
    ...overrides,
  };
}

function makeState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    ...createBattleState([makePkmn()], makePkmn({ name: 'RATTATA', id: 'rattata', type: 'normal',
      baseStats: { hp: 30, attack: 56, defense: 35, special: 25, speed: 72 } })),
    ...overrides,
  };
}

function getLogs(effects: { type: string; payload?: string | number }[]): string[] {
  return effects.filter(e => e.type === 'log').map(e => e.payload as string);
}

let randomSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => { randomSpy = vi.spyOn(Math, 'random'); });
afterEach(() => { randomSpy.mockRestore(); });

// ─── Sleep ────────────────────────────────────────────────────────────────────

describe('Sleep', () => {
  it('sleeping Pokemon skips its attack turn (random > 0.3 → stays asleep)', () => {
    // wakeUp = Math.random() > 0.3 ? false : true → with 0.9 stays asleep
    randomSpy.mockReturnValue(0.9);

    const sleepingPlayer = makePkmn({ status: 'sleep' });
    const state = createBattleState([sleepingPlayer], makePkmn({ moves: [makeMove({ power: 10 })] }));
    const move = makeMove();
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(getLogs(result.effects).some(l => l.includes('dormido'))).toBe(true);
    // Enemy HP should be unchanged — sleep skipped the attack
    expect(result.state.enemyPokemon.hp).toBe(state.enemyPokemon.hp);
  });

  it('sleeping Pokemon wakes and acts on same turn (random <= 0.3 → wakes up)', () => {
    // wakeUp = Math.random() > 0.3 ? false : true → with 0.1, wakes up then attacks
    randomSpy.mockReturnValue(0.1);

    const sleepingPlayer = makePkmn({ status: 'sleep' });
    const enemy = makePkmn({ name: 'RATTATA', moves: [makeMove({ power: 5 })] });
    const state = createBattleState([sleepingPlayer], enemy);
    const move = makeMove({ power: 40 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(getLogs(result.effects).some(l => l.includes('despertado'))).toBe(true);
    // After waking, attack proceeds — enemy HP should drop
    expect(result.state.enemyPokemon.hp).toBeLessThan(state.enemyPokemon.hp);
  });

  it('sleep clears on the sleeping Pokemon when it wakes', () => {
    randomSpy.mockReturnValue(0.1); // wakes up

    const sleepingPlayer = makePkmn({ status: 'sleep' });
    const state = createBattleState([sleepingPlayer], makePkmn({ moves: [makeMove({ power: 5 })] }));
    const move = makeMove();
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    // Status should be cleared (woke up)
    expect(result.state.playerTeam[0].status).toBe('none');
  });

  it('enemy sleep: enemy stays asleep (random > 0.3)', () => {
    randomSpy.mockReturnValue(0.9);

    const sleepingEnemy = makePkmn({ name: 'RATTATA', status: 'sleep', moves: [makeMove({ power: 40 })] });
    const state: BattleState = {
      ...createBattleState([makePkmn()], sleepingEnemy),
      phase: 'ENEMY_ATTACK',
    };

    const result = stepBattle(state, { type: 'TICK' });

    expect(getLogs(result.effects).some(l => l.includes('dormido'))).toBe(true);
    // Player HP unchanged
    expect(result.state.playerTeam[0].hp).toBe(state.playerTeam[0].hp);
    expect(result.state.phase).toBe('CHOOSING');
  });

  it('enemy sleep: enemy wakes and attacks (random <= 0.3)', () => {
    randomSpy.mockReturnValue(0.1);

    const sleepingEnemy = makePkmn({ name: 'RATTATA', status: 'sleep', moves: [makeMove({ power: 40 })] });
    const state: BattleState = {
      ...createBattleState([makePkmn()], sleepingEnemy),
      phase: 'ENEMY_ATTACK',
    };

    const result = stepBattle(state, { type: 'TICK' });

    expect(getLogs(result.effects).some(l => l.includes('despertado'))).toBe(true);
    // Enemy status cleared
    expect(result.state.enemyPokemon.status).toBe('none');
  });
});

// ─── Paralysis ────────────────────────────────────────────────────────────────

describe('Paralysis', () => {
  it('player skips turn when paralyzed (random < 0.25)', () => {
    randomSpy.mockReturnValue(0.1); // < 0.25 → skip

    const paralyzedPlayer = makePkmn({ status: 'paralyzed' });
    const enemy = makePkmn({ moves: [makeMove({ power: 10 })] });
    const state = createBattleState([paralyzedPlayer], enemy);
    const move = makeMove();
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(getLogs(result.effects).some(l => l.includes('paralizado'))).toBe(true);
    expect(result.state.enemyPokemon.hp).toBe(state.enemyPokemon.hp);
  });

  it('player acts normally when paralyzed but roll >= 0.25', () => {
    // First call: random for crit check — 0.5 → no crit (0.5 > speed/512)
    // Second call: paralysis skip check: 0.5 >= 0.25 → acts normally
    // Third call: doesMoveHit: floor(0.5*256)=128 < 255 → hits
    randomSpy.mockReturnValue(0.5);

    const paralyzedPlayer = makePkmn({ status: 'paralyzed' });
    const state = createBattleState([paralyzedPlayer], makePkmn({ moves: [makeMove({ power: 5 })] }));
    const move = makeMove({ power: 40 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(result.state.enemyPokemon.hp).toBeLessThan(state.enemyPokemon.hp);
  });

  it('paralysis does NOT clear from Pokemon after a skipped turn', () => {
    randomSpy.mockReturnValue(0.1); // skip

    const paralyzedPlayer = makePkmn({ status: 'paralyzed' });
    const state = createBattleState([paralyzedPlayer], makePkmn({ moves: [makeMove({ power: 5 })] }));
    const move = makeMove();
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    // Status stays paralyzed — Gen I paralysis doesn't wear off on skip
    expect(result.state.playerTeam[0].status).toBe('paralyzed');
  });

  it('enemy paralysis: 25% skip chance', () => {
    randomSpy.mockReturnValue(0.1); // < 0.25 → skip

    const paralyzedEnemy = makePkmn({ name: 'RATTATA', status: 'paralyzed', moves: [makeMove({ power: 40 })] });
    const state: BattleState = {
      ...createBattleState([makePkmn()], paralyzedEnemy),
      phase: 'ENEMY_ATTACK',
    };

    const result = stepBattle(state, { type: 'TICK' });

    expect(getLogs(result.effects).some(l => l.includes('paralizado'))).toBe(true);
    expect(result.state.playerTeam[0].hp).toBe(state.playerTeam[0].hp);
    expect(result.state.phase).toBe('CHOOSING');
  });
});

// ─── Stat reset on battle end ─────────────────────────────────────────────────

describe('Stat boosts reset when battle ends', () => {
  it('player stat boosts are cleared after winning', () => {
    randomSpy.mockReturnValue(0); // always crit, max damage

    const boostedPlayer = makePkmn({
      statBoosts: { attack: 3, defense: 2, special: 0, speed: 0 },
      baseStats: { hp: 35, attack: 200, defense: 30, special: 50, speed: 90 },
    });
    const weakEnemy = makePkmn({ hp: 1, maxHp: 1, name: 'CATERPIE', id: 'caterpie', level: 1 });
    const state = createBattleState([boostedPlayer], weakEnemy);
    const move = makeMove({ power: 40 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(result.state.outcome).toBe('player_win');
    expect(result.state.playerTeam[0].statBoosts).toBeUndefined();
  });

  it('enemy stat boosts are cleared after winning', () => {
    randomSpy.mockReturnValue(0);

    const boostedEnemy = makePkmn({
      hp: 1, maxHp: 1, name: 'CATERPIE', id: 'caterpie', level: 1,
      statBoosts: { attack: 2, defense: 0, special: 0, speed: 0 },
    });
    const state = createBattleState([makePkmn()], boostedEnemy);
    const move = makeMove({ power: 40 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(result.state.enemyPokemon.statBoosts).toBeUndefined();
  });

  it('stat boosts are cleared after fleeing', () => {
    randomSpy.mockReturnValue(0); // flee always succeeds (roll=0 < fleeValue)

    const boostedPlayer = makePkmn({ statBoosts: { attack: 4, defense: 0, special: 0, speed: 0 } });
    const state = createBattleState([boostedPlayer], makePkmn());

    const result = stepBattle(state, { type: 'FLEE' });

    expect(result.state.outcome).toBe('fled');
    expect(result.state.playerTeam[0].statBoosts).toBeUndefined();
  });
});

// ─── Status cannot stack ─────────────────────────────────────────────────────

describe('Status exclusivity (no stacking)', () => {
  it('applying sleep to an already-poisoned Pokemon replaces the status', () => {
    randomSpy.mockReturnValue(0.5); // hits, status applies

    const poisonedEnemy = makePkmn({ name: 'RATTATA', status: 'poison' });
    const state = createBattleState([makePkmn()], poisonedEnemy);

    const sleepMove: Move = {
      name: 'SOMNÍFERO', type: 'grass', power: 0, accuracy: 100, pp: 15, maxPp: 15,
      statusEffect: 'sleep', statusChance: 100,
    };
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [sleepMove] };

    const result = stepBattle(state, { type: 'ATTACK', move: sleepMove });

    // Status set to 'sleep', overwriting 'poison'
    expect(result.state.enemyPokemon.status).toBe('sleep');
  });
});

// ─── 1/256 accuracy miss ─────────────────────────────────────────────────────

describe('1/256 accuracy miss (Gen I bug)', () => {
  it('100% accuracy move misses when roll = 255/256', () => {
    // doesMoveHit: floor(random * 256) = 255, threshold = floor(100*255/100) = 255
    // 255 < 255 → false → miss
    randomSpy.mockReturnValue(255 / 256);

    const state = makeState();
    const move = makeMove({ accuracy: 100, power: 40 });
    const enemyHpBefore = state.enemyPokemon.hp;
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(result.state.enemyPokemon.hp).toBe(enemyHpBefore);
    expect(getLogs(result.effects).some(l => l.includes('falló'))).toBe(true);
  });

  it('100% accuracy move hits when roll = 0', () => {
    randomSpy.mockReturnValue(0);

    const state = makeState();
    const move = makeMove({ accuracy: 100, power: 40 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(result.state.enemyPokemon.hp).toBeLessThan(state.enemyPokemon.hp);
  });
});

// ─── Critical hits ignore stat stages (Gen I rule) ───────────────────────────

describe('Critical hits ignore negative attack stages (Gen I)', () => {
  it('crit bypasses negative attack stage on attacker — damage equals no-debuff crit', () => {
    // Force crit: speed=512 → critChance=0.996; random=0 → always crit
    randomSpy.mockReturnValue(0);

    const highSpeedPkmn = makePkmn({
      baseStats: { hp: 35, attack: 55, defense: 30, special: 50, speed: 512 },
    });

    const debuffedPkmn = { ...highSpeedPkmn, statBoosts: { attack: -6, defense: 0, special: 0, speed: 0 } };
    const normalPkmn = { ...highSpeedPkmn, statBoosts: undefined };

    const enemy = makePkmn({ name: 'RATTATA' });
    const move = makeMove({ power: 40 });

    const stateDebuffed = createBattleState([debuffedPkmn], { ...enemy });
    stateDebuffed.playerTeam[0] = { ...stateDebuffed.playerTeam[0], moves: [move] };
    const stateNormal = createBattleState([normalPkmn], { ...enemy });
    stateNormal.playerTeam[0] = { ...stateNormal.playerTeam[0], moves: [move] };

    const resultDebuffed = stepBattle(stateDebuffed, { type: 'ATTACK', move });
    const resultNormal = stepBattle(stateNormal, { type: 'ATTACK', move });

    // Damage should be the same — crit ignores the -6 attack stage
    const damageDebuffed = enemy.hp - resultDebuffed.state.enemyPokemon.hp;
    const damageNormal = enemy.hp - resultNormal.state.enemyPokemon.hp;
    expect(damageDebuffed).toBe(damageNormal);
  });
});

// ─── PP edge cases ────────────────────────────────────────────────────────────

describe('PP deduction and zero-PP guard', () => {
  it('PP is reduced by exactly 1 per use', () => {
    randomSpy.mockReturnValue(0.5);

    const state = makeState();
    const move = makeMove({ pp: 7, maxPp: 10 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(result.state.playerTeam[0].moves[0].pp).toBe(6);
  });

  it('move with pp=0 cannot be used', () => {
    const state = makeState();
    const exhaustedMove = makeMove({ pp: 0 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [exhaustedMove] };

    const result = stepBattle(state, { type: 'ATTACK', move: exhaustedMove });

    expect(result.state.phase).toBe('CHOOSING'); // no phase transition
    expect(result.state.enemyPokemon.hp).toBe(state.enemyPokemon.hp);
  });
});

// ─── Catch rate formula ───────────────────────────────────────────────────────

describe('Catch rate formula', () => {
  it('catch rate at full HP is ~10% (base rate)', () => {
    // hpPercent=1 → catchRate = (1-1)*0.7 + 0.1 = 0.1
    // roll=0.09 < 0.1 → caught
    randomSpy.mockReturnValue(0.09);

    const fullHpEnemy = makePkmn({ hp: 28, maxHp: 28 });
    const state = createBattleState([makePkmn()], fullHpEnemy, { inventory: { POKEBALL: 1 } });

    const result = stepBattle(state, { type: 'CATCH' });
    expect(result.state.outcome).toBe('caught');
  });

  it('catch rate at full HP fails with roll=0.11', () => {
    // catchRate ≈ 0.1, roll 0.11 >= 0.1 → fail
    randomSpy
      .mockReturnValueOnce(0.11)  // catch roll → fail
      .mockReturnValue(0.5);      // enemy turn

    const fullHpEnemy = makePkmn({ hp: 28, maxHp: 28, moves: [makeMove({ power: 5 })] });
    const state = createBattleState([makePkmn()], fullHpEnemy, { inventory: { POKEBALL: 1 } });

    const result = stepBattle(state, { type: 'CATCH' });
    expect(result.state.outcome).toBe('ongoing');
  });

  it('catch rate at 0 HP is ~80%', () => {
    // hpPercent=0 → catchRate = 0.7 + 0.1 = 0.8
    // roll=0.79 < 0.8 → caught
    randomSpy.mockReturnValue(0.79);

    const zeroHpEnemy = makePkmn({ hp: 0, maxHp: 28 });
    const state = createBattleState([makePkmn()], zeroHpEnemy, { inventory: { POKEBALL: 1 } });

    const result = stepBattle(state, { type: 'CATCH' });
    expect(result.state.outcome).toBe('caught');
  });

  it('catch rate at 50% HP is ~45%', () => {
    // hpPercent=0.5 → catchRate = 0.5*0.7 + 0.1 = 0.45
    // roll=0.44 → caught
    randomSpy.mockReturnValue(0.44);

    const halfHpEnemy = makePkmn({ hp: 14, maxHp: 28 });
    const state = createBattleState([makePkmn()], halfHpEnemy, { inventory: { POKEBALL: 1 } });

    const result = stepBattle(state, { type: 'CATCH' });
    expect(result.state.outcome).toBe('caught');
  });
});

// ─── Flee formula ─────────────────────────────────────────────────────────────

describe('Flee formula', () => {
  it('faster player always flees (roll=0)', () => {
    randomSpy.mockReturnValue(0); // roll=0, always < fleeValue

    const fastPlayer = makePkmn({ baseStats: { hp: 35, attack: 55, defense: 30, special: 50, speed: 200 } });
    const slowEnemy = makePkmn({ name: 'SLOWPOKE', baseStats: { hp: 90, attack: 65, defense: 65, special: 40, speed: 15 } });
    const state = createBattleState([fastPlayer], slowEnemy);

    const result = stepBattle(state, { type: 'FLEE' });
    expect(result.state.outcome).toBe('fled');
  });

  it('cannot flee from trainer battles', () => {
    randomSpy.mockReturnValue(0);

    const state = createBattleState([makePkmn()], makePkmn(), { isTrainerBattle: true });
    const result = stepBattle(state, { type: 'FLEE' });

    expect(result.state.outcome).toBe('ongoing');
    expect(result.state.phase).toBe('CHOOSING');
  });

  it('flee formula: fleeValue = (playerSpeed * 128 / enemySpeed + 30) % 256', () => {
    // playerSpeed=65, enemySpeed=72 → fleeValue = floor(65*128/72 + 30) % 256 = 145
    // roll=144 → 144 < 145 → success
    randomSpy.mockReturnValue(144 / 256);

    const player = makePkmn({ baseStats: { hp: 35, attack: 55, defense: 30, special: 50, speed: 65 } });
    const enemy = makePkmn({ name: 'RATTATA', baseStats: { hp: 30, attack: 56, defense: 35, special: 25, speed: 72 } });
    const state = createBattleState([player], enemy);

    const result = stepBattle(state, { type: 'FLEE' });
    expect(result.state.outcome).toBe('fled');
  });
});
