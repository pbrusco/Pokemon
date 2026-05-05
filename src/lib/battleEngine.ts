/**
 * battleEngine.ts — Pure battle state machine
 *
 * Takes a BattleState + BattleAction and returns the next BattleState
 * plus a list of side-effect descriptors (animations, sounds).
 * No React, no setTimeout, no Zustand — fully testable.
 *
 * The TICK action advances the machine past an intermediate phase,
 * replacing what setTimeout callbacks do in App.tsx.
 */

import type { Pokemon, Move, InventoryCounts } from '../types';
import {
  calculateDamage,
  doesMoveHit,
  calcHp,
  ZERO_BOOSTS,
  getTypeEffectiveness,
  type DamageResult,
} from './damage';
import { EVOLUTIONS, expForLevel, baseExpFor } from '../constants/pokemon';
import { LEARNSET_DATABASE } from '../constants/moves';
import { applyItemToPokemon } from './itemUtils';

// ─── Types ───────────────────────────────────────────────────────────────────

type BattleOutcome =
  | 'ongoing'
  | 'player_win'
  | 'player_blackout'
  | 'fled'
  | 'caught';

type EffectType =
  | 'sound'
  | 'player_anim'
  | 'enemy_anim'
  | 'screen_flash'
  | 'battle_shake'
  | 'log';

export interface BattleEffect {
  type: EffectType;
  payload?: string | number;
  speaker?: string;
  moveName?: string;
  moveType?: string;
}

type BattleSubPhase =
  | 'CHOOSING'
  | 'PLAYER_ATTACK'
  | 'ENEMY_ATTACK'
  | 'PLAYER_FAINTED'
  | 'FORCED_SWITCH'
  | 'ENEMY_FAINTED'
  | 'CATCHING'
  | 'LEVEL_UP'
  | 'EVOLVING'
  | 'BATTLE_INVENTORY'
  | 'BATTLE_TEAM'
  | 'BATTLE_ITEM_TEAM_SELECT'
  | 'TRAINER_NEXT_POKEMON';

export interface BattleState {
  playerTeam: Pokemon[];
  enemyPokemon: Pokemon;
  enemyTeam: Pokemon[];
  currentEnemyIndex: number;
  trainerName: string;
  phase: BattleSubPhase;
  isTrainerBattle: boolean;
  inventory: InventoryCounts;
  pcStorage: Pokemon[];
  log: string;
  outcome: BattleOutcome;
  /** Gen I badge-boost glitch stacks (each stat-change while BOULDER badge held adds one) */
  badgeBoostGlitchStacks: number;
  hasBoulderBadge: boolean;
  /**
   * Uids of player Pokémon that have participated in the current enemy fight.
   * Used to split EXP in the Gen I formula. Reset when a new enemy Pokémon appears.
   */
  participantUids: string[];
}

export type BattleAction =
  | { type: 'ATTACK'; move: Move }
  | { type: 'USE_ITEM'; itemId: string; targetIndex: number }
  | { type: 'SWITCH'; index: number }
  | { type: 'FLEE' }
  | { type: 'CATCH' }
  | { type: 'CHEAT_KO' }
  /** Advance the state machine past an intermediate phase (replaces setTimeout callbacks) */
  | { type: 'TICK' };

interface BattleResult {
  state: BattleState;
  effects: BattleEffect[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg: string, speaker: string = 'Sistema'): BattleEffect {
  return { type: 'log', payload: msg, speaker };
}

function applyStatChange(
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

function clearBoosts(playerTeam: Pokemon[], enemyPokemon: Pokemon): { playerTeam: Pokemon[]; enemyPokemon: Pokemon } {
  return {
    playerTeam: playerTeam.map(p => ({ ...p, statBoosts: undefined })),
    enemyPokemon: { ...enemyPokemon, statBoosts: undefined },
  };
}

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

function selectTrainerMove(attacker: Pokemon, defender: Pokemon): Move {
  const moves = attacker.moves.filter(m => m.pp > 0);
  if (moves.length === 0) return {
    name: 'FORCEJEO', type: 'normal', power: 50, accuracy: 100, pp: 99, maxPp: 99,
    sfxType: 'noise'
  };
  const damagingMoves = moves.filter(m => m.power > 0);
  if (damagingMoves.length === 0) return moves[Math.floor(Math.random() * moves.length)];

  // Score each damaging move: prefer super-effective, then higher base power
  const scored = damagingMoves.map(m => {
    const effectiveness = getTypeEffectiveness(m.type, defender.types ?? []);
    return { move: m, score: m.power * effectiveness };
  });
  scored.sort((a, b) => b.score - a.score);

  // 70% chance to pick the best move, 30% chance to pick randomly among damaging moves
  if (Math.random() < 0.7) {
    return scored[0].move;
  }
  return damagingMoves[Math.floor(Math.random() * damagingMoves.length)];
}

// ─── Main Reducer ─────────────────────────────────────────────────────────────

export function stepBattle(state: BattleState, action: BattleAction): BattleResult {
  const effects: BattleEffect[] = [];
  let s = { ...state };

  switch (action.type) {

    // ── ATTACK ──────────────────────────────────────────────────────────────
    case 'ATTACK': {
      if (s.phase !== 'CHOOSING') return { state, effects };
      let move = action.move;
      let playerPkmn = s.playerTeam[0];

      // Bide check: locked during accumulation turns
      if (playerPkmn.bideState) {
        if (playerPkmn.bideState.remainingTurns > 1) {
          effects.push(log(`¡${playerPkmn.name} está acumulando energía!`));
          s = { ...s, log: `¡${playerPkmn.name} está acumulando energía!`, phase: 'ENEMY_ATTACK' };
          return { state: s, effects };
        }
        // Release turn: deal 2x accumulated
        const bideDmg = Math.max(1, playerPkmn.bideState.accumulatedDamage * 2);
        const bideTeam = [...s.playerTeam];
        bideTeam[0] = { ...bideTeam[0], bideState: undefined };
        effects.push({ type: 'player_anim', payload: 'attack', moveName: 'ESPERA', moveType: 'normal' });
        effects.push({ type: 'enemy_anim', payload: 'hit' });
        effects.push({ type: 'screen_flash' });
        effects.push({ type: 'battle_shake' });
        effects.push(log(`¡${playerPkmn.name} desató la energía! Causó ${bideDmg} de daño.`));
        const bideNewHP = Math.max(0, s.enemyPokemon.hp - bideDmg);
        s = { ...s, playerTeam: bideTeam, enemyPokemon: { ...s.enemyPokemon, hp: bideNewHP }, log: `¡ESPERA desató ${bideDmg} de daño!`, phase: bideNewHP === 0 ? 'ENEMY_FAINTED' : 'ENEMY_ATTACK' };
        if (bideNewHP === 0) {
          effects.push(log(`¡${s.enemyPokemon.name} se debilitó!`));
          effects.push({ type: 'enemy_anim', payload: 'faint' });
        }
        return { state: s, effects };
      }

      // Rage: auto-lock move
      if (playerPkmn.rageActive && move.name !== 'FURIA') {
        move = playerPkmn.moves.find(m => m.name === 'FURIA') || move;
      }

      if (move.pp <= 0) {
        const totalPP = playerPkmn.moves.reduce((sum, m) => sum + m.pp, 0);
        if (totalPP <= 0) {
          move = { name: 'FORCEJEO', type: 'normal', power: 50, accuracy: 100, pp: 99, maxPp: 99, sfxType: 'noise' };
          effects.push(log(`¡${playerPkmn.name} no tiene movimientos! ¡Usa FORCEJEO!`));
        } else {
          return { state, effects };
        }
      }

      // Deduct PP
      const updatedTeam = [...s.playerTeam];
      updatedTeam[0] = {
        ...updatedTeam[0],
        moves: updatedTeam[0].moves.filter(Boolean).map(m => m.name === move.name ? { ...m, pp: m.pp - 1 } : m),
      };
      s = { ...s, playerTeam: updatedTeam, phase: 'PLAYER_ATTACK' };

      // Confusion check (before sleep/para — Gen I behavior)
      const confused = playerPkmn.confused;
      if (confused && confused.turns > 0) {
        const updatedConfused = { ...confused, turns: confused.turns - 1 };
        const confusedTeam = [...s.playerTeam];
        confusedTeam[0] = { ...confusedTeam[0], confused: updatedConfused };
        if (Math.random() < 0.5) {
          const selfDmg = Math.max(1, Math.floor(((((2 * playerPkmn.level / 5 + 2) * 40 * playerPkmn.baseStats.attack) / playerPkmn.baseStats.defense) / 50 + 2) * (217 + Math.floor(Math.random() * 39)) / 255));
          const newHp = Math.max(0, playerPkmn.hp - selfDmg);
          confusedTeam[0] = { ...confusedTeam[0], hp: newHp };
          effects.push(log(`¡${playerPkmn.name} se golpeó a sí mismo por la confusión!`));
          s = { ...s, playerTeam: confusedTeam, log: `¡${playerPkmn.name} se golpeó a sí mismo!`, phase: newHp === 0 ? 'PLAYER_FAINTED' : 'ENEMY_ATTACK' };
          return { state: s, effects };
        }
        s = { ...s, playerTeam: confusedTeam };
      }

      // Hyper Beam recharge
      if (playerPkmn.recharging) {
        effects.push(log(`¡${playerPkmn.name} debe recargar!`));
        s = { ...s, playerTeam: s.playerTeam.map((p,i) => i === 0 ? { ...p, recharging: false } : p), log: `¡${playerPkmn.name} debe recargar!`, phase: 'ENEMY_ATTACK' };
        return { state: s, effects };
      }

      // Rampage lock (Thrash / Petal Dance)
      if (playerPkmn.rampage) {
        move = playerPkmn.rampage.move;
        const newRemaining = playerPkmn.rampage.remainingTurns - 1;
        const rampageTeam = [...s.playerTeam];
        if (newRemaining <= 0) {
          rampageTeam[0] = { ...rampageTeam[0], rampage: undefined, confused: { turns: 2 + Math.floor(Math.random() * 4) } };
          effects.push(log(`¡${playerPkmn.name} se confundió de tanto atacar!`));
        } else {
          rampageTeam[0] = { ...rampageTeam[0], rampage: { ...playerPkmn.rampage, remainingTurns: newRemaining } };
        }
        s = { ...s, playerTeam: rampageTeam };
      }

      // Two-turn move: charging turn
      if (playerPkmn.charging) {
        if (move.twoTurn) {
          effects.push(log(`¡${playerPkmn.name} ${move.twoTurn.chargeMessage}`));
          s = { ...s, phase: 'ENEMY_ATTACK' };
          return { state: s, effects };
        }
      }

      // Status check: Sleep
      if (playerPkmn.status === 'sleep') {
        const wakeUp = Math.random() > 0.3 ? false : true; // 70% stays asleep
        if (!wakeUp) {
          effects.push(log(`¡${playerPkmn.name} está profundamente dormido!`));
          s = { ...s, log: `¡${playerPkmn.name} está profundamente dormido!`, phase: 'ENEMY_ATTACK' };
          return { state: s, effects };
        } else {
          effects.push(log(`¡${playerPkmn.name} se ha despertado!`));
          const wokenTeam = [...s.playerTeam];
          wokenTeam[0] = { ...wokenTeam[0], status: 'none' };
          s = { ...s, playerTeam: wokenTeam };
        }
      }

      // Status check: Paralysis (25% skip)
      if (playerPkmn.status === 'paralyzed' && Math.random() < 0.25) {
        effects.push(log(`¡${playerPkmn.name} está paralizado! ¡No puede moverse!`));
        s = { ...s, log: `¡${playerPkmn.name} está paralizado! ¡No puede moverse!`, phase: 'ENEMY_ATTACK' };
        return { state: s, effects };
      }

      // Status check: Frozen (unfreeze 20% or skip)
      if (playerPkmn.status === 'frozen') {
        const thaw = Math.random() < 0.2;
        if (thaw) {
          effects.push(log(`¡${playerPkmn.name} se ha descongelado!`));
          const thawedTeam = [...s.playerTeam];
          thawedTeam[0] = { ...thawedTeam[0], status: 'none' };
          s = { ...s, playerTeam: thawedTeam };
        } else {
          effects.push(log(`¡${playerPkmn.name} está congelado!`));
          s = { ...s, log: `¡${playerPkmn.name} está congelado!`, phase: 'ENEMY_ATTACK' };
          return { state: s, effects };
        }
      }

      // ── Turn order: compare speed + priority ────────────────────────────
      const enemyMove = s.isTrainerBattle
        ? selectTrainerMove(s.enemyPokemon, playerPkmn)
        : (s.enemyPokemon.moves.filter(m => m.pp > 0).length > 0
            ? s.enemyPokemon.moves.filter(m => m.pp > 0)[Math.floor(Math.random() * s.enemyPokemon.moves.filter(m => m.pp > 0).length)]
            : { name: 'FORCEJEO', type: 'normal', power: 50, accuracy: 100, pp: 99, maxPp: 99, sfxType: 'noise' } as Move);

      const playerEffSpeed = playerPkmn.baseStats.speed * (playerPkmn.status === 'paralyzed' ? 0.25 : 1);
      const enemyEffSpeed = s.enemyPokemon.baseStats.speed * (s.enemyPokemon.status === 'paralyzed' ? 0.25 : 1);
      const playerPri = move.priority ?? 0;
      const enemyPri = enemyMove.priority ?? 0;

      let enemyAlreadyAttacked = false;

      if (enemyPri > playerPri
        || (enemyPri === playerPri && enemyEffSpeed > playerEffSpeed)
        || (enemyPri === playerPri && enemyEffSpeed === playerEffSpeed && Math.random() < 0.5)) {

        enemyAlreadyAttacked = true;

        // Enemy status checks
        let enemyCanMove = true;
        if (s.enemyPokemon.status === 'sleep') {
          if (Math.random() > 0.3) {
            effects.push(log(`¡${s.enemyPokemon.name} está profundamente dormido!`));
            enemyCanMove = false;
          } else {
            effects.push(log(`¡${s.enemyPokemon.name} se ha despertado!`));
            s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: 'none' } };
          }
        }
        if (enemyCanMove && s.enemyPokemon.status === 'paralyzed' && Math.random() < 0.25) {
          effects.push(log(`¡${s.enemyPokemon.name} está paralizado! ¡No puede moverse!`));
          enemyCanMove = false;
        }
        if (enemyCanMove && s.enemyPokemon.status === 'frozen') {
          if (Math.random() < 0.2) {
            effects.push(log(`¡${s.enemyPokemon.name} se ha descongelado!`));
            s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: 'none' } };
          } else {
            effects.push(log(`¡${s.enemyPokemon.name} está congelado!`));
            enemyCanMove = false;
          }
        }

        if (enemyCanMove) {
          effects.push({ type: 'enemy_anim', payload: 'attack', moveName: enemyMove.name, moveType: enemyMove.type });

          if (!doesMoveHit(enemyMove.accuracy, s.enemyPokemon.statBoosts?.accuracy ?? 0,
              playerPkmn.statBoosts?.evasion ?? 0)) {
            effects.push(log(`¡${s.enemyPokemon.name} usó ${enemyMove.name}! ¡Pero falló!`));
          } else if (enemyMove.power === 0) {
            let moveLog2 = `¡${s.enemyPokemon.name} usó ${enemyMove.name}!`;
            const sc = applyStatChange(enemyMove, false, s.playerTeam, s.enemyPokemon,
              s.hasBoulderBadge, s.badgeBoostGlitchStacks);
            if (sc.msg) moveLog2 += ' ' + sc.msg;
            s = { ...s, playerTeam: sc.playerTeam, enemyPokemon: sc.enemyPokemon,
              badgeBoostGlitchStacks: sc.newGlitchStacks };
            if (enemyMove.statusEffect && Math.random() * 100 < (enemyMove.statusChance || 100)) {
              const ut = [...s.playerTeam];
              ut[0] = { ...ut[0], status: enemyMove.statusEffect };
              s = { ...s, playerTeam: ut };
              moveLog2 += ` ¡${playerPkmn.name} ahora está ${enemyMove.statusEffect}!`;
            }
            effects.push(log(moveLog2, s.enemyPokemon.name));
          } else {
            const enemyResult = calculateDamage(s.enemyPokemon, playerPkmn, enemyMove);
            const enemyDmg = enemyResult.damage;
            const newPlayerHP = Math.max(0, playerPkmn.hp - enemyDmg);
            effects.push({ type: 'player_anim', payload: 'hit' });
            effects.push({ type: 'screen_flash' });
            effects.push({ type: 'battle_shake' });
            const eName = s.enemyPokemon.name.startsWith('RIVAL ')
              ? `El ${s.enemyPokemon.name.replace('RIVAL ', '')} rival`
              : s.enemyPokemon.name;
            let enemyLog = `¡${eName} usó ${enemyMove.name}!`;
            if (enemyResult.effectivenessLabel === 'no_effect') {
              enemyLog += ` No afecta a ${playerPkmn.name}...`;
            } else {
              if (enemyResult.isCritical) enemyLog += ' ¡Golpe crítico!';
              if (enemyResult.effectivenessLabel === 'super_effective') enemyLog += ' ¡Es supereficaz!';
              if (enemyResult.effectivenessLabel === 'not_very_effective') enemyLog += ' No es muy eficaz...';
              enemyLog += ` Causó ${enemyDmg} de daño.`;
            }
            const ut = [...s.playerTeam];
            // Store physical damage for Counter + Rage tracking
            if (['normal','fighting','rock','ground','ghost','bug','poison','flying','ice'].includes(enemyMove.type)) {
              ut[0] = { ...ut[0], hp: newPlayerHP, lastPhysicalDamage: enemyDmg };
              if (ut[0].rageActive) {
                ut[0] = { ...ut[0], statBoosts: { ...(ut[0].statBoosts ?? ZERO_BOOSTS), attack: Math.min(6, (ut[0].statBoosts?.attack ?? 0) + 1) } };
              }
            } else {
              ut[0] = { ...ut[0], hp: newPlayerHP };
            }
            if (enemyMove.statusEffect && Math.random() * 100 < (enemyMove.statusChance || 100)) {
              ut[0].status = enemyMove.statusEffect;
              enemyLog += ` ¡${playerPkmn.name} ahora está ${enemyMove.statusEffect}!`;
            }
            // Track bide accumulation
            if (ut[0].bideState) {
              ut[0].bideState.accumulatedDamage += enemyDmg;
              ut[0].bideState.remainingTurns -= 1;
            }
            effects.push(log(enemyLog, s.enemyPokemon.name));
            s = { ...s, playerTeam: ut, log: enemyLog };
          }
        }

        playerPkmn = s.playerTeam[0];
        if (playerPkmn.hp === 0) {
          const anyAlive = s.playerTeam.slice(1).some(p => p.hp > 0);
          effects.push({ type: 'player_anim', payload: 'faint' });
          effects.push({ type: 'sound', payload: 'FAINT' });
          if (!anyAlive) {
            const blackoutLog = `¡${playerPkmn.name} se debilitó! ¡No te quedan POKÉMON sanos!`;
            effects.push(log(blackoutLog));
            s = { ...s, log: blackoutLog, outcome: 'player_blackout', phase: 'PLAYER_FAINTED' };
          } else {
            const faintLog = `¡${playerPkmn.name} se debilitó! ¡Elige tu siguiente POKÉMON!`;
            effects.push(log(faintLog));
            s = { ...s, log: faintLog, phase: 'FORCED_SWITCH' };
          }
          return { state: s, effects };
        }
      }

      // Accuracy check (player attacker accuracy stage vs enemy evasion stage)
      if (!doesMoveHit(move.accuracy, playerPkmn.statBoosts?.accuracy ?? 0, s.enemyPokemon.statBoosts?.evasion ?? 0)) {
        const missLog = `¡${playerPkmn.name} usó ${move.name}! ¡Pero falló!`;
        effects.push(log(missLog));
        s = { ...s, log: missLog, phase: 'ENEMY_ATTACK' };
        return { state: s, effects };
      }

      // Status / Stat-change move (no damage)
      if (move.power === 0) {
        let moveLog = `¡${playerPkmn.name} usó ${move.name}!`;
        const sc = applyStatChange(move, true, s.playerTeam, s.enemyPokemon, s.hasBoulderBadge, s.badgeBoostGlitchStacks);
        if (sc.msg) moveLog += ' ' + sc.msg;
        s = { ...s, playerTeam: sc.playerTeam, enemyPokemon: sc.enemyPokemon, badgeBoostGlitchStacks: sc.newGlitchStacks };

        // Leech Seed
        if (move.name === 'DRENADORAS') {
          if (s.enemyPokemon.leechSeed) {
            moveLog += ' ¡Pero ya está afectado!';
          } else {
            s = { ...s, enemyPokemon: { ...s.enemyPokemon, leechSeed: true } };
            moveLog += ` ¡${s.enemyPokemon.name} fue sembrado!`;
          }
        }

        // Confuse
        if (move.confuseChance && Math.random() * 100 < (move.confuseChance)) {
          s = { ...s, enemyPokemon: { ...s.enemyPokemon, confused: { turns: 2 + Math.floor(Math.random() * 4) } } };
          moveLog += ` ¡${s.enemyPokemon.name} está confuso!`;
        }

        if (move.statusEffect && Math.random() * 100 < (move.statusChance || 100)) {
          s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: move.statusEffect } };
          moveLog += ` ¡${s.enemyPokemon.name} ahora está ${move.statusEffect}!`;
        }
        effects.push(log(moveLog, playerPkmn.name));
        s = { ...s, log: moveLog, phase: 'ENEMY_ATTACK' };
        return { state: s, effects };
      }

      // OHKO moves (Fissure, Guillotine, Horn Drill)
      if (move.ohko) {
        if (s.enemyPokemon.level > playerPkmn.level) {
          effects.push(log('¡No afecta al POKÉMON enemigo!'));
          s = { ...s, phase: 'ENEMY_ATTACK' };
          return { state: s, effects };
        }
        let ohkoAcc = 30 + (playerPkmn.level - s.enemyPokemon.level);
        if (ohkoAcc < 0) ohkoAcc = 0;
        if (Math.random() * 100 >= ohkoAcc) {
          const missLog = `¡${playerPkmn.name} usó ${move.name}! ¡Pero falló!`;
          effects.push(log(missLog));
          s = { ...s, log: missLog, phase: 'ENEMY_ATTACK' };
          return { state: s, effects };
        }
        effects.push({ type: 'player_anim', payload: 'attack', moveName: move.name, moveType: move.type });
        effects.push({ type: 'enemy_anim', payload: 'hit' });
        effects.push({ type: 'screen_flash' });
        effects.push({ type: 'battle_shake' });
        effects.push(log(`¡${playerPkmn.name} usó ${move.name}! ¡Golpe fulminante!`));
        s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: 0 }, phase: 'ENEMY_ATTACK' };
        return { state: s, effects };
      }

      // Damage move
      let damage: number;
      let result: DamageResult;

      // Super Fang: half current HP (min 1)
      if (move.halfHp) {
        damage = Math.max(1, Math.floor(s.enemyPokemon.hp / 2));
        result = { damage, isCritical: false, effectiveness: 1, effectivenessLabel: 'normal' };
      } else if (move.name === 'CONTRAATAQUE') {
        const physAtk = playerPkmn.lastPhysicalDamage || 0;
        damage = physAtk * 2;
        result = { damage, isCritical: false, effectiveness: 1, effectivenessLabel: 'normal' };
      } else if (move.fixedDmg) {
        damage = move.fixedDmg;
        const eff = getTypeEffectiveness(move.type, s.enemyPokemon.types ?? [s.enemyPokemon.type]);
        const effLabel = eff === 0 ? 'no_effect' : 'normal';
        result = { damage, isCritical: false, effectiveness: eff, effectivenessLabel: effLabel };
      } else if (move.dmgEqualsLevel) {
        damage = playerPkmn.level;
        const eff = getTypeEffectiveness(move.type, s.enemyPokemon.types ?? [s.enemyPokemon.type]);
        const effLabel = eff === 0 ? 'no_effect' : 'normal';
        result = { damage, isCritical: false, effectiveness: eff, effectivenessLabel: effLabel };
      } else {
        const attackMultiplier = s.hasBoulderBadge ? 1 + s.badgeBoostGlitchStacks * 0.125 : 1;
        const attackerWithGlitch = attackMultiplier > 1
          ? { ...playerPkmn, baseStats: { ...playerPkmn.baseStats, attack: Math.floor(playerPkmn.baseStats.attack * attackMultiplier) } }
          : playerPkmn;

        // Multi-hit: determine number of hits
        let numHits = 1;
        if (move.multiHit) {
          const range = move.multiHit.maxHits - move.multiHit.minHits + 1;
          numHits = move.multiHit.minHits + Math.floor(Math.random() * range);
        }

        // Two-turn execution: complete the charge
        if (move.twoTurn) {
          const unchargedTeam = [...s.playerTeam];
          unchargedTeam[0] = { ...unchargedTeam[0], charging: undefined };
          s = { ...s, playerTeam: unchargedTeam };
        }

        let totalDmg = 0;
        let effLabel: string | null = 'normal';
        let eff = 1;
        let anyCrit = false;
        for (let h = 0; h < numHits; h++) {
          const hitResult = calculateDamage(attackerWithGlitch, s.enemyPokemon, move);
          totalDmg += hitResult.damage;
          effLabel = hitResult.effectivenessLabel ?? effLabel;
          eff = hitResult.effectiveness;
          if (hitResult.isCritical) anyCrit = true;
        }
        damage = totalDmg;
        result = { damage, isCritical: anyCrit, effectiveness: eff, effectivenessLabel: effLabel };
      }
      const newEnemyHP = Math.max(0, s.enemyPokemon.hp - damage);

      let attackLog = `¡${playerPkmn.name} usó ${move.name}!`;
      if (result.effectivenessLabel === 'no_effect') {
        attackLog += ` No afecta a ${s.enemyPokemon.name}...`;
      } else {
        if (result.isCritical) attackLog += ' ¡Golpe crítico!';
        if (result.effectivenessLabel === 'super_effective') attackLog += ' ¡Es supereficaz!';
        if (result.effectivenessLabel === 'not_very_effective') attackLog += ' No es muy eficaz...';
        attackLog += ` Causó ${damage} de daño.`;
      }

      effects.push({ type: 'player_anim', payload: 'attack', moveName: move.name, moveType: move.type });
      effects.push({ type: 'enemy_anim', payload: 'hit' });
      effects.push({ type: 'screen_flash' });
      effects.push({ type: 'battle_shake' });
      effects.push(log(attackLog, playerPkmn.name));

      s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: newEnemyHP } };

      // Recoil damage (Struggle, Take Down, Double-Edge)
      if (move.name === 'FORCEJEO') {        const recoil = Math.max(1, Math.floor(damage / 4));
        const recoilTeam = [...s.playerTeam];
        recoilTeam[0] = { ...recoilTeam[0], hp: Math.max(0, recoilTeam[0].hp - recoil) };
        s = { ...s, playerTeam: recoilTeam };
        effects.push(log(`¡${playerPkmn.name} recibió daño por el rebote!`));
        if (recoilTeam[0].hp === 0) {
          attackLog += ` ¡${playerPkmn.name} se debilitó por el rebote!`;
        }
      } else if (move.recoil) {
        const recoilDmg = Math.max(1, Math.floor(damage * move.recoil));
        const recoilTeam = [...s.playerTeam];
        recoilTeam[0] = { ...recoilTeam[0], hp: Math.max(0, recoilTeam[0].hp - recoilDmg) };
        s = { ...s, playerTeam: recoilTeam };
        effects.push(log(`¡${playerPkmn.name} recibió daño por el rebote!`));
        if (recoilTeam[0].hp === 0) {
          attackLog += ` ¡${playerPkmn.name} se debilitó por el rebote!`;
        }
      }

      // HP drain (Mega Drain, Dream Eater, etc)
      if (move.drain && result.effectivenessLabel !== 'no_effect') {
        const drained = Math.max(1, Math.floor(damage * move.drain));
        const drainTeam = [...s.playerTeam];
        drainTeam[0] = { ...drainTeam[0], hp: Math.min(drainTeam[0].maxHp, drainTeam[0].hp + drained) };
        s = { ...s, playerTeam: drainTeam };
        effects.push(log(`¡${playerPkmn.name} absorbió vitalidad!`));
      }

      // Selfdestruct / Explosion: user faints after dealing damage
      if (move.faintsUser) {
        const faintTeam = [...s.playerTeam];
        faintTeam[0] = { ...faintTeam[0], hp: 0 };
        s = { ...s, playerTeam: faintTeam };
        effects.push(log(`¡${playerPkmn.name} se debilitó!`));
      }

      // Hyper Beam: set recharge flag if not KO
      if (move.recharge && newEnemyHP > 0) {
        const reTeam = [...s.playerTeam];
        reTeam[0] = { ...reTeam[0], recharging: true };
        s = { ...s, playerTeam: reTeam };
      }

      // Two-turn move: set charging flag
      if (move.twoTurn && !playerPkmn.charging) {
        const chgTeam = [...s.playerTeam];
        chgTeam[0] = { ...chgTeam[0], charging: true };
        s = { ...s, playerTeam: chgTeam };
      }

      // Rampage start
      if (move.rampage && !playerPkmn.rampage) {
        const rmpTeam = [...s.playerTeam];
        rmpTeam[0] = { ...rmpTeam[0], rampage: { move, remainingTurns: 2 + Math.floor(Math.random() * 2) } };
        s = { ...s, playerTeam: rmpTeam };
      }

      // Apply status effect on hit
      if (move.statusEffect && Math.random() * 100 < (move.statusChance || 100)) {
        s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: move.statusEffect } };
        attackLog += ` ¡${s.enemyPokemon.name} ahora está ${move.statusEffect}!`;
      }

      // Trap effect (Bind, Clamp, Fire Spin, Wrap)
      if (move.trap && !s.enemyPokemon.trapped) {
        s = { ...s, enemyPokemon: { ...s.enemyPokemon, trapped: { damage: Math.max(1, Math.floor(s.enemyPokemon.maxHp / 16)), remainingTurns: 2 + Math.floor(Math.random() * 3) } } };
        attackLog += ` ¡${s.enemyPokemon.name} fue atrapado!`;
      }

      s = { ...s, log: attackLog };

      if (newEnemyHP === 0) {
        // Enemy fainted — compute EXP using the Gen I formula:
        //   expGain = floor(baseExp × enemyLevel × trainerMult / (7 × participants))
        // where `participants` is the number of non-fainted player Pokémon
        // that entered this battle against the current enemy.
        const trainerMult = s.isTrainerBattle ? 1.5 : 1;
        const baseExp = s.enemyPokemon.baseExp ?? baseExpFor(s.enemyPokemon.id);
        const livingParticipants = s.participantUids
          .filter(uid => s.playerTeam.some(p => p.uid === uid && p.hp > 0))
          .length;
        const denom = Math.max(1, livingParticipants);
        const expGain = Math.max(1, Math.floor((trainerMult * baseExp * s.enemyPokemon.level) / (7 * denom)));
        const { pkmn: leveledPkmn, didLevelUp, learnedMove, willEvolve, evolvedPkmn } = computeExpAndLevelUp(playerPkmn, expGain);

        const faintLog = `¡${s.enemyPokemon.name} se debilitó!`;
        effects.push(log(faintLog));
        effects.push({ type: 'enemy_anim', payload: 'faint' });
        effects.push({ type: 'sound', payload: 'FAINT' });

        const expLog = `¡${playerPkmn.name} ganó ${expGain} puntos de EXP!`;
        effects.push(log(expLog));

        const updatedTeamWithExp = [...s.playerTeam];
        updatedTeamWithExp[0] = leveledPkmn;

        s = { ...s, playerTeam: updatedTeamWithExp, log: expLog, phase: 'ENEMY_FAINTED' };

        if (didLevelUp) {
          const lvlLog = `¡${leveledPkmn.name} subió al nivel ${leveledPkmn.level}!`;
          effects.push(log(lvlLog));
          s = { ...s, log: lvlLog, phase: 'LEVEL_UP' };

          if (learnedMove) {
            effects.push(log(`¡${leveledPkmn.name} aprendió ${learnedMove.name}!`));
          }

          if (willEvolve && evolvedPkmn) {
            const evoLog = `¡¿Qué?! ¡${leveledPkmn.name} está evolucionando!`;
            effects.push(log(evoLog));
            const evoTeam = [...updatedTeamWithExp];
            evoTeam[0] = evolvedPkmn;
            s = { ...s, playerTeam: evoTeam, log: `¡Felicidades! ¡${evolvedPkmn.name} ha evolucionado!`, phase: 'EVOLVING' };
          }
        }

        // Check if trainer has more pokemon
        const nextEnemyIdx = s.currentEnemyIndex + 1;
        if (s.isTrainerBattle && nextEnemyIdx < s.enemyTeam.length) {
          const nextEnemy = s.enemyTeam[nextEnemyIdx];
          const trainerLabel = s.trainerName || 'El entrenador';
          const nextLog = `¡${trainerLabel} saca a ${nextEnemy.name}!`;
          effects.push(log(nextLog));
          const cleared = clearBoosts(s.playerTeam, s.enemyPokemon);
          // Reset participant tracking for the next enemy Pokémon — only the
          // currently active player participates until the player switches.
          const freshParticipants = cleared.playerTeam[0].hp > 0 ? [cleared.playerTeam[0].uid!] : [];
          s = { ...s, playerTeam: cleared.playerTeam, currentEnemyIndex: nextEnemyIdx, badgeBoostGlitchStacks: 0, log: nextLog, phase: 'TRAINER_NEXT_POKEMON', participantUids: freshParticipants };
        } else {
          // Final cleanup: outcome = player_win
          const cleared = clearBoosts(s.playerTeam, s.enemyPokemon);
          s = { ...s, playerTeam: cleared.playerTeam, enemyPokemon: cleared.enemyPokemon, badgeBoostGlitchStacks: 0, outcome: 'player_win' };
        }
      } else {
        // Enemy still alive
        if (enemyAlreadyAttacked) {
          const activePkmn = s.playerTeam[0];
          if (activePkmn.hp === 0) {
            const anyAlive = s.playerTeam.slice(1).some(p => p.hp > 0);
            effects.push({ type: 'player_anim', payload: 'faint' });
            effects.push({ type: 'sound', payload: 'FAINT' });
            if (!anyAlive) {
              const bl = `¡${activePkmn.name} se debilitó! ¡No te quedan POKÉMON sanos!`;
              effects.push(log(bl));
              s = { ...s, log: bl, outcome: 'player_blackout', phase: 'PLAYER_FAINTED' };
            } else {
              const fl = `¡${activePkmn.name} se debilitó! ¡Elige tu siguiente POKÉMON!`;
              effects.push(log(fl));
              s = { ...s, log: fl, phase: 'FORCED_SWITCH' };
            }
          } else {
            effects.push(log(''));
            s = { ...s, log: '', phase: 'CHOOSING' };
          }
        } else {
          s = { ...s, phase: 'ENEMY_ATTACK' };
        }
        return { state: s, effects };
      }

      return { state: s, effects };
    }

    // ── CHEAT_KO ────────────────────────────────────────────────────────────
    case 'CHEAT_KO': {
      if (s.phase !== 'CHOOSING') return { state, effects };
      
      const playerPkmn = s.playerTeam[0];
      const damage = s.enemyPokemon.hp;
      const attackLog = `¡${playerPkmn.name} usó ATAQUE FULMINANTE! (Cheat) Causó ${damage} de daño.`;

      effects.push({ type: 'player_anim', payload: 'attack', moveName: 'ATAQUE FULMINANTE', moveType: 'normal' });
      effects.push({ type: 'enemy_anim', payload: 'hit' });
      effects.push({ type: 'screen_flash' });
      effects.push({ type: 'battle_shake' });
      effects.push(log(attackLog, playerPkmn.name));

      s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: 0 }, log: attackLog };

      // Enemy fainted logic (duplicated from ATTACK)
      const trainerMult = s.isTrainerBattle ? 1.5 : 1;
      const baseExp = s.enemyPokemon.baseExp ?? baseExpFor(s.enemyPokemon.id);
      const livingParticipants = s.participantUids
        .filter(uid => s.playerTeam.some(p => p.uid === uid && p.hp > 0))
        .length;
      const denom = Math.max(1, livingParticipants);
      const expGain = Math.max(1, Math.floor((trainerMult * baseExp * s.enemyPokemon.level) / (7 * denom)));
      const { pkmn: leveledPkmn, didLevelUp, learnedMove, willEvolve, evolvedPkmn } = computeExpAndLevelUp(playerPkmn, expGain);

      const faintLog = `¡${s.enemyPokemon.name} se debilitó!`;
      effects.push(log(faintLog));
      effects.push({ type: 'enemy_anim', payload: 'faint' });
      effects.push({ type: 'sound', payload: 'FAINT' });

      const expLog = `¡${playerPkmn.name} ganó ${expGain} puntos de EXP!`;
      effects.push(log(expLog));

      const updatedTeamWithExp = [...s.playerTeam];
      updatedTeamWithExp[0] = leveledPkmn;

      s = { ...s, playerTeam: updatedTeamWithExp, log: expLog, phase: 'ENEMY_FAINTED' };

      if (didLevelUp) {
        const lvlLog = `¡${leveledPkmn.name} subió al nivel ${leveledPkmn.level}!`;
        effects.push(log(lvlLog));
        s = { ...s, log: lvlLog, phase: 'LEVEL_UP' };

        if (learnedMove) {
          effects.push(log(`¡${leveledPkmn.name} aprendió ${learnedMove.name}!`));
        }

        if (willEvolve && evolvedPkmn) {
          const evoLog = `¡¿Qué?! ¡${leveledPkmn.name} está evolucionando!`;
          effects.push(log(evoLog));
          const evoTeam = [...updatedTeamWithExp];
          evoTeam[0] = evolvedPkmn;
          s = { ...s, playerTeam: evoTeam, log: `¡Felicidades! ¡${evolvedPkmn.name} ha evolucionado!`, phase: 'EVOLVING' };
        }
      }

      // Check if trainer has more pokemon
      const nextEnemyIdx = s.currentEnemyIndex + 1;
      if (s.isTrainerBattle && nextEnemyIdx < s.enemyTeam.length) {
        const nextEnemy = s.enemyTeam[nextEnemyIdx];
        const trainerLabel = s.trainerName || 'El entrenador';
        const nextLog = `¡${trainerLabel} saca a ${nextEnemy.name}!`;
        effects.push(log(nextLog));
        const cleared = clearBoosts(s.playerTeam, s.enemyPokemon);
        const freshParticipants = cleared.playerTeam[0].hp > 0 ? [cleared.playerTeam[0].uid!] : [];
        s = { ...s, playerTeam: cleared.playerTeam, currentEnemyIndex: nextEnemyIdx, badgeBoostGlitchStacks: 0, log: nextLog, phase: 'TRAINER_NEXT_POKEMON', participantUids: freshParticipants };
      } else {
        const cleared = clearBoosts(s.playerTeam, s.enemyPokemon);
        s = { ...s, playerTeam: cleared.playerTeam, enemyPokemon: cleared.enemyPokemon, badgeBoostGlitchStacks: 0, outcome: 'player_win' };
      }

      return { state: s, effects };
    }

    // ── ENEMY TURN (via TICK from ENEMY_ATTACK phase) ───────────────────────
    case 'TICK': {
      if (s.phase === 'ENEMY_ATTACK') {
      let playerPkmn = s.playerTeam[0];

        // Status: Sleep
        if (s.enemyPokemon.status === 'sleep') {
          const wakeUp = Math.random() <= 0.3;
          if (!wakeUp) {
            const sleepLog = `¡${s.enemyPokemon.name} está profundamente dormido!`;
            effects.push(log(sleepLog));
            effects.push(log(''));
            s = { ...s, log: '', phase: 'CHOOSING' };
            return { state: s, effects };
          }
          effects.push(log(`¡${s.enemyPokemon.name} se ha despertado!`));
          s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: 'none' } };
        }

        // Status: Paralysis
        if (s.enemyPokemon.status === 'paralyzed' && Math.random() < 0.25) {
          const paraLog = `¡${s.enemyPokemon.name} está paralizado! ¡No puede moverse!`;
          effects.push(log(paraLog));
          effects.push(log(''));
          s = { ...s, log: '', phase: 'CHOOSING' };
          return { state: s, effects };
        }

        // Status: Frozen
        if (s.enemyPokemon.status === 'frozen') {
          const thaw = Math.random() < 0.2;
          if (thaw) {
            effects.push(log(`¡${s.enemyPokemon.name} se ha descongelado!`));
            s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: 'none' } };
          } else {
            const freezeLog = `¡${s.enemyPokemon.name} está congelado!`;
            effects.push(log(freezeLog));
            effects.push(log(''));
            s = { ...s, log: '', phase: 'CHOOSING' };
            return { state: s, effects };
          }
        }

        const enemyMove = s.isTrainerBattle
          ? selectTrainerMove(s.enemyPokemon, playerPkmn)
          : s.enemyPokemon.moves[Math.floor(Math.random() * s.enemyPokemon.moves.length)];
        effects.push({ type: 'enemy_anim', payload: 'attack', moveName: enemyMove.name, moveType: enemyMove.type });

        // Accuracy check (enemy attacker accuracy stage vs player evasion stage)
        if (!doesMoveHit(enemyMove.accuracy, s.enemyPokemon.statBoosts?.accuracy ?? 0, playerPkmn.statBoosts?.evasion ?? 0)) {
          const missLog = `¡${s.enemyPokemon.name} usó ${enemyMove.name}! ¡Pero falló!`;
          effects.push(log(missLog));
          effects.push(log(''));
          s = { ...s, log: '', phase: 'CHOOSING' };
          return { state: s, effects };
        }

        // Status move
        if (enemyMove.power === 0) {
          let moveLog = `¡${s.enemyPokemon.name} usó ${enemyMove.name}!`;
          const sc = applyStatChange(enemyMove, false, s.playerTeam, s.enemyPokemon, s.hasBoulderBadge, s.badgeBoostGlitchStacks);
          if (sc.msg) moveLog += ' ' + sc.msg;
          s = { ...s, playerTeam: sc.playerTeam, enemyPokemon: sc.enemyPokemon, badgeBoostGlitchStacks: sc.newGlitchStacks };

          if (enemyMove.statusEffect && Math.random() * 100 < (enemyMove.statusChance || 100)) {
            const updatedTeam2 = [...s.playerTeam];
            updatedTeam2[0] = { ...updatedTeam2[0], status: enemyMove.statusEffect };
            s = { ...s, playerTeam: updatedTeam2 };
            moveLog += ` ¡${playerPkmn.name} ahora está ${enemyMove.statusEffect}!`;
          }

          effects.push(log(moveLog, s.enemyPokemon.name));
          effects.push(log(''));
          s = { ...s, log: '', phase: 'CHOOSING' };
          return { state: s, effects };
        }

        // Damage move
        const enemyResult = calculateDamage(s.enemyPokemon, playerPkmn, enemyMove);
        const enemyDamage = enemyResult.damage;
        const newPlayerHP = Math.max(0, playerPkmn.hp - enemyDamage);

        effects.push({ type: 'player_anim', payload: 'hit' });
        effects.push({ type: 'screen_flash' });
        effects.push({ type: 'battle_shake' });

        const eName = s.enemyPokemon.name.startsWith('RIVAL ') ? `El ${s.enemyPokemon.name.replace('RIVAL ', '')} rival` : s.enemyPokemon.name;
        let enemyLog = `¡${eName} usó ${enemyMove.name}!`;
        if (enemyResult.effectivenessLabel === 'no_effect') {
          enemyLog += ` No afecta a ${playerPkmn.name}...`;
        } else {
          if (enemyResult.isCritical) enemyLog += ' ¡Golpe crítico!';
          if (enemyResult.effectivenessLabel === 'super_effective') enemyLog += ' ¡Es supereficaz!';
          if (enemyResult.effectivenessLabel === 'not_very_effective') enemyLog += ' No es muy eficaz...';
          enemyLog += ` Causó ${enemyDamage} de daño.`;
        }

        const updatedTeam3 = [...s.playerTeam];
        // Store physical damage
        if (['normal','fighting','rock','ground','ghost','bug','poison','flying','ice'].includes(enemyMove.type)) {
          updatedTeam3[0] = { ...updatedTeam3[0], hp: newPlayerHP, lastPhysicalDamage: enemyDamage };
          if (updatedTeam3[0].rageActive) {
            updatedTeam3[0] = { ...updatedTeam3[0], statBoosts: { ...(updatedTeam3[0].statBoosts ?? ZERO_BOOSTS), attack: Math.min(6, (updatedTeam3[0].statBoosts?.attack ?? 0) + 1) } };
          }
        } else {
          updatedTeam3[0] = { ...updatedTeam3[0], hp: newPlayerHP };
        }
        if (updatedTeam3[0].bideState) {
          updatedTeam3[0].bideState.accumulatedDamage += enemyDamage;
          updatedTeam3[0].bideState.remainingTurns -= 1;
        }

        // Apply status
        if (enemyMove.statusEffect && Math.random() * 100 < (enemyMove.statusChance || 100)) {
          updatedTeam3[0].status = enemyMove.statusEffect;
          enemyLog += ` ¡${playerPkmn.name} ahora está ${enemyMove.statusEffect}!`;
        }

        effects.push(log(enemyLog, s.enemyPokemon.name));
        s = { ...s, playerTeam: updatedTeam3, log: enemyLog };

        if (newPlayerHP === 0) {
          const anyAlive = s.playerTeam.slice(1).some(p => p.hp > 0);
          effects.push({ type: 'player_anim', payload: 'faint' });
          effects.push({ type: 'sound', payload: 'FAINT' });

          if (!anyAlive) {
            const blackoutLog = `¡${playerPkmn.name} se debilitó! ¡No te quedan POKÉMON sanos!`;
            effects.push(log(blackoutLog));
            s = { ...s, log: blackoutLog, outcome: 'player_blackout', phase: 'PLAYER_FAINTED' };
          } else {
            const faintLog = `¡${playerPkmn.name} se debilitó! ¡Elige tu siguiente POKÉMON!`;
            effects.push(log(faintLog));
            s = { ...s, log: faintLog, phase: 'FORCED_SWITCH' };
          }
        } else {
          effects.push(log(''));
          s = { ...s, log: '', phase: 'CHOOSING' };
        }

        return { state: s, effects };
      }

      // TICK in other phases = no-op (advance to CHOOSING after animations)
      if (s.phase === 'ENEMY_FAINTED' || s.phase === 'LEVEL_UP' || s.phase === 'EVOLVING') {
        effects.push(log(''));
        s = { ...s, log: '', phase: 'CHOOSING' };
      }

      if (s.phase === 'TRAINER_NEXT_POKEMON') {
        const nextEnemy = s.enemyTeam[s.currentEnemyIndex];
        effects.push(log(''));
        s = { ...s, enemyPokemon: nextEnemy, log: '', phase: 'CHOOSING' };
      }

      // Burn chip & Leech Seed damage at end of turn
      if (s.phase === 'CHOOSING') {
        if (s.playerTeam[0]?.status === 'burn' && s.playerTeam[0]?.hp > 0) {
          const chip = Math.max(1, Math.floor(s.playerTeam[0].maxHp / 16));
          const newHp = Math.max(0, s.playerTeam[0].hp - chip);
          const updated = [...s.playerTeam];
          updated[0] = { ...updated[0], hp: newHp };
          effects.push(log(`¡${s.playerTeam[0].name} recibe daño por quemaduras!`));
          s = { ...s, playerTeam: updated };
          if (newHp === 0) { s = { ...s, phase: 'PLAYER_FAINTED' }; }
        }
        if (s.playerTeam[0]?.leechSeed && s.playerTeam[0]?.hp > 0) {
          const seedChip = Math.max(1, Math.floor(s.playerTeam[0].maxHp / 16));
          const newHp = Math.max(0, s.playerTeam[0].hp - seedChip);
          const healedAmount = Math.min(seedChip, s.enemyPokemon.maxHp - s.enemyPokemon.hp);
          const updated = [...s.playerTeam];
          updated[0] = { ...updated[0], hp: newHp };
          effects.push(log(`¡${s.playerTeam[0].name} pierde vida por DRENADORAS!`));
          s = { ...s, playerTeam: updated, enemyPokemon: { ...s.enemyPokemon, hp: s.enemyPokemon.hp + healedAmount } };
          if (newHp === 0) { s = { ...s, phase: 'PLAYER_FAINTED' }; }
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
            const ph = [...s.playerTeam];
            ph[0] = { ...ph[0], hp: ph[0].hp + healedToPlayer };
            s = { ...s, playerTeam: ph };
          }
          effects.push(log(`¡${s.enemyPokemon.name} pierde vida por DRENADORAS!`));
        }
        // Trap end-of-turn (Bind, Clamp, Fire Spin, Wrap)
        if (s.playerTeam[0]?.trapped && s.playerTeam[0]?.hp > 0) {
          s.playerTeam[0].trapped.remainingTurns -= 1;
          const trapChip = Math.max(1, Math.floor(s.playerTeam[0].maxHp / 16));
          const newHp = Math.max(0, s.playerTeam[0].hp - trapChip);
          const updated = [...s.playerTeam];
          updated[0] = { ...updated[0], hp: newHp,
            trapped: s.playerTeam[0].trapped.remainingTurns > 0 ? s.playerTeam[0].trapped : undefined };
          effects.push(log(`¡${s.playerTeam[0].name} recibe daño por el ataque continuo!`));
          s = { ...s, playerTeam: updated };
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
      }

      return { state: s, effects };
    }

    // ── SWITCH ───────────────────────────────────────────────────────────────
    case 'SWITCH': {
      if (s.phase !== 'FORCED_SWITCH' && s.phase !== 'CHOOSING' && s.phase !== 'BATTLE_TEAM') {
        return { state, effects };
      }
      const idx = action.index;
      if (idx <= 0 || idx >= s.playerTeam.length) return { state, effects };
      if (s.playerTeam[idx].hp === 0) return { state, effects };

      const newTeam = [...s.playerTeam];
      [newTeam[0], newTeam[idx]] = [newTeam[idx], newTeam[0]];
      const switchLog = `¡Vamos, ${newTeam[0].name}!`;
      effects.push(log(switchLog));

      const nextPhase: BattleSubPhase = s.phase === 'FORCED_SWITCH' ? 'CHOOSING' : 'ENEMY_ATTACK';
      const activeUid = newTeam[0].uid!;
      const nextParticipants = s.participantUids.includes(activeUid)
        ? s.participantUids
        : [...s.participantUids, activeUid];
      s = { ...s, playerTeam: newTeam, log: switchLog, phase: nextPhase, participantUids: nextParticipants };

      if (s.phase === 'ENEMY_ATTACK') {
        return { state: s, effects }; // useBattleEngine will dispatch TICK
      }
      return { state: s, effects };
    }

    // ── USE_ITEM ─────────────────────────────────────────────────────────────
    case 'USE_ITEM': {
      const itemId = action.itemId;
      const targetIndex = action.targetIndex;
      const qty = s.inventory[itemId] ?? 0;
      if (qty <= 0) return { state, effects };

      const playerPkmn = s.playerTeam[targetIndex];
      const result = applyItemToPokemon(playerPkmn, itemId);
      
      if (!result.success) {
        effects.push(log(result.message));
        s = { ...s, log: result.message, phase: 'CHOOSING' };
        return { state: s, effects };
      }

      const newQty = qty - 1;
      const newInventory = newQty > 0
        ? { ...s.inventory, [itemId]: newQty }
        : (() => { const { [itemId]: _, ...rest } = s.inventory; return rest; })();

      const updatedTeam = [...s.playerTeam];
      updatedTeam[targetIndex] = result.pokemon;
      
      effects.push(log(result.message));
      s = { ...s, playerTeam: updatedTeam, inventory: newInventory, log: result.message, phase: 'ENEMY_ATTACK' };
      return { state: s, effects }; // useBattleEngine will dispatch TICK
    }

    // ── CATCH ────────────────────────────────────────────────────────────────
    case 'CATCH': {
      if (s.phase !== 'CHOOSING') return { state, effects };

      if (s.isTrainerBattle) {
        const msg = '¡No puedes usar eso en un combate contra un entrenador!';
        effects.push(log(msg));
        s = { ...s, log: msg, phase: 'CHOOSING' };
        return { state: s, effects };
      }

      const pkbQty = s.inventory['POKEBALL'] ?? 0;
      if (pkbQty <= 0) return { state, effects };

      const newInv = pkbQty - 1 > 0
        ? { ...s.inventory, POKEBALL: pkbQty - 1 }
        : (() => { const { POKEBALL: _, ...rest } = s.inventory; return rest; })();

      // ── Gen I catch formula ──────────────────────────────────────────────────
      // Step 1: Status pre-check (R1 0–255)
      let caught = false;
      const catchStatus = s.enemyPokemon.status;
      const r1 = Math.floor(Math.random() * 256);
      if ((catchStatus === 'sleep' || catchStatus === 'frozen') && r1 < 25) {
        caught = true;
      } else if ((catchStatus === 'paralyzed' || catchStatus === 'burn' || catchStatus === 'poison') && r1 < 12) {
        caught = true;
      }

      // Step 2: CatchV formula — only if Step 1 failed
      if (!caught) {
        const speciesCatchRate = s.enemyPokemon.catchRate ?? 45;
        const catchV = Math.floor(
          speciesCatchRate * (s.enemyPokemon.maxHp * 3 - s.enemyPokemon.hp * 2) / (s.enemyPokemon.maxHp * 3)
        );
        const r2 = Math.floor(Math.random() * 256);
        caught = r2 < catchV;
      }

      s = { ...s, inventory: newInv, phase: 'CATCHING' };
      effects.push(log('¡Pablo lanzó una POKÉ BALL!', 'Pablo'));

      if (caught) {
        effects.push(log(`¡Ya está! ¡${s.enemyPokemon.name} atrapado!`));
        const newPokemon = { ...s.enemyPokemon };
        let newTeam = s.playerTeam;
        let newPC = s.pcStorage;
        if (s.playerTeam.length < 6) {
          newTeam = [...s.playerTeam, newPokemon];
        } else {
          newPC = [...s.pcStorage, newPokemon];
          effects.push(log(`¡${s.enemyPokemon.name} se envió al PC!`));
        }
        const cleared = clearBoosts(newTeam, s.enemyPokemon);
        s = { ...s, playerTeam: cleared.playerTeam, pcStorage: newPC, inventory: newInv, outcome: 'caught', phase: 'CATCHING' };
      } else {
        effects.push(log('¡Oh, no! ¡El POKÉMON se ha escapado!'));
        // After failed catch, enemy gets a turn
        s = { ...s, phase: 'ENEMY_ATTACK' };
        const tickResult = stepBattle(s, { type: 'TICK' });
        return { state: tickResult.state, effects: [...effects, ...tickResult.effects] };
      }

      return { state: s, effects };
    }

    // ── FLEE ─────────────────────────────────────────────────────────────────
    case 'FLEE': {
      if (s.phase !== 'CHOOSING') return { state, effects };
      if (s.isTrainerBattle) {
        const logMsg = `¡No puedes huir de un combate contra un entrenador!`;
        effects.push(log(logMsg));
        s = { ...s, log: logMsg, phase: 'ENEMY_ATTACK' };
        const r = stepBattle(s, { type: 'TICK' });
        return { state: r.state, effects: [...effects, ...r.effects] };
      }

      const playerSpeed = s.playerTeam[0].status === 'paralyzed' ? Math.floor(s.playerTeam[0].baseStats.speed / 4) : s.playerTeam[0].baseStats.speed;
      const enemySpeed = Math.max(1, s.enemyPokemon.status === 'paralyzed' ? Math.floor(s.enemyPokemon.baseStats.speed / 4) : s.enemyPokemon.baseStats.speed);
      const fleeValue = (playerSpeed * 128 / enemySpeed + 30) % 256;
      const roll = Math.floor(Math.random() * 256);

      s = { ...s, phase: 'PLAYER_ATTACK' }; // lock input while attempting

      if (roll < fleeValue) {
        const cleared = clearBoosts(s.playerTeam, s.enemyPokemon);
        effects.push(log('¡Has escapado con éxito!', 'Pablo'));
        s = { ...s, playerTeam: cleared.playerTeam, enemyPokemon: cleared.enemyPokemon, badgeBoostGlitchStacks: 0, outcome: 'fled', log: '¡Has escapado con éxito!' };
      } else {
        effects.push(log('¡No has podido escapar!', 'Pablo'));
        s = { ...s, log: '¡No has podido escapar!', phase: 'ENEMY_ATTACK' };
        const r = stepBattle(s, { type: 'TICK' });
        return { state: r.state, effects: [...effects, ...r.effects] };
      }

      return { state: s, effects };
    }

    default:
      return { state, effects };
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createBattleState(
  playerTeam: Pokemon[],
  enemyPokemon: Pokemon,
  options: {
    isTrainerBattle?: boolean;
    enemyTeam?: Pokemon[];
    trainerName?: string;
    inventory?: InventoryCounts;
    pcStorage?: Pokemon[];
    hasBoulderBadge?: boolean;
  } = {},
): BattleState {
  if (playerTeam.length === 0) throw new Error('createBattleState: playerTeam must not be empty');
  // Sanitize: filter out null/undefined moves, assign a stable uid if missing
  // (needed for participant tracking across switches).
  // Uids only need to be unique within this battle's playerTeam (≤6 members),
  // and stable across swaps — so an index-based scheme is sufficient and keeps
  // battle creation deterministic (no Math.random consumption for tests).
  const sanitizedTeam = playerTeam.map((p, i) => ({
    ...p,
    moves: p.moves.filter(Boolean),
    uid: p.uid ?? `team-${i}`,
  }));
  const enemyTeam = options.enemyTeam ?? [enemyPokemon];
  // If the lead Pokémon is fainted, start in FORCED_SWITCH so the player
  // must choose an alive Pokémon before the battle begins.
  const initialPhase: BattleSubPhase = sanitizedTeam[0].hp <= 0 ? 'FORCED_SWITCH' : 'CHOOSING';
  return {
    playerTeam: sanitizedTeam,
    enemyPokemon,
    enemyTeam,
    currentEnemyIndex: 0,
    trainerName: options.trainerName ?? '',
    phase: initialPhase,
    isTrainerBattle: options.isTrainerBattle ?? false,
    inventory: options.inventory ?? {},
    pcStorage: options.pcStorage ?? [],
    log: '',
    outcome: 'ongoing',
    badgeBoostGlitchStacks: 0,
    hasBoulderBadge: options.hasBoulderBadge ?? false,
    participantUids: sanitizedTeam[0].hp > 0 ? [sanitizedTeam[0].uid!] : [],
  };
}
