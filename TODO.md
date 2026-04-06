# TODO: Pokémon Fire Red Remake

## 🔴 Priority 1: Core Engine & Stability
- [ ] **State Consolidation** — Finalize the migration of the "State Soup" in `App.tsx` to the `useGameStore`. Ensure all 25+ `useState` calls are removed to prevent desync.
- [ ] **Data-Driven Interactions** — Refactor `useInteractionEngine.ts` to remove hardcoded logic for `mom`, `joy`, and `oak`. Move these to an `onInteract` property within the `NPC` type.
- [ ] **Type-Safe Map IDs** — Update `types.ts` to define `MapID` as `keyof typeof worldMaps` instead of a generic `string` to prevent runtime teleportation errors.
- [ ] **The 1/256 Miss Bug** — Implement the original hardware bug where even 100% accuracy moves have a $~0.4\%$ chance to miss for true authenticity.
- [ ] **Sprite Fallback System** — Add an `onError` handler to PokéAPI image tags in `BattleScreen.tsx` to show a "Substitute" silhouette if GitHub raw URLs fail to load.

## 🟠 Priority 2: Content & Mechanics
- [ ] **Badge Boost Glitch** — Implement the Gen I bug where stat-changing moves (like *Growl*) re-apply the permanent $12.5\%$ stat bonus from badges like the Boulder Badge.
- [ ] **Prize Money System** — Update `useBattle.ts` to award `enemy.level * 20` to the `money` store upon defeating a trainer.
- [ ] **Overworld Status Ticks** — Add logic to `usePlayerMovement.ts` to shake the screen and deduct 1 HP every 4 steps if a lead Pokémon is `poisoned`.
- [ ] **HM & Obstacles** — Add `cut` and `strength` logic to the `Tile` type. Link these to specific badges and moves in `constants.ts`.
- [ ] **Inventory Stacking** — Refactor the `inventory` array to a `Map<string, number>` to support item quantities (e.g., "Potion x99") instead of multiple array entries.

## 🟡 Priority 3: Polish & UX
- [ ] **Synthesized Move SFX** — Assign a `sfxType` to each move in `MOVES` (Pulse, Noise, Glissando). Connect these to the `playTone` synthesis engine.
- [ ] **Health Bar "Drain" Animation** — Use `framer-motion` to make HP bars in `BattleScreen.tsx` slide slowly during damage instead of jumping instantly.
- [ ] **Viewport Culling** — Update the map renderer to only process tiles within 8 units of the `playerPos`, ensuring 60 FPS on larger maps like Mt. Moon.
- [ ] **Battle Backgrounds** — Pass `currentMap` to `BattleScreen.tsx` to swap between `grass`, `cave`, and `gym` floor textures based on location.
- [ ] **Trainer "Spotted" Transition** — Add the "walk-to-player" logic for trainers, ensuring they face the player before the `BATTLE_TRANSITION` triggers.

## 🛠️ Technical Debt & Tooling
- [ ] **MapEditor Compact Export** — Update `MapEditor.tsx` to export maps as `{ rows: string[] }` rather than verbose JSON objects to save file space.
- [ ] **Multiple Save Slots** — Expand `localStorage` logic to support named profiles, including a timestamp and play-time counter.
- [ ] **Z-Index Perspective Fix** — Adjust `Tile` rendering so the player's sprite appears "behind" the top layer of `tree` tiles but "in front" of the trunk.
- [ ] **Automated Damage Tests** — Add `vitest` cases for `calculateDamage` to verify that a Level 5 Starter deals the mathematically correct damage range against a Level 3 Wild Pokémon.

---

### Current Progress Summary
* **Map Set:** Pallet Town, Oak's Lab, Route 1, Viridian City, PokeCenter, PokeMart, Viridian Forest, Pewter City, Pewter Gym, Route 3.
* **Implemented Bosses:** Brock (Pewter Gym).
* **Implemented Systems:** Evolution, Leveling, XP, Basic Battle FSM, Movement, Teleportation.