# TODO: Pokémon Fire Red Remake

## Remaining Work

### 🔴 Priority 1
- [ ] **State Consolidation** — complete migration from `App.tsx` local state soup into `useGameStore` in safe incremental steps (overworld -> UI/progression -> battle).

## Recently Completed (highlights)

- [x] Data-driven interactions via `NPC.onInteract`
- [x] Type-safe map IDs and map typing
- [x] Gen I 1/256 miss behavior
- [x] Sprite fallback handling in battle
- [x] Badge boost glitch behavior
- [x] Prize money reward flow
- [x] Poison overworld status ticks
- [x] HM obstacle groundwork (`cut_tree`, `boulder`, parser/editor/constants wiring)
- [x] Inventory quantity stacking
- [x] Move SFX categories + synth mapping
- [x] HP drain animation polish
- [x] Viewport culling
- [x] Map-based battle backgrounds
- [x] Trainer spotted approach transition
- [x] MapEditor compact export
- [x] Multiple save slots
- [x] Tree canopy/trunk perspective layering
- [x] Vitest damage test setup

---

### Project Coverage
- **Maps:** Pallet Town, Oak's Lab, Route 1, Viridian City, Pokecenter, Pokemart, Viridian Forest, Pewter City, Pewter Gym, Route 3
- **Bosses:** Brock
- **Core systems:** movement, encounters, battle FSM, XP/level/evolution, inventory, saves, Pokedex, PC