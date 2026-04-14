import { useCallback, useRef, useEffect, MutableRefObject } from 'react';
import { Direction, Pokemon } from '../types';
import { B_CHOOSING, BATTLE_TRANSITION, battle, BLACKOUT, HEALING, EXPLORING } from '../types/gamePhase';
import { fullHeal } from '../lib/healUtils';
import { BattleState, createBattleState } from '../lib/battleEngine';
import { soundManager } from '../lib/sounds';
import { sd } from '../lib/gameSpeed';
import { calcHp } from '../lib/damage';
import { WILD_POKEMON_DATABASE, WILD_ENCOUNTER_RATES } from '../constants';
import { isGodMode, applyGodMode } from '../lib/godMode';
import { triggerOakCutscene } from '../lib/oakCutscene';
import { triggerTrainerCutscene } from '../lib/cutscenes/trainerEncounter';
import { useGameStore } from '../store/gameStore';
import { GRID_SIZE } from '../types';

interface UseMovementEngineParams {
  battleStateRef: MutableRefObject<BattleState | null>;
  setOverworldShake: (v: boolean) => void;
}

export function useMovementEngine({
  battleStateRef,
  setOverworldShake,
}: UseMovementEngineParams) {
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);
  const poisonStepCounter = useRef(0);

  useEffect(() => {
    return () => {
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
    };
  }, []);

  const initBattle = useCallback((enemyPkmn: Pokemon, isTrainer: boolean) => {
    const s = useGameStore.getState();
    s.setEnemyPokemon(enemyPkmn);
    s.setIsTrainerBattle(isTrainer);
    
    const team = isGodMode() ? applyGodMode(s.playerTeam) : s.playerTeam;
    battleStateRef.current = createBattleState(team, enemyPkmn, {
      isTrainerBattle: isTrainer,
      inventory: s.inventory,
      pcStorage: s.pcStorage,
      hasBoulderBadge: s.badges.includes('BOULDER'),
    });
    
    s.setActiveBattle(battleStateRef.current);
    soundManager.play('BATTLE_START');
    s.setPhase(battle(B_CHOOSING)); // Immediate skip for some reason? No, usually it's BATTLE_TRANSITION
    s.setPhase(BATTLE_TRANSITION);
  }, [battleStateRef]);

  const handleMove = useCallback((dir: Direction) => {
    const store = useGameStore.getState();
    const { isMoving, dialogue, phase, playerPos, currentMap, playerTeam, worldMaps, defeatedTrainers } = store;
    const npcs = store.getNPCs();
    const items = store.getItems();
    const phaseType = phase.type;
    
    const lockedPhases = ['BATTLE', 'BATTLE_TRANSITION', 'HEALING', 'BLACKOUT'];
    if (isMoving || dialogue || lockedPhases.includes(phaseType)) return;

    store.setDirection(dir);

    let nextX = playerPos.x;
    let nextY = playerPos.y;

    switch (dir) {
      case 'up': nextY--; break;
      case 'down': nextY++; break;
      case 'left': nextX--; break;
      case 'right': nextX++; break;
    }

    // Story Event: Oak stops the player from leaving Pallet Town north without pokemon
    if (currentMap === 'PALLET_TOWN' && nextY === 5 && playerTeam.length === 0) {
      triggerOakCutscene(playerPos);
      return;
    }

    const mapData = worldMaps[currentMap];
    if (!mapData) return;
    const grid = mapData.tiles;

    const npcAtNext = npcs[currentMap]?.some(n => n.position.x === nextX && n.position.y === nextY);
    const objectAtNext = items[currentMap]?.some(i => i.type === 'object' && i.position.x === nextX && i.position.y === nextY);

    if (
      nextX >= 0 && nextX < GRID_SIZE &&
      nextY >= 0 && nextY < GRID_SIZE &&
      grid[nextY][nextX].walkable &&
      !npcAtNext &&
      !objectAtNext
    ) {
      const warpOnNext = mapData.warps.find(w => w.x === nextX && w.y === nextY);
      if (warpOnNext && warpOnNext.targetDir && dir !== warpOnNext.targetDir) {
        return; 
      }
      
      store.setIsMoving(true);
      store.setPlayerPos({ x: nextX, y: nextY });

      // Poison overworld damage
      const leadPokemon = playerTeam[0];
      if (leadPokemon?.status === 'poison' && leadPokemon.hp > 0) {
        poisonStepCounter.current += 1;
        if (poisonStepCounter.current >= 4) {
          poisonStepCounter.current = 0;
          const newTeam = [...playerTeam];
          newTeam[0] = { ...newTeam[0], hp: Math.max(0, newTeam[0].hp - 1) };
          store.setPlayerTeam(newTeam);
          store.setBattleLog(`¡${leadPokemon.name} recibió daño por veneno!`);
          setOverworldShake(true);
          setTimeout(() => setOverworldShake(false), sd(220));

          if (newTeam[0].hp === 0 && newTeam.every(p => p.hp === 0)) {
            store.setPhase(BLACKOUT);
            setTimeout(() => {
              const fs = useGameStore.getState();
              fs.setCurrentMap(fs.lastHealLocation.map);
              fs.setPlayerPos(fs.lastHealLocation.pos);
            }, sd(1200));
            setTimeout(() => {
              const fs = useGameStore.getState();
              fs.setPhase(HEALING);
              setTimeout(() => {
                useGameStore.getState().setPlayerTeam(newTeam.map(fullHeal));
                soundManager.play('SELECT');
              }, sd(800));
              setTimeout(() => {
                useGameStore.getState().setPhase(EXPLORING);
                useGameStore.getState().setDialogue('¡Te has quedado sin POKÉMON! Fuiste llevado al último lugar de descanso.');
              }, sd(1600));
            }, sd(2400));
          }
        }
      } else {
        poisonStepCounter.current = 0;
      }

      // Visual grass rustle
      if (grid[nextY][nextX].type === 'grass') {
        store.setGrassEffect({ x: nextX, y: nextY });
        setTimeout(() => useGameStore.getState().setGrassEffect(null), sd(500));
      }

      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      moveTimeout.current = setTimeout(() => {
        useGameStore.getState().setIsMoving(false);
      }, sd(110));

      // Warp check
      const warp = mapData.warps.find(w => w.x === nextX && w.y === nextY);
      if (warp) {
        soundManager.play('SELECT');
        setTimeout(() => {
          const fs = useGameStore.getState();
          fs.setCurrentMap(warp.targetMap);
          fs.setPlayerPos(warp.targetPos);
          if (warp.targetDir) fs.setDirection(warp.targetDir);
        }, sd(200));
      }

      // Trainer vision check
      const currentMapTrainers = npcs[currentMap].filter(n => n.isTrainer && !defeatedTrainers.includes(n.id));
      for (const trainer of currentMapTrainers) {
        for (let i = 1; i <= 3; i++) {
          let visionX = trainer.position.x;
          let visionY = trainer.position.y;
          if (trainer.direction === 'up') visionY -= i;
          if (trainer.direction === 'down') visionY += i;
          if (trainer.direction === 'left') visionX -= i;
          if (trainer.direction === 'right') visionX += i;

          if (visionX === nextX && visionY === nextY) {
            triggerTrainerCutscene(trainer, { x: nextX, y: nextY });
            break;
          }
        }
      }

      // Wild encounter roll
      const encounterRate = WILD_ENCOUNTER_RATES[currentMap] ?? 10;
      const encounterRoll = Math.floor(Math.random() * 256);
      if (grid[nextY][nextX].type === 'grass' && encounterRoll < encounterRate && playerTeam.length > 0) {
        if (playerTeam.every(p => p.hp === 0)) return;

        const routeWilds = WILD_POKEMON_DATABASE[currentMap] || WILD_POKEMON_DATABASE['ROUTE_1'];
        const randomPkmn = routeWilds[Math.floor(Math.random() * routeWilds.length)];
        const levelVariation = Math.floor(Math.random() * 3) - 1;
        const finalLevel = Math.max(2, randomPkmn.level + levelVariation);

        soundManager.play('BATTLE_START');
        const finalMaxHp = calcHp(randomPkmn.baseStats.hp, finalLevel);
        const wildPkmn = {
          ...randomPkmn,
          level: finalLevel,
          hp: finalMaxHp,
          maxHp: finalMaxHp,
          baseStats: {
            ...randomPkmn.baseStats,
            attack: Math.floor(randomPkmn.baseStats.attack * 0.85),
            special: Math.floor(randomPkmn.baseStats.special * 0.85),
          }
        };

        const fs = useGameStore.getState();
        fs.setEnemyPokemon(wildPkmn);
        fs.setIsTrainerBattle(false);
        const wildTeam = isGodMode() ? applyGodMode(fs.playerTeam) : fs.playerTeam;
        battleStateRef.current = createBattleState(wildTeam, wildPkmn, {
          inventory: fs.inventory,
          pcStorage: fs.pcStorage,
          hasBoulderBadge: fs.badges.includes('BOULDER'),
        });
        fs.setActiveBattle(battleStateRef.current);
        fs.updatePokedex(randomPkmn.id, false);
        fs.setBattleLog(`¡Un ${randomPkmn.name} salvaje apareció!`);
        fs.setBattleLogs([{ text: `¡Un ${randomPkmn.name} salvaje apareció!`, speaker: 'Sistema', id: -1 }]);
        fs.setPhase(BATTLE_TRANSITION);
      }
    }
  }, [battleStateRef, setOverworldShake]);

  return { handleMove, initBattle };
}
