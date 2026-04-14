import { useCallback, useEffect, useRef, MutableRefObject } from 'react';
import { GamePhase, battle, B_CHOOSING, B_PLAYER_ATTACK, B_ENEMY_ATTACK, B_PLAYER_FAINTED, B_FORCED_SWITCH, B_ENEMY_FAINTED, B_CATCHING, B_LEVEL_UP, B_EVOLVING, B_BATTLE_INVENTORY, B_BATTLE_TEAM, B_TRAINER_NEXT_POKEMON, EXPLORING, BLACKOUT, HEALING } from '../types/gamePhase';
import { stepBattle, BattleState, BattleAction, BattleEffect } from '../lib/battleEngine';
import { soundManager } from '../lib/sounds';
import { sd } from '../lib/gameSpeed';
import { fullHeal } from '../lib/healUtils';
import { applyGodMode } from '../lib/godMode';
import { useGameStore } from '../store/gameStore';

interface UseBattleEngineParams {
  battleStateRef: MutableRefObject<BattleState | null>;
  setPlayerAnim: (anim: 'idle' | 'attack' | 'hit' | 'faint') => void;
  setEnemyAnim: (anim: 'idle' | 'attack' | 'hit' | 'faint') => void;
  setBattleShake: (v: boolean) => void;
}

function mapEnginePhase(p: string): GamePhase {
  switch (p) {
    case 'CHOOSING': return battle(B_CHOOSING);
    case 'PLAYER_ATTACK': return battle(B_PLAYER_ATTACK);
    case 'ENEMY_ATTACK': return battle(B_ENEMY_ATTACK);
    case 'PLAYER_FAINTED': return battle(B_PLAYER_FAINTED);
    case 'FORCED_SWITCH': return battle(B_FORCED_SWITCH);
    case 'ENEMY_FAINTED': return battle(B_ENEMY_FAINTED);
    case 'CATCHING': return battle(B_CATCHING);
    case 'LEVEL_UP': return battle(B_LEVEL_UP);
    case 'EVOLVING': return battle(B_EVOLVING);
    case 'BATTLE_INVENTORY': return battle(B_BATTLE_INVENTORY);
    case 'BATTLE_TEAM': return battle(B_BATTLE_TEAM);
    case 'TRAINER_NEXT_POKEMON': return battle(B_TRAINER_NEXT_POKEMON);
    default: return battle(B_CHOOSING);
  }
}

export type BattleMessage = { text: string; speaker: string; id: number };

export function useBattleEngine({
  battleStateRef,
  setPlayerAnim,
  setEnemyAnim,
  setBattleShake,
}: UseBattleEngineParams) {
  const store = useGameStore();
  const nextLogId = useRef(0);

  useEffect(() => {
    const onGodModeToggled = (e: Event) => {
      const active = (e as CustomEvent).detail;
      if (active && battleStateRef.current) {
        const newTeam = applyGodMode(battleStateRef.current.playerTeam);
        battleStateRef.current = { ...battleStateRef.current, playerTeam: newTeam };
        useGameStore.getState().setPlayerTeam(newTeam);
      }
    };
    window.addEventListener('godModeToggled', onGodModeToggled);
    return () => window.removeEventListener('godModeToggled', onGodModeToggled);
  }, [battleStateRef]);

  const playBattleEffects = (effects: BattleEffect[]): number => {
    let delay = 0;
    effects.forEach(effect => {
      const d = delay;
      switch (effect.type) {
        case 'log':
          setTimeout(() => {
            const text = effect.payload as string;
            useGameStore.getState().setBattleLog(text);
            if (text.trim() !== '') {
              useGameStore.getState().setBattleLogs(prev => {
                const newMsg = { text, speaker: effect.speaker || 'Sistema', id: nextLogId.current++ };
                return [newMsg, ...prev].slice(0, 5);
              });
            }
          }, d);
          delay += sd(500);
          break;
        case 'sound':
          soundManager.play(effect.payload as Parameters<typeof soundManager.play>[0]);
          break;
        case 'player_anim':
          setTimeout(() => setPlayerAnim(effect.payload as 'idle' | 'attack' | 'hit' | 'faint'), d);
          if (effect.payload === 'hit' || effect.payload === 'faint') delay += sd(400);
          break;
        case 'enemy_anim':
          setTimeout(() => setEnemyAnim(effect.payload as 'idle' | 'attack' | 'hit' | 'faint'), d);
          if (effect.payload === 'hit' || effect.payload === 'faint' || effect.payload === 'attack') delay += sd(400);
          break;
        case 'battle_shake':
          setTimeout(() => { setBattleShake(true); setTimeout(() => setBattleShake(false), sd(400)); }, d);
          break;
      }
    });
    return delay;
  };

  const resolveBattleOutcome = (newState: BattleState) => {
    const s = useGameStore.getState();
    const npcs = s.getNPCs();
    
    if (newState.outcome === 'player_win') {
      if (newState.isTrainerBattle) {
        const trainer = npcs[s.currentMap]?.find(n => n.isTrainer && n.trainerTeam?.some(p => p.id === newState.enemyPokemon.id));
        if (trainer) {
          const moneyReward = newState.enemyPokemon.level * 20;
          s.setDefeatedTrainers(prev => [...prev, trainer.id]);
          if (moneyReward > 0) s.setMoney(prev => prev + moneyReward);
          if (trainer.id === 'brock') {
            s.setBadges(prev => [...prev, 'BOULDER']);
            s.setBattleLog(`${s.battleLog}\n¡Recibiste la MEDALLA ROCA de BROCK!`);
          }
        }
      }
      setTimeout(() => {
        s.setInventory(newState.inventory);
        s.setActiveBattle(null);
        s.setPhase(EXPLORING);
        setEnemyAnim('idle');
        if (s.storyStep === 'PICKED_STARTER') {
          s.setStoryStep('RIVAL_BATTLE');
          s.setDialogue('AZUL: ¡Maldición! ¡He perdido! Pero no volverá a pasar.');
        }
      }, sd(2000));
    } else if (newState.outcome === 'player_blackout') {
      s.setActiveBattle(null);
      s.setPhase(BLACKOUT);
      setTimeout(() => {
        s.setCurrentMap(s.lastHealLocation.map);
        s.setPlayerPos(s.lastHealLocation.pos);
      }, sd(1200));
      setTimeout(() => {
        s.setPhase(HEALING);
        setTimeout(() => {
          s.setPlayerTeam(newState.playerTeam.map(fullHeal));
          soundManager.play('SELECT');
        }, sd(800));
        setTimeout(() => {
          s.setPhase(EXPLORING);
          s.setDialogue('¡Te has quedado sin POKÉMON! Fuiste llevado al último lugar de descanso.');
        }, sd(1600));
      }, sd(2400));
    } else if (newState.outcome === 'fled') {
      s.setInventory(newState.inventory);
      s.setActiveBattle(null);
      s.setPhase(EXPLORING);
    }
  };

  const dispatchBattle = useCallback((action: BattleAction) => {
    if (!battleStateRef.current) return;
    if (battleStateRef.current.outcome !== 'ongoing') return;
    
    const ph = battleStateRef.current.phase;
    const validPhase = ph === 'CHOOSING' || (ph === 'FORCED_SWITCH' && action.type === 'SWITCH');
    if (!validPhase && action.type !== 'TICK') return;

    const { state: newState, effects } = stepBattle(battleStateRef.current, action);
    battleStateRef.current = newState;
    
    const s = useGameStore.getState();
    s.setActiveBattle(newState);
    s.setEnemyPokemon(newState.enemyPokemon);
    s.setIsTrainerBattle(newState.isTrainerBattle);
    
    if (action.type !== 'TICK') {
      s.setInventory(newState.inventory);
    }

    if (action.type === 'CATCH') {
      if (newState.outcome === 'ongoing' && newState.phase === 'CHOOSING') {
        const d = playBattleEffects(effects);
        setTimeout(() => s.setPhase(battle(B_CHOOSING)), d);
        return;
      }

      s.setPhase(battle(B_CATCHING));
      s.setCatchResult(null);
      s.setBattleLog('¡Pablo lanzó una POKÉ BALL!');
      soundManager.play('SELECT');

      if (newState.outcome === 'caught') {
        setTimeout(() => s.setCatchResult(true), sd(2800));
        setTimeout(() => {
          s.setCatchResult(null);
          s.updatePokedex(newState.enemyPokemon.id, true);
          s.setPcStorage(newState.pcStorage);
          s.syncTeamStats(newState.playerTeam);
          s.setActiveBattle(null);
          s.setPhase(EXPLORING);
        }, sd(4000));
      } else {
        setTimeout(() => s.setCatchResult(false), sd(2800));
        setTimeout(() => {
          s.setCatchResult(null);
          s.syncTeamStats(newState.playerTeam);
          s.setEnemyPokemon(newState.enemyPokemon);
          s.setPhase(mapEnginePhase(newState.phase));
        }, sd(4000));
      }
      return;
    }

    const enemyTurnIdx = effects.findIndex(e => e.type === 'enemy_anim' && e.payload === 'attack');
    const playerEffects = enemyTurnIdx >= 0 ? effects.slice(0, enemyTurnIdx) : effects;
    const enemyEffects = enemyTurnIdx >= 0 ? effects.slice(enemyTurnIdx) : [];

    if (action.type === 'ATTACK') {
      setPlayerAnim('attack');
      soundManager.play('SELECT');
    }

    const pDuration = playBattleEffects(playerEffects);
    const pDelay = Math.max(pDuration + sd(300), sd(800));

    const finalize = (state: BattleState, delay: number) => {
      setTimeout(() => {
        setPlayerAnim('idle');
        setEnemyAnim('idle');
        useGameStore.getState().setPhase(mapEnginePhase(state.phase));
        resolveBattleOutcome(state);

        if (state.phase === 'TRAINER_NEXT_POKEMON') {
          setTimeout(() => {
            if (!battleStateRef.current || battleStateRef.current.outcome !== 'ongoing') return;
            const r = stepBattle(battleStateRef.current, { type: 'TICK' });
            battleStateRef.current = r.state;
            useGameStore.getState().setEnemyPokemon(r.state.enemyPokemon);
            useGameStore.getState().setPhase(mapEnginePhase(r.state.phase));
          }, sd(1200));
        }
      }, delay);
    };

    if (enemyEffects.length > 0) {
      setTimeout(() => {
        setPlayerAnim('idle');
        setEnemyAnim('idle');
        useGameStore.getState().syncTeamStats(newState.playerTeam);
        const eDuration = playBattleEffects(enemyEffects);
        const eDelay = Math.max(eDuration + sd(300), sd(800));
        finalize(newState, eDelay);
      }, pDelay);
    } else {
      useGameStore.getState().syncTeamStats(newState.playerTeam);
      finalize(newState, pDelay);
    }
  }, [battleStateRef, setPlayerAnim, setEnemyAnim]);

  return {
    dispatchBattle,
    catchResult: store.catchResult,
    setEnemyPokemon: store.setEnemyPokemon,
    setIsTrainerBattle: store.setIsTrainerBattle,
    setBattleLog: store.setBattleLog,
    setBattleLogs: store.setBattleLogs,
  };
}
