import { Pokemon, Move, StatBoosts } from '../types';

// Gen I: types are either Physical or Special
const PHYSICAL_TYPES = new Set([
  'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost',
]);

const SPECIAL_TYPES = new Set([
  'water', 'grass', 'fire', 'ice', 'electric', 'psychic', 'dragon',
]);

// Gen I type effectiveness chart
// effectiveness[attackType][defenseType] = multiplier
const TYPE_CHART: Record<string, Record<string, number>> = {
  normal:   { rock: 0.5, ghost: 0 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5 },
  ice:      { water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, bug: 2, rock: 0.5, ghost: 0.5 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 2, flying: 0.5, ghost: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2 },
  ghost:    { normal: 0, ghost: 2, psychic: 0 },
  dragon:   { dragon: 2 },
};

// Gen I stat stage multipliers (stage -6 … +6)
const STAT_STAGE_MULTIPLIERS: Record<number, number> = {
  [-6]: 2/8, [-5]: 2/7, [-4]: 2/6, [-3]: 2/5, [-2]: 2/4, [-1]: 2/3,
  [0]: 1,
  [1]: 3/2, [2]: 4/2, [3]: 5/2, [4]: 6/2, [5]: 7/2, [6]: 8/2,
};

export function getStageMultiplier(stage: number): number {
  const clamped = Math.max(-6, Math.min(6, stage));
  return STAT_STAGE_MULTIPLIERS[clamped] ?? 1;
}

/** Compute effective stat from base stat and level (simplified Gen I, no IVs/EVs) */
export function calcStat(base: number, level: number): number {
  // Simplified: Stat = floor((Base * 2 * Level) / 100) + 5
  return Math.floor((base * 2 * level) / 100) + 5;
}

/** Compute effective stat from base stat, level, and battle stage boost */
export function calcStatWithBoost(base: number, level: number, stage: number): number {
  return Math.floor(calcStat(base, level) * getStageMultiplier(stage));
}

/** Default zero stat boosts */
export const ZERO_BOOSTS: StatBoosts = { attack: 0, defense: 0, special: 0, speed: 0 };

/** Compute effective HP from base HP stat and level */
export function calcHp(baseHp: number, level: number): number {
  // HP = floor((Base * 2 * Level) / 100) + Level + 10
  return Math.floor((baseHp * 2 * level) / 100) + level + 10;
}

function isPhysical(moveType: string): boolean {
  return PHYSICAL_TYPES.has(moveType);
}

/** Get type effectiveness multiplier for a move type vs a defender's type(s) */
export function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  let multiplier = 1;
  for (const defType of defenderTypes) {
    const chart = TYPE_CHART[moveType];
    if (chart && chart[defType] !== undefined) {
      multiplier *= chart[defType];
    }
  }
  return multiplier;
}

/** Get effectiveness label for battle log */
export function getEffectivenessLabel(multiplier: number): string | null {
  if (multiplier === 0) return 'no_effect';
  if (multiplier > 1) return 'super_effective';
  if (multiplier < 1) return 'not_very_effective';
  return null;
}

/**
 * Gen I-style accuracy check.
 * Uses a 0-255 roll and a truncated 255-based threshold, which preserves
 * the classic 1/256 miss chance even for nominal 100% accurate moves.
 */
export function doesMoveHit(accuracyPercent: number): boolean {
  const clamped = Math.max(1, Math.min(100, accuracyPercent));
  const threshold = Math.floor((clamped * 255) / 100);
  const roll = Math.floor(Math.random() * 256); // 0..255
  return roll < threshold;
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  effectiveness: number;
  effectivenessLabel: string | null;
}

/**
 * Gen I damage formula:
 * Damage = ((2×Level×Critical÷5+2)×Power×A÷D÷50+2)×STAB×Type1×Type2×random
 */
export function calculateDamage(
  attacker: Pokemon,
  defender: Pokemon,
  move: Move,
): DamageResult {
  // Status moves deal no damage
  if (move.power === 0) {
    return { damage: 0, isCritical: false, effectiveness: 1, effectivenessLabel: null };
  }

  const level = attacker.level;

  // Critical hit: Gen I uses base Speed / 512 chance (capped at ~99.6%)
  const baseSpeed = attacker.baseStats.speed;
  const critChance = Math.min(baseSpeed / 512, 0.996);
  const isCritical = Math.random() < critChance;
  const critical = isCritical ? 2 : 1;

  // Determine Attack and Defense stats based on physical/special
  const physical = isPhysical(move.type);
  let attackStat: number;
  let defenseStat: number;

  const aBoosts = attacker.statBoosts ?? ZERO_BOOSTS;
  const dBoosts = defender.statBoosts ?? ZERO_BOOSTS;

  // Crits ignore negative attack stages and positive defense stages (Gen I)
  if (physical) {
    const atkStage = isCritical ? Math.max(0, aBoosts.attack) : aBoosts.attack;
    const defStage = isCritical ? Math.min(0, dBoosts.defense) : dBoosts.defense;
    attackStat = calcStatWithBoost(attacker.baseStats.attack, isCritical ? level * 2 : level, atkStage);
    defenseStat = calcStatWithBoost(defender.baseStats.defense, isCritical ? level * 2 : level, defStage);
  } else {
    const spaStage = isCritical ? Math.max(0, aBoosts.special) : aBoosts.special;
    const spdStage = isCritical ? Math.min(0, dBoosts.special) : dBoosts.special;
    attackStat = calcStatWithBoost(attacker.baseStats.special, isCritical ? level * 2 : level, spaStage);
    defenseStat = calcStatWithBoost(defender.baseStats.special, isCritical ? level * 2 : level, spdStage);
  }

  // Gen I: if either A or D exceeds 255, both are divided by 4 and floored
  if (attackStat > 255 || defenseStat > 255) {
    attackStat = Math.floor(attackStat / 4);
    defenseStat = Math.floor(defenseStat / 4);
  }

  // Prevent division by zero
  defenseStat = Math.max(1, defenseStat);

  // STAB: 1.5 if move type matches attacker's type(s)
  const attackerTypes = attacker.types || [attacker.type];
  const stab = attackerTypes.includes(move.type) ? 1.5 : 1;

  // Type effectiveness against each of defender's types
  const defenderTypes = defender.types || [defender.type];
  const effectiveness = getTypeEffectiveness(move.type, defenderTypes);

  // If immune, no damage
  if (effectiveness === 0) {
    return { damage: 0, isCritical, effectiveness, effectivenessLabel: 'no_effect' };
  }

  // Main formula
  const baseDamage = Math.floor(
    Math.floor(
      Math.floor((2 * level * critical) / 5 + 2) * move.power * attackStat / defenseStat
    ) / 50 + 2
  );

  // Apply STAB and type effectiveness
  let finalDamage = Math.floor(Math.floor(baseDamage * stab) * effectiveness);

  // Random factor: integer between 217 and 255 (inclusive), divided by 255
  // If damage is 1, skip random
  if (finalDamage > 1) {
    const random = Math.floor(Math.random() * (255 - 217 + 1)) + 217;
    finalDamage = Math.floor(finalDamage * random / 255);
  }

  // Minimum 1 damage
  finalDamage = Math.max(1, finalDamage);

  return {
    damage: finalDamage,
    isCritical,
    effectiveness,
    effectivenessLabel: getEffectivenessLabel(effectiveness),
  };
}
