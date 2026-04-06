import { useState, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Pokemon, Move, StatBoosts, NPC } from '../types';
import { 
  GamePhase, 
  EXPLORING, 
  battle, 
  B_CHOOSING, 
  B_PLAYER_ATTACK, 
  B_ENEMY_ATTACK, 
  B_ENEMY_FAINTED, 
  B_FORCED_SWITCH, 
  B_CATCHING, 
  B_LEVEL_UP, 
  B_EVOLVING,
  BLACKOUT,
  HEALING
} from '../types/gamePhase';
import { calculateDamage, calcHp, ZERO_BOOSTS } from '../lib/damage';
import { soundManager } from '../lib/sounds';
import { EVOLUTIONS } from '../constants';

export function useBattle(
  playerTeam: Pokemon[],
  setPlayerTeam: Dispatch<SetStateAction<Pokemon[]>>,
  setPhase: (phase: GamePhase) => void,
  setInventory: Dispatch<SetStateAction<string[]>>,
  updatePokedex: (id: string, caught?: boolean) => void,
  lastHealLocation: { map: string; pos: { x: number; y: number } },
  setCurrentMap: (map: any) => void,
  setPlayerPos: (pos: { x: number; y: number }) => void,
  setDialogue: (text: string | null) => void
) {
  // --- Battle Internal State ---
  const [enemyPokemon, setEnemyPokemon] = useState<Pokemon | null>(null);
  const [isTrainerBattle, setIsTrainerBattle] = useState(false);
  const [battleLog, setBattleLog] = useState("");
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  
  // Visual Effects
  const [screenFlash, setScreenFlash] = useState(false);
  const [battleShake, setBattleShake] = useState(false);
  const [hitEffect, setHitEffect] = useState<{ x: number, y: number, type: string } | null>(null);
  const [projectile, setProjectile] = useState<{ type: string, from: 'player' | 'enemy' } | null>(null);
  const [damageNumber, setDamageNumber] = useState<{ x: number, y: number, value: number } | null>(null);
  const [healNumber, setHealNumber] = useState<{ x: number, y: number, value: number } | null>(null);

  // --- Core Battle Logic ---

  const startBattle = useCallback((enemy: Pokemon, isTrainer: boolean) => {
    setEnemyPokemon(enemy);
    setIsTrainerBattle(isTrainer);
    setBattleLog(isTrainer ? `¡Entrenador te desafía!` : `¡Un ${enemy.name} salvaje apareció!`);
    updatePokedex(enemy.id);
  }, [updatePokedex]);

  const clearBattleStatBoosts = useCallback(() => {
    setPlayerTeam(prev => prev.map(p => ({ ...p, statBoosts: undefined })));
  }, [setPlayerTeam]);

  const handleEnemyTurn = useCallback(() => {
    if (!enemyPokemon || playerTeam.length === 0) return;
    const playerPkmn = playerTeam[0];

    // 1. Status Checks (Gen I rules)
    if (enemyPokemon.status === 'sleep' && Math.random() > 0.3) {
      setBattleLog(`¡${enemyPokemon.name} está profundamente dormido!`);
      setTimeout(() => setPhase(battle(B_CHOOSING)), 1000);
      return;
    }

    setPhase(battle(B_ENEMY_ATTACK));
    
    setTimeout(() => {
      setEnemyAnim('attack');
      const enemyMove = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];

      // 2. Execute Move
      if (enemyMove.type !== 'normal') {
        setProjectile({ type: enemyMove.type, from: 'enemy' });
        setTimeout(() => setProjectile(null), 600);
      }

      setTimeout(() => {
        const result = calculateDamage(enemyPokemon, playerPkmn, enemyMove);
        setPlayerAnim('hit');
        setScreenFlash(true);
        setBattleShake(true);
        setDamageNumber({ x: 30, y: 60, value: result.damage });

        const newHP = Math.max(0, playerPkmn.hp - result.damage);
        setPlayerTeam(prev => {
          const updated = [...prev];
          updated[0] = { ...updated[0], hp: newHP };
          return updated;
        });

        setBattleLog(`¡${enemyPokemon.name} usó ${enemyMove.name}!`);

        setTimeout(() => {
          setScreenFlash(false);
          setBattleShake(false);
          setDamageNumber(null);
          setPlayerAnim('idle');
          setEnemyAnim('idle');

          if (newHP === 0) {
            handlePlayerFaint();
          } else {
            setPhase(battle(B_CHOOSING));
          }
        }, 500);
      }, 300);
    }, 1000);
  }, [enemyPokemon, playerTeam, setPhase, setPlayerTeam]);

  const handlePlayerFaint = () => {
    soundManager.play('FAINT');
    setPlayerAnim('faint');
    const anyAlive = playerTeam.slice(1).some(p => p.hp > 0);

    if (!anyAlive) {
      setBattleLog("¡No te quedan POKÉMON sanos! ¡Te has desmayado!");
      setTimeout(() => {
        setPhase(BLACKOUT);
        setTimeout(() => {
          setCurrentMap(lastHealLocation.map);
          setPlayerPos(lastHealLocation.pos);
          setPhase(HEALING);
          setPlayerTeam(prev => prev.map(p => ({ ...p, hp: p.maxHp })));
          setPhase(EXPLORING);
        }, 2000);
      }, 1500);
    } else {
      setPhase(battle(B_FORCED_SWITCH));
    }
  };

  const handleAttack = useCallback((move: Move) => {
    if (!enemyPokemon || playerTeam.length === 0) return;
    const playerPkmn = playerTeam[0];

    setPhase(battle(B_PLAYER_ATTACK));
    setPlayerAnim('attack');

    setTimeout(() => {
      const result = calculateDamage(playerPkmn, enemyPokemon, move);
      const newEnemyHP = Math.max(0, enemyPokemon.hp - result.damage);
      
      setEnemyAnim('hit');
      setEnemyPokemon(prev => prev ? { ...prev, hp: newEnemyHP } : null);
      setBattleLog(`¡${playerPkmn.name} usó ${move.name}!`);

      if (newEnemyHP === 0) {
        setPhase(battle(B_ENEMY_FAINTED));
        setBattleLog(`¡${enemyPokemon.name} enemigo se debilitó!`);
        setTimeout(() => {
          clearBattleStatBoosts();
          setPhase(EXPLORING);
        }, 1500);
      } else {
        setTimeout(handleEnemyTurn, 1000);
      }
    }, 500);
  }, [enemyPokemon, playerTeam, handleEnemyTurn, setPhase, clearBattleStatBoosts]);

  return {
    enemyPokemon, setEnemyPokemon,
    isTrainerBattle,
    battleLog,
    playerAnim, enemyAnim,
    visuals: { screenFlash, battleShake, hitEffect, projectile, damageNumber, healNumber },
    actions: { startBattle, handleAttack, handleEnemyTurn }
  };
}