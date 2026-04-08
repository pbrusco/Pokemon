import { Pokemon } from '../types';

/** Apply a Potion (+20 HP, capped at maxHp) to a single Pokémon. */
export function applyPotion(p: Pokemon): Pokemon {
  return { ...p, hp: Math.min(p.maxHp, p.hp + 20) };
}

/** Fully restore a single Pokémon (Pokécenter / blackout recovery). */
export function fullHeal(p: Pokemon): Pokemon {
  return {
    ...p,
    hp: p.maxHp,
    status: 'none',
    moves: p.moves.map(m => ({ ...m, pp: m.maxPp })),
  };
}
