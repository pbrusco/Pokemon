# Kanto Region Blueprint for Map Editor

This document serves as the high-level topological design for the Map Editor. The goal is to translate the classic 2D grid matrix of Kanto into our JSON-based `worldConfig.ts` schema. 

The Kanto region is comprised of a continuous "Overworld" connected via invisible route transition bounds, and numerous "Instanced Interiors" (caves, buildings) that are accessed via teleport triggers.

## 1. Overworld Topology (The Continuous Grid)

The main overworld can be thought of as a massive unified coordinate grid, divided into logical chunks. Below is the relative spatial mapping of the entire region, reading roughly clockwise originating from Pallet Town.

### The Southwestern Peninsula
*   **Pallet Town [0, 0] (Origin Anchor):**
    *   *Features:* Hero's House, Rival's House, Oak's Lab. Water boundary to the South.
    *   *Connects:* **Route 1** (North), **Route 21** (South - Water).
*   **Route 1:**
    *   *Features:* Ledges jumping South. Dense grass patches jumping North.
    *   *Connects:* **Viridian City** (North).
*   **Viridian City:**
    *   *Features:* Gym (locked initially), Pokecenter, Mart, Old Man road block.
    *   *Connects:* **Route 2** (North), **Route 22** (West).

### The Northern Mountains
*   **Route 2 & Viridian Forest:**
    *   *Features:* Route 2 is split vertically. The West side is blocked by trees (requires Cut). The East side goes through Viridian Forest (Instanced Interior). Diglett's Cave entrance on East side.
    *   *Connects:* **Pewter City** (North).
*   **Pewter City:**
    *   *Features:* Museum, Rock Gym, route blocked to East until Gym is defeated.
    *   *Connects:* **Route 3** (East).
*   **Route 3 & Route 4 (Mt. Moon Pass):**
    *   *Features:* Route 3 is a craterous ledge path leading East to Mt. Moon. Route 4 is the eastern descent with a one-way ledge drop. 
    *   *Connects:* **Cerulean City** (East).
*   **Cerulean City:**
    *   *Features:* Water Gym, Bike Shop, path blocked by cop at robbed house. Cave to the West (Cerulean Cave) blocked by an NPC until post-game.
    *   *Connects:* **Route 24/25** (North), **Route 5** (South), **Route 9** (East).

### The Central Infrastructure
*   **Route 5 & 6 (The Saffron Bypass):**
    *   *Features:* Both routes feature a central highway gate (Saffron City entrances) and an offset parallel path with an Underground Path building.
    *   *Connects:* Route 5 drops into **Saffron City** (South) or the Underground Path to Route 6. Route 6 continues to **Vermilion City** (South).
*   **Vermilion City:**
    *   *Features:* Port town. S.S. Anne docks (requires Ticket). Electric Gym (requires Cut). Pokémon Fan Club. Diglett's Cave connects back to Route 2.
    *   *Connects:* **Route 11** (East).
*   **Saffron City (The Hub):**
    *   *Features:* Massive central city. Contains Silph Co. skyscraper in the center. Two Gyms (Fighting Dojo and Psychic Gym). Four access gates blocking entry initially.
    *   *Connects:* Routes 5, 6, 7, and 8 via distinct directional gates.

### The Eastern Coast
*   **Route 9 & 10 (Rock Tunnel):**
    *   *Features:* Route 9 is a ledge maze heading East into Route 10. Route 10 possesses a river leading South to the Power Plant. Land path enters Rock Tunnel.
    *   *Connects:* **Lavender Town** (South).
*   **Lavender Town:**
    *   *Features:* No Gym. Pokémon Tower dominates the east side. Name Rater.
    *   *Connects:* **Route 8** (West), **Route 12** (South).
*   **Route 8 & 7 (The Celadon Approach):**
    *   *Features:* Separated by Saffron City gates. Route 8 connects to Lavender via grass and bikers. Connected by a secondary Underground Path. Route 7 is a short transitional grass patch.
    *   *Connects:* **Celadon City** (West).

### The Western Metropolis & South Coast
*   **Celadon City:**
    *   *Features:* Department Store, Game Corner (Rocket Hideout beneath), Grass Gym (requires Cut), Mansion (Eevee). 
    *   *Connects:* **Route 16** (West).
*   **Route 16, 17, 18 (Cycling Road):**
    *   *Features:* Requires Bicycle. Route 16 houses Snorlax. Route 17 is a massive vertical bridge dropping south. Route 18 turns eastward.
    *   *Connects:* **Fuchsia City** (East).
*   **Fuchsia City:**
    *   *Features:* Safari Zone to the North. Poison Gym with invisible walls. 
    *   *Connects:* **Route 15/14/13/12** (East maze leading back to Lavender Town), **Route 19** (South via Surf).

### The Marine Sector
*   **Route 19 & 20:**
    *   *Features:* Massive ocean routes requiring Surf. Route 20 is split in half by the Seafoam Islands.
    *   *Connects:* **Cinnabar Island** (West).
*   **Cinnabar Island:**
    *   *Features:* Volcano island. Pokémon Lab, Pokémon Mansion (burnt out, contains Gym Key), Fire Gym.
    *   *Connects:* **Route 21** (North - Water leading back up to Pallet Town).

### The Pokémon League
*   **Route 22 & 23:**
    *   *Features:* Route 22 features Rival Battle 2. Route 23 contains the 8 Badge Check gates. 
    *   *Connects:* **Victory Road** (Cave) culminating at the **Indigo Plateau**.

---

## 2. Instanced Interiors (Map Editor 'Target Maps')

When building teleports in `worldConfig`, the following multi-floor matrices must be generated separately from the overworld structure.

### Minor Buildings
*(Single Floor grids, mostly 10x10 or 20x20)*
*   Pokémon Centers (`POKECENTER_TEMPLATE`)
*   PokéMarts (`MART_TEMPLATE`)
*   Residential Houses (`HOUSE_TEMPLATE`)
*   Route Connecting Gates (`GATE_TEMPLATE`)

### Major Dungeons / Multi-Floor Complexes
These maps require careful Z-axis staircase mappings.

1.  **Viridian Forest:** Grassy maze, lots of tree tiles hiding items. (1 Map)
2.  **Mt. Moon:** 3 Floors. Brown crater tiles, climbing ladders. (3 Maps)
3.  **S.S. Anne:** 1st Floor Hall, 2nd Floor Hall, Basement Hall, Deck, Captain's Quarters, and ~12 smaller cabin rooms. (+15 Maps)
4.  **Rock Tunnel:** 2 massive floors. Requires Flash to light tiles. (2 Maps)
5.  **Pokémon Tower:** 7 unique circular floors. Ghostly fog tiles. Graves acting as collision boxes. (7 Maps)
6.  **Rocket Hideout:** 4 underground basement floors. Spinning tile puzzles. (4 Maps)
7.  **Silph Co.:** 11 Floors of high-tech office desks. Contains complex Teleporter puzzles. (11 Maps)
8.  **Pokémon Mansion:** 4 Floors (including basement). Burned wood aesthetics, burglar NPCs, and statue switches. (4 Maps)
9.  **Seafoam Islands:** 5 icy floors. Contains logic puzzles for boulder pushing. (5 Maps)
10. **Victory Road:** 3 massive floors. Final boulder pushing puzzles. (3 Maps)
11. **Cerulean Cave (Unknown Dungeon):** 3 floors, crystal/water motif. (3 Maps)

## 3. Map Editor Execution Strategy

To execute this massive undertaking in the Map Editor:
1.  **Tile Palette Configuration:** The engine needs standard texture maps applied to the Editor toolbar (`grass`, `tree`, `water`, `ledge_down`, `mountain_wall`, etc).
2.  **Overworld Stitching:** Instead of building one massive 1000x1000 array that lags the browser, we will build chunks (e.g. `PALLET_TOWN`, `ROUTE_1`) and use the `teleports` array mapped exactly to the edge tiles to invisibly swap maps as the player steps off the edge of one map boundary into the next.
3.  **Spawn Layer:** Implement an abstract logic layer in the UI to place NPC IDs and Items (x/y coordinates saved directly to `worldConfig.ts`).
