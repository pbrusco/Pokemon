import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calcHp,
  calcStat,
  calcStatWithBoost,
  getStageMultiplier,
  getTypeEffectiveness,
  getEffectivenessLabel,
  doesMoveHit,
  calculateDamage,
  ZERO_BOOSTS,
} from '../damage';
import type { Pokemon } from '../../types';
import { MOVES } from '../../constants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePkmn(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: 'charmander',
    name: 'CHARMANDER',
    level: 10,
    hp: 28,
    maxHp: 28,
    type: 'fire',
    baseStats: { hp: 39, attack: 52, defense: 43, special: 50, speed: 65 },
    moves: [],
    sprite: '',
    ...overrides,
  };
}

// ─── calcHp ──────────────────────────────────────────────────────────────────

describe('calcHp', () => {
  it('computes Charmander level 5 HP correctly', () => {
    // floor((39*2*5)/100) + 5 + 10 = 3 + 15 = 18
    expect(calcHp(39, 5)).toBe(18);
  });

  it('computes Pikachu level 5 HP correctly', () => {
    // floor((35*2*5)/100) + 5 + 10 = 3 + 15 = 18
    expect(calcHp(35, 5)).toBe(18);
  });

  it('computes Snorlax level 50 HP correctly', () => {
    // floor((160*2*50)/100) + 50 + 10 = 160 + 60 = 220
    expect(calcHp(160, 50)).toBe(220);
  });

  it('HP scales with level', () => {
    expect(calcHp(45, 10)).toBeLessThan(calcHp(45, 20));
  });
});

// ─── calcStat ────────────────────────────────────────────────────────────────

describe('calcStat', () => {
  it('computes Charmander attack at level 5', () => {
    // floor((52*2*5)/100) + 5 = floor(5.2) + 5 = 10
    expect(calcStat(52, 5)).toBe(10);
  });

  it('computes Geodude defense at level 12', () => {
    // floor((100*2*12)/100) + 5 = 24 + 5 = 29
    expect(calcStat(100, 12)).toBe(29);
  });

  it('stat scales with level', () => {
    expect(calcStat(50, 10)).toBeLessThan(calcStat(50, 50));
  });
});

// ─── getStageMultiplier ───────────────────────────────────────────────────────

describe('getStageMultiplier', () => {
  it('returns 1 at stage 0', () => {
    expect(getStageMultiplier(0)).toBe(1);
  });

  it('returns 2/8 at stage -6', () => {
    expect(getStageMultiplier(-6)).toBeCloseTo(2 / 8);
  });

  it('returns 8/2 at stage +6', () => {
    expect(getStageMultiplier(6)).toBeCloseTo(8 / 2);
  });

  it('clamps below -6 to -6 value', () => {
    expect(getStageMultiplier(-7)).toBeCloseTo(getStageMultiplier(-6));
    expect(getStageMultiplier(-99)).toBeCloseTo(getStageMultiplier(-6));
  });

  it('clamps above +6 to +6 value', () => {
    expect(getStageMultiplier(7)).toBeCloseTo(getStageMultiplier(6));
    expect(getStageMultiplier(99)).toBeCloseTo(getStageMultiplier(6));
  });

  it('+1 multiplier is 1.5x', () => {
    expect(getStageMultiplier(1)).toBeCloseTo(3 / 2);
  });

  it('-1 multiplier is 0.667x', () => {
    expect(getStageMultiplier(-1)).toBeCloseTo(2 / 3);
  });
});

// ─── calcStatWithBoost ───────────────────────────────────────────────────────

describe('calcStatWithBoost', () => {
  it('returns base stat at stage 0', () => {
    const base = calcStat(52, 10);
    expect(calcStatWithBoost(52, 10, 0)).toBe(base);
  });

  it('doubles stat at stage +6 relative to stage 0', () => {
    const base = calcStat(52, 10);
    const boosted = calcStatWithBoost(52, 10, 6);
    expect(boosted).toBe(Math.floor(base * 4)); // 8/2 = 4x at +6
  });

  it('halves stat at stage -2 (approx)', () => {
    const base = calcStat(52, 10);
    const lowered = calcStatWithBoost(52, 10, -2);
    expect(lowered).toBe(Math.floor(base * (2 / 4)));
  });
});

// ─── getTypeEffectiveness ─────────────────────────────────────────────────────

describe('getTypeEffectiveness', () => {
  it('fire is 2x effective vs grass', () => {
    expect(getTypeEffectiveness('fire', ['grass'])).toBe(2);
  });

  it('water is 0.5x vs water', () => {
    expect(getTypeEffectiveness('water', ['water'])).toBe(0.5);
  });

  it('normal is immune to ghost (0x)', () => {
    expect(getTypeEffectiveness('normal', ['ghost'])).toBe(0);
  });

  it('electric is immune to ground (0x)', () => {
    expect(getTypeEffectiveness('electric', ['ground'])).toBe(0);
  });

  it('unknown type vs unknown type defaults to 1x', () => {
    expect(getTypeEffectiveness('normal', ['normal'])).toBe(1);
  });

  it('grass vs dual-type rock/ground: 2x * 2x = 4x', () => {
    // grass is super effective vs rock (2x) and ground (2x)
    expect(getTypeEffectiveness('grass', ['rock', 'ground'])).toBe(4);
  });

  it('ground vs dual-type fire/flying: 2x vs fire, 0x vs flying = 0 (immune)', () => {
    // ground is 2x vs fire, but flying is immune to ground
    expect(getTypeEffectiveness('ground', ['fire', 'flying'])).toBe(0);
  });

  it('ice vs water/dragon: 0.5x * 2x = 1x', () => {
    expect(getTypeEffectiveness('ice', ['water', 'dragon'])).toBe(1);
  });
});

// ─── getEffectivenessLabel ────────────────────────────────────────────────────

describe('getEffectivenessLabel', () => {
  it('returns no_effect for 0', () => {
    expect(getEffectivenessLabel(0)).toBe('no_effect');
  });

  it('returns super_effective for > 1', () => {
    expect(getEffectivenessLabel(2)).toBe('super_effective');
    expect(getEffectivenessLabel(4)).toBe('super_effective');
  });

  it('returns not_very_effective for < 1', () => {
    expect(getEffectivenessLabel(0.5)).toBe('not_very_effective');
    expect(getEffectivenessLabel(0.25)).toBe('not_very_effective');
  });

  it('returns null for exactly 1', () => {
    expect(getEffectivenessLabel(1)).toBeNull();
  });
});

// ─── doesMoveHit (Gen I 1/256 bug) ────────────────────────────────────────────

describe('doesMoveHit', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('100% accuracy still misses on roll 255 (1/256 bug)', () => {
    randomSpy.mockReturnValue(255 / 256); // floor(255)
    expect(doesMoveHit(100)).toBe(false);
  });

  it('100% accuracy hits on roll 254', () => {
    randomSpy.mockReturnValue(254 / 256); // floor(254)
    expect(doesMoveHit(100)).toBe(true);
  });

  it('50% accuracy misses at threshold and above', () => {
    randomSpy.mockReturnValue(127 / 256); // floor(127), threshold=127 -> miss
    expect(doesMoveHit(50)).toBe(false);
  });
});

// ─── calculateDamage ─────────────────────────────────────────────────────────

describe('calculateDamage', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('returns 0 damage for status moves (power === 0)', () => {
    const attacker = makePkmn();
    const defender = makePkmn({ type: 'water' });
    const statusMove = { ...MOVES.GROWL };
    randomSpy.mockReturnValue(0.999);

    const result = calculateDamage(attacker, defender, statusMove);
    expect(result.damage).toBe(0);
    expect(result.isCritical).toBe(false);
  });

  it('returns 0 damage and no_effect for immune type', () => {
    // normal move vs ghost defender
    const attacker = makePkmn({ type: 'normal' });
    const defender = makePkmn({ type: 'ghost' });
    const tackle = { ...MOVES.TACKLE };
    randomSpy.mockReturnValue(0.999); // no crit

    const result = calculateDamage(attacker, defender, tackle);
    expect(result.damage).toBe(0);
    expect(result.effectivenessLabel).toBe('no_effect');
  });

  it('deals at least 1 damage (minimum damage guarantee)', () => {
    // Use a very weak attacker against a tanky defender
    const weakAttacker = makePkmn({
      level: 1,
      baseStats: { hp: 10, attack: 5, defense: 5, special: 5, speed: 5 },
    });
    const tankyDefender = makePkmn({
      type: 'water',
      baseStats: { hp: 160, attack: 5, defense: 160, special: 160, speed: 5 },
    });
    const tackle = { ...MOVES.TACKLE };
    randomSpy.mockReturnValue(0.999); // no crit

    const result = calculateDamage(weakAttacker, tankyDefender, tackle);
    expect(result.damage).toBeGreaterThanOrEqual(1);
  });

  it('applies STAB bonus (1.5x) when move type matches attacker type', () => {
    // Fire attacker using fire move vs neutral defender
    const fireAttacker = makePkmn({ type: 'fire' });
    const normalDefender = makePkmn({ type: 'water', baseStats: { hp: 44, attack: 48, defense: 65, special: 50, speed: 43 } });
    const fireMove = { name: 'BRASA', type: 'fire', power: 40, accuracy: 100, pp: 25, maxPp: 25 };
    const noStabMove = { ...MOVES.TACKLE }; // normal type

    randomSpy.mockReturnValue(0.999); // no crit, max random

    const stabResult = calculateDamage(fireAttacker, normalDefender, fireMove);
    const noStabResult = calculateDamage(fireAttacker, normalDefender, noStabMove);

    // STAB should give more damage (fire vs water: 0.5x type, but stab 1.5x vs no stab 1x)
    // Let's use a neutral defender type
    const neutralDefender = makePkmn({ type: 'normal', baseStats: { hp: 40, attack: 45, defense: 40, special: 35, speed: 56 } });
    randomSpy.mockReturnValue(0.999);
    const stabVsNeutral = calculateDamage(fireAttacker, neutralDefender, fireMove);
    const noStabVsNeutral = calculateDamage(fireAttacker, neutralDefender, noStabMove);

    expect(stabVsNeutral.damage).toBeGreaterThan(noStabVsNeutral.damage);
  });

  it('super effective move does more damage than neutral', () => {
    const waterAttacker = makePkmn({ type: 'water', baseStats: { hp: 40, attack: 50, defense: 40, special: 50, speed: 90 } });
    const fireDefender = makePkmn({ type: 'fire' });
    const normalDefender = makePkmn({ type: 'normal', baseStats: { hp: 40, attack: 45, defense: 40, special: 35, speed: 56 } });
    const waterMove = { name: 'PISTOLA AGUA', type: 'water', power: 40, accuracy: 100, pp: 25, maxPp: 25 };

    randomSpy.mockReturnValue(0.999);
    const superEffective = calculateDamage(waterAttacker, fireDefender, waterMove);
    const neutral = calculateDamage(waterAttacker, normalDefender, waterMove);

    expect(superEffective.damage).toBeGreaterThan(neutral.damage);
    expect(superEffective.effectivenessLabel).toBe('super_effective');
  });

  it('critical hit has isCritical = true when random < critChance', () => {
    const attacker = makePkmn({ baseStats: { hp: 39, attack: 52, defense: 43, special: 50, speed: 512 } }); // speed 512 → critChance = 1
    const defender = makePkmn({ type: 'normal' });
    const tackle = { ...MOVES.TACKLE };

    randomSpy.mockReturnValue(0); // 0 < 1 → always crit

    const result = calculateDamage(attacker, defender, tackle);
    expect(result.isCritical).toBe(true);
  });

  it('no critical hit when random >= critChance', () => {
    const attacker = makePkmn(); // speed 65 → critChance = 65/512 ≈ 0.127
    const defender = makePkmn({ type: 'normal' });
    const tackle = { ...MOVES.TACKLE };

    randomSpy.mockReturnValue(0.999); // 0.999 >= 0.127 → no crit

    const result = calculateDamage(attacker, defender, tackle);
    expect(result.isCritical).toBe(false);
  });

  it('not very effective is labeled correctly', () => {
    const normalAttacker = makePkmn({ type: 'normal' });
    const rockDefender = makePkmn({ type: 'rock', baseStats: { hp: 40, attack: 80, defense: 100, special: 30, speed: 20 } });
    const tackle = { ...MOVES.TACKLE };

    randomSpy.mockReturnValue(0.999);

    const result = calculateDamage(normalAttacker, rockDefender, tackle);
    expect(result.effectivenessLabel).toBe('not_very_effective');
    expect(result.effectiveness).toBe(0.5);
  });
});
