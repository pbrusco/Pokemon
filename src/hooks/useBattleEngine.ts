import { useCallback, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { Pokemon, MapID, NPC, Entity, InventoryCounts } from '../types';
import { GamePhase, battle, B_CHOOSING, B_PLAYER_ATTACK, B_ENEMY_ATTACK, B_PLAYER_FAINTED, B_FORCED_SWITCH, B_ENEMY_FAINTED, B_CATCHING, B_LEVEL_UP, B_EVOLVING, B_BATTLE_INVENTORY, B_BATTLE_TEAM, EXPLORING, BLACKOUT, HEALING } from '../types/gamePhase';
import { stepBattle, BattleState, BattleAction, BattleEffect } from '../lib/battleEngine';
import { soundManager } from '../lib/sounds';
import { sd } from '../lib/gameSpeed';

interface GameStateSnapshot {
  npcs: Record<MapID, NPC[]>;
  currentMap: MapID;
  storyStep: string;
  lastHealLocation: { map: MapID; pos: { x: number; y: number } };
  inventory: InventoryCounts;
  pcStorage: Pokemon[];
  playerTeam: Pokemon[];
  badges: string[];
  items: Record<MapID, Entity[]>;
  [key: string]: unknown;
}

interface UseBattleEngineParams {
  battleStateRef: MutableRefObject<BattleState | null>;
  gameState: MutableRefObject<GameStateSnapshot>;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  setShowMoves: Dispatch<SetStateAction<boolean>>;
  setPlayerTeam: (team: Pokemon[]) => void;
  setEnemyPokemon: Dispatch<SetStateAction<Pokemon | null>>;
  setPlayerAnim: (anim: string) => void;
  setEnemyAnim: (anim: string) => void;
  setBattleLog: Dispatch<SetStateAction<string>>;
  setCatchResult: Dispatch<SetStateAction<boolean | null>>;
  setDefeatedTrainers: (fn: (prev: string[]) => string[]) => void;
  setBadges: (fn: (prev: string[]) => string[]) => void;
  setMoney: (fn: (prev: number) => number) => void;
  setStoryStep: (step: string) => void;
  setDialogue: (d: string | null) => void;
  setInventory: (inv: InventoryCounts) => void;
  setPcStorage: (pc: Pokemon[]) => void;
  setCurrentMap: (map: MapID) => void;
  setPlayerPos: (pos: { x: number; y: number }) => void;
  setPokedex: (fn: (prev: Record<string, { seen: boolean; caught: boolean }>) => Record<string, { seen: boolean; caught: boolean }>) => void;
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
    default: return battle(B_CHOOSING);
  }
}

export function useBattleEngine({
  battleStateRef,
  gameState,
  setPhase,
  setShowMoves,
  setPlayerTeam,
  setEnemyPokemon,
  setPlayerAnim,
  setEnemyAnim,
  setBattleLog,
  setCatchResult,
  setDefeatedTrainers,
  setBadges,
  setMoney,
  setStoryStep,
  setDialogue,
  setInventory,
  setPcStorage,
  setCurrentMap,
  setPlayerPos,
  setPokedex,
  setBattleShake,
}: UseBattleEngineParams) {
  const playBattleEffects = (effects: BattleEffect[]): number => {
    let delay = 0;
    effects.forEach(effect => {
      const d = delay;
      switch (effect.type) {
        case 'log':
          setTimeout(() => setBattleLog(effect.payload as string), d);
          delay += sd(500);
          break;
        case 'sound':
          soundManager.play(effect.payload as string);
          break;
        case 'player_anim':
          setTimeout(() => setPlayerAnim(effect.payload as string), d);
          if (effect.payload === 'hit' || effect.payload === 'faint') delay += sd(400);
          break;
        case 'enemy_anim':
          setTimeout(() => setEnemyAnim(effect.payload as string), d);
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
    const { npcs, currentMap, storyStep, lastHealLocation } = gameState.current;
    if (newState.outcome === 'player_win') {
      if (newState.isTrainerBattle) {
        const trainer = npcs[currentMap]?.find(n => n.isTrainer && n.trainerTeam?.some(p => p.id === newState.enemyPokemon.id));
        if (trainer) {
          const moneyReward = newState.enemyPokemon.level * 20;
          setDefeatedTrainers(prev => [...prev, trainer.id]);
          if (moneyReward > 0) setMoney(prev => prev + moneyReward);
          if (trainer.id === 'brock') {
            setBadges(prev => [...prev, 'BOULDER']);
            setBattleLog(prev => `${prev}\n¡Recibiste la MEDALLA ROCA de BROCK!`);
          }
        }
      }
      setTimeout(() => {
        setInventory(newState.inventory);
        setPhase(EXPLORING);
        setEnemyAnim('idle');
        if (storyStep === 'PICKED_STARTER') {
          setStoryStep('RIVAL_BATTLE');
          setDialogue('AZUL: ¡Maldición! ¡He perdido! Pero no volverá a pasar.');
        }
      }, sd(2000));
    } else if (newState.outcome === 'player_blackout') {
      setPhase(BLACKOUT);
      setTimeout(() => {
        setCurrentMap(lastHealLocation.map);
        setPlayerPos(lastHealLocation.pos);
      }, sd(1200));
      setTimeout(() => {
        setPhase(HEALING);
        setTimeout(() => {
          setPlayerTeam(newState.playerTeam.map(p => ({ ...p, hp: p.maxHp, status: 'none' as const, moves: p.moves.map(m => ({ ...m, pp: m.maxPp })) })));
          soundManager.play('SELECT');
        }, sd(800));
        setTimeout(() => {
          setPhase(EXPLORING);
          setDialogue('¡Te has quedado sin POKÉMON! Fuiste llevado al último lugar de descanso.');
        }, sd(1600));
      }, sd(2400));
    } else if (newState.outcome === 'fled') {
      setInventory(newState.inventory);
      setPhase(EXPLORING);
    }
  };

  const dispatchBattle = useCallback((action: BattleAction) => {
    if (!battleStateRef.current) return;
    if (battleStateRef.current.outcome !== 'ongoing') return;
    const ph = battleStateRef.current.phase;
    const validPhase = ph === 'CHOOSING' || (ph === 'FORCED_SWITCH' && action.type === 'SWITCH');
    if (!validPhase && action.type !== 'TICK') return;

    setPhase(battle(B_PLAYER_ATTACK));
    setShowMoves(false);

    const { state: newState, effects } = stepBattle(battleStateRef.current, action);
    battleStateRef.current = newState;

    if (action.type === 'CATCH') {
      setPhase(battle(B_CATCHING));
      setCatchResult(null);
      setBattleLog('¡Pablo lanzó una POKÉ BALL!');
      soundManager.play('SELECT');
      setInventory(newState.inventory);

      if (newState.outcome === 'caught') {
        setTimeout(() => setCatchResult(true), sd(2800));
        setTimeout(() => {
          setCatchResult(null);
          setPokedex(prev => ({ ...prev, [newState.enemyPokemon.id]: { seen: true, caught: true } }));
          setPcStorage(newState.pcStorage);
          setPlayerTeam(newState.playerTeam);
          setPhase(EXPLORING);
        }, sd(4000));
      } else {
        setTimeout(() => setCatchResult(false), sd(2800));
        setTimeout(() => {
          setCatchResult(null);
          setPlayerTeam(newState.playerTeam);
          setEnemyPokemon(newState.enemyPokemon);
          setPhase(mapEnginePhase(newState.phase));
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
      setPlayerTeam(newState.playerTeam);
    }

    const playerDuration = playBattleEffects(playerEffects);
    const playerDelay = Math.max(playerDuration + sd(300), sd(800));

    if (enemyEffects.length > 0) {
      setTimeout(() => {
        setPlayerAnim('idle');
        setEnemyAnim('idle');
        setPlayerTeam(newState.playerTeam);
        const enemyDuration = playBattleEffects(enemyEffects);
        const enemyDelay = Math.max(enemyDuration + sd(300), sd(800));

        setTimeout(() => {
          setPlayerAnim('idle');
          setEnemyAnim('idle');
          setPhase(mapEnginePhase(newState.phase));
          resolveBattleOutcome(newState);
        }, enemyDelay);
      }, playerDelay);
    } else {
      setPlayerTeam(newState.playerTeam);
      setTimeout(() => {
        setPlayerAnim('idle');
        setEnemyAnim('idle');
        setPhase(mapEnginePhase(newState.phase));
        resolveBattleOutcome(newState);
      }, playerDelay);
    }
  }, [battleStateRef]);

  return { dispatchBattle };
}
