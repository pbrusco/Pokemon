import type { Direction } from '../types';

// GBA overworld sprite frame offsets.
// 10-frame sheets (160×32) and 9-frame sheets (144×32) use 16×32 pixel frames.
// 3-frame sheets (48×32 / 48×16) use 16×32 (gym leaders) or 16×16 (pokemon).
const FRAME_MAP: Record<number, Record<Direction, number>> = {
  10: { down: 0, up: 3, left: 6, right: 6 },
  9:  { down: 0, up: 3, left: 6, right: 6 },
  3:  { down: 0, up: 1, left: 2, right: 2 },
  0:  { down: 0, up: 0, left: 0, right: 0 },
};

interface SpriteFrame {
  offsetX: number;
  repeatX: number;
}

const DEFAULT_FRAMES = FRAME_MAP[10];

export function getSpriteFrame(direction: Direction, numFrames: number): SpriteFrame {
  const frames = FRAME_MAP[numFrames] ?? DEFAULT_FRAMES;
  const frame = frames[direction] ?? 0;
  const flipped = direction === 'right';
  // CSS background-position % uses n/(N-1): 0%=leftmost frame, 100%=rightmost frame.
  const steps = Math.max(numFrames - 1, 1);
  const oneStep = 1 / steps;
  return {
    offsetX: frame * oneStep,
    repeatX: flipped ? -oneStep : oneStep,
  };
}

export function cssFrame(
  direction: Direction,
  numFrames: number,
): { backgroundPositionX: string; transform: string } {
  const frame = getSpriteFrame(direction, numFrames);
  const pct = frame.offsetX * 100;
  return {
    backgroundPositionX: `${pct}%`,
    transform: direction === 'right' ? 'scaleX(-1)' : 'none',
  };
}
