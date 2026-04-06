# 🌟 Pokémon Fire Red RPG Engine 🌟

**A Fully Simulated, Browser-Based Pokémon Role-Playing Game Engine.**

This project simulates the core mechanics of a classic Pokémon game (like Fire Red) within a modern React/TypeScript framework. It features a fully rendered, interactive overworld, a battle system, and persistence via local storage.

## 💡 Overview

The goal of this simulation is to provide a robust, multi-state environment for developing game logic. It encompasses:
*   **World Exploration:** Moving between distinct zones (Pallet Town, Route 1, etc.) using a tile-based grid system.
*   **Story Progression:** Managing quests, like receiving the Pokédex from Professor Oak.
*   **Combat System:** A turn-based battle engine with visual flair, handling damage, status effects, and leveling up.
*   **Management:** UI for the Pokédex, PC Storage, Inventory, and Team selection.

---

## 🚀 Setup & Execution

**Prerequisites:**
*   Node.js (Recommended: Latest LTS version)

**Installation Steps:**
1.  Navigate to the project root:
    ```bash
    cd ~/projects/poke
    ```
2.  Install all dependencies:
    ```bash
    npm install
    ```
3.  **API Key Setup (Crucial):** Create or update a `.env.local` file in the root directory and populate it with your Google Gemini API Key:
    ```dotenv
    # .env.local
    GEMINI_API_KEY="YOUR_ACTUAL_API_KEY_HERE"
    ```
4.  **Run the Game:** Start the development server:
    ```bash
    npm run dev
    ```

---

## 🗺️ Key Game Mechanics & Features

### 🕹️ 1. World Map & Movement
*   **Control:** Movement is handled via **Keyboard Arrows** (or the virtual D-pad on mobile).
*   **Collision:** The map enforces movement restrictions using defined tile types (e.g., walls, trees).
*   **Interactions:** Pressing **[A] / [Enter]** when near an object/NPC triggers interaction logic (dialogue, item discovery, etc.).
*   **Teleportation:** Transitions between major locations (e.g., Pallet Town $\to$ Oak's Lab) are handled via scripted pathways.

### ⚔️ 2. Battle System
The battle sequence is triggered by encountering a wild Pokémon or a trainer.
*   **Control:** Use the **[A] / [Enter]** button to select actions (Fight, Item, Pokémon, Run).
*   **Visuals:** Features battle animations, damage number overlays, and screen flashes for dramatic effect.
*   **Progression:** Winning battles grants EXP, allows Pokémon to level up, and triggers evolution checks.
*   **Mechanics:** Supports move types, status effects (Paralysis, Sleep), and critical hits.

### 🎒 3. State Management
*   **Persistence:** The entire game state (Player Position, Team, Inventory, Progress) is automatically saved to `localStorage` on every significant change.
*   **Components:** Dedicated UIs exist for managing the Team, Inventory, PC Storage, and the Pokédex.

---

## 📂 Directory Structure Reference

| File/Directory | Purpose | Details |
| :--- | :--- | :--- |
| `src/App.tsx` | **Main Component** | Contains the primary game loop, game state, and rendering logic. |
| `src/constants.ts` | **Data Sources** | Holds static, global data like Move definitions, Pokémon databases, and Move lists. |
| `src/types.ts` | **Data Contracts** | Defines all TypeScript interfaces (`Pokemon`, `Entity`, `Move`, etc.) used throughout the application. |
| `src/components/` | **Reusable UI** | Contains modular components like `PokedexUI.tsx`, `InventoryUI.tsx`, `DialogueBox.tsx`, etc. |
| `src/lib/` | **Utilities** | Contains helper logic, such as `sounds.ts` for sound playback management. |

---

## 🛠️ Development Notes

*   This project is complex and deeply intertwined. Future enhancements should focus on isolating state changes or refining the action handlers (`handleMove`, `handleAction`) to maintain data integrity.
*   **Bugs:** Due to its size, certain edge cases (especially around simultaneous events like a battle starting right as a teleport happens) may require further refinement.

*Developed with passion and powered by the OpenClaw assistant.*