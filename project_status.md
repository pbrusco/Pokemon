# Pokémon Fire Red RPG Engine - Project Scan Summary

## 🚀 Tech Stack
- **Framework:** React 19 + TypeScript powered by Vite
- **Styling:** Tailwind CSS + UI components via Lucide React
- **Audio:** Howler.js for sound effects and background music
- **Animations:** Motion (Framer Motion)
- **AI Integration:** `@google/genai` (Google Gemini API configured via `.env.local`)

## 📂 Architecture Overview

### 1. **Core Loop & State (`src/App.tsx`)**
The application heavily relies on `App.tsx`, which serves as the primary game loop and monolithic state manager. It contains ~81KB of code managing everything from movement and collision handling to combat state and local storage persistence.

### 2. **Data Definitions (`src/types.ts` & `src/constants.ts`)**
- **Types:** Cleanly structured interfaces (`Move`, `Pokemon`, `NPC`, `Entity`, `Tile`) define the shape of game objects.
- **Maps:** Maps are fundamentally 20x20 tile grids, explicitly hardcoded in `types.ts` (e.g., `MAP_PALLET_TOWN`, `MAP_ROUTE_1`, `MAP_VIRIDIAN_FOREST`).
- **Constants:** Dictionaries holding Pokemon stats, attacks, item details, and map teleport pathways.

### 3. **UI Components (`src/components/`)**
Contains modular UI overlays distinct from the overworld rendering:
- `DialogueBox.tsx`
- `InventoryUI.tsx`
- `PCStorageUI.tsx`
- `PokedexUI.tsx`
- `TeamMenuUI.tsx`
- `ShopUI.tsx`
- `Joystick.tsx` (for mobile/touch controls)

## 🛠️ Areas Ripe for Development / Refactoring
1. **`App.tsx` Refactor:** Decoupling the massive `App.tsx` into smaller React contexts (e.g., `BattleContext`, `MapContext`, `PlayerStateContext`) would vastly improve maintainability.
2. **Map/Data Extensibility:** Migrating the hardcoded map layouts from `types.ts` into individual JSON files or standardising an import format.
3. **Sound System Enhancements:** Integrating the Howler.js sounds more deeply into battle events and interactions (`lib/sounds.ts` provides the foundation).
4. **AI/GenAI Mechanics:** The project has the Gemini SDK installed, presenting an opportunity for dynamic dialogue or procedural quests.

---
**Ready to continue!** What area would you like to focus on first?
