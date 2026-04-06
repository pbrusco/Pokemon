# TODO

## Content & Progression

- [ ] **Award money after trainer battles** — `money` state exists and deducts on purchases, but winning a trainer battle does not yet grant prize money.

- [ ] **Expand wild Pokemon encounter tables** — Only Routes 1, 3, and Viridian Forest have wild encounters. Add encounter tables for other maps that logically should have them.

- [ ] **More trainer battles** — Route 1 and Route 3 only have a few trainers. Add the canonical set of trainers from the original games with appropriate levels and teams.

- [ ] **Additional gym leaders** — Only Brock (Pewter Gym) is implemented. Add Misty (Cerulean), Lt. Surge (Vermillion), and others as the map set expands.

- [ ] **Badge effects** — Badges in the original games unlock HM usage and boost stats. Implement at least the stat-boost effects (e.g., Boulder Badge raises Attack).

- [ ] **More maps** — Mt. Moon, Cerulean City, Route 4, and beyond are missing. Expand the map set to continue the main story arc.

- [ ] **Rival rematches** — Currently the rival only battles once at Oak's lab. Add subsequent encounters at appropriate story beats.

---

## Polish & UX

- [ ] **Battle transition for trainer battles** — Add a brief pause or "walk toward each other" animation before the battle screen appears, to distinguish trainer battles from wild encounters.

---

## Technical Debt

- [ ] **MapEditor export format** — The in-game MapEditor (`src/components/MapEditor.tsx`) still exports in the old verbose JSON format. Update it to export `{ rows: string[] }` compact format.

- [ ] **Extract battle sequences from App.tsx** — `handleAttack` and `handleEnemyTurn` are long nested `setTimeout` chains inside a 1900-line file. These could be moved to a well-structured hook now that the stale-closure pattern (using refs) is established.

- [ ] **Map validation** — Add a dev-time check that all map JSON files are exactly 20×20 and contain only valid tile types. Currently malformed maps fail silently.

- [ ] **Type safety for map IDs** — `currentMap` is typed as `string`. A string literal union (`'PALLET_TOWN' | 'OAKS_LAB' | ...`) would catch typos at compile time.

- [ ] **Sprite loading errors** — PokeAPI sprites load from GitHub raw URLs. Add an `onError` fallback (e.g., a colored placeholder) so missing sprites don't break the UI.

- [ ] **Multiple save slots** — Currently one save slot in localStorage. Add support for named saves or at least a "New Game" confirmation that doesn't silently overwrite progress.
