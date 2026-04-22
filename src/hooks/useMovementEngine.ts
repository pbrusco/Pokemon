import { useCallback, useRef, useEffect, MutableRefObject } from 'react';
import { Direction, NPC, Pokemon, Position } from '../types';
import { BLACKOUT, HEALING, EXPLORING } from '../types/gamePhase';
import { fullHeal } from '../lib/healUtils';
import { BattleState } from '../lib/battleEngine';
import { sd } from '../lib/gameSpeed';
import { calcHp } from '../lib/damage';
import { WILD_POKEMON_DATABASE, WILD_ENCOUNTER_RATES, getKantoRegion } from '../constants';
import { triggerOakCutscene } from '../lib/oakCutscene';
import { triggerTrainerCutscene } from '../lib/cutscenes/trainerEncounter';
import { useGameStore } from '../store/gameStore';
import { MapID } from '../types';
import { launchBattle } from '../lib/launchBattle';
import { logObservation } from '../lib/eventLog';

// Pallet Town exit coords in the unified KANTO_OVERWORLD
const PALLET_NORTH_EXIT_Y = 198; // Row 198 is Pallet's top row in world coords

// ── Extracted helpers (pure or store-writing, no React hooks) ────────────────

/** Check if any undefeated trainer on this map can see the player at (x, y). */
function checkTrainerVision(
  npcs: NPC[],
  defeatedTrainers: string[],
  x: number,
  y: number,
): NPC | undefined {
  const trainers = npcs.filter(n => n.isTrainer && !defeatedTrainers.includes(n.id));
  for (const trainer of trainers) {
    for (let i = 1; i <= 3; i++) {
      let vx = trainer.position.x;
      let vy = trainer.position.y;
      if (trainer.direction === 'up') vy -= i;
      if (trainer.direction === 'down') vy += i;
      if (trainer.direction === 'left') vx -= i;
      if (trainer.direction === 'right') vx += i;
      if (vx === x && vy === y) return trainer;
    }
  }
  return undefined;
}

/** Roll for a wild encounter and start battle if triggered. Returns true if a battle started. */
function tryWildEncounter(
  tileType: string,
  currentMap: MapID,
  playerPos: Position,
  playerTeam: Pokemon[],
): boolean {
  if (tileType !== 'grass' || playerTeam.length === 0) return false;
  if (playerTeam.every(p => p.hp === 0)) return false;

  // On the unified overworld, look up the zone from the player's absolute coordinates
  const zone = currentMap === 'KANTO_OVERWORLD'
    ? getKantoRegion(playerPos.x, playerPos.y)
    : (currentMap as string);

  const routeWilds = WILD_POKEMON_DATABASE[zone];
  const encounterRate = WILD_ENCOUNTER_RATES[zone] ?? WILD_ENCOUNTER_RATES[currentMap];
  if (!routeWilds || encounterRate === undefined) return false;
  if (Math.floor(Math.random() * 256) >= encounterRate) return false;
  const randomPkmn = routeWilds[Math.floor(Math.random() * routeWilds.length)];
  const levelVariation = Math.floor(Math.random() * 3) - 1;
  const finalLevel = Math.max(2, randomPkmn.level + levelVariation);
  const finalMaxHp = calcHp(randomPkmn.baseStats.hp, finalLevel);

  const wildPkmn: Pokemon = {
    ...randomPkmn,
    level: finalLevel,
    hp: finalMaxHp,
    maxHp: finalMaxHp,
    baseStats: {
      ...randomPkmn.baseStats,
      attack: Math.floor(randomPkmn.baseStats.attack * 0.85),
      special: Math.floor(randomPkmn.baseStats.special * 0.85),
    },
  };

  logObservation({ k: 'obs_encounter', map: currentMap, pokemon: randomPkmn.name, level: finalLevel });
  launchBattle({
    enemy: wildPkmn,
    isTrainer: false,
    battleLog: `¡Un ${randomPkmn.name} salvaje apareció!`,
  });
  return true;
}

/** Apply overworld poison damage every 4 steps. Triggers blackout if all faint. */
function applyOverworldPoison(
  playerTeam: Pokemon[],
  poisonStepCounter: MutableRefObject<number>,
  setOverworldShake: (v: boolean) => void,
): void {
  const lead = playerTeam[0];
  if (!lead || lead.status !== 'poison' || lead.hp <= 0) {
    poisonStepCounter.current = 0;
    return;
  }

  poisonStepCounter.current += 1;
  if (poisonStepCounter.current < 4) return;
  poisonStepCounter.current = 0;

  const newTeam = [...playerTeam];
  newTeam[0] = { ...newTeam[0], hp: Math.max(0, newTeam[0].hp - 1) };

  const store = useGameStore.getState();
  store.setPlayerTeam(newTeam);
  store.setBattleLog(`¡${lead.name} recibió daño por veneno!`);
  setOverworldShake(true);
  setTimeout(() => setOverworldShake(false), sd(220));

  if (newTeam[0].hp === 0 && newTeam.every(p => p.hp === 0)) {
    store.setPhase(BLACKOUT);
    setTimeout(() => {
      const fs = useGameStore.getState();
      fs.setCurrentMap(fs.lastHealLocation.map);
      fs.setPlayerPos(fs.lastHealLocation.pos);
    }, sd(1200));
    setTimeout(() => useGameStore.getState().setPhase(HEALING), sd(2400));
    setTimeout(() => {
      useGameStore.getState().setPlayerTeam(newTeam.map(fullHeal));
    }, sd(2400) + sd(800));
    setTimeout(() => {
      useGameStore.getState().setPhase(EXPLORING);
      useGameStore.getState().setDialogue('¡Te has quedado sin POKÉMON! Fuiste llevado al último lugar de descanso.');
    }, sd(2400) + sd(1600));
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

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

  const initBattle = useCallback((enemyPkmn: Pokemon, isTrainer: boolean, trainerName?: string) => {
    launchBattle({ enemy: enemyPkmn, isTrainer, trainerName });
  }, []);

  const handleMove = useCallback((dir: Direction) => {
    const store = useGameStore.getState();
    const { isMoving, dialogue, phase, playerPos, currentMap, playerTeam, worldMaps, defeatedTrainers } = store;
    const npcs = store.getNPCs();
    const items = store.getItems();

    const lockedPhases = ['BATTLE', 'BATTLE_TRANSITION', 'HEALING', 'BLACKOUT'];
    if (isMoving || dialogue || lockedPhases.includes(phase.type)) return;

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
    // In KANTO_OVERWORLD, Pallet Town's northern border is at world y = PALLET_NORTH_EXIT_Y
    const isLeavingPalletNorth =
      currentMap === 'KANTO_OVERWORLD' && nextY === PALLET_NORTH_EXIT_Y - 1 &&
      nextX >= 11 && nextX < 31 && playerTeam.length === 0;
    if (isLeavingPalletNorth) {
      triggerOakCutscene(playerPos);
      return;
    }

    const mapData = worldMaps[currentMap];
    if (!mapData) return;
    const grid = mapData.tiles;
    const mapH = grid.length;
    const mapW = grid[0].length;

    const inBounds = (x: number, y: number) => x >= 0 && x < mapW && y >= 0 && y < mapH;

    // Ledge jump: only passable if moving in the ledge's direction; land 2 tiles ahead.
    let isLedgeJump = false;
    if (inBounds(nextX, nextY)) {
      const t = grid[nextY][nextX].type;
      const ledgeMatch =
        (t === 'ledge_down'  && dir === 'down')  ||
        (t === 'ledge_left'  && dir === 'left')  ||
        (t === 'ledge_right' && dir === 'right');
      if (ledgeMatch) {
        const landX = dir === 'left' ? nextX - 1 : dir === 'right' ? nextX + 1 : nextX;
        const landY = dir === 'down' ? nextY + 1 : nextY;
        if (
          inBounds(landX, landY) &&
          grid[landY][landX].walkable &&
          !npcs[currentMap]?.some(n => n.position.x === landX && n.position.y === landY) &&
          !items[currentMap]?.some(i => i.type === 'object' && i.position.x === landX && i.position.y === landY)
        ) {
          isLedgeJump = true;
          nextX = landX;
          nextY = landY;
        } else {
          return;
        }
      }
    }

    const npcAtNext = !isLedgeJump && npcs[currentMap]?.some(n => n.position.x === nextX && n.position.y === nextY);
    const objectAtNext = !isLedgeJump && items[currentMap]?.some(i => i.type === 'object' && i.position.x === nextX && i.position.y === nextY);

    if (
      !inBounds(nextX, nextY) ||
      !grid[nextY][nextX].walkable ||
      npcAtNext ||
      objectAtNext
    ) return;

    // Warp at the destination tile (used for both the direction guard and seamless scroll)
    const warp = mapData.warps.find(w => w.x === nextX && w.y === nextY);
    if (warp && warp.targetDir && dir !== warp.targetDir) return;

    // ── Movement accepted ──
    store.setIsMoving(true);
    store.setPlayerPos({ x: nextX, y: nextY });

    applyOverworldPoison(playerTeam, poisonStepCounter, setOverworldShake);

    // Visual grass rustle
    if (grid[nextY][nextX].type === 'grass') {
      store.setGrassEffect({ x: nextX, y: nextY });
      setTimeout(() => useGameStore.getState().setGrassEffect(null), sd(500));
    }

    // Seamless scroll: warps now commit immediately — the unified overworld means
    // most boundary crossings are just tile-scrolls within the same map.
    // Remaining warps (indoor entrances) still teleport.
    if (moveTimeout.current) clearTimeout(moveTimeout.current);
    moveTimeout.current = setTimeout(() => {
      const fs = useGameStore.getState();
      fs.setIsMoving(false);
      if (warp) {
        fs.setCurrentMap(warp.targetMap);
        fs.setPlayerPos(warp.targetPos);
        if (warp.targetDir) fs.setDirection(warp.targetDir);
      }
    }, sd(isLedgeJump ? 260 : 110));

    // Trainer vision check
    const spottedTrainer = checkTrainerVision(npcs[currentMap] || [], defeatedTrainers, nextX, nextY);
    if (spottedTrainer) {
      logObservation({ k: 'obs_trainer_spotted', trainerId: spottedTrainer.id });
      triggerTrainerCutscene(spottedTrainer, { x: nextX, y: nextY });
    }

    // Wild encounter roll
    tryWildEncounter(grid[nextY][nextX].type, currentMap, { x: nextX, y: nextY }, playerTeam);
  }, [battleStateRef, setOverworldShake]);

  return { handleMove, initBattle };
}
