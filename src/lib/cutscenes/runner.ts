/**
 * CutsceneRunner — Executes a sequence of CutsceneStep objects.
 *
 * Completely decoupled from React. Reads/writes game state exclusively
 * through useGameStore.getState(). Uses setInterval for walk steps and
 * setTimeout for waits. Dialogue steps pause execution until the player
 * dismisses the dialogue (via the store's dialogueCallback mechanism).
 *
 * Usage:
 *   import { runCutscene, stopCutscene } from './runner';
 *   runCutscene(steps);  // starts processing
 *   stopCutscene();      // cancel if needed
 */

import type { CutsceneStep } from './types';
import { useGameStore } from '../../store/gameStore';
import { sd } from '../gameSpeed';

// ── Module state ──────────────────────────────────────────────────────────────

let currentSteps: CutsceneStep[] = [];
let currentIndex = 0;
let walkInterval: ReturnType<typeof setInterval> | null = null;
let waitTimeout: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;

// ── Public API ────────────────────────────────────────────────────────────────

/** Start executing a cutscene. Cancels any currently running cutscene. */
export function runCutscene(steps: CutsceneStep[]) {
  stopCutscene();
  currentSteps = steps;
  currentIndex = 0;
  isRunning = true;
  processNext();
}

/** Stop the current cutscene immediately. Safe to call when idle. */
export function stopCutscene() {
  if (walkInterval) { clearInterval(walkInterval); walkInterval = null; }
  if (waitTimeout) { clearTimeout(waitTimeout); waitTimeout = null; }
  currentSteps = [];
  currentIndex = 0;
  isRunning = false;
}

/** Check if a cutscene is currently running. */
export function isCutsceneRunning(): boolean {
  return isRunning;
}

// ── Step processor ────────────────────────────────────────────────────────────

function processNext() {
  if (!isRunning || currentIndex >= currentSteps.length) {
    isRunning = false;
    return;
  }

  const step = currentSteps[currentIndex];
  currentIndex++;

  switch (step.type) {
    case 'lock':
      useGameStore.getState().setIsMoving(true);
      processNext();
      break;

    case 'unlock':
      useGameStore.getState().setIsMoving(false);
      processNext();
      break;

    case 'dialogue':
      // Pause execution — resume when dialogue is dismissed
      useGameStore.getState().setDialogue(step.text, () => {
        processNext();
      });
      break;

    case 'npc_appear':
      useGameStore.getState().setOakCutscenePos(step.position, step.direction);
      processNext();
      break;

    case 'npc_remove':
      useGameStore.getState().setOakCutscenePos(null, null);
      processNext();
      break;

    case 'warp': {
      const s = useGameStore.getState();
      s.setCurrentMap(step.map);
      s.setPlayerPos(step.position);
      s.setDirection(step.direction);
      processNext();
      break;
    }

    case 'set_story':
      useGameStore.getState().setStoryStep(step.step as any);
      processNext();
      break;

    case 'wait':
      waitTimeout = setTimeout(() => {
        waitTimeout = null;
        processNext();
      }, sd(step.ms));
      break;

    case 'walk':
      processWalk(step);
      break;

    case 'sound':
      // Sound is a side-effect, we proceed immediately
      soundManager.play(step.soundId as any);
      processNext();
      break;

    case 'npc_walk':
      processNpcWalk(step);
      break;

    case 'battle':
      processBattle(step);
      break;
  }
}

import { soundManager } from '../sounds';
import { launchBattle } from '../launchBattle';

/** Drive a walk step via setInterval, one tile per tick. */
function processWalk(step: Extract<CutsceneStep, { type: 'walk' }>) {
  const path = step.path;
  let walkStep = 0; // Current position index

  walkInterval = setInterval(() => {
    walkStep++; // Move to next node
    const s = useGameStore.getState();

    if (walkStep >= path.length) {
      clearInterval(walkInterval!);
      walkInterval = null;
      processNext();
      return;
    }

    const playerNode = path[walkStep];
    s.setDirection(playerNode.dir);
    s.setPlayerPos({ x: playerNode.x, y: playerNode.y });

    if (step.npcLeadId) {
      const oakNode = walkStep + 1 < path.length ? path[walkStep + 1] : null;
      if (oakNode) {
        s.setOakCutscenePos({ x: oakNode.x, y: oakNode.y }, playerNode.dir);
      } else {
        s.setOakCutscenePos(null, null);
      }
    }
  }, sd(200));
}

/** Move an NPC along a path. */
function processNpcWalk(step: Extract<CutsceneStep, { type: 'npc_walk' }>) {
  const path = step.path;
  let currentStep = -1;

  walkInterval = setInterval(() => {
    currentStep++;
    const s = useGameStore.getState();

    if (currentStep >= path.length) {
      clearInterval(walkInterval!);
      walkInterval = null;
      processNext();
      return;
    }

    const pos = path[currentStep];
    // Direction calculation for NPC walk
    let dir: any = 'down';
    if (currentStep > 0) {
      const prev = path[currentStep - 1];
      if (pos.x > prev.x) dir = 'right';
      if (pos.x < prev.x) dir = 'left';
      if (pos.y > prev.y) dir = 'down';
      if (pos.y < prev.y) dir = 'up';
    }
    s.setOakCutscenePos(pos, dir);
  }, sd(200));
}

/** Start a battle. */
function processBattle(step: Extract<CutsceneStep, { type: 'battle' }>) {
  const s = useGameStore.getState();
  s.setSpottedTrainerId(null);
  s.setSpottedTrainerPos(null);

  launchBattle({
    enemy: step.enemyPokemon,
    isTrainer: step.isTrainer,
    trainerName: step.trainerId,
    battleLog: '¡Batalla iniciada!',
  });

  // Cutscene ends here as we enter battle
  stopCutscene();
}
