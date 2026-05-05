/**
 * Oak escort cutscene — defined as declarative DSL steps.
 *
 * When the player tries to leave Pallet Town without a Pokémon,
 * Oak appears, speaks, then leads the player to his lab.
 */

import type { Direction, Position, MapID } from '../types';
import type { CutsceneStep } from './cutscenes/types';
import { runCutscene } from './cutscenes/runner';

// ── Path builder (pure function) ──────────────────────────────────────────────

interface PathNode { x: number; y: number; dir: Direction }

/** Build the Oak escort path from player position to the lab door at world coords. */
export function buildOakEscortPath(startPos: Position): PathNode[] {
  const path: PathNode[] = [];
  let { x, y } = startPos;
  // FireRed Pallet Town: Oak's Lab door at local (16, 13) → world (76, 273).
  // The path row y=274 is all walkable so we navigate there before turning
  // up onto the door.
  const labApproachX = 76;
  const labApproachY = 274;

  path.push({ x, y, dir: 'down' });
  while (x > labApproachX) { x--; path.push({ x, y, dir: 'left' }); }
  while (x < labApproachX) { x++; path.push({ x, y, dir: 'right' }); }
  while (y < labApproachY) { y++; path.push({ x, y, dir: 'down' }); }

  return path;
}

// ── Cutscene definition (DSL) ─────────────────────────────────────────────────

/** Build the Oak escort cutscene steps for a given player position. */
export function buildOakEscortSteps(playerPos: Position): CutsceneStep[] {
  const path = buildOakEscortPath(playerPos);

  return [
    { type: 'lock' },
    { type: 'npc_appear', npcId: 'oak_escort', position: { x: playerPos.x, y: playerPos.y + 1 }, direction: 'up' as Direction },
    { type: 'dialogue', text: "PROF. OAK: ¡Hola! Soy el PROF. OAK. El mundo está lleno de criaturas misteriosas llamadas POKÉMON." },
    { type: 'dialogue', text: "PROF. OAK: ¡Espera! ¡Es peligroso salir a la hierba sin un POKÉMON! Ven al laboratorio." },
    { type: 'walk', path, npcLeadId: 'oak_escort' },
    { type: 'npc_remove' },
    { type: 'set_story', step: 'OAK_STOPPED' },
    // Land the player just inside the lab door, directly south of Oak
    // (canonical Oak at (6, 3) → player at (6, 11) facing up). Old (4, 10)
    // dropped the player off-axis and Oak felt disconnected from the entry.
    { type: 'warp', map: 'OAKS_LAB' as MapID, position: { x: 6, y: 11 }, direction: 'up' as Direction },
    { type: 'unlock' },
    { type: 'wait', ms: 500 },
    { type: 'dialogue', text: "PROF. OAK: ¡Hola! Por fin llegas. Pasa, pasa — ven hasta la mesa." },
    { type: 'dialogue', text: "PROF. OAK: Toma uno de estos POKÉMON, te ayudará en tu viaje." },
  ];
}

// ── Trigger (called from handleMove) ──────────────────────────────────────────

import { useGameStore } from '../store/gameStore';

/** Trigger the Oak escort cutscene. Called when the player tries to leave Pallet Town north without a Pokémon. */
export function triggerOakCutscene(playerPos: Position) {
  // Face the player toward Oak before the cutscene starts
  useGameStore.getState().setDirection('down');

  const steps = buildOakEscortSteps(playerPos);
  runCutscene(steps);
}


