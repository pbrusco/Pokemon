import type { Move, Pokemon } from '../types';
import { doesMoveHit, getStageMultiplier } from './damage';

export interface PreMoveStatusResult {
  action: 'skip' | 'recover' | 'pass';
  msg: string;
  newStatus?: Pokemon['status'];
}

/**
 * Centralized Gen I battle profile.
 * Keep all tuneable rule knobs in one place so authenticity changes are local.
 */
const GEN1_RULES = {
  sleepWakeChance: 0.3,
  fullParalysisChance: 0.25,
  freezeThawChance: 0.2,
} as const;

export function resolvePreMoveStatus(pkmn: Pokemon): PreMoveStatusResult {
  if (pkmn.status === 'sleep') {
    return Math.random() > GEN1_RULES.sleepWakeChance
      ? { action: 'skip', msg: `¡${pkmn.name} está profundamente dormido!` }
      : { action: 'recover', msg: `¡${pkmn.name} se ha despertado!`, newStatus: 'none' };
  }
  if (pkmn.status === 'paralyzed' && Math.random() < GEN1_RULES.fullParalysisChance) {
    return { action: 'skip', msg: `¡${pkmn.name} está paralizado! ¡No puede moverse!` };
  }
  if (pkmn.status === 'frozen') {
    return Math.random() < GEN1_RULES.freezeThawChance
      ? { action: 'recover', msg: `¡${pkmn.name} se ha descongelado!`, newStatus: 'none' }
      : { action: 'skip', msg: `¡${pkmn.name} está congelado!` };
  }
  return { action: 'pass', msg: '' };
}

export function moveHits(attacker: Pokemon, defender: Pokemon, move: Move): boolean {
  if (move.alwaysHit) return true;
  return doesMoveHit(
    move.accuracy,
    attacker.statBoosts?.accuracy ?? 0,
    defender.statBoosts?.evasion ?? 0,
  );
}

export function getEffectiveSpeed(pkmn: Pokemon): number {
  const stage = pkmn.statBoosts?.speed ?? 0;
  const stagedSpeed = pkmn.baseStats.speed * getStageMultiplier(stage);
  const paralysisMultiplier = pkmn.status === 'paralyzed' ? 0.25 : 1;
  return stagedSpeed * paralysisMultiplier;
}
