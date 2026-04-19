import { Pokemon } from '../types';
import { createBattleState } from './battleEngine';
import { useGameStore } from '../store/gameStore';
import { BATTLE_TRANSITION } from '../types/gamePhase';
import { TRAINER_BATTLE_SPRITES } from '../data/trainerSprites';

interface LaunchBattleOptions {
  enemy: Pokemon;
  isTrainer: boolean;
  trainerName?: string;
  battleLog?: string;
}

export function launchBattle(options: LaunchBattleOptions): void {
  const s = useGameStore.getState();
  const battleState = createBattleState(s.playerTeam, options.enemy, {
    isTrainerBattle: options.isTrainer,
    trainerName: options.trainerName,
    inventory: s.inventory,
    pcStorage: s.pcStorage,
    hasBoulderBadge: s.badges.includes('BOULDER'),
  });

  s.setEnemyPokemon(options.enemy);
  s.setIsTrainerBattle(options.isTrainer);

  if (options.isTrainer && options.trainerName) {
    const allNpcs = s.getNPCs();
    const trainer = Object.values(allNpcs).flat().find(n => n.id === options.trainerName);
    s.setTrainerBattleSprite(
      trainer?.trainerClass ? (TRAINER_BATTLE_SPRITES[trainer.trainerClass] ?? null) : null
    );
  } else {
    s.setTrainerBattleSprite(null);
  }

  s.setActiveBattle(battleState);
  s.setShowMoves(false);
  s.updatePokedex(options.enemy.id, false);
  if (options.battleLog) {
    s.setBattleLog(options.battleLog);
    s.setBattleLogs([{ text: options.battleLog, speaker: 'Sistema', id: -1 }]);
  }
  s.setPhase(BATTLE_TRANSITION);
}
