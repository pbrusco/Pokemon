# Technical Specification: Pallet Town (Pokémon Fire Red Clone)

This document provides a structured data set and logic flow for the first town of the game. It is designed to be parsed by an LLM to generate game code, state machines, and map layouts.

---

## 1. Global Map Environment
* **Boundaries:** * **North:** Exit to Route 1 (Trigger-locked until Pokémon is obtained).
    * **South:** Water edge (Impassable without "Surf" move).
    * **East/West:** Fences and trees (Hard collision).

---

## 2. Building & Interior Data

### Building A: Red’s House (Player’s Home)
* **Structure:** 2 Floors.
* **2F (Bedroom) Logic:**
    * **Player Spawn Point:** Center of the room.
    * **Interactable - SNES:** Text: *"Red is playing the SNES! ...Okay! It's time to go!"*
    * **Interactable - PC:** Open "Item Storage" menu. Contains 1x **Potion**.
* **1F (Living Room) Logic:**
    * **NPC - Mom:** * *Pre-Starter:* *"All boys leave home some day. It said so on TV."*
        * *Post-Starter:* Fully heals the party and displays: *"Red! You should take a quick rest."*

### Building B: Blue’s House (Rival’s Home)
* **NPC - Daisy:** * *Initial:* *"Hi Red! Blue is out at Grandpas lab."*
        * *Post-Oak's Parcel:* Gives **Town Map** item.

### Building C: Professor Oak’s Lab
* **Interactions:**
    * **Table:** Contains 3 Pokéballs (Bulbasaur, Charmander, Squirtle).
    * **NPC - Scientists:** Provide flavor text about Pokémon research.
    * **NPC - Rival (Blue):** Waits at the table until the player chooses a starter.

---

## 3. Game State & Scripted Events

### Event 1: The Grass Interception
* **Trigger:** Player enters any tile in the North exit row (y = 19) while `has_pokemon == false`.
* **Action:**
    1.  Movement input disabled.
    2.  Oak NPC spawns and walks to the Player.
    3.  Dialogue: *"Hey! Wait! Don't go out!"*
    4.  Cutscene: Player and Oak move automatically to the Lab.

### Event 2: Choosing the Starter
* **Selection Logic:**
    * **If Player picks Bulbasaur:** Rival picks Charmander.
    * **If Player picks Charmander:** Rival picks Squirtle.
    * **If Player picks Squirtle:** Rival picks Bulbasaur.
* **State Update:** Set `has_pokemon = true`.

### Event 3: The First Rival Battle
* **Trigger:** Player attempts to walk toward the exit of the Lab after picking a starter.
* **Logic:**
    * **Rival Dialogue:** *"Wait Red! Let's check out our Pokémon!"*
    * **Combat Init:** Red (Lv. 5) vs. Blue (Lv. 5).
    * **Win Condition:** Award $175 and Level 6 XP.
    * **Loss Condition:** Respawn at Red’s House 1F (Mom heals).

---

## 4. NPC & World Interaction Table

| Entity | Type | Logic / Dialogue |
| :--- | :--- | :--- |
| **Town Sign** | Static Object | "Pallet Town: Shades of your journey await!" |
| **Fat Man NPC** | Roaming | "Technology is incredible! You can now store items and Pokémon as data via PC!" |
| **Lab Sign** | Static Object | "Oak Pokémon Research Laboratory" |
| **Mailbox** | Static Object | "Red's House" / "Blue's House" |

---

## 5. Technical Constraints for LLM Implementation

1.  **Movement:** Implementation must be tile-based. Input (Up/Down/Left/Right) moves the player exactly 1 tile.
2.  **Collision:** Check the `collision_layer` before every movement step. 
3.  **Layering:** Player sprite must render above the floor layer but below building "overhangs" (roofs).
4.  **State Persistence:** Ensure the `game_stage` variable is checked before loading NPC dialogue to prevent event repetition.