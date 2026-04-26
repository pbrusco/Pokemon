import { Pokemon } from '../types';
import { ITEMS_DATABASE } from '../constants';

interface ItemUseResult {
  success: boolean;
  pokemon: Pokemon;
  message: string;
}

/**
 * Applies an item's effects to a specific Pokémon.
 * Returns the modified Pokémon and a status message.
 */
export function applyItemToPokemon(pokemon: Pokemon, itemId: string): ItemUseResult {
  const item = ITEMS_DATABASE[itemId];
  if (!item || !item.effect) {
    return { success: false, pokemon, message: 'No se puede usar eso aquí.' };
  }

  const effect = item.effect;
  let success = false;
  let message = '';
  const newPokemon = { ...pokemon };

  // 1. Check revive first
  if (effect.revive) {
    if (newPokemon.hp > 0) {
      return { success: false, pokemon, message: '¡No tiene ningún efecto!' };
    }
    newPokemon.hp = Math.max(1, Math.floor((newPokemon.maxHp * (effect.reviveHpPercent || 50)) / 100));
    success = true;
    message = `¡${newPokemon.name} ha revivido!`;
  } else {
    // Cannot use non-revive items on fainted pokemon
    if (newPokemon.hp <= 0) {
      return { success: false, pokemon, message: '¡No tiene ningún efecto!' };
    }
  }

  // 2. Healing HP
  if (effect.healHp && newPokemon.hp > 0) {
    if (newPokemon.hp === newPokemon.maxHp) {
      if (!success) { // If it didn't revive, and HP is full, fail if this is only a heal item
        if (!effect.cureStatus) {
           return { success: false, pokemon, message: '¡No tiene ningún efecto!' };
        }
      }
    } else {
      const healAmount = Math.min(newPokemon.maxHp - newPokemon.hp, effect.healHp);
      newPokemon.hp += healAmount;
      success = true;
      if (!message) message = `¡${newPokemon.name} recuperó ${healAmount} PS!`;
    }
  }

  // 3. Status curing
  if (effect.cureStatus && newPokemon.hp > 0) {
    if (newPokemon.status && newPokemon.status !== 'none') {
      if (effect.cureStatus === 'all' || effect.cureStatus === newPokemon.status) {
        newPokemon.status = 'none';
        success = true;
        if (!message) message = `¡El problema de estado de ${newPokemon.name} se curó!`;
      } else if (!success) {
        return { success: false, pokemon, message: '¡No tiene ningún efecto!' };
      }
    } else if (!success) {
       return { success: false, pokemon, message: '¡No tiene ningún efecto!' };
    }
  }

  return { success, pokemon: newPokemon, message };
}
