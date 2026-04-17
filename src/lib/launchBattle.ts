import { Pokemon } from '../types';
import { createBattleState } from './battleEngine';
import { isGodMode, applyGodMode } from './godMode';
import { useGameStore } from '../store/gameStore';
import { BATTLE_TRANSITION } from '../types/gamePhase';

interface LaunchBattleOptions {
  enemy: Pokemon;
  isTrainer: boolean;
  trainerName?: string;
  battleLog?: string;
}

export function launchBattle(options: LaunchBattleOptions): void {
  const s = useGameStore.getState();
  const team = isGodMode() ? applyGodMode(s.playerTeam) : s.playerTeam;
  const battleState = createBattleState(team, options.enemy, {
    isTrainerBattle: options.isTrainer,
    trainerName: options.trainerName,
    inventory: s.inventory,
    pcStorage: s.pcStorage,
    hasBoulderBadge: s.badges.includes('BOULDER'),
  });

  s.setEnemyPokemon(options.enemy);
  s.setIsTrainerBattle(options.isTrainer);
  s.setActiveBattle(battleState);
  s.setShowMoves(false);
  s.updatePokedex(options.enemy.id, false);
  if (options.battleLog) {
    s.setBattleLog(options.battleLog);
    s.setBattleLogs([{ text: options.battleLog, speaker: 'Sistema', id: -1 }]);
  }
  s.setPhase(BATTLE_TRANSITION);
}
