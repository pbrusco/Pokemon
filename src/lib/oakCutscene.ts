/**
 * Oak escort cutscene — defined as declarative DSL steps.
 *
 * When the player tries to leave Pallet Town without a Pokémon,
 * Oak appears, speaks, then leads the player to his lab.
 */

import type { Direction, Position } from '../types';
import type { CutsceneStep } from './cutscenes/types';
import { runCutscene, stopCutscene } from './cutscenes/runner';

export { stopCutscene as stopOakWalk };

// ── Path builder (pure function) ──────────────────────────────────────────────

interface PathNode { x: number; y: number; dir: Direction }

/** Build the escort path from player position to the lab door at (12, 11). */
export function buildOakEscortPath(startPos: Position): PathNode[] {
  const path: PathNode[] = [];
  let { x, y } = startPos;

  path.push({ x, y, dir: 'down' });

  while (y < 11) { y++; path.push({ x, y, dir: 'down' }); }
  while (x < 12) { x++; path.push({ x, y, dir: 'right' }); }
  while (x > 12) { x--; path.push({ x, y, dir: 'left' }); }

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
    { type: 'warp', map: 'OAKS_LAB' as any, position: { x: 4, y: 10 }, direction: 'up' as Direction },
    { type: 'unlock' },
    { type: 'wait', ms: 500 },
    { type: 'dialogue', text: "OAK: ¡Hola! Por fin llegas.\nToma uno de estos POKÉMON, te ayudará en tu viaje." },
  ];
}

// ── Trigger (called from handleMove) ──────────────────────────────────────────

import { useGameStore } from '../store/gameStore';

/** Trigger the Oak escort cutscene. Called when the player walks north at y=5 without Pokémon. */
export function triggerOakCutscene(playerPos: Position) {
  // Face the player toward Oak before the cutscene starts
  useGameStore.getState().setDirection('down');

  const steps = buildOakEscortSteps(playerPos);
  runCutscene(steps);
}

// ── Re-export for backward compat with existing startOakWalk tests ────────────

export function startOakWalk(path: PathNode[]) {
  // The old API: just run the walk portion via the DSL runner
  const steps: CutsceneStep[] = [
    { type: 'walk', path, npcLeadId: 'oak_escort' },
    { type: 'npc_remove' },
    { type: 'set_story', step: 'OAK_STOPPED' },
    { type: 'warp', map: 'OAKS_LAB' as any, position: { x: 4, y: 10 }, direction: 'up' as Direction },
    { type: 'unlock' },
    { type: 'wait', ms: 500 },
    { type: 'dialogue', text: "OAK: ¡Hola! Por fin llegas.\nToma uno de estos POKÉMON, te ayudará en tu viaje." },
  ];
  runCutscene(steps);
}
