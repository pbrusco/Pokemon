import { Pokemon } from '../types';

const W = window as any;
if (!W.__gm) W.__gm = { active: false };

export const isGodMode = (): boolean => W.__gm.active;
export const toggleGodMode = (): boolean => { W.__gm.active = !W.__gm.active; return W.__gm.active; };

export function applyGodMode(team: Pokemon[]): Pokemon[] {
  return team.map(p => ({
    ...p,
    hp: p.maxHp,
    baseStats: {
      ...p.baseStats,
      attack: p.baseStats.attack * 10,
      special: p.baseStats.special * 10,
    },
  }));
}
