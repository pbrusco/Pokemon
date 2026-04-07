import { useState } from 'react';

export type PokedexEntry = { seen: boolean; caught: boolean };
export type PokedexState = Record<string, PokedexEntry>;

export function usePokedex(initial: PokedexState = {}) {
  const [pokedex, setPokedex] = useState<PokedexState>(initial);

  function updatePokedex(pokemonId: string, caught = false) {
    setPokedex(prev => ({
      ...prev,
      [pokemonId]: {
        seen: true,
        caught: caught || (prev[pokemonId]?.caught || false),
      },
    }));
  }

  return { pokedex, setPokedex, updatePokedex };
}
