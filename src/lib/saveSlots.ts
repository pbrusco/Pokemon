/**
 * Manual save-slot storage.
 *
 * The game has 3 slots backed by separate localStorage keys. Each slot
 * stores a timestamp + the same partialized payload that zustand-persist
 * writes for in-session continuity.
 *
 * Slots are independent of the in-session auto-persist key
 * (`pokemon-firered-save-v3`) — they survive `resetGame()` and let the
 * player snapshot their progress at multiple checkpoints.
 */

export const SLOT_NUMBERS = [1, 2, 3] as const;
export type SlotNumber = typeof SLOT_NUMBERS[number];

export interface SaveSlot {
  slot: SlotNumber;
  savedAt: number;
  data: Record<string, unknown>;
}

const KEY_PREFIX = 'pokemon-firered-slot-';

function key(n: SlotNumber): string {
  return `${KEY_PREFIX}${n}`;
}

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readSlot(n: SlotNumber): SaveSlot | null {
  const ls = safeStorage();
  if (!ls) return null;
  const raw = ls.getItem(key(n));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { savedAt: number; data: Record<string, unknown> };
    if (typeof parsed.savedAt !== 'number' || !parsed.data) return null;
    return { slot: n, savedAt: parsed.savedAt, data: parsed.data };
  } catch {
    return null;
  }
}

export function listSlots(): Array<SaveSlot | { slot: SlotNumber; empty: true }> {
  return SLOT_NUMBERS.map(n => readSlot(n) ?? { slot: n, empty: true as const });
}

export function writeSlot(n: SlotNumber, data: Record<string, unknown>): SaveSlot {
  const ls = safeStorage();
  const slot: SaveSlot = { slot: n, savedAt: Date.now(), data };
  if (ls) ls.setItem(key(n), JSON.stringify({ savedAt: slot.savedAt, data: slot.data }));
  return slot;
}

/** First slot (1→3) without saved data, or null if all slots are full. */
export function findFreeSlot(): SlotNumber | null {
  for (const n of SLOT_NUMBERS) {
    if (!readSlot(n)) return n;
  }
  return null;
}

export function hasAnySave(): boolean {
  return SLOT_NUMBERS.some(n => readSlot(n) !== null);
}
