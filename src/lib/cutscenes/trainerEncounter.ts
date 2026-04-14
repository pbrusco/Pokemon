import type { Direction, Position, NPC } from '../types';
import type { CutsceneStep } from './types';
import { runCutscene } from './runner';

/**
 * Builds a trainer spotting cutscene.
 * Logic: Trainer spots player, walks to them, says something, and battle starts.
 */
export function triggerTrainerCutscene(trainer: NPC, playerPos: Position) {
  const steps: CutsceneStep[] = [];
  
  // 1. Alert sound and show the "!" above trainer (via spottedTrainerId in store)
  steps.push({ type: 'sound', soundId: 'TRAINER_SPOTTED' });
  
  // 2. Dialogue from trainer
  steps.push({ type: 'dialogue', text: `${trainer.name}: ¡Eh! ¡Te he visto! ¡Vamos a luchar!` });
  
  // 3. Trainer walks to player if distance > 1
  const path: Position[] = [];
  const startX = trainer.position.x;
  const startY = trainer.position.y;
  const dx = playerPos.x - startX;
  const dy = playerPos.y - startY;
  const dist = Math.max(Math.abs(dx), Math.abs(dy));
  
  if (dist > 1) {
    for (let i = 1; i < dist; i++) {
      const x = startX + (dx / dist) * i;
      const y = startY + (dy / dist) * i;
      path.push({ x, y });
    }
    steps.push({ type: 'npc_walk', npcId: trainer.id, path });
  }
  
  // 4. Start battle sound and initiate battle
  steps.push({ type: 'sound', soundId: 'BATTLE_START' });
  steps.push({ 
    type: 'battle', 
    isTrainer: true, 
    trainerId: trainer.id, 
    enemyPokemon: trainer.trainerTeam![0] 
  });
  
  runCutscene(steps);
}
