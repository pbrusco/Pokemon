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

  // Auto-sync: if the store has an activeBattle but battleStateRef is empty,
  // populate the ref. This happens when a cutscene's processBattle() sets
  // activeBattle in the store without access to the React mutable ref.
  const activeBattle = store.activeBattle;
  useEffect(() => {
    if (activeBattle && !battleStateRef.current) {
      battleStateRef.current = activeBattle;
    }
  }, [activeBattle, battleStateRef]);

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
        const trainer = npcs[s.currentMap]?.find(n => n.id === newState.trainerName);
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
        const fs = useGameStore.getState();
        fs.setInventory(newState.inventory);
        fs.setActiveBattle(null);
        fs.setPhase(EXPLORING);
        setEnemyAnim('idle');
        if (fs.storyStep === 'PICKED_STARTER') {
          fs.setStoryStep('RIVAL_BATTLE');
          fs.setDialogue('AZUL: ¡Maldición! ¡He perdido! Pero no volverá a pasar.');
        }
      }, sd(2000));
    } else if (newState.outcome === 'player_blackout') {
      s.setActiveBattle(null);
      s.setPhase(BLACKOUT);
      const healLocation = s.lastHealLocation;
      setTimeout(() => {
        const fs = useGameStore.getState();
        fs.setCurrentMap(healLocation.map);
        fs.setPlayerPos(healLocation.pos);
      }, sd(1200));
      setTimeout(() => useGameStore.getState().setPhase(HEALING), sd(2400));
      setTimeout(() => {
        useGameStore.getState().setPlayerTeam(t => t.map(fullHeal));
        soundManager.play('SELECT');
      }, sd(2400) + sd(800));
      setTimeout(() => {
        const fs = useGameStore.getState();
        fs.setPhase(EXPLORING);
        fs.setDialogue('¡Te has quedado sin POKÉMON! Fuiste llevado al último lugar de descanso.');
      }, sd(2400) + sd(1600));
    } else if (newState.outcome === 'fled') {
      s.setInventory(newState.inventory);
      s.setActiveBattle(null);
      s.setPhase(EXPLORING);
    }
  };

  /** Handle catch-specific animation flow (separate from normal attack flow). */
  const handleCatchAction = (newState: BattleState, effects: BattleEffect[]) => {
    const s = useGameStore.getState();
    s.setActiveBattle(newState);
    s.setEnemyPokemon(newState.enemyPokemon);

    // Catch failed in a trainer battle — return to CHOOSING
    if (newState.outcome === 'ongoing' && newState.phase === 'CHOOSING') {
      const d = playBattleEffects(effects);
      setTimeout(() => useGameStore.getState().setPhase(battle(B_CHOOSING)), d);
      return;
    }

    s.setPhase(battle(B_CATCHING));
    s.setCatchResult(null);
    s.setBattleLog('¡Pablo lanzó una POKÉ BALL!');
    soundManager.play('SELECT');

    if (newState.outcome === 'caught') {
      setTimeout(() => useGameStore.getState().setCatchResult(true), sd(2800));
      setTimeout(() => {
        const fs = useGameStore.getState();
        fs.setCatchResult(null);
        fs.updatePokedex(newState.enemyPokemon.id, true);
        fs.setPcStorage(newState.pcStorage);
        fs.syncTeamStats(newState.playerTeam);
        fs.setActiveBattle(null);
        fs.setPhase(EXPLORING);
      }, sd(4000));
    } else {
      setTimeout(() => useGameStore.getState().setCatchResult(false), sd(2800));
      setTimeout(() => {
        const fs = useGameStore.getState();
        fs.setCatchResult(null);
        fs.syncTeamStats(newState.playerTeam);
        fs.setEnemyPokemon(newState.enemyPokemon);
        fs.setPhase(mapEnginePhase(newState.phase));
      }, sd(4000));
    }
  };

  // Stable ref so the deferred setTimeout callbacks always call the latest
  // version of dispatchBattle without creating a circular useCallback dep.
  const dispatchBattleRef = useRef<((action: BattleAction) => void) | undefined>(undefined);

  const dispatchBattle = useCallback((action: BattleAction) => {
    if (!battleStateRef.current) return;
    if (battleStateRef.current.outcome !== 'ongoing') return;

    const ph = battleStateRef.current.phase;
    const validPhase = ph === 'CHOOSING' || (ph === 'FORCED_SWITCH' && action.type === 'SWITCH');
    if (!validPhase && action.type !== 'TICK') return;

    const { state: newState, effects } = stepBattle(battleStateRef.current, action);
    battleStateRef.current = newState;

    const s = useGameStore.getState();
    s.setIsTrainerBattle(newState.isTrainerBattle);
    if (action.type !== 'TICK') {
      s.setInventory(newState.inventory);
    }

    if (action.type === 'CATCH') {
      handleCatchAction(newState, effects);
      return;
    }

    if (action.type === 'ATTACK') {
      setPlayerAnim('attack');
      soundManager.play('SELECT');
    }

    const aDuration = playBattleEffects(effects);
    const aDelay = Math.max(aDuration + sd(300), sd(800));

    setTimeout(() => {
      setPlayerAnim('idle');
      setEnemyAnim('idle');

      const fs = useGameStore.getState();
      fs.setActiveBattle(newState);
      fs.setEnemyPokemon(newState.enemyPokemon);
      fs.syncTeamStats(newState.playerTeam);

      if (newState.phase === 'ENEMY_ATTACK') {
        fs.setPhase(mapEnginePhase('ENEMY_ATTACK'));
        fs.setBattleLog('¡Turno del enemigo!');
        setTimeout(() => dispatchBattleRef.current?.({ type: 'TICK' }), sd(600));
      } else {
        fs.setPhase(mapEnginePhase(newState.phase));
        resolveBattleOutcome(newState);

        if (newState.phase === 'TRAINER_NEXT_POKEMON') {
          setTimeout(() => {
            if (!battleStateRef.current || battleStateRef.current.outcome !== 'ongoing') return;
            dispatchBattleRef.current?.({ type: 'TICK' });
          }, sd(1200));
        }
      }
    }, aDelay);
  }, [battleStateRef, setPlayerAnim, setEnemyAnim, setBattleShake]);

  dispatchBattleRef.current = dispatchBattle;

  return {
    dispatchBattle,
    catchResult: store.catchResult,
    setEnemyPokemon: store.setEnemyPokemon,
    setIsTrainerBattle: store.setIsTrainerBattle,
    setBattleLog: store.setBattleLog,
    setBattleLogs: store.setBattleLogs,
  };
}
