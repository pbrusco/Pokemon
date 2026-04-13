import { useCallback, useState, useEffect, useRef, MutableRefObject } from 'react';
import { Pokemon } from '../types';
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
  const [enemyPokemon, setEnemyPokemon] = useState<Pokemon | null>(null);
  const [battleLog, setBattleLog] = useState("");
  const [battleLogs, setBattleLogs] = useState<BattleMessage[]>([]);
  const nextLogId = useRef(0);
  const [isTrainerBattle, setIsTrainerBattle] = useState(false);
  const [catchResult, setCatchResult] = useState<boolean | null>(null);

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
            setBattleLog(text);
            if (text.trim() !== '') {
              setBattleLogs(prev => {
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
    const store = useGameStore.getState();
    const npcs = store.getNPCs();
    
    if (newState.outcome === 'player_win') {
      if (newState.isTrainerBattle) {
        const trainer = npcs[store.currentMap]?.find(n => n.isTrainer && n.trainerTeam?.some(p => p.id === newState.enemyPokemon.id));
        if (trainer) {
          const moneyReward = newState.enemyPokemon.level * 20;
          store.setDefeatedTrainers(prev => [...prev, trainer.id]);
          if (moneyReward > 0) store.setMoney(prev => prev + moneyReward);
          if (trainer.id === 'brock') {
            store.setBadges(prev => [...prev, 'BOULDER']);
            setBattleLog(prev => `${prev}\n¡Recibiste la MEDALLA ROCA de BROCK!`);
          }
        }
      }
      setTimeout(() => {
        store.setInventory(newState.inventory);
        store.setActiveBattle(null);
        store.setPhase(EXPLORING);
        setEnemyAnim('idle');
        if (store.storyStep === 'PICKED_STARTER') {
          store.setStoryStep('RIVAL_BATTLE');
          store.setDialogue('AZUL: ¡Maldición! ¡He perdido! Pero no volverá a pasar.');
        }
      }, sd(2000));
    } else if (newState.outcome === 'player_blackout') {
      store.setActiveBattle(null);
      store.setPhase(BLACKOUT);
      setTimeout(() => {
        store.setCurrentMap(store.lastHealLocation.map);
        store.setPlayerPos(store.lastHealLocation.pos);
      }, sd(1200));
      setTimeout(() => {
        store.setPhase(HEALING);
        setTimeout(() => {
          store.setPlayerTeam(newState.playerTeam.map(fullHeal));
          soundManager.play('SELECT');
        }, sd(800));
        setTimeout(() => {
          store.setPhase(EXPLORING);
          store.setDialogue('¡Te has quedado sin POKÉMON! Fuiste llevado al último lugar de descanso.');
        }, sd(1600));
      }, sd(2400));
    } else if (newState.outcome === 'fled') {
      store.setInventory(newState.inventory);
      store.setActiveBattle(null);
      store.setPhase(EXPLORING);
    }
  };

  const dispatchBattle = useCallback((action: BattleAction) => {
    if (!battleStateRef.current) return;
    if (battleStateRef.current.outcome !== 'ongoing') return;
    
    const ph = battleStateRef.current.phase;
    const validPhase = ph === 'CHOOSING' || (ph === 'FORCED_SWITCH' && action.type === 'SWITCH');
    if (!validPhase && action.type !== 'TICK') return;

    useGameStore.getState().setPhase(battle(B_PLAYER_ATTACK));
    useGameStore.getState().setShowMoves(false);

    const { state: newState, effects } = stepBattle(battleStateRef.current, action);
    battleStateRef.current = newState;
    useGameStore.getState().setActiveBattle(newState);
    
    if (action.type !== 'TICK') {
      useGameStore.getState().setInventory(newState.inventory);
    }

    if (action.type === 'CATCH') {
      // If the engine rejected the catch (e.g. trainer battle), just show the log and stay in CHOOSING
      if (newState.phase === 'CHOOSING') {
        const delay = playBattleEffects(effects);
        setTimeout(() => {
          useGameStore.getState().setPhase(battle(B_CHOOSING));
        }, delay);
        return;
      }

      useGameStore.getState().setPhase(battle(B_CATCHING));
      setCatchResult(null);
      setBattleLog('¡Pablo lanzó una POKÉ BALL!');
      soundManager.play('SELECT');
      useGameStore.getState().setInventory(newState.inventory);

      if (newState.outcome === 'caught') {
        setTimeout(() => setCatchResult(true), sd(2800));
        setTimeout(() => {
          setCatchResult(null);
          useGameStore.getState().updatePokedex(newState.enemyPokemon.id, true);
          useGameStore.getState().setPcStorage(newState.pcStorage);
          useGameStore.getState().setPlayerTeam(newState.playerTeam);
          useGameStore.getState().setActiveBattle(null);
          useGameStore.getState().setPhase(EXPLORING);
        }, sd(4000));
      } else {
        setTimeout(() => setCatchResult(false), sd(2800));
        setTimeout(() => {
          setCatchResult(null);
          useGameStore.getState().setPlayerTeam(newState.playerTeam);
          setEnemyPokemon(newState.enemyPokemon);
          useGameStore.getState().setPhase(mapEnginePhase(newState.phase));
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
    setEnemyPokemon(newState.enemyPokemon);
    if (action.type !== 'ATTACK') {
      useGameStore.getState().setPlayerTeam(newState.playerTeam);
    }

    const playerDuration = playBattleEffects(playerEffects);
    const playerDelay = Math.max(playerDuration + sd(300), sd(800));

    const handlePostBattle = (state: BattleState, delay: number) => {
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
            setEnemyPokemon(r.state.enemyPokemon);
            useGameStore.getState().setPhase(mapEnginePhase(r.state.phase));
          }, sd(1200));
        }
      }, delay);
    };

    if (enemyEffects.length > 0) {
      setTimeout(() => {
        setPlayerAnim('idle');
        setEnemyAnim('idle');
        useGameStore.getState().setPlayerTeam(newState.playerTeam);
        const enemyDuration = playBattleEffects(enemyEffects);
        const enemyDelay = Math.max(enemyDuration + sd(300), sd(800));
        handlePostBattle(newState, enemyDelay);
      }, playerDelay);
    } else {
      useGameStore.getState().setPlayerTeam(newState.playerTeam);
      handlePostBattle(newState, playerDelay);
    }
  }, [battleStateRef]);

  return { dispatchBattle, enemyPokemon, setEnemyPokemon, battleLog, setBattleLog, battleLogs, setBattleLogs, isTrainerBattle, setIsTrainerBattle, catchResult };
}
