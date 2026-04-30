import { NPC_SPRITE_MAP } from './npcSpriteMap';

/**
 * Returns the FireRed battle front sprite URL for a trainer class,
 * or undefined if one doesn't exist.
 */
export function getTrainerBattleSprite(trainerClass: string): string | undefined {
  return NPC_SPRITE_MAP[trainerClass]?.battle;
}
