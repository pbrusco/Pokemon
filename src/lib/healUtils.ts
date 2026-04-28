import { type Pokemon } from '../types';

/** Fully restore a single Pokémon (Pokécenter / blackout recovery). */
export function fullHeal(p: Pokemon): Pokemon {
  return {
    ...p,
    hp: p.maxHp,
    status: 'none',
    moves: p.moves.map(m => ({ ...m, pp: m.maxPp })),
  };
}
