/**
 * Cutscene DSL — Declarative definitions for scripted game sequences.
 *
 * Cutscenes are arrays of CutsceneStep objects processed sequentially
 * by the CutsceneRunner. Each step type maps to a specific game action.
 */

import type { Direction, Position, MapID, Pokemon } from '../../types';

// ── Step types ────────────────────────────────────────────────────────────────

/** Show a dialogue box. Execution pauses until the player dismisses it. */
export interface DialogueStep {
  type: 'dialogue';
  text: string;
}

/** Walk the player along a path. One tile per tick (200ms at 1x speed). */
export interface WalkStep {
  type: 'walk';
  path: { x: number; y: number; dir: Direction }[];
  /** Optional: move an NPC one step ahead of the player */
  npcLeadId?: string;
}

/** Show or reposition a cutscene NPC on the map. */
export interface NpcAppearStep {
  type: 'npc_appear';
  npcId: string;
  position: Position;
  direction: Direction;
}

/** Remove a cutscene NPC from the map. */
export interface NpcRemoveStep {
  type: 'npc_remove';
}

/** Warp the player to a different map/position. */
export interface WarpStep {
  type: 'warp';
  map: MapID;
  position: Position;
  direction: Direction;
}

/** Set the storyStep field. */
export interface SetStoryStep {
  type: 'set_story';
  step: string;
}

/** Lock player input (isMoving = true). */
export interface LockStep {
  type: 'lock';
}

/** Unlock player input (isMoving = false). */
export interface UnlockStep {
  type: 'unlock';
}

/** Wait a fixed duration before proceeding. */
export interface WaitStep {
  type: 'wait';
  ms: number;
}

/** Play a sound effect. */
export interface SoundStep {
  type: 'sound';
  soundId: string;
}

/** Move a specific NPC along a path. */
export interface NpcWalkStep {
  type: 'npc_walk';
  npcId: string;
  path: Position[];
}

/** Initiate a battle. */
export interface BattleStep {
  type: 'battle';
  isTrainer: boolean;
  trainerId?: string;
  enemyPokemon?: Pokemon;
  /** Full enemy team for trainer battles (allows multi-Pokémon fights). */
  enemyTeam?: Pokemon[];
}

export type CutsceneStep =
  | DialogueStep
  | WalkStep
  | NpcAppearStep
  | NpcRemoveStep
  | WarpStep
  | SetStoryStep
  | LockStep
  | UnlockStep
  | WaitStep
  | SoundStep
  | NpcWalkStep
  | BattleStep;
