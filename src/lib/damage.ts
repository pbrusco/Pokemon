import { Pokemon, Move } from '../types';

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

/** Compute effective stat from base stat and level (simplified Gen I, no IVs/EVs) */
export function calcStat(base: number, level: number): number {
  // Simplified: Stat = floor((Base * 2 * Level) / 100) + 5
  return Math.floor((base * 2 * level) / 100) + 5;
}

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

  if (physical) {
    attackStat = calcStat(attacker.baseStats.attack, isCritical ? level * 2 : level);
    defenseStat = calcStat(defender.baseStats.defense, isCritical ? level * 2 : level);
  } else {
    attackStat = calcStat(attacker.baseStats.special, isCritical ? level * 2 : level);
    defenseStat = calcStat(defender.baseStats.special, isCritical ? level * 2 : level);
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
