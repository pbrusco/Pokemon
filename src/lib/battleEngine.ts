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
} from './damage';
import { EVOLUTIONS } from '../constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BattleOutcome =
  | 'ongoing'
  | 'player_win'
  | 'player_blackout'
  | 'fled'
  | 'caught';

export type EffectType =
  | 'sound'
  | 'player_anim'
  | 'enemy_anim'
  | 'screen_flash'
  | 'battle_shake'
  | 'log';

export interface BattleEffect {
  type: EffectType;
  payload?: string | number;
}

export type BattleSubPhase =
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
}

export type BattleAction =
  | { type: 'ATTACK'; move: Move }
  | { type: 'USE_ITEM'; itemId: string }
  | { type: 'SWITCH'; index: number }
  | { type: 'FLEE' }
  | { type: 'CATCH' }
  /** Advance the state machine past an intermediate phase (replaces setTimeout callbacks) */
  | { type: 'TICK' };

export interface BattleResult {
  state: BattleState;
  effects: BattleEffect[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg: string): BattleEffect {
  return { type: 'log', payload: msg };
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

  let newPlayerTeam = playerTeam;
  let newEnemyPokemon = enemyPokemon;
  let newGlitchStacks = badgeBoostGlitchStacks;

  if (targetIsPlayer) {
    const updated = [...playerTeam];
    const boosts = { ...(updated[0].statBoosts ?? ZERO_BOOSTS) };
    boosts[statName] = Math.max(-6, Math.min(6, (boosts[statName] ?? 0) + stages));
    updated[0] = { ...updated[0], statBoosts: boosts };
    newPlayerTeam = updated;
    if (hasBoulderBadge) newGlitchStacks = badgeBoostGlitchStacks + 1;
  } else {
    const boosts = { ...(enemyPokemon.statBoosts ?? ZERO_BOOSTS) };
    boosts[statName] = Math.max(-6, Math.min(6, (boosts[statName] ?? 0) + stages));
    newEnemyPokemon = { ...enemyPokemon, statBoosts: boosts };
  }

  const targetName = targetIsPlayer ? playerTeam[0]?.name : enemyPokemon.name;
  const statLabels: Record<string, string> = { attack: 'ATAQUE', defense: 'DEFENSA', special: 'ESPECIAL', speed: 'VELOCIDAD' };
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

  while (p.exp >= (p.expToNextLevel || 100)) {
    p.exp -= (p.expToNextLevel || 100);
    p.level += 1;
    p.expToNextLevel = p.level * 100;
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
  }

  return { pkmn: p, didLevelUp, learnedMove, willEvolve, evolvedPkmn };
}

// ─── Trainer AI ──────────────────────────────────────────────────────────────

function selectTrainerMove(attacker: Pokemon, defender: Pokemon): Move {
  const moves = attacker.moves;
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
      const move = action.move;
      if (move.pp <= 0) return { state, effects };

      const playerPkmn = s.playerTeam[0];

      // Deduct PP
      const updatedTeam = [...s.playerTeam];
      updatedTeam[0] = {
        ...updatedTeam[0],
        moves: updatedTeam[0].moves.filter(Boolean).map(m => m.name === move.name ? { ...m, pp: m.pp - 1 } : m),
      };
      s = { ...s, playerTeam: updatedTeam, phase: 'PLAYER_ATTACK' };

      // Status check: Sleep
      if (playerPkmn.status === 'sleep') {
        const wakeUp = Math.random() > 0.3 ? false : true; // 70% stays asleep
        if (!wakeUp) {
          effects.push(log(`¡${playerPkmn.name} está profundamente dormido!`));
          s = { ...s, log: `¡${playerPkmn.name} está profundamente dormido!`, phase: 'ENEMY_ATTACK' };
          const r = stepBattle(s, { type: 'TICK' });
          return { state: r.state, effects: [...effects, ...r.effects] };
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
        const r = stepBattle(s, { type: 'TICK' });
        return { state: r.state, effects: [...effects, ...r.effects] };
      }

      // Accuracy check
      if (!doesMoveHit(move.accuracy)) {
        const missLog = `¡${playerPkmn.name} usó ${move.name}! ¡Pero falló!`;
        effects.push(log(missLog));
        s = { ...s, log: missLog, phase: 'ENEMY_ATTACK' };
        const r = stepBattle(s, { type: 'TICK' });
        return { state: r.state, effects: [...effects, ...r.effects] };
      }

      // Status / Stat-change move (no damage)
      if (move.power === 0) {
        let moveLog = `¡${playerPkmn.name} usó ${move.name}!`;
        const sc = applyStatChange(move, true, s.playerTeam, s.enemyPokemon, s.hasBoulderBadge, s.badgeBoostGlitchStacks);
        if (sc.msg) moveLog += ' ' + sc.msg;
        s = { ...s, playerTeam: sc.playerTeam, enemyPokemon: sc.enemyPokemon, badgeBoostGlitchStacks: sc.newGlitchStacks };

        if (move.statusEffect && Math.random() * 100 < (move.statusChance || 100)) {
          s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: move.statusEffect } };
          moveLog += ` ¡${s.enemyPokemon.name} ahora está ${move.statusEffect}!`;
        }
        effects.push(log(moveLog));
        s = { ...s, log: moveLog, phase: 'ENEMY_ATTACK' };
        const r = stepBattle(s, { type: 'TICK' });
        return { state: r.state, effects: [...effects, ...r.effects] };
      }

      // Damage move
      const attackMultiplier = s.hasBoulderBadge ? 1 + s.badgeBoostGlitchStacks * 0.125 : 1;
      const attackerWithGlitch = attackMultiplier > 1
        ? { ...playerPkmn, baseStats: { ...playerPkmn.baseStats, attack: Math.floor(playerPkmn.baseStats.attack * attackMultiplier) } }
        : playerPkmn;

      const result = calculateDamage(attackerWithGlitch, s.enemyPokemon, move);
      const damage = result.damage;
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

      effects.push({ type: 'enemy_anim', payload: 'hit' });
      effects.push({ type: 'screen_flash' });
      effects.push({ type: 'battle_shake' });
      effects.push(log(attackLog));

      s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: newEnemyHP } };

      // Apply status effect on hit
      if (move.statusEffect && Math.random() * 100 < (move.statusChance || 100)) {
        s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: move.statusEffect } };
        attackLog += ` ¡${s.enemyPokemon.name} ahora está ${move.statusEffect}!`;
      }

      s = { ...s, log: attackLog };

      if (newEnemyHP === 0) {
        // Enemy fainted — compute EXP
        const expGain = Math.floor(s.enemyPokemon.level * 25 * (s.isTrainerBattle ? 1.5 : 1));
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
          s = { ...s, playerTeam: cleared.playerTeam, currentEnemyIndex: nextEnemyIdx, badgeBoostGlitchStacks: 0, log: nextLog, phase: 'TRAINER_NEXT_POKEMON' };
        } else {
          // Final cleanup: outcome = player_win
          const cleared = clearBoosts(s.playerTeam, s.enemyPokemon);
          s = { ...s, playerTeam: cleared.playerTeam, enemyPokemon: cleared.enemyPokemon, badgeBoostGlitchStacks: 0, outcome: 'player_win' };
        }
      } else {
        // Enemy still alive — enemy turn
        s = { ...s, phase: 'ENEMY_ATTACK' };
        const r = stepBattle(s, { type: 'TICK' });
        return { state: r.state, effects: [...effects, ...r.effects] };
      }

      return { state: s, effects };
    }

    // ── ENEMY TURN (via TICK from ENEMY_ATTACK phase) ───────────────────────
    case 'TICK': {
      if (s.phase === 'ENEMY_ATTACK') {
        const playerPkmn = s.playerTeam[0];

        // Status: Sleep
        if (s.enemyPokemon.status === 'sleep') {
          const wakeUp = Math.random() <= 0.3;
          if (!wakeUp) {
            const sleepLog = `¡${s.enemyPokemon.name} está profundamente dormido!`;
            effects.push(log(sleepLog));
            s = { ...s, log: sleepLog, phase: 'CHOOSING' };
            return { state: s, effects };
          }
          effects.push(log(`¡${s.enemyPokemon.name} se ha despertado!`));
          s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: 'none' } };
        }

        // Status: Paralysis
        if (s.enemyPokemon.status === 'paralyzed' && Math.random() < 0.25) {
          const paraLog = `¡${s.enemyPokemon.name} está paralizado! ¡No puede moverse!`;
          effects.push(log(paraLog));
          s = { ...s, log: paraLog, phase: 'CHOOSING' };
          return { state: s, effects };
        }

        const enemyMove = s.isTrainerBattle
          ? selectTrainerMove(s.enemyPokemon, playerPkmn)
          : s.enemyPokemon.moves[Math.floor(Math.random() * s.enemyPokemon.moves.length)];
        effects.push({ type: 'enemy_anim', payload: 'attack' });

        // Accuracy check
        if (!doesMoveHit(enemyMove.accuracy)) {
          const missLog = `¡${s.enemyPokemon.name} usó ${enemyMove.name}! ¡Pero falló!`;
          effects.push(log(missLog));
          s = { ...s, log: missLog, phase: 'CHOOSING' };
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

          effects.push(log(moveLog));
          s = { ...s, log: moveLog, phase: 'CHOOSING' };
          return { state: s, effects };
        }

        // Damage move
        const enemyResult = calculateDamage(s.enemyPokemon, playerPkmn, enemyMove);
        const enemyDamage = enemyResult.damage;
        const newPlayerHP = Math.max(0, playerPkmn.hp - enemyDamage);

        effects.push({ type: 'player_anim', payload: 'hit' });
        effects.push({ type: 'screen_flash' });
        effects.push({ type: 'battle_shake' });

        let enemyLog = `¡${s.enemyPokemon.name} usó ${enemyMove.name}!`;
        if (enemyResult.effectivenessLabel === 'no_effect') {
          enemyLog += ` No afecta a ${playerPkmn.name}...`;
        } else {
          if (enemyResult.isCritical) enemyLog += ' ¡Golpe crítico!';
          if (enemyResult.effectivenessLabel === 'super_effective') enemyLog += ' ¡Es supereficaz!';
          if (enemyResult.effectivenessLabel === 'not_very_effective') enemyLog += ' No es muy eficaz...';
          enemyLog += ` Causó ${enemyDamage} de daño.`;
        }

        const updatedTeam3 = [...s.playerTeam];
        updatedTeam3[0] = { ...updatedTeam3[0], hp: newPlayerHP };

        // Apply status
        if (enemyMove.statusEffect && Math.random() * 100 < (enemyMove.statusChance || 100)) {
          updatedTeam3[0].status = enemyMove.statusEffect;
          enemyLog += ` ¡${playerPkmn.name} ahora está ${enemyMove.statusEffect}!`;
        }

        effects.push(log(enemyLog));
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
          s = { ...s, phase: 'CHOOSING' };
        }

        return { state: s, effects };
      }

      // TICK in other phases = no-op (advance to CHOOSING after animations)
      if (s.phase === 'ENEMY_FAINTED' || s.phase === 'LEVEL_UP' || s.phase === 'EVOLVING') {
        s = { ...s, phase: 'CHOOSING' };
      }

      if (s.phase === 'TRAINER_NEXT_POKEMON') {
        const nextEnemy = s.enemyTeam[s.currentEnemyIndex];
        s = { ...s, enemyPokemon: nextEnemy, phase: 'CHOOSING' };
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
      s = { ...s, playerTeam: newTeam, log: switchLog, phase: nextPhase };

      if (s.phase === 'ENEMY_ATTACK') {
        const r = stepBattle(s, { type: 'TICK' });
        return { state: r.state, effects: [...effects, ...r.effects] };
      }
      return { state: s, effects };
    }

    // ── USE_ITEM ─────────────────────────────────────────────────────────────
    case 'USE_ITEM': {
      const itemId = action.itemId;
      const qty = s.inventory[itemId] ?? 0;
      if (qty <= 0) return { state, effects };

      const newQty = qty - 1;
      const newInventory = newQty > 0
        ? { ...s.inventory, [itemId]: newQty }
        : (() => { const { [itemId]: _, ...rest } = s.inventory; return rest; })();

      if (itemId === 'POTION') {
        const playerPkmn = s.playerTeam[0];
        const healed = Math.min(20, playerPkmn.maxHp - playerPkmn.hp);
        const newHP = playerPkmn.hp + healed;
        const healedTeam = [...s.playerTeam];
        healedTeam[0] = { ...playerPkmn, hp: newHP };
        const healLog = `¡Usaste una POCIÓN en ${playerPkmn.name}! Recuperó ${healed} PS.`;
        effects.push(log(healLog));
        s = { ...s, playerTeam: healedTeam, inventory: newInventory, log: healLog, phase: 'ENEMY_ATTACK' };
        const r = stepBattle(s, { type: 'TICK' });
        return { state: r.state, effects: [...effects, ...r.effects] };
      }

      return { state, effects };
    }

    // ── CATCH ────────────────────────────────────────────────────────────────
    case 'CATCH': {
      if (s.phase !== 'CHOOSING') return { state, effects };
      if (s.isTrainerBattle) return { state, effects };
      const pkbQty = s.inventory['POKEBALL'] ?? 0;
      if (pkbQty <= 0) return { state, effects };

      const newInv = pkbQty - 1 > 0
        ? { ...s.inventory, POKEBALL: pkbQty - 1 }
        : (() => { const { POKEBALL: _, ...rest } = s.inventory; return rest; })();

      const hpPercent = s.enemyPokemon.hp / s.enemyPokemon.maxHp;
      const catchRate = (1 - hpPercent) * 0.7 + 0.1;
      const caught = Math.random() < catchRate;

      s = { ...s, inventory: newInv, phase: 'CATCHING' };
      effects.push(log('¡Pablo lanzó una POKÉ BALL!'));

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
      if (s.isTrainerBattle) return { state, effects };

      const playerSpeed = s.playerTeam[0].baseStats.speed;
      const enemySpeed = Math.max(1, s.enemyPokemon.baseStats.speed);
      const fleeValue = (playerSpeed * 128 / enemySpeed + 30) % 256;
      const roll = Math.floor(Math.random() * 256);

      s = { ...s, phase: 'PLAYER_ATTACK' }; // lock input while attempting

      if (roll < fleeValue) {
        const cleared = clearBoosts(s.playerTeam, s.enemyPokemon);
        effects.push(log('¡Has escapado con éxito!'));
        s = { ...s, playerTeam: cleared.playerTeam, enemyPokemon: cleared.enemyPokemon, badgeBoostGlitchStacks: 0, outcome: 'fled', log: '¡Has escapado con éxito!' };
      } else {
        effects.push(log('¡No has podido escapar!'));
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
  // Sanitize: filter out null/undefined moves
  const sanitizedTeam = playerTeam.map(p => ({ ...p, moves: p.moves.filter(Boolean) }));
  const enemyTeam = options.enemyTeam ?? [enemyPokemon];
  return {
    playerTeam: sanitizedTeam,
    enemyPokemon,
    enemyTeam,
    currentEnemyIndex: 0,
    trainerName: options.trainerName ?? '',
    phase: 'CHOOSING',
    isTrainerBattle: options.isTrainerBattle ?? false,
    inventory: options.inventory ?? {},
    pcStorage: options.pcStorage ?? [],
    log: '',
    outcome: 'ongoing',
    badgeBoostGlitchStacks: 0,
    hasBoulderBadge: options.hasBoulderBadge ?? false,
  };
}
