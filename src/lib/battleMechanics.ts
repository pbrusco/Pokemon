import type { Pokemon, Move } from '../types';
import {
  getTypeEffectiveness,
  ZERO_BOOSTS,
} from './damage';
import { EVOLUTIONS, expForLevel, baseExpFor } from '../constants/pokemon';
import { LEARNSET_DATABASE } from '../constants/moves';

import { withLeadPkmn } from './battleEngine';
import type { BattleState, BattleEffect, BattleSubPhase } from './battleEngine';

// ─── Log helper ──────────────────────────────────────────────────────────────

export function log(msg: string, speaker: string = 'Sistema'): BattleEffect {
  return { type: 'log', payload: msg, speaker };
}

// ─── Stat changes ────────────────────────────────────────────────────────────

export function applyStatChange(
  move: Move,
  attackerIsPlayer: boolean,
  playerTeam: Pokemon[],
  enemyPokemon: Pokemon,
  hasBoulderBadge: boolean,
  badgeBoostGlitchStacks: number,
): { playerTeam: Pokemon[]; enemyPokemon: Pokemon; msg: string | null; newGlitchStacks: number } {
  const sc = move.statChange;
  if (!sc) return { playerTeam, enemyPokemon, msg: null, newGlitchStacks: badgeBoostGlitchStacks };

  const targetIsPlayer = attackerIsPlayer ? sc.target === 'self' : sc.target === 'enemy';
  const statName = sc.stat;
  const stages = sc.stages;
  const statLabels: Record<string, string> = { attack: 'ATAQUE', defense: 'DEFENSA', special: 'ESPECIAL', speed: 'VELOCIDAD' };

  let newPlayerTeam = playerTeam;
  let newEnemyPokemon = enemyPokemon;
  let newGlitchStacks = badgeBoostGlitchStacks;

  if (targetIsPlayer) {
    const updated = [...playerTeam];
    const boosts = { ...(updated[0].statBoosts ?? ZERO_BOOSTS) };
    const oldVal = boosts[statName] ?? 0;
    const newVal = Math.max(-6, Math.min(6, oldVal + stages));
    boosts[statName] = newVal;
    updated[0] = { ...updated[0], statBoosts: boosts };
    newPlayerTeam = updated;
    if (hasBoulderBadge) newGlitchStacks = badgeBoostGlitchStacks + 1;

    if (oldVal === newVal) {
      const targetName = playerTeam[0]?.name;
      const verb = stages > 0 ? 'mejorar' : 'empeorar';
      return { playerTeam: newPlayerTeam, enemyPokemon, msg: `¡${targetName} ya no puede ${verb} más su ${statLabels[statName]}!`, newGlitchStacks };
    }
  } else {
    const boosts = { ...(enemyPokemon.statBoosts ?? ZERO_BOOSTS) };
    const oldVal = boosts[statName] ?? 0;
    const newVal = Math.max(-6, Math.min(6, oldVal + stages));
    boosts[statName] = newVal;
    newEnemyPokemon = { ...enemyPokemon, statBoosts: boosts };

    if (oldVal === newVal) {
      const verb = stages > 0 ? 'mejorar' : 'empeorar';
      return { playerTeam, enemyPokemon: newEnemyPokemon, msg: `¡${enemyPokemon.name} ya no puede ${verb} más su ${statLabels[statName]}!`, newGlitchStacks: badgeBoostGlitchStacks };
    }
  }

  const targetName = targetIsPlayer ? playerTeam[0]?.name : enemyPokemon.name;
  const dir = stages > 0 ? 'subió' : 'bajó';
  const amount = Math.abs(stages) === 1 ? '' : Math.abs(stages) === 2 ? ' mucho' : ' al máximo';
  const msg = `¡${targetName} ${dir} su ${statLabels[statName]}${amount}!`;

  return { playerTeam: newPlayerTeam, enemyPokemon: newEnemyPokemon, msg, newGlitchStacks };
}

export function clearBoosts(playerTeam: Pokemon[], enemyPokemon: Pokemon): { playerTeam: Pokemon[]; enemyPokemon: Pokemon } {
  return {
    playerTeam: playerTeam.map(p => ({ ...p, statBoosts: undefined })),
    enemyPokemon: { ...enemyPokemon, statBoosts: undefined },
  };
}

// ─── EXP / Level-up / Evolution ──────────────────────────────────────────────

function computeExpAndLevelUp(pkmn: Pokemon, expGain: number): {
  pkmn: Pokemon;
  didLevelUp: boolean;
  learnedMove: Move | null;
  willEvolve: boolean;
  evolvedPkmn: Pokemon | null;
} {
  let p = { ...pkmn };
  p.exp = (p.exp || 0) + expGain;

  let didLevelUp = false;
  let learnedMove: Move | null = null;

  let threshold = Math.max(1, expForLevel(p.level + 1, p.growthRate) - expForLevel(p.level, p.growthRate));
  p.expToNextLevel = threshold;

  while (p.exp >= p.expToNextLevel) {
    p.exp -= p.expToNextLevel;
    p.level += 1;
    threshold = Math.max(1, expForLevel(p.level + 1, p.growthRate) - expForLevel(p.level, p.growthRate));
    p.expToNextLevel = threshold;
    const newMaxHp = calcHp(p.baseStats.hp, p.level);
    p.hp = Math.min(p.hp + (newMaxHp - p.maxHp), newMaxHp);
    p.maxHp = newMaxHp;
    didLevelUp = true;
    const moveEntry = p.movesToLearn?.find(m => m.level === p.level);
    if (moveEntry && !p.moves.some(m => m.name === moveEntry.move.name)) {
      learnedMove = moveEntry.move;
      p.moves = p.moves.length < 4
        ? [...p.moves, moveEntry.move]
        : [moveEntry.move, ...p.moves.slice(1)];
    }
  }

  const willEvolve = didLevelUp
    && p.evolutionLevel != null
    && p.level >= p.evolutionLevel
    && p.evolvesTo != null;

  const evoData = willEvolve ? EVOLUTIONS[p.evolvesTo!] : null;
  let evolvedPkmn: Pokemon | null = null;
  if (evoData) {
    evolvedPkmn = { ...p, ...evoData };
    if (evoData.baseStats) {
      const evoMaxHp = calcHp(evoData.baseStats.hp, p.level);
      evolvedPkmn.hp = Math.min(p.hp + (evoMaxHp - p.maxHp), evoMaxHp);
      evolvedPkmn.maxHp = evoMaxHp;
    }
    const spriteMatch = evoData.sprite?.toString().match(/pokemon\/(\d+)/);
    const dexNum = spriteMatch ? parseInt(spriteMatch[1]) : null;
    const evoLearnset = dexNum != null ? LEARNSET_DATABASE[dexNum] : undefined;
    if (evoLearnset) evolvedPkmn.movesToLearn = evoLearnset;
    const evoMoveEntry = evolvedPkmn.movesToLearn?.find(m => m.level === p.level);
    if (evoMoveEntry && !evolvedPkmn.moves.some(m => m.name === evoMoveEntry.move.name)) {
      evolvedPkmn.moves = evolvedPkmn.moves.length < 4
        ? [...evolvedPkmn.moves, evoMoveEntry.move]
        : [evoMoveEntry.move, ...evolvedPkmn.moves.slice(1)];
      learnedMove = evoMoveEntry.move;
    }
  }

  return { pkmn: p, didLevelUp, learnedMove, willEvolve, evolvedPkmn };
}

// ─── Trainer AI ──────────────────────────────────────────────────────────────

function getUsefulMoves(attacker: Pokemon, defender: Pokemon): Move[] {
  const all = attacker.moves.filter(m => m.pp > 0 && m.name !== attacker.disabled?.moveName);
  const damaging = all.filter(m => m.power > 0);
  if (damaging.length > 0) return damaging;

  const defStatus = defender.status;
  const defTypes = defender.types ?? [defender.type];
  return all.filter(m => {
    if (m.statusEffect === 'sleep' && defStatus !== 'none') return false;
    if (m.statusEffect && defStatus === m.statusEffect) return false;
    if (m.statusEffect === 'poison' && defTypes.includes('poison')) return false;
    if (m.statusEffect === 'paralyzed' && defTypes.includes('electric')) return false;
    if (m.statusEffect === 'burn' && defTypes.includes('fire')) return false;
    if (m.statusEffect === 'frozen' && defTypes.includes('ice')) return false;
    return true;
  });
}

export function selectTrainerMove(attacker: Pokemon, defender: Pokemon): Move {
  const moves = getUsefulMoves(attacker, defender);
  if (moves.length === 0) return {
    name: 'FORCEJEO', type: 'normal', power: 50, accuracy: 100, pp: 99, maxPp: 99,
    sfxType: 'noise'
  };
  const damagingMoves = moves.filter(m => m.power > 0);
  if (damagingMoves.length === 0) return moves[Math.floor(Math.random() * moves.length)];

  const scored = damagingMoves.map(m => ({
    move: m,
    score: m.power * getTypeEffectiveness(m.type, defender.types ?? []),
  }));
  scored.sort((a, b) => b.score - a.score);

  if (Math.random() < 0.7) {
    return scored[0].move;
  }
  return damagingMoves[Math.floor(Math.random() * damagingMoves.length)];
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export function enemyNameDisplay(pkmn: Pokemon): string {
  return pkmn.name.startsWith('RIVAL ')
    ? `El ${pkmn.name.replace('RIVAL ', '')} rival`
    : pkmn.name;
}

function calcHp(baseStat: number, level: number): number {
  return Math.floor(((baseStat + 50) * level) / 50) + 10;
}

// ─── Enemy fainted: EXP / level-up / evolution / next-pokémon ────────────────

export function handleEnemyFainted(
  s: BattleState,
  playerPkmn: Pokemon,
  effects: BattleEffect[],
): { s: BattleState; effects: BattleEffect[] } {
  const trainerMult = s.isTrainerBattle ? 1.5 : 1;
  const baseExp = s.enemyPokemon.baseExp ?? baseExpFor(s.enemyPokemon.id);
  const livingParticipants = s.participantUids
    .filter(uid => s.playerTeam.some(p => p.uid === uid && p.hp > 0))
    .length;
  const denom = Math.max(1, livingParticipants);
  const expGain = Math.max(1, Math.floor((trainerMult * baseExp * s.enemyPokemon.level) / (7 * denom)));
  const { pkmn: leveledPkmn, didLevelUp, learnedMove, willEvolve, evolvedPkmn } = computeExpAndLevelUp(playerPkmn, expGain);

  // Order: log "fainted!" → FAINT sound (parallel) → faint anim (HP sync) → EXP log.
  effects.push(log(`¡${s.enemyPokemon.name} se debilitó!`));
  effects.push({ type: 'sound', payload: 'FAINT' });
  effects.push({ type: 'enemy_anim', payload: 'faint' });
  effects.push(log(`¡${playerPkmn.name} ganó ${expGain} puntos de EXP!`));

  s = withLeadPkmn(s, () => leveledPkmn);
  let nextPhase: BattleSubPhase = 'ENEMY_FAINTED';

  s = { ...s, log: `¡${playerPkmn.name} ganó ${expGain} puntos de EXP!`, phase: nextPhase };

  if (didLevelUp) {
    effects.push(log(`¡${leveledPkmn.name} subió al nivel ${leveledPkmn.level}!`));
    s = { ...s, log: `¡${leveledPkmn.name} subió al nivel ${leveledPkmn.level}!`, phase: 'LEVEL_UP' };

    if (learnedMove) {
      effects.push(log(`¡${leveledPkmn.name} aprendió ${learnedMove.name}!`));
    }

    if (willEvolve && evolvedPkmn) {
      effects.push(log(`¡¿Qué?! ¡${leveledPkmn.name} está evolucionando!`));
      s = withLeadPkmn(s, () => evolvedPkmn);
      s = { ...s, log: `¡Felicidades! ¡${evolvedPkmn.name} ha evolucionado!`, phase: 'EVOLVING', preEvoSprite: leveledPkmn.sprite, evoSprite: evolvedPkmn.sprite };
    }
  }

  const nextEnemyIdx = s.currentEnemyIndex + 1;
  if (s.isTrainerBattle && nextEnemyIdx < s.enemyTeam.length) {
    const nextEnemy = s.enemyTeam[nextEnemyIdx];
    const trainerLabel = s.trainerName || 'El entrenador';
    effects.push(log(`¡${trainerLabel} saca a ${nextEnemy.name}!`));
    const cleared = clearBoosts(s.playerTeam, s.enemyPokemon);
    const freshParticipants = cleared.playerTeam[0].hp > 0 ? [cleared.playerTeam[0].uid!] : [];
    s = { ...s, playerTeam: cleared.playerTeam, currentEnemyIndex: nextEnemyIdx, badgeBoostGlitchStacks: 0, log: `¡${trainerLabel} saca a ${nextEnemy.name}!`, phase: 'TRAINER_NEXT_POKEMON', participantUids: freshParticipants };
  } else {
    const cleared = clearBoosts(s.playerTeam, s.enemyPokemon);
    s = { ...s, playerTeam: cleared.playerTeam, enemyPokemon: cleared.enemyPokemon, badgeBoostGlitchStacks: 0, outcome: 'player_win' };
  }

  return { s, effects };
}

// ─── End-of-turn effects: poison / burn / leech seed / trap ──────────────────

export function handleEndOfTurnEffects(
  s: BattleState,
  effects: BattleEffect[],
): BattleState {
  if (s.enemyPokemon.disabled && s.enemyPokemon.disabled.turns > 0) {
    s = { ...s, enemyPokemon: { ...s.enemyPokemon, disabled: { ...s.enemyPokemon.disabled, turns: s.enemyPokemon.disabled.turns - 1 } } };
  }
  if (s.enemyPokemon.disabled && s.enemyPokemon.disabled.turns <= 0) {
    s = { ...s, enemyPokemon: { ...s.enemyPokemon, disabled: undefined } };
  }
  if (s.playerTeam[0]?.status === 'poison' && s.playerTeam[0]?.hp > 0) {
    const turns = (s.playerTeam[0].toxicTurns || 0) + 1;
    const chip = s.playerTeam[0].toxicTurns
      ? Math.max(1, Math.floor(s.playerTeam[0].maxHp * turns / 16))
      : Math.max(1, Math.floor(s.playerTeam[0].maxHp / 16));
    const newHp = Math.max(0, s.playerTeam[0].hp - chip);
    s = withLeadPkmn(s, p => ({ ...p, hp: newHp, toxicTurns: s.playerTeam[0].toxicTurns ? turns : undefined }));
    effects.push(log(`¡${s.playerTeam[0].name} recibe daño por veneno!`));
    if (newHp === 0) { s = { ...s, phase: 'PLAYER_FAINTED' }; }
  }
  if (s.playerTeam[0]?.status === 'burn' && s.playerTeam[0]?.hp > 0) {
    const chip = Math.max(1, Math.floor(s.playerTeam[0].maxHp / 16));
    const newHp = Math.max(0, s.playerTeam[0].hp - chip);
    s = withLeadPkmn(s, p => ({ ...p, hp: newHp }));
    effects.push(log(`¡${s.playerTeam[0].name} recibe daño por quemaduras!`));
    if (newHp === 0) { s = { ...s, phase: 'PLAYER_FAINTED' }; }
  }
  if (s.playerTeam[0]?.leechSeed && s.playerTeam[0]?.hp > 0) {
    const seedChip = Math.max(1, Math.floor(s.playerTeam[0].maxHp / 16));
    const newHp = Math.max(0, s.playerTeam[0].hp - seedChip);
    const healedAmount = Math.min(seedChip, s.enemyPokemon.maxHp - s.enemyPokemon.hp);
    s = withLeadPkmn(s, p => ({ ...p, hp: newHp }));
    effects.push(log(`¡${s.playerTeam[0].name} pierde vida por DRENADORAS!`));
    s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: s.enemyPokemon.hp + healedAmount } };
    if (newHp === 0) { s = { ...s, phase: 'PLAYER_FAINTED' }; }
  }
  if (s.enemyPokemon.status === 'poison' && s.enemyPokemon.hp > 0) {
    const eTurns = (s.enemyPokemon.toxicTurns || 0) + 1;
    const eChip = s.enemyPokemon.toxicTurns
      ? Math.max(1, Math.floor(s.enemyPokemon.maxHp * eTurns / 16))
      : Math.max(1, Math.floor(s.enemyPokemon.maxHp / 16));
    s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: Math.max(0, s.enemyPokemon.hp - eChip), toxicTurns: s.enemyPokemon.toxicTurns ? eTurns : undefined } };
    effects.push(log(`¡${s.enemyPokemon.name} recibe daño por veneno!`));
  }
  if (s.enemyPokemon.status === 'burn' && s.enemyPokemon.hp > 0) {
    const chip = Math.max(1, Math.floor(s.enemyPokemon.maxHp / 16));
    s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: Math.max(0, s.enemyPokemon.hp - chip) } };
    effects.push(log(`¡${s.enemyPokemon.name} recibe daño por quemaduras!`));
  }
  if (s.enemyPokemon.leechSeed && s.enemyPokemon.hp > 0) {
    const seedChip = Math.max(1, Math.floor(s.enemyPokemon.maxHp / 16));
    const newEnemyHp = Math.max(0, s.enemyPokemon.hp - seedChip);
    const healedToPlayer = Math.min(seedChip, Math.max(0, s.playerTeam[0].maxHp - s.playerTeam[0].hp));
    s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: newEnemyHp } };
    if (healedToPlayer > 0) {
      s = withLeadPkmn(s, p => ({ ...p, hp: p.hp + healedToPlayer }));
    }
    effects.push(log(`¡${s.enemyPokemon.name} pierde vida por DRENADORAS!`));
  }
  if (s.playerTeam[0]?.trapped && s.playerTeam[0]?.hp > 0) {
    s.playerTeam[0].trapped.remainingTurns -= 1;
    const remaining = s.playerTeam[0].trapped.remainingTurns;
    const trapChip = Math.max(1, Math.floor(s.playerTeam[0].maxHp / 16));
    const newHp = Math.max(0, s.playerTeam[0].hp - trapChip);
    s = withLeadPkmn(s, p => ({ ...p, hp: newHp, trapped: remaining > 0 ? { ...p.trapped!, remainingTurns: remaining } : undefined }));
    effects.push(log(`¡${s.playerTeam[0].name} recibe daño por el ataque continuo!`));
    if (newHp === 0) { s = { ...s, phase: 'PLAYER_FAINTED' }; }
  }
  if (s.enemyPokemon.trapped && s.enemyPokemon.hp > 0) {
    s.enemyPokemon.trapped.remainingTurns -= 1;
    const trapChip = Math.max(1, Math.floor(s.enemyPokemon.maxHp / 16));
    const newEnemyHp = Math.max(0, s.enemyPokemon.hp - trapChip);
    s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: newEnemyHp,
      trapped: s.enemyPokemon.trapped.remainingTurns > 0 ? s.enemyPokemon.trapped : undefined } };
    effects.push(log(`¡${s.enemyPokemon.name} recibe daño por el ataque continuo!`));
  }
  return s;
}
