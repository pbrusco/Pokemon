# TODO

## ~~Priority 1 — Install Node & verify the build~~ DONE
- [x] Install Node.js on this machine (v20.19.4, npm 11.12.1)
- [x] Run `npm install` — 179 packages, 0 vulnerabilities
- [x] Run `npx tsc --noEmit` — clean (fixed 2 missing tile types: `bookshelf`, `machine`)
- [x] Run `npm run test:run` — 121 tests passing across 4 test files

## ~~Priority 2 — Save/load system~~ DONE
- [x] Add localStorage persistence to the Zustand store (`zustand/persist`, key `pokemon-firered-save`)
- [x] Persist progression data via `partialize`: playerTeam, inventory, currentMap, playerPos, storyStep, badges, defeatedTrainers, pcStorage, money, pickedItemIds, pokedex
- [x] Auto-save on every state change (zustand persist default)
- [x] Load saved state on app mount
- [x] Add `resetGame()` that clears saved data

## ~~Priority 3 — Consolidate state into Zustand~~ DONE
- [x] Move `phase` / `setPhase` into the Zustand store
- [x] Move `pickedItemIds`, `showMoves`, `isMuted` into the store
- [x] Replace the `gameState` ref with `{ current: store }` compatibility shim
- [x] Simplify App.tsx — hooks subscribe directly to the store

## ~~Priority 4 — Tileset rendering overhaul~~ DONE
- [x] Canvas-generated 16×16 pixel art tileset (Fire Red style) — `src/data/tileset/tilesetGenerator.ts`
- [x] 3-layer autotiler (ground/objects/overhead) with neighbor-based tile selection — `src/data/tileset/autotiler.ts`
- [x] Rewrite GameTile to render via `background-position` on tileset spritesheet (React.memo, single div per tile)
- [x] Rewrite WorldView for 3-layer rendering; tree canopies use overhead layer for walk-behind depth
- [x] Move grass rustle to single AnimatePresence overlay (was ~500 instances → 1)

## Priority 5 — Fix broken interactions and tests from store refactor
- [ ] Fix Pokéball item pickups (animations and interactions broken)
- [ ] Fix 19 failing tests in `src/hooks/__tests__/useInteractionEngine.test.ts` — the upstream store refactor changed hook APIs (setters now come from the store, not props)
- [ ] Fix `updateTeam` type mismatch in App.tsx:191 (`(team: Pokemon[]) => void` vs `(fn: (prev: Pokemon[]) => Pokemon[]) => void`)

## Priority 6 — PP tracking in battle
- [ ] Decrement PP when a move is used in `battleEngine.ts`
- [ ] Prevent selecting moves with 0 PP
- [ ] Implement Struggle (used when all moves have 0 PP): typeless, 50 power, 1/4 recoil damage
- [ ] Restore PP on heal at Pokécenter
- [ ] Display current/max PP in the battle move selection UI

## Priority 7 — Tileset polish
- [ ] Refine pixel art tile designs (more detail, closer to Fire Red originals)
- [ ] Add terrain transition tiles (grass↔path edges, water shores)
- [ ] Add NPC sprite sheets (replace CSS box characters with pixel art)
- [ ] Support variable map sizes (remove GRID_SIZE=20 constraint)

## Priority 8 — More map content
- [ ] Expand Mt. Moon interior (encounters, items, trainers)
- [ ] Add Cerulean City map
- [ ] Add Cerulean Gym (Misty)
- [ ] Add Route 4 (Mt. Moon exit → Cerulean)
- [ ] Populate routes with trainers, wild encounter tables, and items

## Priority 9 — Overworld poison damage
- [ ] Tick 1 HP per step for poisoned Pokémon while walking
- [ ] Faint poisoned Pokémon at 0 HP (Gen I: poison can kill outside battle)
- [ ] Show poison damage visual/text feedback on the overworld
- [ ] Clear poison on heal at Pokécenter
