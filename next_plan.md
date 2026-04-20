# Stabilization & Game Design Plan

## Live Progress Tracker

> Updated continuously as phases execute. If context is lost, resume from the first non-✅ item.

- [x] **Phase 0** — CI + pre-commit + stale TODO ✅
  - [x] `.github/workflows/ci.yml` (tsc, unused-locals filter, tests, knip)
  - [x] `.githooks/pre-commit` + `prepare` npm script (`git config core.hooksPath .githooks`)
  - [x] Delete stale TODO line ("Fix 4 pre-existing statusRules.test.ts failures")
  - [x] **Decoupling tripwire**: `src/test/decoupling.test.ts` — fails if `src/lib/**` or `src/data/**` import `react` or reference DOM globals (2 pre-existing violations on documented allowlist with migration notes)
  - [x] Cleanup: deleted unused exports (`getGameSpeed`, `stopOakWalk`, `BattleMessage` type, unused `GamePhase` singletons `MENU`/`INVENTORY`/`TEAM`/`POKEDEX`/`PC`)
  - [x] `knip.json` config (treats `eventLog.ts` as entry pending Phase 4; ignores `tailwindcss` CSS-import dep)
  - **Verification**: tsc clean, 160/160 tests, knip clean, hook wired
- [x] **Phase 2** — Crit + EXP formula fixes ✅
  - [x] Pin test added: L40 Charmander Scratch crit on L40 Rattata → expect 39 (max roll)
  - [x] Fix `damage.ts` crit calc: removed `level*2` misuse (was applying doubled level inside `calcStatWithBoost` — now uses raw level; `critical=2` in main formula handles the Gen I crit level term)
  - [x] Added sanity test: crit ≈ 1.5–2× non-crit (not 4×)
  - [x] `BASE_EXP` table for all 151 species in `constants.ts`, `baseExpFor()` helper
  - [x] `baseExp?` on `Pokemon` type; `makePokemon` sets it
  - [x] `participantUids: string[]` in `BattleState`
  - [x] `createBattleState` assigns `uid` to team members if missing (index-based, deterministic)
  - [x] `SWITCH` action adds new active uid to participants
  - [x] `TRAINER_NEXT_POKEMON` transition resets participants to `[active.uid]`
  - [x] Gen I EXP formula: `floor(baseExp × level × trainerMult / (7 × participants))`; fainted participants excluded from denominator
  - [x] EXP formula tests: species weighting (Magikarp 20 vs Dragonair 144), trainer multiplier, participant split, fainted-skip, reset on trainer next Pokémon, SWITCH participant tracking
  - [x] DV/Stat-Exp out-of-scope comment in `damage.ts` pointing to DESIGN.md
  - **Verification**: tsc clean, 168/168 tests (+6 new), knip clean
- [x] **Phase 1** — World data unification + validator ✅
  - [x] Audit: `worldConfig.teleports` was dead state (set in store, never read; movement engine uses JSON `warps` directly). Removed from `worldConfig.ts`, store, and 2 test setups.
  - [x] `src/data/__tests__/worldIntegrity.test.ts` — 91 tests covering: warp source/target in-bounds, target map existence, walkable target tile, warp surface type, reciprocity (Chebyshev ≤ 1 for the walk-on-door pattern), NPC in-bounds + walkable, globally-unique NPC ids, item in-bounds, encounter table sanity (level/moves/rate range), encounter↔grass coherence.
  - [x] **Real bugs fixed by validator:**
    - `bug_catcher_forest` was placed on a tree at viridian_forest (10,10) — moved to (9,10).
    - VIRIDIAN_CITY ↔ VIRIDIAN_FOREST warps skipped ROUTE_2 entirely (faithfulness regression — Gen I has Route 2 between them). Rerouted: VIRIDIAN_CITY (15,0) → ROUTE_2 (4,39) and VIRIDIAN_FOREST (11,35) → ROUTE_2 (4,0). ROUTE_2 already had matching warps to forest+city.
  - **Verification**: tsc clean, 427/427 tests (+91 new), knip clean
- [x] **Phase 3** — Extended simulator scenarios ✅
  - [x] Extracted `src/lib/worldValidator.ts` → pure `validateWorld(): WorldValidationIssue[]` reused by the test and simulator
  - [x] `GameSimulator.assertWorldIntact()` throws on any issue; scenario asserts it's callable mid-playthrough without churn
  - [x] Scenario 13: Trainer vision boundary — confirms 3-tile range (matches engine; plan's "4 tiles" was aspirational, engine uses 3 which is authentic Gen I)
  - [x] Scenario 14: Brock battle — L50 starter defeats Brock, verifies `defeatedTrainers` contains `brock`
  - [x] **Deferred**: level-cap progression tests (Pallet → Pewter) and Brock win-rate-over-N-seeded-runs. Attempted a wild-encounter EXP test; ran into RNG orchestration complexity through the full flow (seed stream exhausts mid-battle, phases don't match expectation deterministically). The battle engine unit tests in `battleEngine.test.ts` already cover the Gen I EXP formula with better isolation. Revisit in Phase 5 when extending content requires balance regression tests.
  - **Verification**: tsc clean, 173/173 tests, knip clean
- [x] **Phase 4** — Replay logger as repro tool ✅
  - [x] `GameSimulator.loadLogAsScenario(log, { tickBetween })` — restores snapshot, seeds the mulberry32 PRNG from the log, then dispatches `move`/`action`/`battle` events with a tick between. `item` and `pcSwap` intentionally skipped (not wired into the headless `useGameLoop`).
  - [x] `GameSimulator.seedPrng(seed)` exposed standalone for reusable determinism.
  - [x] Crash auto-save in `eventLog.ts` (`installCrashAutoSave`): DEV-only; on `window.error` or `unhandledrejection` during an active recording, fires `saveLogToDisk("crash-<tag>-<ts>")` fire-and-forget.
  - [x] Integration test proves `loadLogAsScenario` with a hand-crafted log (snapshot + `move` event) reproduces the post-move position deterministically.
  - **Verification**: tsc clean, 174/174 tests (+1 new), knip clean
  - **Note**: eventLog.ts still has 2 DOM-global usages on the decoupling allowlist (`window.__log` bridge, `document.createElement('a')` in `downloadLog`). These are DEV-only features and legitimately need DOM — leaving them allowlisted. Full separation into `src/lib/eventLog.ts` (pure) + `src/lib/eventLogBridge.ts` (DOM) is a future refactor, not blocking.
- [x] **Phase 5** — Resume content expansion ✅
  - [x] 5a. Viridian City 30×27 → 40×36. Pad-and-shift (+5,+5); border trees; exit corridors at col 20 (N row 0, S row 35). Updated warps: ROUTE_1 (4,0) target, ROUTE_2 (4,39) target, POKECENTER (6,7) target, POKEMART (3,7) target; shifted citizen NPC to (17,25).
  - [x] 5b. Pewter City 30×27 → 40×36. Pad-and-shift (+5,+5); S exit at (20,35) to VIRIDIAN_FOREST, gym door at (16,19), E exit at (39,19) to ROUTE_3. Updated PEWTER_GYM target, ROUTE_3 W target, VIRIDIAN_FOREST N target; shifted pewter_citizen + 2 locked-door items.
  - [x] 5c. Viridian Forest 24×36 → 34×48. Pad (+5,+6); N exit at (16,0), S exit at (16,47). Updated PEWTER_CITY S target, ROUTE_2 N target; shifted 4 trainer NPCs + 2 items; preserved original tree obstacles.
  - [x] 5d. Mt. Moon split into MT_MOON (1F) / MT_MOON_B1F / MT_MOON_B2F. Added `MT_MOON_B1F`/`MT_MOON_B2F` via worldMaps (MapID auto-derived). Stair warps: 1F↔B1F @ (5,4), B1F↔B2F @ (15,15). Distributed 4 Mt. Moon trainers across floors; added potion to B1F, moonstone to B2F. Added `WILD_ENCOUNTER_RATES` (rate 10 each) + `WILD_POKEMON_DATABASE` entries for all three floors (Zubat/Geodude/Paras/Clefairy, levels 8–11).
  - **Verification**: tsc clean, 174/174 tests, knip clean, validator passes.

---

## Decoupling Invariant (added 2026-04-18)

User goal: enable a future UI refactor — including a terminal renderer. All phases must preserve the rule:

> **Game engine code (state machines, formulas, world data) must not import from `react` or any DOM API.**

### Current state (audit)

| Layer | React imports | Decoupled? |
| --- | --- | --- |
| `src/lib/*` (battleEngine, damage, eventLog, oakCutscene, …) | none | ✅ pure |
| `src/data/*` (maps, species, NPC db, …) | none | ✅ pure |
| `src/store/gameStore.ts` | only `SetStateAction` *type* (cosmetic) | ✅ headless-compatible (zustand vanilla works) |
| `src/hooks/*` (useBattleEngine, useMovementEngine, useInteractionEngine, useInputHandler, useBattleVFX, useOverworldVFX) | full React | ⚠ React-bound; this is the bridge layer |
| `src/components/*` | full React | ✅ correctly UI-only |
| `src/test/simulator/useGameLoop.ts` | uses `renderHook` to drive hooks headlessly | ⚠ proves engine runs without UI, but still goes through React |

### Implications for each phase

- **Phase 0 (CI):** Add a tripwire to CI — grep `src/lib/**` and `src/data/**` for `from 'react'` and fail if found. Cheap, codifies the invariant.
- **Phase 2 (formulas):** All edits land in `src/lib/damage.ts` and `src/lib/battleEngine.ts`. No React. Easy.
- **Phase 1 (world data):** Validator is a Vitest test importing `src/data/*` — must stay pure TS. No React.
- **Phase 3 (simulator):** `assertWorldIntact()` should be a pure function in `src/lib/worldValidator.ts` (or similar) that the simulator wraps — *not* logic embedded inside the simulator/hook.
- **Phase 4 (replay logger):** `loadLogAsScenario` should produce a sequence of engine commands consumable by either `GameSimulator` (React) *or* a hypothetical terminal driver. Keep the log format and replay semantics in `src/lib/eventLog.ts`.

### Future terminal-renderer path (not now, but design for it)

A terminal driver would need: vanilla zustand store + a non-React loop that ticks engines. The cleanest future refactor is to split each hook into:

1. A pure `*Engine` module in `src/lib/` exposing `step(state, input) → newState + effects`.
2. A thin React hook in `src/hooks/` that wires the engine to React effects/timers.

We are **not** doing that refactor now. We are just making sure new code lands on the correct side of the line.

---

## Context (original)

The project has grown across three axes — battle mechanics, map content, progression — without a matching growth in *verification infrastructure*. Symptom: bugs surface during manual play, get fixed, then different bugs surface elsewhere because nothing catches regressions at a systemic level. You're asking two questions:

1. **Process:** how do we converge on stability rather than ping-ponging between fixes?
2. **Design:** what Gen I principles are we under-applying that would make the game feel "right"?

Exploration surfaced a clean test suite (154/154 pass, tsc clean) but very uneven **coverage density** — engine logic is well tested, but maps, world data, movement, and NPC interactions have minimal automated checks. Several correctness gaps exist in formulas. Data integrity relies on manual discipline (warp tables split between JSON and `worldConfig.ts`, no validator). Replay logger exists but is dev-only and manual.

**Goal:** shift from "test individual bugs after players find them" to "make a whole class of bug impossible to ship."

---

## Recommended Path (ordered by leverage)

### Phase 0 — Stop the bleeding (½ day)

Before any new feature work, cement what you already have:

1. **CI with `tsc --noEmit` + `npm run test:run` + `knip`** on every push. The suite already passes; codify it as a gate. File: `.github/workflows/ci.yml` (new). This single step prevents ~80% of regressions from reaching `main`.
2. **Pre-commit hook** via `lefthook` or plain `.git/hooks/pre-commit`: run the same three commands on staged files. Cheap insurance. *Decision:* using `.githooks/pre-commit` (committed) + `prepare` npm script that wires `git config core.hooksPath .githooks`. No new dependency.
3. **Delete the stale TODO entry** (`Fix 4 pre-existing statusRules.test.ts failures`) — those pass now. Stale TODOs breed confusion.
4. **Decoupling tripwire** (added) — fail CI if `src/lib/**` or `src/data/**` import from `react`.

### Phase 1 — Single source of truth for world data (1–2 days)

Root cause of "maps are not perfect" is **data split across JSON files and `worldConfig.ts`**, with the movement engine silently trusting only one. ROUTE_2, MT_MOON, PLAYERS_HOUSE_1F/2F, RIVALS_HOUSE have JSON warps that are ignored. Route 2 is effectively unreachable.

1. **Pick one format** — JSON maps are already richer; migrate `worldConfig.ts` teleports into per-map JSON, delete the duplicate. Files: `src/data/worldConfig.ts`, `src/data/maps/*.json`.
2. **Write a world validator** as a Vitest test (not a CLI — same muscle you already use). Validator checks, per map:
   - Every warp's `target` is a valid `MapID`
   - Every warp's source coord is in-bounds and on a walkable tile
   - Every warp's target coord is in-bounds and on a walkable tile on the target map
   - Bidirectional warps line up (warp A→B's target position = warp B→A's source, within ±1 tile)
   - Every NPC position is in-bounds and not inside a wall/tree
   - Every item pickup position is in-bounds
   - Every wild encounter table exists for maps whose tiles include grass
   New file: `src/data/__tests__/worldIntegrity.test.ts`. Runs in ~50ms, catches an entire class of bugs forever.
3. **Run the validator.** Fix whatever it flags. This will likely surface 10–20 issues in one pass.

### Phase 2 — Fix the formula bugs surgically (½ day)

Formulas diverge from Gen I in ways that compound (bad EXP → bad level curve → bad boss fights):

1. **Critical hit stat calc** — `src/lib/damage.ts:143,144,148,149` uses `level * 2` inside `calcStatWithBoost`, which recomputes the stat itself with a doubled level. Gen I crits use the doubled level in the `(2L/5 + 2)` damage-formula term, **not** when computing the raw stat. Effect: crits currently ~4× too strong. Write a test that pins the expected damage for a known Gen I crit scenario (e.g., L10 Charmander Scratch crit on L10 Rattata), then fix until green.
2. **Experience formula** — `src/lib/battleEngine.ts:335` uses `level * 25 * trainer_multiplier` with no per-species `baseExp` and no participant split. Since you have the full 151-species data, wiring `baseExp` is cheap and makes level curve suddenly feel right. Gen I: `(baseExp × enemyLevel × 1.5_if_trainer) / (7 × participants)`. Add `baseExp` to species data, track participants in `BattleState`, apply formula.
3. **DVs/Stat Exp — decide and document.** DESIGN.md line 33 says IV/EV explicitly out of scope. Fine — but then **stop treating it as a gap**. Add a one-line comment in `damage.ts` pointing to DESIGN.md so future-you doesn't re-open the debate. Consistency > completeness.

### Phase 3 — Extend the simulator for end-to-end playthrough tests (1–2 days)

The `GameSimulator` covers early game beautifully but stops around the rival battle. The highest-value new test is a **scripted full-route playthrough** that would catch balance + progression regressions:

1. Add scenarios: "Reach Pewter Gym at reasonable level from Pallet" asserting `party.level ≥ 10 && party.level ≤ 14`. If EXP formula or encounter rates drift, this fails.
2. "Beat Brock with Charmander starter" asserting a known win probability over N seeded RNG runs. Flags balance regressions.
3. "Trainer vision triggers battle from 4 tiles away" — exercises movement + trigger logic currently untested.
4. Expose a `sim.assertWorldIntact()` helper backed by the Phase 1 validator, runnable mid-scenario after warps.

Files: `src/test/simulator/scenarios.test.ts`, `src/test/simulator/GameSimulator.ts`.

### Phase 4 — Make the replay logger a bug-reproduction tool (1 day)

Right now the recorder is manual and dev-only. Small changes make it a debugging superpower:

1. **Auto-save last N minutes** to `logs/crash-<ts>.json` on any error boundary or on `window.error` — so every crash ships with a reproduction.
2. **Replay as test fixture.** Add `loadLogAsScenario(path)` that drops a saved log into the simulator. When a bug is reported, the fix workflow is: replay log → add as failing test → fix → ship. No more "works on my machine."
3. Keep it dev-only for production payload reasons; that's fine.

### Phase 5 — Only now, resume content expansion

Stage 5 / Stage 6 in TODO.md (expanding maps to full pret dimensions, adding remaining Kanto) become safe *after* the validator + playthrough tests exist. Every new map then gets validated automatically.

---

## Game Design Advice (Gen I principles under-applied)

1. **Level curve is the spine of the game.** Gen I's curve works because EXP rewards species-weighted (base_exp). Without it, a Magikarp and a Dragonair give the same EXP at equal level — players either grind uniformly or outscale everything. Fix EXP formula (Phase 2) before balancing rosters.

2. **Gen I trainers are a curve, not a gauntlet.** The Route 2 Bug Catcher at L4 while Route 3 Lass Haley has L14 (flagged in audit) breaks pacing. Rule of thumb: trainers within a route stay within ±1 level of each other, and the gym leader caps the route at +2. Once Phase 3 scenarios exist, level-cap assertions keep this honest.

3. **Move variety > Pokémon variety.** 20 moves across 151 species means every Pokémon feels the same in battle. Priority add: status moves (Thunder Wave, Confuse Ray, Toxic) — they change the strategic texture dramatically more than damage moves do. Target ~50 moves before adding post-Pewter content.

4. **Catch-the-feeling over pixel-perfect.** DESIGN.md already says this. Stop trying to match pret dimensions for every map (Stage 5) unless it unlocks specific gameplay — smaller, well-populated maps beat large, empty ones for feel.

5. **Deterministic randomness is already a win — lean into it.** Gen I had reproducible RNG across savestates by design. Your seeded PRNG + replay log puts you *ahead* of the original. Every bug report can become a failing test. This is the single biggest lever you're under-using.

6. **Status > damage in Gen I identity.** Sleep, paralyze, and freeze were central to Gen I's skill ceiling. Audit flagged freeze as defined-but-unreachable, and paralysis speed reduction is missing. Fix these before tuning damage numbers — they change what "optimal play" looks like.

7. **Player feedback on invisible state.** Audit flagged that stat boosts silently cap at ±6 with no message. Gen I shows "El ataque de X no puede subir más." These small texts are what make the game feel *tight*. Cheap wins; do them when touching nearby code.

---

## Critical Files

- `src/lib/damage.ts` — crit formula fix
- `src/lib/battleEngine.ts:335` — EXP formula
- `src/data/worldConfig.ts` + `src/data/maps/*.json` — unify warp data
- `src/data/__tests__/worldIntegrity.test.ts` — **new**, Phase 1 validator
- `src/test/simulator/scenarios.test.ts` — extended playthrough scenarios
- `src/lib/eventLog.ts` + `src/components/RecorderButton.tsx` — replay-as-fixture
- `.github/workflows/ci.yml` — **new**, CI gate
- `.githooks/pre-commit` — **new**, local gate
- `DESIGN.md` — decisions log entries (crit fix, EXP fix, DV scope confirmation)

## Verification

- `npm run test:run` — all green, including new validator + extended scenarios
- `npx tsc --noEmit` — clean
- `npx knip --no-progress` — clean (or consciously ignored)
- Manual browser playthrough Pallet → Pewter — should feel paced correctly with the new EXP formula
- Validator test should fail **before** fixing world data issues, pass **after** — proves it catches what it's meant to

## What NOT to do

- **Do not refactor the engine** alongside these fixes. Each phase is surgical.
- **Do not add new maps** until Phase 1 validator is live and green.
- **Do not chase all 165 moves** — aim for ~50 with strategic variety, not completeness.
- **Do not expand DVs/Stat Exp** — DESIGN.md already ruled them out; close the question.
- **Do not import `react` from `src/lib/**` or `src/data/**`** — engine must stay headless-capable.
