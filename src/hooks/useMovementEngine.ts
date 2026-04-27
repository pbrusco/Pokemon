import { useCallback, useRef, useEffect, MutableRefObject } from 'react';
import { Direction, NPC, Pokemon, Position } from '../types';
import { BLACKOUT, HEALING, EXPLORING } from '../types/gamePhase';
import { fullHeal } from '../lib/healUtils';
import { BattleState } from '../lib/battleEngine';
import { sd } from '../lib/gameSpeed';
import { triggerOakCutscene } from '../lib/oakCutscene';
import { triggerTrainerCutscene } from '../lib/cutscenes/trainerEncounter';
import { useGameStore } from '../store/gameStore';
import { MapID } from '../types';
import { launchBattle } from '../lib/launchBattle';
import { logObservation } from '../lib/eventLog';
import { WILD_POKEMON_DATABASE, WILD_ENCOUNTER_RATES, getKantoRegion } from '../constants';
import { calcHp } from '../lib/damage';

// Pallet Town exit coords in the unified KANTO_OVERWORLD
// Route 1 south end is at world y=196 (x=127-128). The cutscene fires when
// the player tries to step from y=197 (Pallet's north path) into y=196 (Route 1).
const PALLET_NORTH_EXIT_Y = 197;

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
      const validLoc = getValidTeleportLocation(fs.lastHealLocation.map, fs.lastHealLocation.pos);
      fs.setCurrentMap(validLoc.map);
      fs.setPlayerPos(validLoc.pos);
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

/** Validates a teleport destination, falling back to a safe spot if invalid or blocked. */
function getValidTeleportLocation(targetMap: string, targetPos: Position): { map: MapID; pos: Position } {
  const store = useGameStore.getState();
  const mapData = store.worldMaps[targetMap as MapID];
  if (!mapData) {
    const err = `Teleport target map '${targetMap}' does not exist. Falling back to safe zone.`;
    console.warn(`[Teleport] ${err}`);
    store.setTeleportError(err);
    return { map: 'PLAYERS_HOUSE_2F', pos: { x: 4, y: 4 } };
  }
  
  const grid = mapData.tiles;
  const inBounds = targetPos.x >= 0 && targetPos.x < grid[0].length && targetPos.y >= 0 && targetPos.y < grid.length;
  // Note: we might want to check for NPCs/items too, but a basic walkable check prevents hardlocks out of bounds.
  if (!inBounds || (!grid[targetPos.y][targetPos.x].walkable && !store.ghostMode)) {
    const err = `Teleport coordinate {x:${targetPos.x}, y:${targetPos.y}} on map '${targetMap}' is blocked or out of bounds. Falling back to safe zone.`;
    console.warn(`[Teleport] ${err}`);
    store.setTeleportError(err);
    return { map: 'PLAYERS_HOUSE_2F', pos: { x: 4, y: 4 } };
  }
  
  return { map: targetMap as MapID, pos: targetPos };
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
    const { isMoving, dialogue, phase, playerPos, currentMap, playerTeam, worldMaps, defeatedTrainers, ghostMode } = store;
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
      nextX >= 128 && nextX <= 129 && playerTeam.length === 0 && !ghostMode;
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
          (grid[landY][landX].walkable || ghostMode) &&
          !npcs[currentMap]?.some(n => n.position.x === landX && n.position.y === landY) &&
          !items[currentMap]?.some(i => i.type === 'object' && i.position.x === landX && i.position.y === landY)
        ) {
          isLedgeJump = true;
          nextX = landX;
          nextY = landY;
        } else if (!ghostMode) {
          return;
        }
      }
    }

    const npcAtNext = !isLedgeJump && npcs[currentMap]?.some(n => n.position.x === nextX && n.position.y === nextY);
    const objectAtNext = !isLedgeJump && items[currentMap]?.some(i => i.type === 'object' && i.position.x === nextX && i.position.y === nextY);
    const wildAtNext = !isLedgeJump && store.wildPokemon.find(p => p.position.x === nextX && p.position.y === nextY);

    if (!ghostMode) {
      if (
        !inBounds(nextX, nextY) ||
        !grid[nextY][nextX].walkable ||
        npcAtNext ||
        objectAtNext
      ) return;
    }

    // ── Collision with overworld wild pokemon ──
    if (wildAtNext && !ghostMode) {
        logObservation({ k: 'obs_encounter', map: currentMap, pokemon: wildAtNext.pokemon.name, level: wildAtNext.pokemon.level });
        launchBattle({
          enemy: wildAtNext.pokemon,
          isTrainer: false,
          battleLog: `¡Un ${wildAtNext.pokemon.name} salvaje apareció!`,
        });
        store.setWildPokemon(prev => prev.filter(p => p.id !== wildAtNext.id));
        return;
    }

    // Warp at the destination tile (used for both the direction guard and seamless scroll)
    const warp = mapData.warps.find(w => w.x === nextX && w.y === nextY);
    if (warp && warp.targetDir && dir !== warp.targetDir && !ghostMode) return;

    // ── Movement accepted ──
    store.setIsMoving(true);
    store.setPlayerPos({ x: nextX, y: nextY });

    if (!ghostMode) {
      applyOverworldPoison(playerTeam, poisonStepCounter, setOverworldShake);

      // Visual grass rustle
      if (inBounds(nextX, nextY) && grid[nextY][nextX].type === 'grass') {
        store.setGrassEffect({ x: nextX, y: nextY });
        setTimeout(() => useGameStore.getState().setGrassEffect(null), sd(500));
      }
    }

    // Seamless scroll: warps now commit immediately — the unified overworld means
    // most boundary crossings are just tile-scrolls within the same map.
    // Remaining warps (indoor entrances) still teleport.
    if (moveTimeout.current) clearTimeout(moveTimeout.current);
    moveTimeout.current = setTimeout(() => {
      const fs = useGameStore.getState();
      fs.setIsMoving(false);
      if (warp) {
        const validLoc = getValidTeleportLocation(warp.targetMap, warp.targetPos);
        fs.setCurrentMap(validLoc.map);
        fs.setPlayerPos(validLoc.pos);
        if (warp.targetDir) fs.setDirection(warp.targetDir);
      }
    }, sd(isLedgeJump ? 260 : 110));

    if (ghostMode) return;

    // Trainer vision check
    const spottedTrainer = checkTrainerVision((npcs[currentMap] as NPC[]) || [], defeatedTrainers, nextX, nextY);
    if (spottedTrainer) {
      logObservation({ k: 'obs_trainer_spotted', trainerId: spottedTrainer.id });
      triggerTrainerCutscene(spottedTrainer, { x: nextX, y: nextY });
    }

    // Grass random encounter (coexists with overworld visible pokemon)
    if (!warp && grid[nextY][nextX].type === 'grass' && playerTeam.length > 0) {
      const zone = currentMap === 'KANTO_OVERWORLD' ? getKantoRegion(nextX, nextY) : currentMap;
      const rate = WILD_ENCOUNTER_RATES[zone] ?? WILD_ENCOUNTER_RATES[currentMap] ?? 10;
      if (Math.random() * 100 < rate) {
        const speciesList = WILD_POKEMON_DATABASE[zone];
        if (speciesList && speciesList.length > 0) {
          const base = speciesList[Math.floor(Math.random() * speciesList.length)];
          const level = Math.max(1, base.level + Math.floor(Math.random() * 3) - 1);
          const maxHp = calcHp(base.baseStats.hp, level);
          const enemy = { ...base, uid: Math.random().toString(36).substring(2, 9), level, hp: maxHp, maxHp };
          logObservation({ k: 'obs_encounter', map: currentMap, pokemon: enemy.name, level });
          launchBattle({ enemy, isTrainer: false, battleLog: `¡Un ${enemy.name} salvaje apareció!` });
        }
      }
    }
  }, [battleStateRef, setOverworldShake]);

  return { handleMove, initBattle };
}
