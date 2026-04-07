# BUGS.md — Known Issues from Demo Simulation

## Fixed

### BUG-1: Blackout/battle_end log spam during BLACKOUT phase
**Where:** `src/lib/demoMode.ts` — blackout outcome check
**What:** `K` and `E` entries repeated every tick during blackout.
**Fix:** Track battle end with `ds.battleLogged` + `ds.outcome`, reset only on new battle.

### BUG-2: Duplicate level_up logs
**Where:** `src/lib/demoMode.ts` — level tracking
**What:** False level-up detected when team order changed (switch moved higher-level pokemon to slot 0).
**Fix:** Track levels by pokemon ID, not array index.

### BUG-3: AI attacks dead enemies (0 HP)
**Where:** `src/App.tsx` — `dispatchBattle` + `src/lib/demoMode.ts`
**What:** Actions dispatched against enemies at 0 HP because React phase was stale.
**Fix:** Demo uses engine phase (`bs.phase`) directly. Added `outcome !== 'ongoing'` guard in `dispatchBattle`.

### BUG-4: Missing battle_end for some battles
**Where:** `src/lib/demoMode.ts` — outcome tracking
**What:** Some battles had no `E` entry.
**Fix:** Addressed by the `battleLogged` + `outcome` tracking rework. Not reproducible in latest simulation.

### BUG-5: Duplicate dialogue entries
**Where:** `src/lib/demoMode.ts` — dialogue handling
**What:** Same dialogue logged multiple times within a few ticks.
**Fix:** Track `ds.lastDialogue`, skip logging if text matches.

### BUG-6: FORCED_SWITCH spam (132 S entries per switch)
**Where:** `src/App.tsx` — `dispatchBattle` guard
**What:** Guard `phase !== 'CHOOSING'` blocked SWITCH actions during FORCED_SWITCH, so the switch never resolved and the demo retried every tick.
**Fix:** Allow SWITCH actions when phase is FORCED_SWITCH:
```typescript
const validPhase = ph === 'CHOOSING' || (ph === 'FORCED_SWITCH' && action.type === 'SWITCH');
```
