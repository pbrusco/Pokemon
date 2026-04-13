# Pokémon Red (Generation 1) Implementation Specification
## "Intended" Game Mechanics and Formulas

This document outlines the core mathematical formulas for re-implementing the mechanics of Pokémon Red/Blue. These formulas represent the **intended** logic, removing common engine glitches (such as the 1/256 miss rate or the Focus Energy bug) to ensure a smooth modern gameplay experience.

---

## 1. Damage Calculation

The damage formula is calculated using integer math. The "Intended" version ensures that critical hits and stat modifiers interact logically.

### The Formula
$$Damage = \left\lfloor \left( \frac{\left( \frac{2 \times L \times K}{5} + 2 \right) \times P \times \frac{A}{D}}{50} \right) + 2 \right\rfloor \times STAB \times Type1 \times Type2 \times \frac{R}{255}$$

### Variables
- **L**: Level of the attacking Pokémon.
- **K**: Critical Hit multiplier. Set to **2** if a critical hit occurs, **1** otherwise.
- **P**: Power of the move (e.g., Thunderbolt = 95).
- **A**: Effective Attack (or Special). Includes Stat Stages and Badge Boosts.
- **D**: Effective Defense (or Special). Includes Stat Stages.
- **STAB**: Same Type Attack Bonus. **1.5** if the move type matches the user's type, **1.0** otherwise.
- **Type1 / Type2**: Type effectiveness multipliers (0.0, 0.5, 1.0, or 2.0).
- **R**: A random integer between **217 and 255** (inclusive).

### Intended Fixes
- **Critical Hits:** Unlike the original glitch, critical hits should **not** ignore positive stat stage modifiers. They should only ignore negative modifiers applied to the attacker or positive modifiers applied to the defender.

---

## 2. Accuracy and Evasion

To avoid the "1/256 glitch" where 100% accurate moves can miss, use the following check:

1. Calculate **Probability (P)**: 
   $$P = MoveAccuracy \times \frac{AttackerAccuracyStage}{DefenderEvasionStage}$$
2. Generate a random number **R** between 1 and 100.
3. If $R \le P$, the move hits.

---

## 3. Critical Hit Probability

In Generation 1, critical hits are tied to the Pokémon's **Base Speed** stat.

- **Normal Moves:** $P_{crit} = \frac{BaseSpeed}{512}$
- **High-Crit Moves (Slash, Razor Leaf, etc.):** $P_{crit} = \frac{BaseSpeed \times 8}{512}$
- **Focus Energy (Intended):** Using Focus Energy should **double** the $P_{crit}$ (not quarter it, as it did in the original game).

---

## 4. Wild Pokémon Encounters

Encounters are checked every time the player moves into a "danger" tile (tall grass or water).

### The Encounter Check
Each area has an **Encounter Rate** (e.g., 25).
1. Generate a random number **R** (0 to 255).
2. If $R < EncounterRate$, a battle begins.
3. If a battle begins, the game selects the Pokémon species based on the area's internal encounter table (which usually sums to 100%).

---

## 5. Pokémon Catch Likelihood

The Gen 1 catch rate calculation is a multi-step process. This is the logic without the "ball miss" glitches.

### Step 1: Status Condition
Generate a random number **R1** (0-255).
- If the Pokémon is **Asleep or Frozen** and $R1 < 25$, it is caught.
- If the Pokémon is **Paralyzed, Burned, or Poisoned** and $R1 < 12$, it is caught.

### Step 2: The Catch Value (CatchV)
If Step 1 fails, calculate the Catch Value:
$$CatchV = \frac{CatchRate \times BallModifier \times (MaxHP \times 3 - CurrHP \times 2)}{MaxHP \times 3}$$

- **BallModifier:** Poké Ball = 1, Great Ball = 1.5, Ultra Ball = 2.
- **CatchRate:** A base value specific to the species (e.g., Caterpie = 255, Mewtwo = 3).

### Step 3: Final Check
Generate a random number **R2** (0-255).
- If $R2 < CatchV$, the Pokémon is caught.

---

## 6. Stat Calculation

Stats are determined by Base Stats, Individual Values (DVs), and Stat Experience.

### For HP:
$$HP = \left\lfloor \frac{(Base + DV + 50) \times 2 + \lfloor \frac{\sqrt{StatExp}}{4} \rfloor \times L}{100} \right\rfloor + 10$$

### For Other Stats (Atk, Def, Spd, Spcl):
$$Stat = \left\lfloor \frac{(Base + DV) \times 2 + \lfloor \frac{\sqrt{StatExp}}{4} \rfloor \times L}{100} \right\rfloor + 5$$

- **DV (Deterministic Value):** The Gen 1 equivalent of IVs. Range 0–15.
- **StatExp:** The Gen 1 equivalent of EVs. Range 0–65535.

---

## 7. Experience Growth Rates

Pokémon level up based on four different growth "curves":

- **Fast:** $EXP = 0.8 \times L^3$
- **Medium Fast:** $EXP = L^3$
- **Medium Slow:** $EXP = 1.2 \times L^3 - 15 \times L^2 + 100 \times L - 140$
- **Slow:** $EXP = 1.25 \times L^3$
