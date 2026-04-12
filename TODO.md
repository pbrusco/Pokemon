# TODO

## ~~Priority 1 — Install Node & verify the build~~ DONE
- [x] Install Node.js on this machine (v20.19.4, npm 11.12.1)
- [x] Run `npm install` — 179 packages, 0 vulnerabilities
- [x] Run `npx tsc --noEmit` — clean (fixed 2 missing tile types: `bookshelf`, `machine`)
- [x] Run `npm run test:run` — 121 tests passing across 4 test files

## Priority 2 — Save/load system
- [ ] Add localStorage persistence to the Zustand store
- [ ] Persist progression data: playerTeam, inventory, currentMap, playerPos, storyStep, badges, defeatedTrainers, pcStorage, money, pickedItemIds, pokedex
- [ ] Add save-on-change (or periodic auto-save)
- [ ] Load saved state on app mount
- [ ] Add a "New Game" option that clears saved data

## Priority 3 — Consolidate state into Zustand
- [ ] Move `phase` / `setPhase` into the Zustand store
- [ ] Move `pickedItemIds`, `showMoves`, `isMuted` into the store
- [ ] Replace the `gameState` ref with `useGameStore.getState()` calls inside setTimeout callbacks
- [ ] Simplify App.tsx — hooks subscribe directly to the store instead of receiving 15+ setter props

## Priority 4 — PP tracking in battle
- [ ] Decrement PP when a move is used in `battleEngine.ts`
- [ ] Prevent selecting moves with 0 PP
- [ ] Implement Struggle (used when all moves have 0 PP): typeless, 50 power, 1/4 recoil damage
- [ ] Restore PP on heal at Pokécenter
- [ ] Display current/max PP in the battle move selection UI

## Priority 5 — Memoize NPC/item databases
- [ ] Wrap `buildNPCDatabase()` and `buildItemDatabase()` calls in `useMemo` with correct deps
- [ ] Or move the derivation into Zustand selectors so it's computed once per state change

## Priority 6 — More map content
- [ ] Expand Mt. Moon interior (encounters, items, trainers)
- [ ] Add Cerulean City map
- [ ] Add Cerulean Gym (Misty)
- [ ] Add Route 4 (Mt. Moon exit → Cerulean)
- [ ] Populate routes with trainers, wild encounter tables, and items

## Priority 7 — Overworld poison damage
- [ ] Tick 1 HP per step for poisoned Pokémon while walking
- [ ] Faint poisoned Pokémon at 0 HP (Gen I: poison can kill outside battle)
- [ ] Show poison damage visual/text feedback on the overworld
- [ ] Clear poison on heal at Pokécenter
