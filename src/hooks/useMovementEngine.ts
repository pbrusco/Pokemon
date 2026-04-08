import { useCallback, useRef, useEffect, MutableRefObject, Dispatch, SetStateAction } from 'react';
import { Direction, Position, Pokemon, MapID, NPC, Entity, InventoryCounts, GRID_SIZE } from '../types';
import { GamePhase, BATTLE_TRANSITION } from '../types/gamePhase';
import { BattleState, createBattleState } from '../lib/battleEngine';
import { soundManager } from '../lib/sounds';
import { sd } from '../lib/gameSpeed';
import { calcHp } from '../lib/damage';
import { WILD_POKEMON_DATABASE } from '../constants';

interface GameStateSnapshot {
  playerPos: Position;
  direction: Direction;
  isMoving: boolean;
  dialogue: string | null;
  phaseType: string;
  currentMap: MapID;
  playerTeam: Pokemon[];
  maps: Record<MapID, { tiles: { type: string; walkable: boolean }[][]; warps: Array<{ x: number; y: number; targetMap: MapID; targetPos: Position; targetDir?: Direction }> }>;
  npcs: Record<MapID, NPC[]>;
  items: Record<MapID, Entity[]>;
  defeatedTrainers: string[];
  inventory: InventoryCounts;
  storyStep: string;
  pcStorage: Pokemon[];
  badges: string[];
  [key: string]: unknown;
}

interface UseMovementEngineParams {
  gameState: MutableRefObject<GameStateSnapshot>;
  battleStateRef: MutableRefObject<BattleState | null>;
  setCurrentMap: (map: MapID) => void;
  setPlayerPos: (pos: Position) => void;
  setDirection: (dir: Direction) => void;
  setIsMoving: (v: boolean) => void;
  setDialogue: (d: string | null) => void;
  setStoryStep: (step: string) => void;
  setPlayerTeam: (fn: ((prev: Pokemon[]) => Pokemon[]) | Pokemon[]) => void;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  setOverworldShake: (v: boolean) => void;
  setGrassEffect: (pos: Position | null) => void;
  setSpottedTrainerId: (id: string | null) => void;
  setSpottedTrainerPos: (pos: Position | null | ((prev: Position | null) => Position | null)) => void;
  setEnemyPokemon: (p: Pokemon | null) => void;
  setIsTrainerBattle: Dispatch<SetStateAction<boolean>>;
  setBattleLog: Dispatch<SetStateAction<string>>;
  updatePokedex: (id: string) => void;
}

export function useMovementEngine({
  gameState,
  battleStateRef,
  setCurrentMap,
  setPlayerPos,
  setDirection,
  setIsMoving,
  setDialogue,
  setStoryStep,
  setPlayerTeam,
  setPhase,
  setOverworldShake,
  setGrassEffect,
  setSpottedTrainerId,
  setSpottedTrainerPos,
  setEnemyPokemon,
  setIsTrainerBattle,
  setBattleLog,
  updatePokedex,
}: UseMovementEngineParams) {
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);
  const poisonStepCounter = useRef(0);

  useEffect(() => {
    return () => {
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
    };
  }, []);

  const initBattle = useCallback((enemyPkmn: Pokemon, isTrainer: boolean) => {
    setEnemyPokemon(enemyPkmn);
    battleStateRef.current = createBattleState(gameState.current.playerTeam, enemyPkmn, {
      isTrainerBattle: isTrainer,
      inventory: gameState.current.inventory,
      pcStorage: gameState.current.pcStorage,
      hasBoulderBadge: gameState.current.badges.includes('BOULDER'),
    });
    setIsTrainerBattle(isTrainer);
    soundManager.play('BATTLE_START');
    setPhase(BATTLE_TRANSITION);
  }, []);

  const handleMove = useCallback((dir: Direction) => {
    const { isMoving, dialogue, phaseType, playerPos, currentMap, playerTeam, npcs, items, defeatedTrainers, maps } = gameState.current;
    const lockedPhases = ['BATTLE', 'BATTLE_TRANSITION', 'HEALING', 'BLACKOUT'];
    if (isMoving || dialogue || lockedPhases.includes(phaseType)) return;

    setDirection(dir);

    let nextX = playerPos.x;
    let nextY = playerPos.y;

    switch (dir) {
      case 'up': nextY--; break;
      case 'down': nextY++; break;
      case 'left': nextX--; break;
      case 'right': nextX++; break;
    }

    // Story Event: Oak stops the player from leaving Pallet Town
    if (currentMap === 'PALLET_TOWN' && nextY === 5 && playerTeam.length === 0) {
      setDialogue("OAK: ¡Espera! ¡No vayas por ahí!");
      setStoryStep('OAK_STOPPED');
      setTimeout(() => {
        setCurrentMap('OAKS_LAB');
        setPlayerPos({ x: 10, y: 14 });
        setDialogue("OAK: ¡Es peligroso ir solo! Ven, elige un POKÉMON.");
      }, sd(1000));
      return;
    }

    const mapData = maps[currentMap];
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
      setIsMoving(true);
      setPlayerPos({ x: nextX, y: nextY });

      // Poison overworld damage
      const leadPokemon = playerTeam[0];
      if (leadPokemon?.status === 'poison' && leadPokemon.hp > 1) {
        poisonStepCounter.current += 1;
        if (poisonStepCounter.current >= 4) {
          poisonStepCounter.current = 0;
          setPlayerTeam((prev: Pokemon[]) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            updated[0] = { ...updated[0], hp: Math.max(1, updated[0].hp - 1) };
            return updated;
          });
          setOverworldShake(true);
          setTimeout(() => setOverworldShake(false), sd(220));
        }
      } else {
        poisonStepCounter.current = 0;
      }

      // Visual grass rustle
      if (grid[nextY][nextX].type === 'grass') {
        setGrassEffect({ x: nextX, y: nextY });
        setTimeout(() => setGrassEffect(null), sd(500));
      }

      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      moveTimeout.current = setTimeout(() => {
        setIsMoving(false);
      }, sd(110));

      // Warp check
      const warp = mapData.warps.find(w => w.x === nextX && w.y === nextY);
      if (warp) {
        soundManager.play('SELECT');
        setTimeout(() => {
          setCurrentMap(warp.targetMap);
          setPlayerPos(warp.targetPos);
          if (warp.targetDir) setDirection(warp.targetDir);
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
            setSpottedTrainerId(trainer.id);
            setSpottedTrainerPos({ ...trainer.position });
            soundManager.play('TRAINER_SPOTTED');
            setDialogue(`${trainer.name}: ¡Eh! ¡Te he visto! ¡Vamos a luchar!`);
            const spottedDistance = i;
            for (let step = 1; step < spottedDistance; step++) {
              setTimeout(() => {
                setSpottedTrainerPos(prev => {
                  if (!prev) return prev;
                  const next = { ...prev };
                  if (trainer.direction === 'up') next.y -= 1;
                  if (trainer.direction === 'down') next.y += 1;
                  if (trainer.direction === 'left') next.x -= 1;
                  if (trainer.direction === 'right') next.x += 1;
                  return next;
                });
              }, sd(step * 220));
            }
            setTimeout(() => {
              setSpottedTrainerId(null);
              setSpottedTrainerPos(null);
              soundManager.play('BATTLE_START');
              setEnemyPokemon(trainer.trainerTeam![0]);
              battleStateRef.current = createBattleState(gameState.current.playerTeam, trainer.trainerTeam![0], {
                isTrainerBattle: true,
                inventory: gameState.current.inventory,
                pcStorage: gameState.current.pcStorage,
                hasBoulderBadge: gameState.current.badges.includes('BOULDER'),
              });
              updatePokedex(trainer.trainerTeam![0].id);
              setIsTrainerBattle(true);
              setBattleLog(`¡${trainer.name} te desafía!`);
              setPhase(BATTLE_TRANSITION);
            }, sd(Math.max(1500, spottedDistance * 240)));
            break;
          }
        }
      }

      // Wild encounter
      if (grid[nextY][nextX].type === 'grass' && Math.random() < 0.1 && playerTeam.length > 0) {
        if (playerTeam.every(p => p.hp === 0)) return;

        const routeWilds = WILD_POKEMON_DATABASE[currentMap] || WILD_POKEMON_DATABASE['ROUTE_1'];
        const randomPkmn = routeWilds[Math.floor(Math.random() * routeWilds.length)];
        const levelVariation = Math.floor(Math.random() * 3) - 1;
        const finalLevel = Math.max(2, randomPkmn.level + levelVariation);

        soundManager.play('BATTLE_START');
        const finalMaxHp = calcHp(randomPkmn.baseStats.hp, finalLevel);
        const wildBaseStats = {
          ...randomPkmn.baseStats,
          attack: Math.floor(randomPkmn.baseStats.attack * 0.85),
          special: Math.floor(randomPkmn.baseStats.special * 0.85),
        };
        const finalPkmn = {
          ...randomPkmn,
          baseStats: wildBaseStats,
          level: finalLevel,
          hp: finalMaxHp,
          maxHp: finalMaxHp,
        };
        setEnemyPokemon(finalPkmn);
        battleStateRef.current = createBattleState(gameState.current.playerTeam, finalPkmn, {
          inventory: gameState.current.inventory,
          pcStorage: gameState.current.pcStorage,
          hasBoulderBadge: gameState.current.badges.includes('BOULDER'),
        });
        setIsTrainerBattle(false);
        updatePokedex(randomPkmn.id);
        setBattleLog(`¡Un ${randomPkmn.name} salvaje apareció!`);
        setPhase(BATTLE_TRANSITION);
      }
    }
  }, [
    setCurrentMap, setPlayerPos, setDirection, setIsMoving, setDialogue, setStoryStep,
    setPlayerTeam, setOverworldShake, setGrassEffect, setSpottedTrainerId,
    setSpottedTrainerPos, setEnemyPokemon, setIsTrainerBattle, setBattleLog,
    setPhase, updatePokedex
  ]);

  return { handleMove, initBattle };
}
