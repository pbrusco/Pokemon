import { describe, it, expect } from 'vitest';
import { applyItemToPokemon } from '../itemUtils';
import { makePokemon } from '../../constants/pokemon';
import type { Pokemon } from '../../types';

const bulbasaur = (hpVal = 28, statusVal?: Pokemon['status']): Pokemon => {
  const p = makePokemon('bulbasaur', 'BULBASAUR', 10, 'grass', [], 1, { types: ['grass', 'poison'] });
  return { ...p, hp: hpVal, maxHp: Math.max(hpVal, p.maxHp), status: statusVal ?? 'none' };
};

describe('applyItemToPokemon', () => {
  it('returns false for unknown item', () => {
    const result = applyItemToPokemon(bulbasaur(20), 'UNKNOWN_ITEM');
    expect(result.success).toBe(false);
  });

  it('heals HP with Potion', () => {
    const pkmn = { ...bulbasaur(), hp: 5, maxHp: 40 };
    const result = applyItemToPokemon(pkmn, 'POTION');
    expect(result.success).toBe(true);
    expect(result.pokemon.hp).toBe(25); // 5 + 20
  });

  it('fails Potion on full HP Pokemon', () => {
    const pkmn = { ...bulbasaur(), hp: 40, maxHp: 40 };
    const result = applyItemToPokemon(pkmn, 'POTION');
    expect(result.success).toBe(false);
    expect(result.message).toBe('¡No tiene ningún efecto!');
  });

  it('cures poison with Antidote', () => {
    const pkmn = { ...bulbasaur(20), status: 'poison' as const };
    const result = applyItemToPokemon(pkmn, 'ANTIDOTE');
    expect(result.success).toBe(true);
    expect(result.pokemon.status).toBe('none');
  });

  it('fails Antidote on non-poisoned Pokemon', () => {
    const pkmn = bulbasaur(20);
    const result = applyItemToPokemon(pkmn, 'ANTIDOTE');
    expect(result.success).toBe(false);
    expect(result.message).toBe('¡No tiene ningún efecto!');
  });

  it('fails Antidote on wrong status', () => {
    const pkmn = { ...bulbasaur(20), status: 'burn' as const };
    const result = applyItemToPokemon(pkmn, 'ANTIDOTE');
    expect(result.success).toBe(false);
    expect(result.message).toBe('¡No tiene ningún efecto!');
  });

  it('revives fainted Pokemon with Revive', () => {
    const pkmn = { ...bulbasaur(), hp: 0, maxHp: 100 };
    const result = applyItemToPokemon(pkmn, 'REVIVE');
    expect(result.success).toBe(true);
    expect(result.pokemon.hp).toBe(50); // 50% of maxHp
  });

  it('fails Revive on alive Pokemon', () => {
    const pkmn = bulbasaur(20);
    const result = applyItemToPokemon(pkmn, 'REVIVE');
    expect(result.success).toBe(false);
    expect(result.message).toBe('¡No tiene ningún efecto!');
  });

  it('fails non-revive item on fainted Pokemon', () => {
    const pkmn = { ...bulbasaur(), hp: 0, maxHp: 100 };
    const result = applyItemToPokemon(pkmn, 'POTION');
    expect(result.success).toBe(false);
    expect(result.message).toBe('¡No tiene ningún efecto!');
  });

  it('Full Heal cures any status', () => {
    const pkmn = { ...bulbasaur(30), status: 'paralyzed' as const };
    const result = applyItemToPokemon(pkmn, 'FULL_HEAL');
    expect(result.success).toBe(true);
    expect(result.pokemon.status).toBe('none');
  });

  it('Full Heal fails on healthy Pokemon', () => {
    const pkmn = bulbasaur(30);
    const result = applyItemToPokemon(pkmn, 'FULL_HEAL');
    expect(result.success).toBe(false);
  });
});
