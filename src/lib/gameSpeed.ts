// ─── Game Speed Multiplier ───────────────────────────────────────────────────
// Module-level so it's accessible everywhere without prop drilling.
// Does NOT trigger re-renders — consumed imperatively inside setTimeout/animations.

let _speed = 1;

/** Set game speed multiplier (clamped to >= 0.1) */
export function setGameSpeed(s: number) { _speed = Math.max(0.1, s); }

/** Scale a millisecond delay by game speed (for setTimeout) */
export function sd(ms: number): number { return ms / _speed; }

/** Scale a seconds duration by game speed (for Framer Motion) */
export function sdur(s: number): number { return s / _speed; }
