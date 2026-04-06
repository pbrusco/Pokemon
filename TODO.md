# TODO: Pokémon Fire Red Remake (Next Phase)

## ✅ Completed Milestones

- [x] State consolidation (phase 1): core overworld/progression/team/inventory state connected to `useGameStore`
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

## 🔴 Priority 1: Stabilization & Architecture

- [ ] **State Consolidation (phase 2)** — migrate remaining battle/UI transient state into dedicated store slices or focused hooks, then shrink `App.tsx` further.
- [ ] **Interaction Engine Tests** — add integration tests for NPC interactions, HM obstacle interactions, and quest inventory transitions.
- [ ] **Save Slot Manager UI** — add profile metadata panel (name, playtime, last save date) and create/delete/rename flows.

## 🟠 Priority 2: Gameplay Depth

- [ ] **Trainer Teams Progression** — scale trainer teams and levels by route/gym progression for smoother difficulty curve.
- [ ] **Status/Volatile Rules Audit** — validate Gen I edge cases (sleep turns, paralysis interaction, stat-reset timing) with tests.
- [ ] **HM Progression Content** — place real cut/strength obstacles in maps and gate meaningful shortcuts/rewards.

## 🟡 Priority 3: UX & Presentation

- [ ] **Battle HUD Pass 2** — add classic command cursor behavior and tighter menu alignment for both desktop and mobile.
- [ ] **Touch Move Details** — mobile-friendly tap-to-expand move details (hover parity).
- [ ] **Audio Mixing Pass** — normalize SFX/music volumes and add per-channel volume settings.

## 🛠️ Tooling & Quality

- [ ] **E2E Smoke Tests** — add a minimal Playwright flow: move, battle, catch/use item, save/load.
- [ ] **Performance Budget Checks** — measure frame time and memory after culling/layer changes on low-end devices.
- [ ] **Refactor Guardrails** — add lint/test checks that enforce no regressions in FSM transitions and save schema migrations.

---

### Current Coverage
- **Maps:** Pallet Town, Oak's Lab, Route 1, Viridian City, Pokecenter, Pokemart, Viridian Forest, Pewter City, Pewter Gym, Route 3
- **Bosses:** Brock
- **Core systems:** movement, encounters, battle FSM, XP/level/evolution, inventory quantities, save slots, Pokedex, PC