// ---------------------------------------------------------------------------
// Game Phase FSM — replaces ~17 boolean useState hooks with two
// discriminated unions.  Impossible states become unrepresentable.
// ---------------------------------------------------------------------------

/** Battle sub-phases (only meaningful when GamePhase.type === 'BATTLE') */
export type BattlePhase =
  | { type: 'CHOOSING' }
  | { type: 'PLAYER_ATTACK' }
  | { type: 'ENEMY_ATTACK' }
  | { type: 'PLAYER_FAINTED' }
  | { type: 'FORCED_SWITCH' }
  | { type: 'ENEMY_FAINTED' }
  | { type: 'CATCHING' }
  | { type: 'LEVEL_UP' }
  | { type: 'EVOLVING' }
  | { type: 'BATTLE_INVENTORY' }
  | { type: 'BATTLE_TEAM' }
  | { type: 'TRAINER_NEXT_POKEMON' }

/** Top-level game phase */
export type GamePhase =
  | { type: 'EXPLORING' }
  | { type: 'MENU'; returnTo?: GamePhase }
  | { type: 'INVENTORY'; returnTo?: GamePhase }
  | { type: 'TEAM'; returnTo?: GamePhase }
  | { type: 'SHOP' }
  | { type: 'POKEDEX'; returnTo?: GamePhase }
  | { type: 'PC'; returnTo?: GamePhase }
  | { type: 'EDITOR' }
  | { type: 'BATTLE_TRANSITION' }
  | { type: 'BATTLE'; sub: BattlePhase }
  | { type: 'BLACKOUT' }
  | { type: 'HEALING' }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const EXPLORING: GamePhase = { type: 'EXPLORING' };
export const SHOP: GamePhase = { type: 'SHOP' };
export const EDITOR: GamePhase = { type: 'EDITOR' };
export const BATTLE_TRANSITION: GamePhase = { type: 'BATTLE_TRANSITION' };
export const BLACKOUT: GamePhase = { type: 'BLACKOUT' };
export const HEALING: GamePhase = { type: 'HEALING' };

export function battle(sub: BattlePhase): GamePhase {
  return { type: 'BATTLE', sub };
}

// Pre-built battle sub-phases for convenience
export const B_CHOOSING      = { type: 'CHOOSING' } as const;
export const B_PLAYER_ATTACK = { type: 'PLAYER_ATTACK' } as const;
export const B_ENEMY_ATTACK  = { type: 'ENEMY_ATTACK' } as const;
export const B_PLAYER_FAINTED = { type: 'PLAYER_FAINTED' } as const;
export const B_FORCED_SWITCH = { type: 'FORCED_SWITCH' } as const;
export const B_ENEMY_FAINTED = { type: 'ENEMY_FAINTED' } as const;
export const B_CATCHING      = { type: 'CATCHING' } as const;
export const B_LEVEL_UP      = { type: 'LEVEL_UP' } as const;
export const B_EVOLVING      = { type: 'EVOLVING' } as const;
export const B_BATTLE_INVENTORY = { type: 'BATTLE_INVENTORY' } as const;
export const B_BATTLE_TEAM   = { type: 'BATTLE_TEAM' } as const;
export const B_TRAINER_NEXT_POKEMON = { type: 'TRAINER_NEXT_POKEMON' } as const;
