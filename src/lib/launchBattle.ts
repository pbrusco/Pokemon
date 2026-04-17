import { Pokemon } from '../types';
import { BATTLE_TRANSITION } from '../types/gamePhase';
import { createBattleState } from './battleEngine';
import { useGameStore } from '../store/gameStore';

interface LaunchBattleParams {
  enemy: Pokemon;
  isTrainer: boolean;
  trainerName?: string;
  enemyTeam?: Pokemon[];
  battleLog?: string;
}

export function launchBattle({ enemy, isTrainer, trainerName, enemyTeam, battleLog }: LaunchBattleParams): void {
  const s = useGameStore.getState();
  const state = createBattleState(s.playerTeam, enemy, {
    isTrainerBattle: isTrainer,
    trainerName,
    enemyTeam,
    inventory: s.inventory,
    pcStorage: s.pcStorage,
    hasBoulderBadge: s.badges.includes('BOULDER'),
  });
  s.setActiveBattle(state);
  if (battleLog !== undefined) s.setBattleLog(battleLog);
  s.setPhase(BATTLE_TRANSITION);
}
