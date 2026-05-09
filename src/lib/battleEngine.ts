/**
 * battleEngine.ts — Pure battle state machine
 *
 * Takes a BattleState + BattleAction and returns the next BattleState
 * plus a list of side-effect descriptors (animations, sounds).
 * No React, no setTimeout, no Zustand — fully testable.
 *
 * Mechanical helpers live in battleMechanics.ts.
 */

import type { Pokemon, Move, InventoryCounts } from '../types';
import {
  calculateDamage,
  doesMoveHit,
  getTypeEffectiveness,
  ZERO_BOOSTS,
  type DamageResult,
} from './damage';
import { applyItemToPokemon } from './itemUtils';
import {
  log,
  applyStatChange,
  clearBoosts,
  selectTrainerMove,
  enemyNameDisplay,
  handleEnemyFainted,
  handleEndOfTurnEffects,
} from './battleMechanics';

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
  badgeBoostGlitchStacks: number;
  hasBoulderBadge: boolean;
  participantUids: string[];
}

export type BattleAction =
  | { type: 'ATTACK'; move: Move }
  | { type: 'USE_ITEM'; itemId: string; targetIndex: number }
  | { type: 'SWITCH'; index: number }
  | { type: 'FLEE' }
  | { type: 'CATCH'; ballType?: 'POKEBALL' | 'MASTER_BALL' }
  | { type: 'CHEAT_KO' }
  | { type: 'TICK' };

interface BattleResult {
  state: BattleState;
  effects: BattleEffect[];
}

// ─── Status / turn helpers ───────────────────────────────────────────────────

type StatusResult =
  | { action: 'skip'; msg: string }
  | { action: 'recover'; msg: string; newStatus: Pokemon['status'] }
  | { action: 'pass' };

function checkPlayerStatusBeforeMove(pkmn: Pokemon): StatusResult {
  if (pkmn.status === 'sleep') {
    return Math.random() > 0.3
      ? { action: 'skip', msg: `¡${pkmn.name} está profundamente dormido!` }
      : { action: 'recover', msg: `¡${pkmn.name} se ha despertado!`, newStatus: 'none' };
  }
  if (pkmn.status === 'paralyzed' && Math.random() < 0.25) {
    return { action: 'skip', msg: `¡${pkmn.name} está paralizado! ¡No puede moverse!` };
  }
  if (pkmn.status === 'frozen') {
    return Math.random() < 0.2
      ? { action: 'recover', msg: `¡${pkmn.name} se ha descongelado!`, newStatus: 'none' }
      : { action: 'skip', msg: `¡${pkmn.name} está congelado!` };
  }
  return { action: 'pass' };
}

function checkEnemyStatus(pkmn: Pokemon): StatusResult {
  if (pkmn.status === 'sleep') {
    return Math.random() > 0.3
      ? { action: 'skip', msg: `¡${pkmn.name} está profundamente dormido!` }
      : { action: 'recover', msg: `¡${pkmn.name} se ha despertado!`, newStatus: 'none' };
  }
  if (pkmn.status === 'paralyzed' && Math.random() < 0.25) {
    return { action: 'skip', msg: `¡${pkmn.name} está paralizado! ¡No puede moverse!` };
  }
  if (pkmn.status === 'frozen') {
    return Math.random() < 0.2
      ? { action: 'recover', msg: `¡${pkmn.name} se ha descongelado!`, newStatus: 'none' }
      : { action: 'skip', msg: `¡${pkmn.name} está congelado!` };
  }
  return { action: 'pass' };
}

function handlePlayerFaint(s: BattleState, effects: BattleEffect[], pkmn: Pokemon): BattleState {
  const anyAlive = s.playerTeam.slice(1).some(p => p.hp > 0);
  // Order: log "X fainted!" → FAINT sound (parallel) → faint anim (HP sync).
  const msg = anyAlive
    ? `¡${pkmn.name} se debilitó! ¡Elige tu siguiente POKÉMON!`
    : `¡${pkmn.name} se debilitó! ¡No te quedan POKÉMON sanos!`;
  effects.push(log(msg));
  effects.push({ type: 'sound', payload: 'FAINT' });
  effects.push({ type: 'player_anim', payload: 'faint' });
  if (!anyAlive) {
    return { ...s, outcome: 'player_blackout', phase: 'PLAYER_FAINTED' };
  }
  return { ...s, phase: 'FORCED_SWITCH' };
}

// ─── Struggle ────────────────────────────────────────────────────────────────

const STRUGGLE: Move = {
  name: 'FORCEJEO', type: 'normal', power: 50, accuracy: 100, pp: 99, maxPp: 99, sfxType: 'noise'
};

function getStruggle(pkmn: Pokemon): Move | null {
  if (pkmn.moves.every(m => m.pp <= 0)) return STRUGGLE;
  return null;
}

const PHYSICAL_TYPES = new Set(['normal','fighting','rock','ground','ghost','bug','poison','flying','ice']);

// ─── Damage calculation dispatch ─────────────────────────────────────────────

function computeDamage(playerPkmn: Pokemon, enemyPkmn: Pokemon, move: Move, s: BattleState): { damage: number; result: DamageResult } {
  if (move.halfHp) {
    const dmg = Math.max(1, Math.floor(enemyPkmn.hp / 2));
    return { damage: dmg, result: { damage: dmg, isCritical: false, effectiveness: 1, effectivenessLabel: 'normal' } };
  }
  if (move.name === 'CONTRAATAQUE') {
    const dmg = (playerPkmn.lastPhysicalDamage || 0) * 2;
    return { damage: dmg, result: { damage: dmg, isCritical: false, effectiveness: 1, effectivenessLabel: 'normal' } };
  }
  if (move.fixedDmg) {
    const eff = getTypeEffectiveness(move.type, enemyPkmn.types ?? [enemyPkmn.type]);
    return { damage: move.fixedDmg, result: { damage: move.fixedDmg, isCritical: false, effectiveness: eff, effectivenessLabel: eff === 0 ? 'no_effect' : 'normal' } };
  }
  if (move.dmgEqualsLevel) {
    const eff = getTypeEffectiveness(move.type, enemyPkmn.types ?? [enemyPkmn.type]);
    return { damage: playerPkmn.level, result: { damage: playerPkmn.level, isCritical: false, effectiveness: eff, effectivenessLabel: eff === 0 ? 'no_effect' : 'normal' } };
  }

  const attackMultiplier = s.hasBoulderBadge ? 1 + s.badgeBoostGlitchStacks * 0.125 : 1;
  const attacker = attackMultiplier > 1
    ? { ...playerPkmn, baseStats: { ...playerPkmn.baseStats, attack: Math.floor(playerPkmn.baseStats.attack * attackMultiplier) } }
    : playerPkmn;

  let numHits = 1;
  if (move.multiHit) {
    const range = move.multiHit.maxHits - move.multiHit.minHits + 1;
    numHits = move.multiHit.minHits + Math.floor(Math.random() * range);
  }

  let totalDmg = 0;
  let effLabel: string | null = 'normal';
  let eff = 1;
  let anyCrit = false;
  for (let h = 0; h < numHits; h++) {
    const hitResult = calculateDamage(attacker, enemyPkmn, move);
    totalDmg += hitResult.damage;
    effLabel = hitResult.effectivenessLabel ?? effLabel;
    eff = hitResult.effectiveness;
    if (hitResult.isCritical) anyCrit = true;
  }
  return { damage: totalDmg, result: { damage: totalDmg, isCritical: anyCrit, effectiveness: eff, effectivenessLabel: effLabel } };
}

function formatEffectiveness(moveName: string, result: DamageResult, targetName: string, damage: number): string {
  let text = `¡${moveName}!`;
  if (result.effectivenessLabel === 'no_effect') return text + ` No afecta a ${targetName}...`;
  if (result.isCritical) text += ' ¡Golpe crítico!';
  if (result.effectivenessLabel === 'super_effective') text += ' ¡Es supereficaz!';
  if (result.effectivenessLabel === 'not_very_effective') text += ' No es muy eficaz...';
  return text + ` Causó ${damage} de daño.`;
}

/** Attacker swing animation only — no hit/flash/shake. Pair with
 *  `pushDefenderHit` and a log entry between them so the sequence reads
 *  swing → text → defender flinch + HP sync. */
function pushAttackerSwing(effects: BattleEffect[], move: Move, isPlayer: boolean, moveNameOverride?: string): void {
  const mn = moveNameOverride ?? move.name;
  const mt = move.type;
  effects.push({
    type: isPlayer ? 'player_anim' : 'enemy_anim',
    payload: 'attack',
    moveName: mn,
    moveType: mt,
  });
}

/** Defender recoil + screen flash + shake. Skip this when an attack does
 *  no damage (no_effect / miss) — there's nothing to flinch from. */
function pushDefenderHit(effects: BattleEffect[], isPlayer: boolean): void {
  effects.push({ type: isPlayer ? 'enemy_anim' : 'player_anim', payload: 'hit' });
  effects.push({ type: 'screen_flash' });
  effects.push({ type: 'battle_shake' });
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

      // Bide
      if (playerPkmn.bideState) {
        if (playerPkmn.bideState.remainingTurns > 1) {
          effects.push(log(`¡${playerPkmn.name} está acumulando energía!`));
          return { state: { ...s, phase: 'ENEMY_ATTACK' }, effects };
        }
        const bideDmg = Math.max(1, playerPkmn.bideState.accumulatedDamage * 2);
        const bideTeam = [...s.playerTeam];
        bideTeam[0] = { ...bideTeam[0], bideState: undefined };
        pushAttackerSwing(effects, { name: 'ESPERA', type: 'normal' } as Move, true, 'ESPERA');
        effects.push(log(`¡${playerPkmn.name} desató la energía! Causó ${bideDmg} de daño.`));
        pushDefenderHit(effects, true);
        const bideNewHP = Math.max(0, s.enemyPokemon.hp - bideDmg);
        s = { ...s, playerTeam: bideTeam, enemyPokemon: { ...s.enemyPokemon, hp: bideNewHP }, phase: bideNewHP === 0 ? 'ENEMY_FAINTED' : 'ENEMY_ATTACK' };
        if (bideNewHP === 0) {
          effects.push(log(`¡${s.enemyPokemon.name} se debilitó!`));
          effects.push({ type: 'sound', payload: 'FAINT' });
          effects.push({ type: 'enemy_anim', payload: 'faint' });
        }
        return { state: s, effects };
      }

      // Rage lock
      if (playerPkmn.rageActive && move.name !== 'FURIA') {
        move = playerPkmn.moves.find(m => m.name === 'FURIA') || move;
      }

      // Struggle check
      if (move.pp <= 0) {
        const struggle = getStruggle(playerPkmn);
        if (struggle) {
          move = struggle;
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
      playerPkmn = s.playerTeam[0];

      // Confusion check
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
          if (newHp === 0) return { state: handlePlayerFaint({ ...s, playerTeam: confusedTeam }, effects, playerPkmn), effects };
          return { state: { ...s, playerTeam: confusedTeam }, effects };
        }
        s = { ...s, playerTeam: confusedTeam };
      }

      // Hyper Beam recharge
      if (playerPkmn.recharging) {
        effects.push(log(`¡${playerPkmn.name} debe recargar!`));
        return { state: { ...s, playerTeam: s.playerTeam.map((p,i) => i === 0 ? { ...p, recharging: false } : p), phase: 'ENEMY_ATTACK' }, effects };
      }

      // Rampage lock
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

      // Two-turn charging
      if (playerPkmn.charging) {
        if (move.twoTurn) {
          effects.push(log(`¡${playerPkmn.name} ${move.twoTurn.chargeMessage}`));
          return { state: { ...s, phase: 'ENEMY_ATTACK' }, effects };
        }
      }

      // Status check
      const statusCheck = checkPlayerStatusBeforeMove(playerPkmn);
      if (statusCheck.action === 'skip') {
        effects.push(log(statusCheck.msg));
        return { state: { ...s, phase: 'ENEMY_ATTACK' }, effects };
      }
      if (statusCheck.action === 'recover') {
        effects.push(log(statusCheck.msg));
        const wokenTeam = [...s.playerTeam];
        wokenTeam[0] = { ...wokenTeam[0], status: statusCheck.newStatus };
        s = { ...s, playerTeam: wokenTeam };
      }

      // ── Turn order ────────────────────────────────────────────────────────
      const enemyMove = s.isTrainerBattle
        ? selectTrainerMove(s.enemyPokemon, playerPkmn)
        : (s.enemyPokemon.moves.filter(m => m.pp > 0).length > 0
            ? s.enemyPokemon.moves.filter(m => m.pp > 0)[Math.floor(Math.random() * s.enemyPokemon.moves.filter(m => m.pp > 0).length)]
            : STRUGGLE);

      const playerEffSpeed = playerPkmn.baseStats.speed * (playerPkmn.status === 'paralyzed' ? 0.25 : 1);
      const enemyEffSpeed = s.enemyPokemon.baseStats.speed * (s.enemyPokemon.status === 'paralyzed' ? 0.25 : 1);
      const playerPri = move.priority ?? 0;
      const enemyPri = enemyMove.priority ?? 0;

      let enemyAlreadyAttacked = false;

      if (enemyPri > playerPri
        || (enemyPri === playerPri && enemyEffSpeed > playerEffSpeed)
        || (enemyPri === playerPri && enemyEffSpeed === playerEffSpeed && Math.random() < 0.5)) {

        enemyAlreadyAttacked = true;

        const eStatus = checkEnemyStatus(s.enemyPokemon);
        if (eStatus.action === 'skip') {
          effects.push(log(eStatus.msg));
        } else if (eStatus.action === 'recover') {
          effects.push(log(eStatus.msg));
          s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: eStatus.newStatus } };
        }

        if (eStatus.action !== 'skip') {
          effects.push({ type: 'enemy_anim', payload: 'attack', moveName: enemyMove.name, moveType: enemyMove.type });

          if (!doesMoveHit(enemyMove.accuracy, s.enemyPokemon.statBoosts?.accuracy ?? 0,
              playerPkmn.statBoosts?.evasion ?? 0)) {
            effects.push(log(`¡${s.enemyPokemon.name} usó ${enemyMove.name}! ¡Pero falló!`));
          } else if (enemyMove.power === 0) {
            let moveLog = `¡${s.enemyPokemon.name} usó ${enemyMove.name}!`;
            const sc = applyStatChange(enemyMove, false, s.playerTeam, s.enemyPokemon, s.hasBoulderBadge, s.badgeBoostGlitchStacks);
            if (sc.msg) moveLog += ' ' + sc.msg;
            s = { ...s, playerTeam: sc.playerTeam, enemyPokemon: sc.enemyPokemon, badgeBoostGlitchStacks: sc.newGlitchStacks };
            if (enemyMove.statusEffect && Math.random() * 100 < (enemyMove.statusChance || 100)) {
              const ut = [...s.playerTeam];
              ut[0] = { ...ut[0], status: enemyMove.statusEffect };
              s = { ...s, playerTeam: ut };
              moveLog += ` ¡${playerPkmn.name} ahora está ${enemyMove.statusEffect}!`;
            }
            effects.push(log(moveLog, s.enemyPokemon.name));
          } else {
            const enemyResult = calculateDamage(s.enemyPokemon, playerPkmn, enemyMove);
            const enemyDmg = enemyResult.damage;
            const newPlayerHP = Math.max(0, playerPkmn.hp - enemyDmg);

            const eName = enemyNameDisplay(s.enemyPokemon);
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
            if (PHYSICAL_TYPES.has(enemyMove.type)) {
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
            if (ut[0].bideState) {
              ut[0].bideState.accumulatedDamage += enemyDmg;
              ut[0].bideState.remainingTurns -= 1;
            }
            // Order: swing already pushed above → log → defender hit (HP sync).
            effects.push(log(enemyLog, s.enemyPokemon.name));
            if (enemyResult.effectivenessLabel !== 'no_effect') {
              pushDefenderHit(effects, false);
            }
            s = { ...s, playerTeam: ut };
          }
        }

        playerPkmn = s.playerTeam[0];
        if (playerPkmn.hp === 0) {
          return { state: handlePlayerFaint(s, effects, playerPkmn), effects };
        }
      }

      // ── Player attack ──────────────────────────────────────────────────────
      if (!doesMoveHit(move.accuracy, playerPkmn.statBoosts?.accuracy ?? 0, s.enemyPokemon.statBoosts?.evasion ?? 0)) {
        effects.push(log(`¡${playerPkmn.name} usó ${move.name}! ¡Pero falló!`));
        return { state: { ...s, phase: 'ENEMY_ATTACK' }, effects };
      }

      // Status move
      if (move.power === 0) {
        let moveLog = `¡${playerPkmn.name} usó ${move.name}!`;
        const sc = applyStatChange(move, true, s.playerTeam, s.enemyPokemon, s.hasBoulderBadge, s.badgeBoostGlitchStacks);
        if (sc.msg) moveLog += ' ' + sc.msg;
        s = { ...s, playerTeam: sc.playerTeam, enemyPokemon: sc.enemyPokemon, badgeBoostGlitchStacks: sc.newGlitchStacks };

        if (move.name === 'DRENADORAS') {
          if (s.enemyPokemon.leechSeed) {
            moveLog += ' ¡Pero ya está afectado!';
          } else {
            s = { ...s, enemyPokemon: { ...s.enemyPokemon, leechSeed: true } };
            moveLog += ` ¡${s.enemyPokemon.name} fue sembrado!`;
          }
        }
        if (move.confuseChance && Math.random() * 100 < (move.confuseChance)) {
          s = { ...s, enemyPokemon: { ...s.enemyPokemon, confused: { turns: 2 + Math.floor(Math.random() * 4) } } };
          moveLog += ` ¡${s.enemyPokemon.name} está confuso!`;
        }
        if (move.statusEffect && Math.random() * 100 < (move.statusChance || 100)) {
          s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: move.statusEffect } };
          moveLog += ` ¡${s.enemyPokemon.name} ahora está ${move.statusEffect}!`;
        }
        effects.push(log(moveLog, playerPkmn.name));
        return { state: { ...s, phase: 'ENEMY_ATTACK' }, effects };
      }

      // OHKO move
      if (move.ohko) {
        if (s.enemyPokemon.level > playerPkmn.level) {
          effects.push(log('¡No afecta al POKÉMON enemigo!'));
          return { state: { ...s, phase: 'ENEMY_ATTACK' }, effects };
        }
        let ohkoAcc = 30 + (playerPkmn.level - s.enemyPokemon.level);
        if (ohkoAcc < 0) ohkoAcc = 0;
        if (Math.random() * 100 >= ohkoAcc) {
          effects.push(log(`¡${playerPkmn.name} usó ${move.name}! ¡Pero falló!`));
          return { state: { ...s, phase: 'ENEMY_ATTACK' }, effects };
        }
        pushAttackerSwing(effects, move, true);
        effects.push(log(`¡${playerPkmn.name} usó ${move.name}! ¡Golpe fulminante!`));
        pushDefenderHit(effects, true);
        s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: 0 }, phase: 'ENEMY_ATTACK' };
        return { state: s, effects };
      }

      // Damage move
      const { damage, result } = computeDamage(playerPkmn, s.enemyPokemon, move, s);

      // Two-turn execution: clear charging flag
      if (move.twoTurn) {
        const unchargedTeam = [...s.playerTeam];
        unchargedTeam[0] = { ...unchargedTeam[0], charging: undefined };
        s = { ...s, playerTeam: unchargedTeam };
      }

      const newEnemyHP = Math.max(0, s.enemyPokemon.hp - damage);
      const attackLog = formatEffectiveness(playerPkmn.name + ' usó ' + move.name, result, s.enemyPokemon.name, damage);

      pushAttackerSwing(effects, move, true);
      effects.push(log(attackLog, playerPkmn.name));
      if (result.effectivenessLabel !== 'no_effect') {
        pushDefenderHit(effects, true);
      }

      s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: newEnemyHP }, log: attackLog };

      // Post-attack effects
      if (move.name === 'FORCEJEO') {
        const recoil = Math.max(1, Math.floor(damage / 4));
        const recoilTeam = [...s.playerTeam];
        recoilTeam[0] = { ...recoilTeam[0], hp: Math.max(0, recoilTeam[0].hp - recoil) };
        s = { ...s, playerTeam: recoilTeam };
        effects.push(log(`¡${playerPkmn.name} recibió daño por el rebote!`));
        if (recoilTeam[0].hp === 0) {
          effects.push(log(`¡${playerPkmn.name} se debilitó por el rebote!`));
        }
      } else if (move.recoil) {
        const recoilDmg = Math.max(1, Math.floor(damage * move.recoil));
        const recoilTeam = [...s.playerTeam];
        recoilTeam[0] = { ...recoilTeam[0], hp: Math.max(0, recoilTeam[0].hp - recoilDmg) };
        s = { ...s, playerTeam: recoilTeam };
        effects.push(log(`¡${playerPkmn.name} recibió daño por el rebote!`));
      }

      if (move.drain && result.effectivenessLabel !== 'no_effect') {
        const drained = Math.max(1, Math.floor(damage * move.drain));
        const drainTeam = [...s.playerTeam];
        drainTeam[0] = { ...drainTeam[0], hp: Math.min(drainTeam[0].maxHp, drainTeam[0].hp + drained) };
        s = { ...s, playerTeam: drainTeam };
        effects.push(log(`¡${playerPkmn.name} absorbió vitalidad!`));
      }

      if (move.faintsUser) {
        const faintTeam = [...s.playerTeam];
        faintTeam[0] = { ...faintTeam[0], hp: 0 };
        s = { ...s, playerTeam: faintTeam };
        effects.push(log(`¡${playerPkmn.name} se debilitó!`));
      }

      if (move.recharge && newEnemyHP > 0) {
        const reTeam = [...s.playerTeam];
        reTeam[0] = { ...reTeam[0], recharging: true };
        s = { ...s, playerTeam: reTeam };
      }

      if (move.twoTurn && !playerPkmn.charging) {
        const chgTeam = [...s.playerTeam];
        chgTeam[0] = { ...chgTeam[0], charging: true };
        s = { ...s, playerTeam: chgTeam };
      }

      if (move.rampage && !playerPkmn.rampage) {
        const rmpTeam = [...s.playerTeam];
        rmpTeam[0] = { ...rmpTeam[0], rampage: { move, remainingTurns: 2 + Math.floor(Math.random() * 2) } };
        s = { ...s, playerTeam: rmpTeam };
      }

      if (move.statusEffect && Math.random() * 100 < (move.statusChance || 100)) {
        s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: move.statusEffect } };
      }

      if (move.trap && !s.enemyPokemon.trapped) {
        s = { ...s, enemyPokemon: { ...s.enemyPokemon, trapped: { damage: Math.max(1, Math.floor(s.enemyPokemon.maxHp / 16)), remainingTurns: 2 + Math.floor(Math.random() * 3) } } };
      }

      if (newEnemyHP === 0) {
        const result2 = handleEnemyFainted(s, playerPkmn, effects);
        return { state: result2.s, effects: result2.effects };
      }

      // The player's own attack may have fainted the active Pokémon — e.g.
      // Self-Destruct (faintsUser), Struggle/Double-Edge recoil, or a confusion
      // self-hit earlier in this branch. Route directly to PLAYER_FAINTED
      // instead of letting the enemy retaliate against a 0-HP target.
      const postAttackPlayer = s.playerTeam[0];
      if (postAttackPlayer.hp === 0) {
        return { state: handlePlayerFaint(s, effects, postAttackPlayer), effects };
      }

      if (enemyAlreadyAttacked) {
        effects.push(log(''));
        return { state: { ...s, log: '', phase: 'CHOOSING' }, effects };
      }

      return { state: { ...s, phase: 'ENEMY_ATTACK' }, effects };
    }

    // ── CHEAT_KO ────────────────────────────────────────────────────────────
    case 'CHEAT_KO': {
      if (s.phase !== 'CHOOSING') return { state, effects };
      const playerPkmn = s.playerTeam[0];
      effects.push({ type: 'player_anim', payload: 'attack', moveName: 'ATAQUE FULMINANTE', moveType: 'normal' });
      effects.push(log(`¡ATAQUE FULMINANTE! Causó ${s.enemyPokemon.hp} de daño.`, playerPkmn.name));
      pushDefenderHit(effects, true);
      s = { ...s, enemyPokemon: { ...s.enemyPokemon, hp: 0 } };
      const result2 = handleEnemyFainted(s, playerPkmn, effects);
      return { state: result2.s, effects: result2.effects };
    }

    // ── TICK ────────────────────────────────────────────────────────────────
    case 'TICK': {
      if (s.phase === 'ENEMY_ATTACK') {
        const playerPkmn = s.playerTeam[0];

        // Defensive: a fainted enemy must never act. This can happen when
        // recoil / leech-seed / poison ticks finished the enemy off between
        // phases — we still need to short-circuit cleanly back to CHOOSING.
        if (s.enemyPokemon.hp <= 0) {
          effects.push(log(''));
          return { state: { ...s, log: '', phase: 'CHOOSING' }, effects };
        }

        const eStatus = checkEnemyStatus(s.enemyPokemon);
        if (eStatus.action === 'skip') {
          effects.push(log(eStatus.msg));
          effects.push(log(''));
          return { state: { ...s, log: '', phase: 'CHOOSING' }, effects };
        }
        if (eStatus.action === 'recover') {
          effects.push(log(eStatus.msg));
          s = { ...s, enemyPokemon: { ...s.enemyPokemon, status: eStatus.newStatus } };
        }

        const enemyMove = s.isTrainerBattle
          ? selectTrainerMove(s.enemyPokemon, playerPkmn)
          : s.enemyPokemon.moves[Math.floor(Math.random() * s.enemyPokemon.moves.length)];
        effects.push({ type: 'enemy_anim', payload: 'attack', moveName: enemyMove.name, moveType: enemyMove.type });

        if (!doesMoveHit(enemyMove.accuracy, s.enemyPokemon.statBoosts?.accuracy ?? 0, playerPkmn.statBoosts?.evasion ?? 0)) {
          effects.push(log(`¡${s.enemyPokemon.name} usó ${enemyMove.name}! ¡Pero falló!`));
          effects.push(log(''));
          return { state: { ...s, log: '', phase: 'CHOOSING' }, effects };
        }

        // Status move
        if (enemyMove.power === 0) {
          let moveLog = `¡${s.enemyPokemon.name} usó ${enemyMove.name}!`;
          const sc = applyStatChange(enemyMove, false, s.playerTeam, s.enemyPokemon, s.hasBoulderBadge, s.badgeBoostGlitchStacks);
          if (sc.msg) moveLog += ' ' + sc.msg;
          s = { ...s, playerTeam: sc.playerTeam, enemyPokemon: sc.enemyPokemon, badgeBoostGlitchStacks: sc.newGlitchStacks };
          if (enemyMove.statusEffect && Math.random() * 100 < (enemyMove.statusChance || 100)) {
            const ut2 = [...s.playerTeam];
            ut2[0] = { ...ut2[0], status: enemyMove.statusEffect };
            s = { ...s, playerTeam: ut2 };
            moveLog += ` ¡${playerPkmn.name} ahora está ${enemyMove.statusEffect}!`;
          }
          effects.push(log(moveLog, s.enemyPokemon.name));
          effects.push(log(''));
          return { state: { ...s, log: '', phase: 'CHOOSING' }, effects };
        }

        // Damage move
        const enemyResult = calculateDamage(s.enemyPokemon, playerPkmn, enemyMove);
        const enemyDamage = enemyResult.damage;
        const newPlayerHP = Math.max(0, playerPkmn.hp - enemyDamage);

        const eName = enemyNameDisplay(s.enemyPokemon);
        let enemyLog = `¡${eName} usó ${enemyMove.name}!`;
        if (enemyResult.effectivenessLabel === 'no_effect') {
          enemyLog += ` No afecta a ${playerPkmn.name}...`;
        } else {
          if (enemyResult.isCritical) enemyLog += ' ¡Golpe crítico!';
          if (enemyResult.effectivenessLabel === 'super_effective') enemyLog += ' ¡Es supereficaz!';
          if (enemyResult.effectivenessLabel === 'not_very_effective') enemyLog += ' No es muy eficaz...';
          enemyLog += ` Causó ${enemyDamage} de daño.`;
        }

        const ut3 = [...s.playerTeam];
        if (PHYSICAL_TYPES.has(enemyMove.type)) {
          ut3[0] = { ...ut3[0], hp: newPlayerHP, lastPhysicalDamage: enemyDamage };
          if (ut3[0].rageActive) {
            ut3[0] = { ...ut3[0], statBoosts: { ...(ut3[0].statBoosts ?? ZERO_BOOSTS), attack: Math.min(6, (ut3[0].statBoosts?.attack ?? 0) + 1) } };
          }
        } else {
          ut3[0] = { ...ut3[0], hp: newPlayerHP };
        }
        if (ut3[0].bideState) {
          ut3[0].bideState.accumulatedDamage += enemyDamage;
          ut3[0].bideState.remainingTurns -= 1;
        }
        if (enemyMove.statusEffect && Math.random() * 100 < (enemyMove.statusChance || 100)) {
          ut3[0].status = enemyMove.statusEffect;
          enemyLog += ` ¡${playerPkmn.name} ahora está ${enemyMove.statusEffect}!`;
        }

        // Order: swing already pushed above → log → defender hit (HP sync).
        effects.push(log(enemyLog, s.enemyPokemon.name));
        if (enemyResult.effectivenessLabel !== 'no_effect') {
          pushDefenderHit(effects, false);
        }
        s = { ...s, playerTeam: ut3 };

        if (newPlayerHP === 0) {
          return { state: handlePlayerFaint(s, effects, playerPkmn), effects };
        }
        effects.push(log(''));
        return { state: { ...s, log: '', phase: 'CHOOSING' }, effects };
      }

      if (s.phase === 'ENEMY_FAINTED' || s.phase === 'LEVEL_UP' || s.phase === 'EVOLVING') {
        effects.push(log(''));
        s = { ...s, log: '', phase: 'CHOOSING' };
      }

      if (s.phase === 'TRAINER_NEXT_POKEMON') {
        effects.push(log(''));
        s = { ...s, enemyPokemon: s.enemyTeam[s.currentEnemyIndex], log: '', phase: 'CHOOSING' };
      }

      if (s.phase === 'CHOOSING') {
        s = handleEndOfTurnEffects(s, effects);
      }

      return { state: s, effects };
    }

    // ── SWITCH ──────────────────────────────────────────────────────────────
    case 'SWITCH': {
      if (s.phase !== 'FORCED_SWITCH' && s.phase !== 'CHOOSING' && s.phase !== 'BATTLE_TEAM') {
        return { state, effects };
      }
      const idx = action.index;
      if (idx <= 0 || idx >= s.playerTeam.length) return { state, effects };
      if (s.playerTeam[idx].hp === 0) return { state, effects };

      const newTeam = [...s.playerTeam];
      [newTeam[0], newTeam[idx]] = [newTeam[idx], newTeam[0]];
      effects.push(log(`¡Vamos, ${newTeam[0].name}!`));

      const nextPhase: BattleSubPhase = s.phase === 'FORCED_SWITCH' ? 'CHOOSING' : 'ENEMY_ATTACK';
      const activeUid = newTeam[0].uid!;
      const nextParticipants = s.participantUids.includes(activeUid)
        ? s.participantUids
        : [...s.participantUids, activeUid];
      s = { ...s, playerTeam: newTeam, log: `¡Vamos, ${newTeam[0].name}!`, phase: nextPhase, participantUids: nextParticipants };

      return { state: s, effects };
    }

    // ── USE_ITEM ────────────────────────────────────────────────────────────
    case 'USE_ITEM': {
      const qty = s.inventory[action.itemId] ?? 0;
      if (qty <= 0) return { state, effects };

      const result2 = applyItemToPokemon(s.playerTeam[action.targetIndex], action.itemId);
      if (!result2.success) {
        effects.push(log(result2.message));
        return { state: { ...s, phase: 'CHOOSING' }, effects };
      }

      const newQty = qty - 1;
      const newInventory = newQty > 0
        ? { ...s.inventory, [action.itemId]: newQty }
        : (() => { const { [action.itemId]: _, ...rest } = s.inventory; return rest; })();

      const updated = [...s.playerTeam];
      updated[action.targetIndex] = result2.pokemon;
      effects.push(log(result2.message));
      return { state: { ...s, playerTeam: updated, inventory: newInventory, log: result2.message, phase: 'ENEMY_ATTACK' }, effects };
    }

    // ── CATCH ───────────────────────────────────────────────────────────────
    case 'CATCH': {
      if (s.phase !== 'CHOOSING') return { state, effects };
      if (s.isTrainerBattle) {
        effects.push(log('¡No puedes usar eso en un combate contra un entrenador!'));
        return { state: { ...s, phase: 'CHOOSING' }, effects };
      }

      const ballType = action.ballType ?? 'POKEBALL';
      const ballQty = s.inventory[ballType] ?? 0;
      if (ballQty <= 0) return { state, effects };

      const newInv = ballQty - 1 > 0
        ? { ...s.inventory, [ballType]: ballQty - 1 }
        : (() => { const { [ballType]: _, ...rest } = s.inventory; return rest; })();

      let caught = false;
      if (ballType === 'MASTER_BALL') {
        // Canonical Gen I: Master Ball always succeeds.
        caught = true;
      } else {
        const catchStatus = s.enemyPokemon.status;
        const r1 = Math.floor(Math.random() * 256);
        if ((catchStatus === 'sleep' || catchStatus === 'frozen') && r1 < 25) {
          caught = true;
        } else if ((catchStatus === 'paralyzed' || catchStatus === 'burn' || catchStatus === 'poison') && r1 < 12) {
          caught = true;
        }

        if (!caught) {
          const speciesCatchRate = s.enemyPokemon.catchRate ?? 45;
          const catchV = Math.floor(
            speciesCatchRate * (s.enemyPokemon.maxHp * 3 - s.enemyPokemon.hp * 2) / (s.enemyPokemon.maxHp * 3)
          );
          caught = Math.floor(Math.random() * 256) < catchV;
        }
      }

      s = { ...s, inventory: newInv, phase: 'CATCHING' };
      const ballLabel = ballType === 'MASTER_BALL' ? 'MASTER BALL' : 'POKÉ BALL';
      effects.push(log(`¡Pablo lanzó una ${ballLabel}!`, 'Pablo'));

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
        return { state: { ...s, playerTeam: cleared.playerTeam, pcStorage: newPC, inventory: newInv, outcome: 'caught', phase: 'CATCHING' }, effects };
      }

      effects.push(log('¡Oh, no! ¡El POKÉMON se ha escapado!'));
      s = { ...s, phase: 'ENEMY_ATTACK' };
      const tickResult = stepBattle(s, { type: 'TICK' });
      return { state: tickResult.state, effects: [...effects, ...tickResult.effects] };
    }

    // ── FLEE ────────────────────────────────────────────────────────────────
    case 'FLEE': {
      if (s.phase !== 'CHOOSING') return { state, effects };
      if (s.isTrainerBattle) {
        effects.push(log(`¡No puedes huir de un combate contra un entrenador!`));
        s = { ...s, phase: 'ENEMY_ATTACK' };
        const r = stepBattle(s, { type: 'TICK' });
        return { state: r.state, effects: [...effects, ...r.effects] };
      }

      const playerSpeed = s.playerTeam[0].status === 'paralyzed'
        ? Math.floor(s.playerTeam[0].baseStats.speed / 4)
        : s.playerTeam[0].baseStats.speed;
      const enemySpeed = Math.max(1, s.enemyPokemon.status === 'paralyzed'
        ? Math.floor(s.enemyPokemon.baseStats.speed / 4)
        : s.enemyPokemon.baseStats.speed);
      const fleeValue = (playerSpeed * 128 / enemySpeed + 30) % 256;

      s = { ...s, phase: 'PLAYER_ATTACK' };

      if (Math.floor(Math.random() * 256) < fleeValue) {
        const cleared = clearBoosts(s.playerTeam, s.enemyPokemon);
        effects.push(log('¡Has escapado con éxito!', 'Pablo'));
        return { state: { ...s, playerTeam: cleared.playerTeam, enemyPokemon: cleared.enemyPokemon, badgeBoostGlitchStacks: 0, outcome: 'fled', log: '¡Has escapado con éxito!' }, effects };
      }

      effects.push(log('¡No has podido escapar!', 'Pablo'));
      s = { ...s, phase: 'ENEMY_ATTACK' };
      const r = stepBattle(s, { type: 'TICK' });
      return { state: r.state, effects: [...effects, ...r.effects] };
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
  const sanitizedTeam = playerTeam.map((p, i) => ({
    ...p,
    moves: p.moves.filter(Boolean),
    uid: p.uid ?? `team-${i}`,
  }));
  const enemyTeam = options.enemyTeam ?? [enemyPokemon];
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
