# TODO

## Bugs (Break Playability)

- [x] **Input lock on battle/action transitions** — Fixed: `handleMove` now blocks on `BATTLE`, `BATTLE_TRANSITION`, `HEALING`, and `BLACKOUT` phases via `phaseType` in `gameState.current`.

- [x] **Oak appears in two places simultaneously** — Fixed: `oak_pallet` NPC in PALLET_TOWN is conditionally rendered only when `playerTeam.length === 0`.

- [x] **Pokedex not tracking seen/caught Pokemon** — Fixed: `pokedex` and `money` are now included in localStorage save/load. Trainer battle enemies are marked as seen on battle start.

- [x] **Invisible collision barriers are passable** — Fixed: Removed the CSS-only fence divs that had no backing tile data. Real barriers must be in the map JSON as `walkable: false` tiles.

---

## Playability Improvements

- [x] **Show player character sprite in trainer battles** — Done: player.png sprite shown beside the Pokemon in trainer battles.

- [x] **Trainer vision shadow** — Done: semi-transparent red overlays rendered on all 3 tiles in each undefeated trainer's vision cone.

- [x] **Exclamation mark on trainer detection** — Done: animated `!` bubble appears above the trainer's head when they spot the player.

- [x] **Show money/budget in shop UI** — Done: balance displayed in shop header; purchases deduct from `money` state; items disabled when unaffordable.

- [x] **Teleport exit indicators** — Done: bouncing directional arrows rendered on every teleport tile.

- [x] **Long grass visual for wild encounter zones** — Done: maps with `WILD_POKEMON_DATABASE` entries render darker tall-grass tiles with visible blades.

- [x] **Show full Pokemon stats in battle (debug mode)** — Done: ATK/DEF/SPC/SPD computed stats shown below both HUDs; active status effect displayed in orange.

---

## Content & Progression

- [ ] **Expand wild Pokemon encounter tables** — Only Routes 1, 3, and Viridian Forest have wild encounters. Add encounter tables for other maps that logically should have them.

- [ ] **Money system** — `money` state added (3000₽ initial), deducted on purchases, persisted in save. Still missing: award money after winning trainer battles.

- [ ] **More trainer battles** — Route 1 and Route 3 only have a few trainers. Add the canonical set of trainers from the original games with appropriate levels and teams.

- [ ] **Additional gym leaders** — Only Brock (Pewter Gym) is implemented. Add Misty (Cerulean), Lt. Surge (Vermillion), and others as the map set expands.

- [ ] **Badge effects** — Badges in the original games unlock HM usage and boost stats. Implement at least the stat-boost effects (e.g., Boulder Badge raises Attack).

- [ ] **More maps** — Mt. Moon, Cerulean City, Route 4, and beyond are missing. Expand the map set to continue the main story arc.

- [ ] **Rival rematches** — Currently the rival only battles once at Oak's lab. Add subsequent encounters at appropriate story beats.

---

## Polish & UX

- [ ] **Battle transition is abrupt for trainer battles** — Add a brief "walk toward each other" animation or a short pause before the battle screen appears, to distinguish trainer battles from wild encounters.

- [x] **Move PP system** — Done: `pp` and `maxPp` fields on `Move`, Gen I PP values for all moves, PP deducted on use, disabled when 0, displayed in battle UI, restored on heal.

- [x] **Run from wild battle** — Done: Gen I flee formula `(playerSpeed * 128 / enemySpeed + 30) % 256 > random(0–255)`. On fail, enemy gets a turn.

- [x] **Item use feedback** — Done: Potion use shows floating green `+N` heal number and reports PS recovered in battle log.

- [x] **Persistent Pokedex seen state** — Done: Fixed save `useEffect` deps to include `pokedex` and `money`, so seen state persists across sessions.

- [x] **Sound for trainer detection** — Done: `TRAINER_SPOTTED` SFX (rising two-note square wave jingle) plays when a trainer spots the player.

- [x] **Mobile layout polish** — Done: Battle HUDs, sprites, move buttons, action panel, and side menu all use responsive `sm:` breakpoints for 375px viewports. Debug stats hidden on mobile.

---

## Technical Debt

- [ ] **Extract battle sequences from App.tsx** — `handleAttack` and `handleEnemyTurn` are long nested `setTimeout` chains inside a 1900-line file. These could be moved to a well-structured hook now that the stale-closure pattern (using refs) is established.

- [ ] **Map validation** — Add a dev-time check that all map JSON files are exactly 20×20 and contain only valid tile types. Currently malformed maps fail silently.

- [ ] **Type safety for map IDs** — `currentMap` is typed as `string`. A string literal union (`'PALLET_TOWN' | 'OAKS_LAB' | ...`) would catch typos at compile time.

- [ ] **Sprite loading errors** — PokeAPI sprites load from GitHub raw URLs. Add an `onError` fallback (e.g., a colored placeholder) so missing sprites don't break the UI.

- [ ] **Multiple save slots** — Currently there is one save slot in localStorage with a fixed key. Add support for named saves or at least a "New Game" confirmation that doesn't silently overwrite progress.
