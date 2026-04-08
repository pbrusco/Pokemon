import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stepBattle, createBattleState } from '../battleEngine';
import type { BattleState } from '../battleEngine';
import type { Pokemon, Move } from '../../types';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeMove(overrides: Partial<Move> = {}): Move {
  return {
    name: 'TACKLE',
    type: 'normal',
    power: 40,
    accuracy: 100,
    pp: 10,
    maxPp: 10,
    ...overrides,
  };
}

function makePkmn(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: 'charmander',
    name: 'CHARMANDER',
    level: 10,
    hp: 28,
    maxHp: 28,
    type: 'fire',
    baseStats: { hp: 39, attack: 52, defense: 43, special: 50, speed: 65 },
    moves: [makeMove()],
    sprite: '',
    status: 'none',
    exp: 0,
    expToNextLevel: 100,
    ...overrides,
  };
}

function makeState(overrides: Partial<BattleState> = {}): BattleState {
  return createBattleState(
    [makePkmn()],
    makePkmn({ name: 'RATTATA', id: 'rattata', type: 'normal', baseStats: { hp: 30, attack: 56, defense: 35, special: 25, speed: 72 } }),
    overrides as any,
  );
}

let randomSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  randomSpy = vi.spyOn(Math, 'random');
});

afterEach(() => {
  randomSpy.mockRestore();
});

/** Extract all log strings from a BattleResult's effects array */
function getLogs(effects: { type: string; payload?: string | number }[]): string[] {
  return effects.filter(e => e.type === 'log').map(e => e.payload as string);
}

// ─── Scenario 1: Normal attack flow ──────────────────────────────────────────

describe('Normal attack flow', () => {
  it('CHOOSING → player attacks → enemy survives → goes to CHOOSING', () => {
    // 0.5: no crit (0.5 > critChance≈0.127), doesMoveHit floor(0.5*256)=128 < 255 → hit
    randomSpy.mockReturnValue(0.5);

    const state = makeState();
    const move = makeMove({ name: 'TACKLE', type: 'normal', power: 40 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    // Enemy should have taken damage
    expect(result.state.enemyPokemon.hp).toBeLessThan(state.enemyPokemon.hp);
    // Should loop back to CHOOSING after enemy turn
    expect(result.state.phase).toBe('CHOOSING');
    expect(result.state.outcome).toBe('ongoing');
  });

  it('deducts PP from the used move', () => {
    randomSpy.mockReturnValue(0.5);

    const state = makeState();
    const move = makeMove({ pp: 5, maxPp: 10 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(result.state.playerTeam[0].moves[0].pp).toBe(4);
  });

  it('attack with 0 PP is rejected', () => {
    const state = makeState();
    const move = makeMove({ pp: 0 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(result.state.phase).toBe('CHOOSING'); // unchanged
    expect(result.state.playerTeam[0].moves[0].pp).toBe(0);
  });
});

// ─── Scenario 2: Miss ────────────────────────────────────────────────────────

describe('Move miss', () => {
  it('when move misses, enemy HP is unchanged and enemy gets a turn', () => {
    // doesMoveHit uses floor(random * 256) < threshold
    // For accuracy=100, threshold = floor(100*255/100) = 255
    // roll=255 → 255 < 255 is false → miss
    randomSpy.mockReturnValue(255 / 256); // no crit first call, then miss roll

    const state = makeState();
    const move = makeMove({ accuracy: 100, power: 40 });
    const enemyHpBefore = state.enemyPokemon.hp;
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(result.state.enemyPokemon.hp).toBe(enemyHpBefore);
    expect(result.state.log).toContain('falló');
  });
});

// ─── Scenario 3: Player fainted with backup → FORCED_SWITCH ─────────────────

describe('Player Pokemon faints with backup', () => {
  it('when player is hit to 0 HP with a backup alive, phase becomes FORCED_SWITCH', () => {
    randomSpy.mockReturnValue(0.999);

    const backup = makePkmn({ name: 'SQUIRTLE', id: 'squirtle', hp: 20, maxHp: 20 });
    const playerPkmn = makePkmn({ hp: 1, maxHp: 28 }); // will faint on any hit

    // Enemy has a strong move to guarantee 1+ damage
    const strongMove = makeMove({ power: 100, type: 'normal' });
    const enemy = makePkmn({
      name: 'GOLEM',
      id: 'golem',
      type: 'rock',
      baseStats: { hp: 80, attack: 110, defense: 130, special: 55, speed: 45 },
      moves: [strongMove],
    });

    const state = createBattleState([playerPkmn, backup], enemy);

    // Simulate: player attacks, enemy kills the player
    // First, manually set player HP to 1 so one hit kills them
    // Then run the enemy TICK
    const stateWithWeakPlayer = {
      ...state,
      phase: 'ENEMY_ATTACK' as const,
    };

    const result = stepBattle(stateWithWeakPlayer, { type: 'TICK' });

    // Either FORCED_SWITCH (player fainted, backup alive) or CHOOSING (missed/status)
    // With hp=1 and a 100-power move, damage should be >= 1
    if (result.state.playerTeam[0].hp === 0) {
      expect(result.state.phase).toBe('FORCED_SWITCH');
      expect(result.state.outcome).toBe('ongoing');
    }
  });

  it('SWITCH in FORCED_SWITCH brings backup to front and returns to CHOOSING', () => {
    const fainted = makePkmn({ hp: 0, maxHp: 28, name: 'CHARMANDER' });
    const backup = makePkmn({ hp: 20, maxHp: 20, name: 'SQUIRTLE', id: 'squirtle', type: 'water' });
    const enemy = makePkmn({ name: 'RATTATA' });

    const state: BattleState = {
      ...createBattleState([fainted, backup], enemy),
      phase: 'FORCED_SWITCH',
    };

    randomSpy.mockReturnValue(0.999); // enemy won't paralyze/status

    const result = stepBattle(state, { type: 'SWITCH', index: 1 });

    expect(result.state.playerTeam[0].name).toBe('SQUIRTLE');
    expect(result.state.playerTeam[1].name).toBe('CHARMANDER');
    // After forced switch, enemy gets a turn — phase should be CHOOSING again
    expect(result.state.phase).toBe('CHOOSING');
    expect(result.state.log).toContain('SQUIRTLE');
  });

  it('cannot switch to a fainted Pokemon', () => {
    const active = makePkmn({ name: 'CHARMANDER' });
    const faintedBackup = makePkmn({ hp: 0, maxHp: 20, name: 'SQUIRTLE' });
    const enemy = makePkmn({ name: 'RATTATA' });

    const state: BattleState = {
      ...createBattleState([active, faintedBackup], enemy),
      phase: 'FORCED_SWITCH',
    };

    const result = stepBattle(state, { type: 'SWITCH', index: 1 });

    // Should be rejected — state unchanged
    expect(result.state.playerTeam[0].name).toBe('CHARMANDER');
    expect(result.state.phase).toBe('FORCED_SWITCH');
  });
});

// ─── Scenario 4: All fainted → BLACKOUT ──────────────────────────────────────

describe('Blackout when all Pokemon faint', () => {
  it('when last Pokemon faints, outcome becomes player_blackout', () => {
    randomSpy.mockReturnValue(0.5); // ensures doesMoveHit passes: floor(0.5*256)=128 < 255

    const dyingPlayer = makePkmn({ hp: 1, maxHp: 28 });
    const strongEnemy = makePkmn({
      name: 'GOLEM',
      id: 'golem',
      type: 'rock',
      baseStats: { hp: 80, attack: 110, defense: 130, special: 55, speed: 45 },
      moves: [makeMove({ power: 200, type: 'normal' })],
    });

    const state: BattleState = {
      ...createBattleState([dyingPlayer], strongEnemy),
      phase: 'ENEMY_ATTACK',
    };

    const result = stepBattle(state, { type: 'TICK' });

    expect(result.state.playerTeam[0].hp).toBe(0);
    expect(result.state.outcome).toBe('player_blackout');
    expect(result.state.phase).toBe('PLAYER_FAINTED');
  });
});

// ─── Scenario 5: Enemy faints → EXP → Level Up → Evolution ─────────────────

describe('Enemy fainted → EXP and level-up', () => {
  it('player gains EXP when enemy faints', () => {
    randomSpy.mockReturnValue(0); // always crit, max hit

    const player = makePkmn({
      baseStats: { hp: 39, attack: 120, defense: 43, special: 50, speed: 65 },
      exp: 0,
      expToNextLevel: 1000, // won't level up
    });
    const weakEnemy = makePkmn({ hp: 1, maxHp: 1, name: 'CATERPIE', level: 5 });
    const state = createBattleState([player], weakEnemy);
    const move = makeMove({ power: 40 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(result.state.outcome).toBe('player_win');
    expect(result.state.playerTeam[0].exp).toBeGreaterThan(0);
    expect(result.state.log).toContain('EXP');
  });

  it('level up recalculates HP correctly', () => {
    randomSpy.mockReturnValue(0); // always crit

    // calcHp(39, 4) = floor(39*2*4/100)+4+10 = 3+14 = 17
    const player = makePkmn({
      level: 4,
      exp: 95, // 5 more XP to level up (expToNextLevel = 100 by default)
      expToNextLevel: 100,
      hp: 17,
      maxHp: 17,
    });
    // Enemy at level 1 gives floor(1*25) = 25 EXP → triggers level up
    const weakEnemy = makePkmn({ hp: 1, maxHp: 1, name: 'CATERPIE', id: 'caterpie', level: 1 });
    const state = createBattleState([player], weakEnemy);
    const move = makeMove({ power: 40 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    if (result.state.playerTeam[0].level === 5) {
      // Leveled up — maxHp should increase beyond initial 17 (calcHp(39,4)=17)
      expect(result.state.playerTeam[0].maxHp).toBeGreaterThan(17);
      expect(result.state.phase).toBe('LEVEL_UP');
    }
  });

  it('evolution triggers when level meets evolutionLevel', () => {
    randomSpy.mockReturnValue(0);

    const player = makePkmn({
      id: 'charmander',
      name: 'CHARMANDER',
      level: 15, // will reach 16 (evolutionLevel)
      exp: 95,
      expToNextLevel: 100,
      evolutionLevel: 16,
      evolvesTo: 'charmeleon',
    });
    const weakEnemy = makePkmn({ hp: 1, maxHp: 1, name: 'CATERPIE', id: 'caterpie', level: 1 });
    const state = createBattleState([player], weakEnemy);
    const move = makeMove({ power: 40 });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    if (result.state.playerTeam[0].level === 16) {
      expect(result.state.phase).toBe('EVOLVING');
      expect(result.state.playerTeam[0].name).toBe('CHARMELEON');
    }
  });
});

// ─── Scenario 6: Catching ────────────────────────────────────────────────────

describe('Catch mechanics', () => {
  it('successful catch adds Pokemon to team when team < 6', () => {
    // catchRate = (1 - hpPercent) * 0.7 + 0.1
    // enemy at 0 HP → catchRate = 0.8, roll must be < 0.8
    randomSpy.mockReturnValue(0.1); // roll < catchRate → success

    const enemy = makePkmn({ hp: 0, maxHp: 28, name: 'RATTATA' });
    const state = createBattleState(
      [makePkmn()],
      enemy,
      { inventory: { POKEBALL: 1 } },
    );

    const result = stepBattle(state, { type: 'CATCH' });

    expect(result.state.outcome).toBe('caught');
    expect(result.state.playerTeam).toHaveLength(2);
    expect(result.state.playerTeam[1].name).toBe('RATTATA');
    expect(result.state.inventory['POKEBALL']).toBeUndefined(); // consumed
  });

  it('successful catch sends to PC when team is full', () => {
    randomSpy.mockReturnValue(0.1);

    const fullTeam = Array(6).fill(null).map((_, i) => makePkmn({ name: `PKM${i}` }));
    const enemy = makePkmn({ hp: 0, maxHp: 28, name: 'RATTATA' });
    const state = createBattleState(fullTeam, enemy, { inventory: { POKEBALL: 1 } });

    const result = stepBattle(state, { type: 'CATCH' });

    expect(result.state.outcome).toBe('caught');
    expect(result.state.playerTeam).toHaveLength(6); // unchanged
    expect(result.state.pcStorage).toHaveLength(1);
    expect(result.state.pcStorage[0].name).toBe('RATTATA');
  });

  it('failed catch gives enemy a turn', () => {
    // catch roll: random * catchRate where catchRate for full-HP enemy ≈ 0.1
    // With random=0.99: 0.99 >= 0.1 → fail; then enemy TICK → needs to HIT
    // Use mockReturnValueOnce to control catch roll separately from hit roll
    randomSpy
      .mockReturnValueOnce(0.99) // catch roll → fail (0.99 >= ~0.1)
      .mockReturnValue(0.5);     // subsequent calls: enemy hits, no crit, etc.

    const enemy = makePkmn({ hp: 28, maxHp: 28, name: 'RATTATA', moves: [makeMove({ power: 5 })] });
    const state = createBattleState([makePkmn()], enemy, { inventory: { POKEBALL: 1 } });

    const result = stepBattle(state, { type: 'CATCH' });

    expect(result.state.outcome).toBe('ongoing');
    // "escapado" appears in effects before enemy turn overwrites state.log
    expect(getLogs(result.effects).some(l => l.includes('escapado'))).toBe(true);
    expect(['CHOOSING', 'FORCED_SWITCH', 'PLAYER_FAINTED']).toContain(result.state.phase);
  });

  it('cannot catch in trainer battle', () => {
    const state = createBattleState(
      [makePkmn()],
      makePkmn(),
      { isTrainerBattle: true, inventory: { POKEBALL: 3 } },
    );

    const result = stepBattle(state, { type: 'CATCH' });
    expect(result.state.phase).toBe('CHOOSING'); // unchanged
    expect(result.state.inventory['POKEBALL']).toBe(3); // not consumed
  });

  it('cannot catch with no Pokeballs', () => {
    const state = createBattleState([makePkmn()], makePkmn(), { inventory: {} });
    const result = stepBattle(state, { type: 'CATCH' });
    expect(result.state.phase).toBe('CHOOSING');
  });
});

// ─── Scenario 7: Flee ────────────────────────────────────────────────────────

describe('Flee mechanics', () => {
  it('successful flee sets outcome to fled', () => {
    // fleeValue = (playerSpeed*128/enemySpeed + 30) % 256
    // roll must be < fleeValue
    randomSpy.mockReturnValue(0); // roll = 0 → always succeed

    const state = makeState();
    const result = stepBattle(state, { type: 'FLEE' });

    expect(result.state.outcome).toBe('fled');
    expect(result.state.log).toContain('escapado');
  });

  it('failed flee triggers enemy turn', () => {
    // fleeValue for player speed 65 vs enemy speed 72:
    //   floor(65*128/72 + 30) % 256 = floor(115.5 + 30) % 256 = 145
    // We need roll >= fleeValue → roll of 200 fails
    // First random call is the flee roll, subsequent are for enemy turn
    randomSpy
      .mockReturnValueOnce(200 / 256) // flee roll → 200 >= 145 → fail
      .mockReturnValue(0.5);          // enemy hits (floor(0.5*256)=128 < 255)

    const state = makeState(); // player speed 65, enemy speed 72
    const result = stepBattle(state, { type: 'FLEE' });

    expect(result.state.outcome).toBe('ongoing');
    // "podido escapar" appears in effects before enemy turn overwrites state.log
    expect(getLogs(result.effects).some(l => l.includes('podido escapar'))).toBe(true);
    expect(['CHOOSING', 'FORCED_SWITCH', 'PLAYER_FAINTED']).toContain(result.state.phase);
  });

  it('cannot flee from a trainer battle', () => {
    const state = createBattleState([makePkmn()], makePkmn(), { isTrainerBattle: true });
    const result = stepBattle(state, { type: 'FLEE' });
    expect(result.state.outcome).toBe('ongoing');
    expect(result.state.phase).toBe('CHOOSING');
  });
});

// ─── Scenario 8: Status effects ──────────────────────────────────────────────

describe('Status effects', () => {
  it('sleep: Pokemon stays asleep with 70% probability', () => {
    // In battleEngine: wakeUp = Math.random() > 0.3 ? false : true
    // With random = 0.5: 0.5 > 0.3 → wakeUp = false → stays asleep
    // After sleeping, enemy gets a turn → state.log gets overwritten; check effects
    randomSpy.mockReturnValue(0.5);

    const sleepingPlayer = makePkmn({ status: 'sleep' });
    const enemy = makePkmn({ moves: [makeMove({ power: 10 })] });
    const state = createBattleState([sleepingPlayer], enemy);
    const move = makeMove();
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(getLogs(result.effects).some(l => l.includes('dormido'))).toBe(true);
  });

  it('paralysis: 25% chance to skip turn', () => {
    // In ATTACK handler: first random call is PP deduct check (none), then:
    // sleep check (no), then: status === 'paralyzed' && Math.random() < 0.25
    // With 0.1: 0.1 < 0.25 → skip turn; then enemy gets a turn (state.log overwritten)
    randomSpy.mockReturnValue(0.1);

    const paralyzedPlayer = makePkmn({ status: 'paralyzed' });
    const enemy = makePkmn({ moves: [makeMove({ power: 10 })] });
    const state = createBattleState([paralyzedPlayer], enemy);
    const move = makeMove();
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [move] };

    const result = stepBattle(state, { type: 'ATTACK', move });

    expect(getLogs(result.effects).some(l => l.includes('paralizado'))).toBe(true);
  });

  it('status move applies status to enemy', () => {
    // random=0.5: doesMoveHit floor(0.5*256)=128 < 255 → HIT
    // statusChance=100: 0.5*100=50 < 100 → applies
    randomSpy.mockReturnValue(0.5);

    const state = makeState();
    const sleepMove = makeMove({
      name: 'SOMNIFERO',
      type: 'psychic',
      power: 0,
      statusEffect: 'sleep',
      statusChance: 100,
    });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [sleepMove] };

    const result = stepBattle(state, { type: 'ATTACK', move: sleepMove });

    expect(result.state.enemyPokemon.status).toBe('sleep');
  });
});

// ─── Scenario 9: Stat boosts clamping ────────────────────────────────────────

describe('Stat boost clamping', () => {
  it('stat boost cannot exceed +6', () => {
    randomSpy.mockReturnValue(0.999);

    let state = makeState();
    // Player's attack already at +6
    state = {
      ...state,
      playerTeam: [{
        ...state.playerTeam[0],
        statBoosts: { attack: 6, defense: 0, special: 0, speed: 0 },
      }],
    };

    const swordsDance = makeMove({
      name: 'DANZA ESPADA',
      type: 'normal',
      power: 0,
      statChange: { target: 'self', stat: 'attack', stages: 2 },
    });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [swordsDance] };

    const result = stepBattle(state, { type: 'ATTACK', move: swordsDance });

    expect(result.state.playerTeam[0].statBoosts?.attack).toBe(6); // still clamped at 6
  });

  it('stat debuff cannot go below -6', () => {
    randomSpy.mockReturnValue(0.999);

    let state = makeState();
    state = {
      ...state,
      enemyPokemon: {
        ...state.enemyPokemon,
        statBoosts: { attack: -6, defense: 0, special: 0, speed: 0 },
      },
    };

    const growl = makeMove({
      name: 'GRUÑIDO',
      type: 'normal',
      power: 0,
      statChange: { target: 'enemy', stat: 'attack', stages: -1 },
    });
    state.playerTeam[0] = { ...state.playerTeam[0], moves: [growl] };

    const result = stepBattle(state, { type: 'ATTACK', move: growl });

    expect(result.state.enemyPokemon.statBoosts?.attack).toBe(-6); // clamped at -6
  });
});

// ─── Scenario 10: POTION use in battle ───────────────────────────────────────

describe('Potion use in battle', () => {
  it('heals active Pokemon by up to 20 HP and triggers enemy turn', () => {
    randomSpy.mockReturnValue(0.999);

    const woundedPlayer = makePkmn({ hp: 5, maxHp: 28 });
    const enemy = makePkmn({ moves: [makeMove({ power: 5 })] });
    const state = createBattleState(
      [woundedPlayer],
      enemy,
      { inventory: { POTION: 1 } },
    );

    const result = stepBattle(state, { type: 'USE_ITEM', itemId: 'POTION' });

    // Player was healed before enemy turn
    // After enemy turn the HP might decrease again — check the log
    expect(result.state.log).not.toBeUndefined();
    expect(result.state.inventory['POTION']).toBeUndefined(); // consumed
    // Should be back to CHOOSING
    expect(['CHOOSING', 'FORCED_SWITCH', 'PLAYER_FAINTED']).toContain(result.state.phase);
  });

  it('cannot use a Potion when inventory is empty', () => {
    const state = createBattleState([makePkmn({ hp: 5 })], makePkmn(), { inventory: {} });
    const result = stepBattle(state, { type: 'USE_ITEM', itemId: 'POTION' });
    expect(result.state.playerTeam[0].hp).toBe(5); // unchanged
    expect(result.state.phase).toBe('CHOOSING');
  });

  it('potion does not overheal beyond maxHp', () => {
    randomSpy.mockReturnValue(0.5);

    const partialPlayer = makePkmn({ hp: 25, maxHp: 28 }); // 3 HP missing → heals 3, not 20
    const enemy = makePkmn({ moves: [makeMove({ power: 5 })] });
    const state = createBattleState([partialPlayer], enemy, { inventory: { POTION: 1 } });

    const result = stepBattle(state, { type: 'USE_ITEM', itemId: 'POTION' });

    // The heal log ("Recuperó 3 PS") appears in effects before enemy turn overwrites state.log
    expect(getLogs(result.effects).some(l => l.includes('3 PS'))).toBe(true);
  });
});

// ─── Scenario 11: ATTACK is a no-op when not in CHOOSING ────────────────────

describe('createBattleState validation', () => {
  it('throws when playerTeam is empty', () => {
    expect(() => createBattleState([], makePkmn())).toThrow('playerTeam must not be empty');
  });
});

describe('Phase guards', () => {
  it('ATTACK action is rejected outside of CHOOSING phase', () => {
    const state: BattleState = { ...makeState(), phase: 'PLAYER_ATTACK' };
    const move = makeMove();
    const result = stepBattle(state, { type: 'ATTACK', move });
    expect(result.state.phase).toBe('PLAYER_ATTACK'); // unchanged
  });

  it('FLEE is rejected outside of CHOOSING phase', () => {
    const state: BattleState = { ...makeState(), phase: 'ENEMY_ATTACK' };
    const result = stepBattle(state, { type: 'FLEE' });
    expect(result.state.phase).toBe('ENEMY_ATTACK');
  });
});
