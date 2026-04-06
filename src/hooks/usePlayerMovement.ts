import { useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Direction } from '../types';
import { soundManager } from '../lib/sounds';

export const usePlayerMovement = () => {
  const store = useGameStore();
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMove = useCallback((dir: Direction) => {
    // We get fresh state directly from the store to avoid stale closures
    const state = useGameStore.getState();
    const {
      isMoving, dialogue, isBattle, isLocked, direction,
      playerPos, currentMap, playerTeam, worldMaps,
      teleports, defeatedTrainers, storyStep, items
    } = state;

    if (isMoving || dialogue || isBattle || isLocked) return;

    if (dir !== direction) {
      state.setDirection(dir);
      return;
    }
    
    let nextX = playerPos.x;
    let nextY = playerPos.y;

    switch (dir) {
      case 'up': nextY--; break;
      case 'down': nextY++; break;
      case 'left': nextX--; break;
      case 'right': nextX++; break;
    }

    // Story: Oak stops player
    if (currentMap === 'PALLET_TOWN' && nextY === 5 && playerTeam.length === 0) {
      state.setDialogue("OAK: ¡Espera! ¡No vayas por ahí!");
      state.setStoryStep('OAK_STOPPED');
      state.setIsLocked(true);
      setTimeout(() => {
        const freshState = useGameStore.getState();
        freshState.setIsLocked(false);
        freshState.setCurrentMap('OAKS_LAB');
        freshState.setPlayerPos({ x: 10, y: 14 });
        freshState.setDialogue("OAK: ¡Es peligroso ir solo! Ven, elige un POKÉMON.");
      }, 1000);
      return;
    }

    // Boundary and collision check
    const map = worldMaps[currentMap];
    const npcs = state.getNPCs();
    const npcAtNext = npcs[currentMap]?.some(n => n.position.x === nextX && n.position.y === nextY);
    const objectAtNext = items[currentMap]?.some(i => i.type === 'object' && i.position.x === nextX && i.position.y === nextY);
    if (
      nextX >= 0 && nextX < 20 &&
      nextY >= 0 && nextY < 20 &&
      map[nextY][nextX].walkable &&
      !npcAtNext &&
      !objectAtNext
    ) {
      state.setIsMoving(true);
      state.setPlayerPos({ x: nextX, y: nextY });
      
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      moveTimeout.current = setTimeout(() => {
        useGameStore.getState().setIsMoving(false);
      }, 100);

      // Check for teleports
      const teleport = teleports[currentMap]?.find(t => t.position.x === nextX && t.position.y === nextY);
      if (teleport && teleport.targetMap && teleport.targetPos) {
        soundManager.play('SELECT');
        setTimeout(() => {
          const s = useGameStore.getState();
          s.setCurrentMap(teleport.targetMap!);
          s.setPlayerPos(teleport.targetPos!);
        }, 150);
      }

      // Check for trainers
      const currentMapTrainers = state.getNPCs()[currentMap]?.filter(n => n.isTrainer && !defeatedTrainers.includes(n.id)) || [];
      for (const trainer of currentMapTrainers) {
        for (let i = 1; i <= 3; i++) {
          let visionX = trainer.position.x;
          let visionY = trainer.position.y;
          if (trainer.direction === 'up') visionY -= i;
          if (trainer.direction === 'down') visionY += i;
          if (trainer.direction === 'left') visionX -= i;
          if (trainer.direction === 'right') visionX += i;
          
          if (visionX === nextX && visionY === nextY) {
            state.setDialogue(`${trainer.name}: ¡Eh! ¡Te he visto! ¡Vamos a luchar!`);
            setTimeout(() => {
              soundManager.play('BATTLE_START');
              const s = useGameStore.getState();
              s.setEnemyPokemon(trainer.trainerTeam![0]);
              s.setShowBattleTransition(true);
              s.setIsLocked(true);
            }, 1500);
            return;
          }
        }
      }

    }
  }, []);

  return { handleMove };
};
