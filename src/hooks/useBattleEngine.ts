import { useGameStore } from '../store/gameStore';
import { Move } from '../types';
import { EVOLUTIONS, BASE_STATS } from '../constants';
import { soundManager } from '../lib/sounds';
import { calculateDamage, calcHp } from '../lib/damage';

interface BattleEngineCallbacks {
  setPlayerAnim: (anim: string) => void;
  setEnemyAnim: (anim: string) => void;
  setBattleLog: (updater: string | ((prev: string) => string)) => void;
  setScreenFlash: (flash: boolean) => void;
  setBattleShake: (shake: boolean) => void;
  setProjectile: (proj: any) => void;
  setHitEffect: (effect: any) => void;
  setDamageNumber: (dmg: any) => void;
}

export const useBattleEngine = (callbacks: BattleEngineCallbacks) => {
  const { setPlayerAnim, setEnemyAnim, setBattleLog, setScreenFlash, setBattleShake, setProjectile, setHitEffect, setDamageNumber } = callbacks;

  const handleEnemyTurn = () => {
    const state = useGameStore.getState();
    const { enemyPokemon, playerTeam, lastHealLocation } = state;
    if (!enemyPokemon || playerTeam.length === 0) return;
    const playerPkmn = playerTeam[0];
    
    // Status check
    if (enemyPokemon.status === 'sleep') {
      if (Math.random() > 0.3) {
        setBattleLog(`¡${enemyPokemon.name} está profundamente dormido!`);
        return;
      } else {
        setBattleLog(`¡${enemyPokemon.name} se ha despertado!`);
        state.setEnemyPokemon({ ...enemyPokemon, status: 'none' });
      }
    }

    if (enemyPokemon.status === 'paralyzed' && Math.random() < 0.25) {
      setBattleLog(`¡${enemyPokemon.name} está paralizado! ¡No puede moverse!`);
      return;
    }

    setTimeout(() => {
      setEnemyAnim('attack');
      // Fresh pull of enemy (in case it woke up)
      const currentEnemy = useGameStore.getState().enemyPokemon!;
      const enemyMove = currentEnemy.moves[Math.floor(Math.random() * currentEnemy.moves.length)];
      
      if (enemyMove.type !== 'normal') {
        setProjectile({ type: enemyMove.type, from: 'enemy' });
        setTimeout(() => setProjectile(null), 600);
      }

      soundManager.play('HIT');
      
      setTimeout(() => {
        setEnemyAnim('idle');
        setPlayerAnim('hit');
        soundManager.play('HIT');
        setScreenFlash(true);
        
        const freshState = useGameStore.getState();
        const freshPlayerPkmn = freshState.playerTeam[0];
        const enemyResult = calculateDamage(currentEnemy, freshPlayerPkmn, enemyMove);
        const enemyDamage = enemyResult.damage;
        setHitEffect({ x: 30, y: 70, type: enemyMove.type });
        setDamageNumber({ x: 30, y: 60, value: enemyDamage });
        setBattleShake(true);
        setTimeout(() => {
          setScreenFlash(false);
          setHitEffect(null);
          setDamageNumber(null);
          setBattleShake(false);
        }, 400);
        const newPlayerHP = Math.max(0, freshPlayerPkmn.hp - enemyDamage);
        
        const updatedTeam = [...freshState.playerTeam];
        updatedTeam[0] = { ...freshPlayerPkmn, hp: newPlayerHP };
        
        if (enemyMove.statusEffect && Math.random() * 100 < (enemyMove.statusChance || 100)) {
          updatedTeam[0].status = enemyMove.statusEffect;
          setBattleLog(prevLog => `${prevLog} ¡${freshPlayerPkmn.name} ahora está ${enemyMove.statusEffect}!`);
        }
        
        freshState.updateTeam(updatedTeam);
        let enemyLog = `¡${currentEnemy.name} usó ${enemyMove.name}!`;
        if (enemyResult.effectivenessLabel === 'no_effect') {
          enemyLog += ` No afecta a ${freshPlayerPkmn.name}...`;
        } else {
          if (enemyResult.isCritical) enemyLog += ' ¡Golpe crítico!';
          if (enemyResult.effectivenessLabel === 'super_effective') enemyLog += ' ¡Es supereficaz!';
          if (enemyResult.effectivenessLabel === 'not_very_effective') enemyLog += ' No es muy eficaz...';
          enemyLog += ` Causó ${enemyDamage} de daño.`;
        }
        setBattleLog(enemyLog);
        
        setTimeout(() => {
          if (newPlayerHP === 0) {
            const tempState = useGameStore.getState();
            const anyAlive = tempState.playerTeam.some(p => p.hp > 0);
            
            if (!anyAlive) {
              soundManager.play('FAINT');
              setPlayerAnim('faint');
              setBattleLog(`¡${freshPlayerPkmn.name} se debilitó! ¡No te quedan POKÉMON sanos!`);
              
              setTimeout(() => {
                const s = useGameStore.getState();
                s.setDialogue("¡Te has quedado sin POKÉMON! ¡Te desmayaste!");
                s.setBattleState(false, null);
                s.setShowBattleTransition(false);
                setPlayerAnim('idle');
                s.setPlayerPos(s.lastHealLocation.pos);
                s.setCurrentMap(s.lastHealLocation.map);
                
                const healedTeam = s.playerTeam.map(p => ({ ...p, hp: p.maxHp }));
                s.updateTeam(healedTeam);
              }, 2000);
            } else {
              soundManager.play('FAINT');
              setPlayerAnim('faint');
              setBattleLog(`¡${freshPlayerPkmn.name} se debilitó! Huyes del combate...`);
              setTimeout(() => {
                const s = useGameStore.getState();
                s.setBattleState(false, null);
                s.setShowBattleTransition(false);
                setPlayerAnim('idle');
              }, 1500);
            }
          } else {
            setPlayerAnim('idle');
          }
        }, 500);
      }, 300);
    }, 1000);
  };

  const handleCatch = () => {
    const state = useGameStore.getState();
    const { enemyPokemon, playerTeam } = state;
    if (!enemyPokemon) return;
    
    state.removeInventoryItem('POKEBALL');

    setBattleLog(`¡Pedro lanzó una POKÉ BALL!`);
    state.setIsCatching(true);
    soundManager.play('SELECT');
    
    const hpPercent = enemyPokemon.hp / enemyPokemon.maxHp;
    const catchRate = (1 - hpPercent) * 0.7 + 0.1;
    const roll = Math.random();
    
    setTimeout(() => {
      const s = useGameStore.getState();
      if (roll < catchRate) {
        soundManager.play('SELECT');
        setBattleLog(`¡Ya está! ¡${enemyPokemon.name} atrapado!`);
        
        setTimeout(() => {
          if (s.playerTeam.length < 6) {
            s.updateTeam([...s.playerTeam, { ...enemyPokemon, hp: enemyPokemon.hp }]);
          } else {
            s.updatePcStorage([...s.pcStorage, { ...enemyPokemon, hp: enemyPokemon.hp }]);
            setBattleLog(`¡${enemyPokemon.name} se envió al PC!`);
          }
          // Note: Pokedex would be updated here...
          
          s.setBattleState(false, null);
          s.setShowBattleTransition(false);
          s.setIsCatching(false);
        }, 2000);
      } else {
        setBattleLog(`¡Oh, no! ¡El POKÉMON se ha escapado!`);
        setTimeout(() => {
          s.setIsCatching(false);
          handleEnemyTurn();
        }, 1500);
      }
    }, 2000);
  };

  const handleAttack = (move: Move, playerAnimState: string, enemyAnimState: string) => {
    const state = useGameStore.getState();
    if (!state.enemyPokemon || state.playerTeam.length === 0 || playerAnimState !== 'idle' || enemyAnimState !== 'idle') return;

    const playerPkmn = state.playerTeam[0];
    
    if (playerPkmn.status === 'sleep') {
      if (Math.random() > 0.3) {
        setBattleLog(`¡${playerPkmn.name} está profundamente dormido!`);
        setTimeout(handleEnemyTurn, 1000);
        return;
      } else {
        setBattleLog(`¡${playerPkmn.name} se ha despertado!`);
        const newTeam = [...state.playerTeam];
        newTeam[0] = { ...newTeam[0], status: 'none' };
        state.updateTeam(newTeam);
      }
    }

    if (playerPkmn.status === 'paralyzed' && Math.random() < 0.25) {
      setBattleLog(`¡${playerPkmn.name} está paralizado! ¡No puede moverse!`);
      setTimeout(handleEnemyTurn, 1000);
      return;
    }

    setPlayerAnim('attack');
    soundManager.play('HIT');
    
    if (move.type !== 'normal') {
      setProjectile({ type: move.type, from: 'player' });
      setTimeout(() => setProjectile(null), 600);
    }

    setTimeout(() => {
      const s = useGameStore.getState();
      const currentEnemy = s.enemyPokemon!;
      const result = calculateDamage(playerPkmn, currentEnemy, move);
      const damage = result.damage;
      const newEnemyHP = Math.max(0, currentEnemy.hp - damage);
      
      setEnemyAnim('hit');
      setScreenFlash(true);
      setHitEffect({ x: 70, y: 30, type: move.type });
      setDamageNumber({ x: 70, y: 20, value: damage });
      setBattleShake(true);
      
      setTimeout(() => {
        setScreenFlash(false);
        setHitEffect(null);
        setDamageNumber(null);
        setBattleShake(false);
      }, 400);

      s.setEnemyPokemon({ ...currentEnemy, hp: newEnemyHP });
      let attackLog = `¡${playerPkmn.name} usó ${move.name}!`;
      if (result.effectivenessLabel === 'no_effect') {
        attackLog += ` No afecta a ${currentEnemy.name}...`;
      } else {
        if (result.isCritical) attackLog += ' ¡Golpe crítico!';
        if (result.effectivenessLabel === 'super_effective') attackLog += ' ¡Es supereficaz!';
        if (result.effectivenessLabel === 'not_very_effective') attackLog += ' No es muy eficaz...';
        attackLog += ` Causó ${damage} de daño.`;
      }
      setBattleLog(attackLog);

      if (move.statusEffect && Math.random() * 100 < (move.statusChance || 100)) {
        s.setEnemyPokemon({ ...currentEnemy, hp: newEnemyHP, status: move.statusEffect });
        setBattleLog(prevLog => `${prevLog} ¡${currentEnemy.name} ahora está ${move.statusEffect}!`);
      }

      setTimeout(() => {
        setPlayerAnim('idle');
        const freshEnemy = useGameStore.getState().enemyPokemon!;
        if (freshEnemy.hp === 0) {
          soundManager.play('FAINT');
          setEnemyAnim('faint');
          setBattleLog(`¡${freshEnemy.name} se debilitó!`);
          
          // EXP Gain
          const expGain = Math.floor((freshEnemy.level * 25) / 1);
          setTimeout(() => {
            setBattleLog(`¡${playerPkmn.name} ganó ${expGain} puntos de EXP!`);
            
            const expState = useGameStore.getState();
            const updated = [...expState.playerTeam];
            let pkmn = { ...updated[0] };
            pkmn.exp = (pkmn.exp || 0) + expGain;
            
            const expNeeded = pkmn.expToNextLevel || 100;
            if (pkmn.exp >= expNeeded) {
              pkmn.level += 1;
              pkmn.exp -= expNeeded;
              pkmn.expToNextLevel = pkmn.level * 100;
              const newMaxHp = calcHp(pkmn.baseStats.hp, pkmn.level);
              const hpGain = newMaxHp - pkmn.maxHp;
              pkmn.maxHp = newMaxHp;
              pkmn.hp += hpGain;
            }
            updated[0] = pkmn;
            expState.updateTeam(updated);
            
            setTimeout(() => {
              expState.setBattleState(false, null);
              expState.setShowBattleTransition(false);
              setEnemyAnim('idle');
            }, 2000);
          }, 1500);
        } else {
          handleEnemyTurn();
        }
      }, 1000);
    }, 1000);
  };

  return { handleEnemyTurn, handleCatch, handleAttack };
};
