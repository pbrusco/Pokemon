# TODO: Pokémon Fire Red Remake (Next Phase)


- [ ] **Trainer Teams Progression** — scale trainer teams and levels by route/gym progression for smoother difficulty curve.
- [ ] **Status/Volatile Rules Audit** — validate Gen I edge cases (sleep turns, paralysis interaction, stat-reset timing) with tests.

- [ ] **Battle HUD Pass 2** — add classic command cursor behavior and tighter menu alignment for both desktop and mobile.
- [ ] **Touch Move Details** — mobile-friendly tap-to-expand move details (hover parity).
- [ ] **Audio Mixing Pass** — normalize SFX/music volumes and add per-channel volume settings.

## ⚔️ Battle UX Improvements
- [ ] **Persistent Dialogue Cleanup** — battle text (e.g. "¡RIVAL SQUIRTLE usó PLACAJE!...") persists in the dialogue box even after the action menu re-appears. It should instead clear or read "¿Qué hará [NAME]?" when waiting for player input.
- [ ] **Wait/Delay Desync on Action Menu** — sometimes the action menu area on the right would remain blank after a turn resolves until the user interacts with the UI again.
- [ ] **Enable "HUIR" Button** — the Run button appears to be entirely inactive (greyed out) during rival/trainer battles, but it should still be clickable to inform the player they cannot run.
- [ ] **String Formatting for Enemy Names** — the prefix "RIVAL" is currently burned directly into the species name string in the event log (e.g., "¡RIVAL SQUIRTLE usó..."). It should be grammatically improved to read "¡El SQUIRTLE rival usó..." or simply "SQUIRTLE usó...".

## 🔴 User Reported Bugs
- [ ] **Oak's Lab Teleport Alignment** — the teleport tile for Oak's lab does not match the visual door in Pallet Town.
- [ ] **Pokeball vs Rival** — able to choose to throw a Pokeball at the rival, but nothing happens (silently fails without consuming turn or alerting).
- [ ] **Battle Potion Failure** — choosing a Potion from the bag during battle does not do anything.
- [ ] **Tile Culling Artifacts** — moving completely to edge of map makes opposite columns of tiles disappear prematurely.
- [ ] **Spotted Trainer Movement Glitch** — can still move continuously while the exclamation mark (!) animation is playing before a battle starts.
- [ ] **God Mode in Battle** — toggling God mode during a battle has no effect on the current battle stats.
- [ ] **Pewter City Dead Doors** — standard house doors in Pewter City don't have teleport triggers. Need blocking signs or warps.

## 🟣 Demo Mode & Simulation Improvements
- [ ] **Pathfinding Aesthetics (BFS)** — update the BFS navigation to minimize turns (penalize changing directions). Currently, the pathfinding generates zig-zag "stair-step" patterns to targets, which looks unnatural compared to straight L-shaped paths.
- [ ] **Lab Tile Textures** — investigate and add textures for empty white tiles and weird striped wall segments in Oak's Lab that look out of place.
- [ ] **Interaction Indicator Suppression** — hide the bouncing "A" action button UI prompts (e.g., above signs) when the AI demo mode is driving the character to maintain immersion.
- [ ] **Demo Mode State Reset** — investigate why the Demo sometimes shuts off completely after interacting with all objects in Oak's Lab, instead of gracefully transitioning back to the random-walk heuristic fallback.

## 🛠️ Tooling & Quality

- [ ] **E2E Smoke Tests** — add a minimal Playwright flow: move, battle, catch/use item, save/load.
- [ ] **Performance Budget Checks** — measure frame time and memory after culling/layer changes on low-end devices.
- [ ] **Refactor Guardrails** — add lint/test checks that enforce no regressions in FSM transitions and save schema migrations.

---

### Current Coverage
- **Maps:** Pallet Town, Oak's Lab, Route 1, Viridian City, Pokecenter, Pokemart, Viridian Forest, Pewter City, Pewter Gym, Route 3
- **Bosses:** Brock
- **Core systems:** movement, encounters, battle FSM, XP/level/evolution, inventory quantities, save slots, Pokedex, PC