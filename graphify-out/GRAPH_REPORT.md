# Graph Report - .  (2026-05-08)

## Corpus Check
- 123 files · ~248,570 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 833 nodes · 903 edges · 103 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 136 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Battle UI & Overworld Components|Battle UI & Overworld Components]]
- [[_COMMUNITY_Frame Loop & Process Pipeline|Frame Loop & Process Pipeline]]
- [[_COMMUNITY_Pokemon Stats & FireRed Bridge Helpers|Pokemon Stats & FireRed Bridge Helpers]]
- [[_COMMUNITY_Logging & Replay System|Logging & Replay System]]
- [[_COMMUNITY_Game Simulator (test harness)|Game Simulator (test harness)]]
- [[_COMMUNITY_3D HUD & Items Data|3D HUD & Items Data]]
- [[_COMMUNITY_Auto-Entity Builders (NPCItemTrainer)|Auto-Entity Builders (NPC/Item/Trainer)]]
- [[_COMMUNITY_FireRed Pipeline Extraction|FireRed Pipeline Extraction]]
- [[_COMMUNITY_FireRed Generated Constants|FireRed Generated Constants]]
- [[_COMMUNITY_PNG  Tileset Decoder|PNG / Tileset Decoder]]
- [[_COMMUNITY_Engine Hooks Coordination|Engine Hooks Coordination]]
- [[_COMMUNITY_Battle Launch Pipeline|Battle Launch Pipeline]]
- [[_COMMUNITY_Phase FSM Types|Phase FSM Types]]
- [[_COMMUNITY_App Root Handlers|App Root Handlers]]
- [[_COMMUNITY_Battle Engine Core|Battle Engine Core]]
- [[_COMMUNITY_Battle Outcome & Cinematics|Battle Outcome & Cinematics]]
- [[_COMMUNITY_Pokemon  Move Constants|Pokemon / Move Constants]]
- [[_COMMUNITY_Tile Behavior Mappings|Tile Behavior Mappings]]
- [[_COMMUNITY_3D Texture Generation|3D Texture Generation]]
- [[_COMMUNITY_FireRed Build Scripts|FireRed Build Scripts]]
- [[_COMMUNITY_Cutscene DSL|Cutscene DSL]]
- [[_COMMUNITY_Overworld Stitching|Overworld Stitching]]
- [[_COMMUNITY_Game Data Extraction|Game Data Extraction]]
- [[_COMMUNITY_Interaction & Movement|Interaction & Movement]]
- [[_COMMUNITY_Battle UI Pieces|Battle UI Pieces]]
- [[_COMMUNITY_Music Selection by Map|Music Selection by Map]]
- [[_COMMUNITY_Map  Warp Registry|Map / Warp Registry]]
- [[_COMMUNITY_Music Mapping Tables|Music Mapping Tables]]
- [[_COMMUNITY_FireRedRuntime Decoupling Tests|FireRed/Runtime Decoupling Tests]]
- [[_COMMUNITY_Tileset Loader & Caches|Tileset Loader & Caches]]
- [[_COMMUNITY_Team Menu Helpers|Team Menu Helpers]]
- [[_COMMUNITY_Audio Playback|Audio Playback]]
- [[_COMMUNITY_Indoor Map Generator|Indoor Map Generator]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 118|Community 118]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 122|Community 122]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 125|Community 125]]
- [[_COMMUNITY_Community 126|Community 126]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 128|Community 128]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 130|Community 130]]
- [[_COMMUNITY_Community 131|Community 131]]
- [[_COMMUNITY_Community 132|Community 132]]
- [[_COMMUNITY_Community 133|Community 133]]
- [[_COMMUNITY_Community 134|Community 134]]
- [[_COMMUNITY_Community 135|Community 135]]
- [[_COMMUNITY_Community 136|Community 136]]
- [[_COMMUNITY_Community 137|Community 137]]
- [[_COMMUNITY_Community 138|Community 138]]
- [[_COMMUNITY_Community 140|Community 140]]
- [[_COMMUNITY_Community 141|Community 141]]
- [[_COMMUNITY_Community 142|Community 142]]
- [[_COMMUNITY_Community 143|Community 143]]
- [[_COMMUNITY_Community 144|Community 144]]
- [[_COMMUNITY_Community 145|Community 145]]
- [[_COMMUNITY_Community 146|Community 146]]
- [[_COMMUNITY_Community 148|Community 148]]
- [[_COMMUNITY_Community 149|Community 149]]
- [[_COMMUNITY_Community 150|Community 150]]
- [[_COMMUNITY_Community 151|Community 151]]
- [[_COMMUNITY_Community 152|Community 152]]
- [[_COMMUNITY_Community 153|Community 153]]
- [[_COMMUNITY_Community 154|Community 154]]
- [[_COMMUNITY_Community 155|Community 155]]
- [[_COMMUNITY_Community 156|Community 156]]
- [[_COMMUNITY_Community 157|Community 157]]
- [[_COMMUNITY_Community 158|Community 158]]
- [[_COMMUNITY_Community 159|Community 159]]
- [[_COMMUNITY_Community 160|Community 160]]
- [[_COMMUNITY_Community 161|Community 161]]
- [[_COMMUNITY_Community 162|Community 162]]
- [[_COMMUNITY_Community 163|Community 163]]
- [[_COMMUNITY_Community 164|Community 164]]
- [[_COMMUNITY_Community 165|Community 165]]
- [[_COMMUNITY_Community 166|Community 166]]
- [[_COMMUNITY_Community 167|Community 167]]
- [[_COMMUNITY_Community 168|Community 168]]
- [[_COMMUNITY_Community 169|Community 169]]
- [[_COMMUNITY_Community 170|Community 170]]
- [[_COMMUNITY_Community 171|Community 171]]

## God Nodes (most connected - your core abstractions)
1. `GameSimulator` - 38 edges
2. `GameModals` - 27 edges
3. `stepBattle` - 13 edges
4. `stepBattle()` - 12 edges
5. `makePokemon()` - 10 edges
6. `useGameStore (Zustand)` - 10 edges
7. `cachedTexture()` - 9 edges
8. `processNext()` - 9 edges
9. `useGameStore` - 9 edges
10. `useGameStore` - 9 edges

## Surprising Connections (you probably didn't know these)
- `MoveMenu (incl. Forcejeo)` --implements--> `PP Tracking + Struggle`  [INFERRED]
  src/components/BattleScreen.tsx → docs/game-mechanics.md
- `DPad on-screen movement controller` --implements--> `Game Controls (Keyboard / Mobile)`  [INFERRED]
  src/components/DPad.tsx → docs/gameplay.md
- `Phase 1: Pipeline Metatile Bridge Refinement` --references--> `resolveBehaviorGrid()`  [INFERRED]
  docs/missing_abilities_plan.md → scripts/build-firered-pipeline.mjs
- `Phase 1: Pipeline Metatile Bridge Refinement` --references--> `Tile interface (type/walkable/blockFrom)`  [INFERRED]
  docs/missing_abilities_plan.md → src/types.ts
- `Phase 2: HM Teaching Flow` --implements--> `handleApplyItemToPokemon (HM teaching)`  [INFERRED]
  docs/missing_abilities_plan.md → src/App.tsx

## Hyperedges (group relationships)
- **FireRed Build-Time Data Pipeline (predev/prebuild)** — buildfireredpipeline_main, extractgamedata_main, generateindoormaps_main, stitchfireredoverworld_main, buildfireredpipeline_artifact_maps [EXTRACTED 0.95]
- **HM teaching + field-move usage flow** — app_handleapplyitemtopokemon, app_handlehmforget, app_handlefieldmove, app_handleflyselect, missing_abilities_phase2_hm_teaching [INFERRED 0.85]
- **Battle visual stack (transition + cinematic + screen)** — battletransition_component, cinematicpanel_component, battlescreen_component, stateandfsm_battle_subphase [INFERRED 0.85]
- **GameModals as central UI dispatcher for game phases** —  [INFERRED 0.90]
- **Overworld rendering pipeline (camera-relative tile/NPC rendering)** —  [INFERRED 0.90]
- **Fly HM field move flow: SideMenu/Summary → FlyTownSelect → FlyAnimation → arrive (warp)** —  [INFERRED 0.85]
- **** — mapmesh3d_buildbuckets, tile_to_voxel, tile_textures_get [INFERRED 0.85]
- **** — world_view_3d, scene3d_component, hud3d_component [EXTRACTED 1.00]
- **** — npc_db_build, npc_db_merge_auto, npc_db_w [EXTRACTED 1.00]
- **** — pokemon_make, pokemon_base_stats, moves_db [EXTRACTED 1.00]
- **** — useBattleEngine_hook, useBattleVFX_hook, useBattleEngine_playBattleEffects [INFERRED 0.90]
- **** — runtime_buildAutoEntities, firedNpcs_FIRERED_NPCS, firedDialogue_NPC_OVERRIDES [EXTRACTED 1.00]
- **** — useMovementEngine_handleMove, launchBattle, WILD_POKEMON_DATABASE [EXTRACTED 1.00]
- **** — useInputHandler_hook, useMovementEngine_handleMove, useInteractionEngine_handleAction [EXTRACTED 1.00]
- **** — maps_index, indoorMaps_FIRERED_INDOOR_MAPS, maps_worldMaps [EXTRACTED 1.00]
- **** — useMusicEngine_getOverworldMusic, useMusicEngine_FIRERED_MUS_TO_TRACK, useMusicEngine_ZONE_MUSIC [EXTRACTED 1.00]
- **** — battleengine_stepbattle, damage_calculatedamage, damage_doesmovehit [EXTRACTED 1.00]
- **** — damage_calcstatwithboost, damage_calcstat, damage_getstagemultiplier [EXTRACTED 1.00]
- **** — battleengine_computeexpandlevelup, damage_calchp, battleengine_stepbattle [EXTRACTED 1.00]
- **** — oakcutscene_triggeroakcutscene, cutscenes_runner_runcutscene, launchbattle_fn [INFERRED 0.85]
- **** — eventlog_startrecord, eventlog_prng_mulberry32, eventlog_replay [EXTRACTED 1.00]
- **FireRed bridge layer (collision/behavior + warp resolution)** —  [INFERRED 0.90]
- **Headless game simulator stack** —  [EXTRACTED 1.00]
- **GamePhase FSM (top-level + battle sub-FSM + helpers)** —  [EXTRACTED 1.00]

## Communities

### Community 0 - "Battle UI & Overworld Components"
Cohesion: 0.06
Nodes (48): BattleAction (battleEngine), BattleScreen, BattleScreen.integration.test, BattleTransition, CameraRig, ConfigPanel, DialogueBox, DPad on-screen movement controller (+40 more)

### Community 1 - "Frame Loop & Process Pipeline"
Cohesion: 0.06
Nodes (40): computeExpAndLevelUp, battleEngine module, run(), processBattle(), processNext(), processNpcWalk(), processWalk(), runCutscene() (+32 more)

### Community 2 - "Pokemon Stats & FireRed Bridge Helpers"
Cohesion: 0.07
Nodes (29): baseExpFor(), expForLevel(), getSprite(), makePokemon(), tileFromBehavior(), bridgeFireredLayout(), fromFirered(), bridgeStitchedKanto() (+21 more)

### Community 3 - "Logging & Replay System"
Cohesion: 0.11
Nodes (25): save(), start(), stop(), apply(), cancelReplay(), downloadLog(), exportLog(), installPRNG() (+17 more)

### Community 4 - "Game Simulator (test harness)"
Cohesion: 0.07
Nodes (2): setGameSpeed(), GameSimulator

### Community 5 - "3D HUD & Items Data"
Cohesion: 0.09
Nodes (29): getAmbienceFromMap, getCompassDir, Hud3D, ItemBillboard, ITEM_COLORS, SignPost, ITEMS_DATABASE, SHOP_PRICES (+21 more)

### Community 6 - "Auto-Entity Builders (NPC/Item/Trainer)"
Cohesion: 0.13
Nodes (22): buildItemDatabase(), buildNPCDatabase(), mergeAuto(), w(), buildAutoEntities(), buildAutoWildEncounters(), buildEncountersForTable(), buildTrainerTeam() (+14 more)

### Community 7 - "FireRed Pipeline Extraction"
Cohesion: 0.09
Nodes (25): artifact: src/artifacts/firered/maps/<layout>.json, artifact: src/artifacts/firered/tilesets/<slug>/, extractLayout(), extractTileset(), build-firered-pipeline.mjs entrypoint, parseMapBin() collision/elevation decoder, resolveBehaviorGrid(), FireredKantoPreview (?firered=KANTO) (+17 more)

### Community 8 - "FireRed Generated Constants"
Cohesion: 0.08
Nodes (20): NPC_OVERRIDES, FIRERED_NPCS, FIRERED_SIGNS, FIRERED_SPECIES, FIRERED_TRAINERS, FIRERED_TRAINER_PARTIES, FIRERED_WILD_ENCOUNTERS, KANTO_FIRERED_ZONE_OFFSETS (+12 more)

### Community 9 - "PNG / Tileset Decoder"
Cohesion: 0.17
Nodes (19): decodePngIndices(), decodePngToIndices(), decompressZlib(), drawTileToImageData(), findGlob(), getMetatileBitmap(), loadTileset(), paeth() (+11 more)

### Community 10 - "Engine Hooks Coordination"
Cohesion: 0.1
Nodes (8): mapEnginePhase(), useBattleEngine(), useInteractionEngine(), applyOverworldPoison(), useMovementEngine(), useGameLoop(), setup(), battle()

### Community 11 - "Battle Launch Pipeline"
Cohesion: 0.13
Nodes (15): getTrainerBattleSprite(), triggerBattle(), createBattleState(), logObservation(), launchBattle(), getExpLog(), getLogs(), makeMove() (+7 more)

### Community 12 - "Phase FSM Types"
Cohesion: 0.1
Nodes (21): B_CHOOSING constant, battle() helper, BattlePhase (sub-FSM), GamePhase (top-level FSM), GameSimulator.assertWorldIntact, GameSimulator class, GameSimulator.init, GameSimulator.skipBattleTransition (+13 more)

### Community 13 - "App Root Handlers"
Cohesion: 0.11
Nodes (20): App: battle restore-from-store useEffect, App() root component, handleApplyItemToPokemon (HM teaching), handleFieldMove (Surf/Fly/Flash), handleFlySelect, handleHMForget, handlePCSwap, handleUseItem (+12 more)

### Community 14 - "Battle Engine Core"
Cohesion: 0.13
Nodes (20): applyStatChange, BattleState, clearBoosts, createBattleState, selectTrainerMove, stepBattle, battleEngine.test, calcStat (+12 more)

### Community 15 - "Battle Outcome & Cinematics"
Cohesion: 0.11
Nodes (11): dispatchBattle(), handleCatchAction(), useBattleEngine(), playBattleEffects(), CINEMATIC_DURATION_MS, CinematicEvent (type), giveDemoTeam(), useDebugAPI() (+3 more)

### Community 16 - "Pokemon / Move Constants"
Cohesion: 0.15
Nodes (17): MOVES, moveHelper, buildNPCDatabase, buildItemDatabase, mergeAuto, w(zone,lx,ly), BASE_STATS, EVOLUTIONS (+9 more)

### Community 17 - "Tile Behavior Mappings"
Cohesion: 0.15
Nodes (15): DOOR_BEHAVIORS, ENCOUNTER_BEHAVIORS, IMPASSABLE_DIRECTIONAL, LEDGE_BEHAVIORS, SIGN_BEHAVIORS, tileFromBehavior, WALL constant, WARP_PAD_BEHAVIORS (+7 more)

### Community 18 - "3D Texture Generation"
Cohesion: 0.26
Nodes (9): cachedTexture(), makeCanopyTexture(), makeCarpetTexture(), makeFloorTexture(), makeGrassTexture(), makePathTexture(), makeTrunkTexture(), makeWallTexture() (+1 more)

### Community 19 - "FireRed Build Scripts"
Cohesion: 0.27
Nodes (11): extractLayout(), extractTileset(), findTilesetDir(), loadAttrsForTileset(), loadPalettes(), parseAttrs(), parseMapBin(), parseMetatiles() (+3 more)

### Community 20 - "Cutscene DSL"
Cohesion: 0.24
Nodes (11): BattleStep, CutsceneStep DSL, DialogueStep, NpcAppearStep, NpcWalkStep, runCutscene (cutscene runner), WalkStep, WarpStep (+3 more)

### Community 21 - "Overworld Stitching"
Cohesion: 0.29
Nodes (7): buildBuckets(), buildBehaviorGrid(), buildZone(), isOutdoor(), loadAttrs(), place(), tilesetSlug()

### Community 22 - "Game Data Extraction"
Cohesion: 0.22
Nodes (6): artifact: firedNpcs.generated.ts, artifact: firedTrainers.generated.ts, extractNpcs(scriptToTrainer), extractTrainers(), extractTrainerScripts(), extract-game-data.mjs entrypoint

### Community 23 - "Interaction & Movement"
Cohesion: 0.28
Nodes (7): handleAction(), useInteractionEngine(), applyOverworldPoison(), getValidTeleportLocation(), handleMove(), useMovementEngine(), initBattle()

### Community 24 - "Battle UI Pieces"
Cohesion: 0.25
Nodes (8): BattleScreen component, MoveMenu (incl. Forcejeo), PokeballAnim (catch animation), getTerrainFromMap / getArenaStyle, CinematicPanel battle intro, Critical Hit Probability, Battle System (engine + hook), PP Tracking + Struggle

### Community 27 - "Music Selection by Map"
Cohesion: 0.33
Nodes (3): getKantoRegion(), fireredMusicForMap(), getOverworldMusic()

### Community 28 - "Map / Warp Registry"
Cohesion: 0.29
Nodes (5): FIRERED_INDOOR_MAPS, MAP_KANTO_OVERWORLD, data/maps/index.ts, worldMaps, outdoorWarpsByTarget (Map)

### Community 29 - "Music Mapping Tables"
Cohesion: 0.29
Nodes (6): FIRERED_MUS_TO_TRACK, INTERIOR_MUSIC, ZONE_MUSIC, fireredMusicForMap(), getOverworldMusic(), useMusicEngine()

### Community 30 - "FireRed/Runtime Decoupling Tests"
Cohesion: 0.29
Nodes (7): firered/bridge.ts, include/fieldmap.h (NUM_TILES_IN_PRIMARY), pret/pokefirered disassembly (canonical source), DOM_GLOBALS_ALLOWLIST, test/decoupling.test.ts, firered/multiZoneBridge.ts, firered/tilesetLoader.ts

### Community 31 - "Tileset Loader & Caches"
Cohesion: 0.29
Nodes (7): src/fieldmap.c LoadTilesetPalette, decodePngIndices (mini PNG decoder), drawTileToImageData, getMetatileBitmap, loadTileset, metatileCache (ImageBitmap cache), tilesetCache (per-label assets)

### Community 32 - "Team Menu Helpers"
Cohesion: 0.4
Nodes (3): canSelect(), handleSelect(), applyItemToPokemon()

### Community 33 - "Audio Playback"
Cohesion: 0.47
Nodes (3): createAudio(), getAudioElement(), resolvePath()

### Community 35 - "Indoor Map Generator"
Cohesion: 0.6
Nodes (3): loadAttrs(), resolveBehaviorGrid(), tilesetSlug()

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (2): cssFrame(), getSpriteFrame()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (3): Blackout Flow, Overworld Poison Logic, Status Effects Reference

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (3): ensureUid helper, setPlayerTeam (with ensureUid), syncTeamStats

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (2): Damage Calculation Formula (Gen I), Damage Formula Implementation

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (2): Experience Growth Rates, Leveling and Evolution Rules

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (2): Pokemon Catch Likelihood (Gen I), Catch Rate Implementation

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (2): Move interface, Pokemon interface

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (2): Entity interface, NPC interface

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (2): HM_MOVE_MAP, HM_REQUIREMENTS

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (2): WILD_ENCOUNTER_RATES, WILD_POKEMON_DATABASE

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (2): getKantoRegion, KANTO_ZONE_OFFSETS

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (2): cssFrame, getSpriteFrame

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (2): FireredParsedMap interface, MultiZoneFireredMap

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (2): GameSaveState interface, GameState interface

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (2): GameSimulator.loadLogAsScenario, GameSimulator.seedPrng (mulberry32)

### Community 79 - "Community 79"
Cohesion: 1.0
Nodes (2): firered/behaviorMappings.ts, include/constants/metatile_behaviors.h

### Community 116 - "Community 116"
Cohesion: 1.0
Nodes (1): Accuracy and Evasion

### Community 117 - "Community 117"
Cohesion: 1.0
Nodes (1): Wild Pokemon Encounters Formula

### Community 118 - "Community 118"
Cohesion: 1.0
Nodes (1): Stat Calculation (DV+StatExp)

### Community 119 - "Community 119"
Cohesion: 1.0
Nodes (1): Type Effectiveness Chart

### Community 120 - "Community 120"
Cohesion: 1.0
Nodes (1): Movement System Description

### Community 121 - "Community 121"
Cohesion: 1.0
Nodes (1): Sound System (soundManager)

### Community 122 - "Community 122"
Cohesion: 1.0
Nodes (1): Phase 7: Strength Item Placement

### Community 123 - "Community 123"
Cohesion: 1.0
Nodes (1): Phase 8: Waterfall HM (post-game)

### Community 124 - "Community 124"
Cohesion: 1.0
Nodes (1): TILE_SIZE constant (=64)

### Community 125 - "Community 125"
Cohesion: 1.0
Nodes (1): BattleTransition wipe component

### Community 126 - "Community 126"
Cohesion: 1.0
Nodes (1): ConfigPanel UI

### Community 127 - "Community 127"
Cohesion: 1.0
Nodes (1): DialogueBox (typewriter + confirm)

### Community 128 - "Community 128"
Cohesion: 1.0
Nodes (1): WATER_WILD_POKEMON_DATABASE

### Community 129 - "Community 129"
Cohesion: 1.0
Nodes (1): PLAYER_OVERWORLD_SPRITE

### Community 130 - "Community 130"
Cohesion: 1.0
Nodes (1): CENTER_MAPS

### Community 131 - "Community 131"
Cohesion: 1.0
Nodes (1): MART_MAPS

### Community 132 - "Community 132"
Cohesion: 1.0
Nodes (1): NpcOverride (interface)

### Community 133 - "Community 133"
Cohesion: 1.0
Nodes (1): FIRERED_ITEMS

### Community 134 - "Community 134"
Cohesion: 1.0
Nodes (1): FireredItem (interface)

### Community 135 - "Community 135"
Cohesion: 1.0
Nodes (1): FireredNpc (interface)

### Community 136 - "Community 136"
Cohesion: 1.0
Nodes (1): FireredSign (interface)

### Community 137 - "Community 137"
Cohesion: 1.0
Nodes (1): FireredTrainer (interface)

### Community 138 - "Community 138"
Cohesion: 1.0
Nodes (1): outdoorEntryByTarget

### Community 140 - "Community 140"
Cohesion: 1.0
Nodes (1): MetatileCache (interface)

### Community 141 - "Community 141"
Cohesion: 1.0
Nodes (1): useWindowSize

### Community 142 - "Community 142"
Cohesion: 1.0
Nodes (1): BattleAction

### Community 143 - "Community 143"
Cohesion: 1.0
Nodes (1): logEvent

### Community 144 - "Community 144"
Cohesion: 1.0
Nodes (1): setGameSpeed

### Community 145 - "Community 145"
Cohesion: 1.0
Nodes (1): sdur (scale seconds)

### Community 146 - "Community 146"
Cohesion: 1.0
Nodes (1): fullHeal

### Community 148 - "Community 148"
Cohesion: 1.0
Nodes (1): cutscenes/types.ts

### Community 149 - "Community 149"
Cohesion: 1.0
Nodes (1): FireredLayoutJson interface

### Community 150 - "Community 150"
Cohesion: 1.0
Nodes (1): StitchedDescriptor

### Community 151 - "Community 151"
Cohesion: 1.0
Nodes (1): store/gameStore.ts

### Community 152 - "Community 152"
Cohesion: 1.0
Nodes (1): reorderTeam

### Community 153 - "Community 153"
Cohesion: 1.0
Nodes (1): setDialogue

### Community 154 - "Community 154"
Cohesion: 1.0
Nodes (1): setConfirm (yes/no modal)

### Community 155 - "Community 155"
Cohesion: 1.0
Nodes (1): addInventoryItem

### Community 156 - "Community 156"
Cohesion: 1.0
Nodes (1): removeInventoryItem

### Community 157 - "Community 157"
Cohesion: 1.0
Nodes (1): updatePokedex

### Community 158 - "Community 158"
Cohesion: 1.0
Nodes (1): setModifiedTile

### Community 159 - "Community 159"
Cohesion: 1.0
Nodes (1): test/setup.ts

### Community 160 - "Community 160"
Cohesion: 1.0
Nodes (1): test/simulator/GameSimulator.ts

### Community 161 - "Community 161"
Cohesion: 1.0
Nodes (1): GameSimulator.destroy

### Community 162 - "Community 162"
Cohesion: 1.0
Nodes (1): GameSimulator.phaseHistory

### Community 163 - "Community 163"
Cohesion: 1.0
Nodes (1): Scenario 5-6: Mom heals

### Community 164 - "Community 164"
Cohesion: 1.0
Nodes (1): Scenario 7: Wild encounter

### Community 165 - "Community 165"
Cohesion: 1.0
Nodes (1): Scenario 8-9: Parcel/Pokedex

### Community 166 - "Community 166"
Cohesion: 1.0
Nodes (1): Scenario 10: Pokeball blocked in trainer battle

### Community 167 - "Community 167"
Cohesion: 1.0
Nodes (1): Scenario 11: Pokecenter heal

### Community 168 - "Community 168"
Cohesion: 1.0
Nodes (1): Scenario 14: Brock leader battle

### Community 169 - "Community 169"
Cohesion: 1.0
Nodes (1): test/simulator/useGameLoop.ts

### Community 170 - "Community 170"
Cohesion: 1.0
Nodes (1): types/gamePhase.ts

### Community 171 - "Community 171"
Cohesion: 1.0
Nodes (1): EXPLORING constant

## Knowledge Gaps
- **216 isolated node(s):** `Damage Calculation Formula (Gen I)`, `Critical Hit Probability`, `Accuracy and Evasion`, `Wild Pokemon Encounters Formula`, `Pokemon Catch Likelihood (Gen I)` (+211 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Game Simulator (test harness)`** (36 nodes): `setGameSpeed()`, `GameSimulator`, `.badges()`, `.battleAction()`, `.battleLog()`, `.battleState()`, `.confirmNo()`, `.confirmYes()`, `.destroy()`, `.dialogue()`, `.dialogueContains()`, `.direction()`, `.dismissDialogue()`, `.enemyPokemon()`, `.eventsOfType()`, `.face()`, `.flushTimers()`, `.hasParcel()`, `.hasPokedex()`, `.init()`, `.interact()`, `.inventory()`, `.loadLogAsScenario()`, `.money()`, `.move()`, `.phase()`, `.pos()`, `.seedPrng()`, `.setNextRandom()`, `.setRandomSequence()`, `.skipBattleTransition()`, `.state()`, `.storyStep()`, `.team()`, `.tick()`, `GameSimulator.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (3 nodes): `cssFrame()`, `getSpriteFrame()`, `spriteFormat.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (2 nodes): `Damage Calculation Formula (Gen I)`, `Damage Formula Implementation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (2 nodes): `Experience Growth Rates`, `Leveling and Evolution Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (2 nodes): `Pokemon Catch Likelihood (Gen I)`, `Catch Rate Implementation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (2 nodes): `Move interface`, `Pokemon interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (2 nodes): `Entity interface`, `NPC interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (2 nodes): `HM_MOVE_MAP`, `HM_REQUIREMENTS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (2 nodes): `WILD_ENCOUNTER_RATES`, `WILD_POKEMON_DATABASE`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (2 nodes): `getKantoRegion`, `KANTO_ZONE_OFFSETS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (2 nodes): `cssFrame`, `getSpriteFrame`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (2 nodes): `FireredParsedMap interface`, `MultiZoneFireredMap`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (2 nodes): `GameSaveState interface`, `GameState interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (2 nodes): `GameSimulator.loadLogAsScenario`, `GameSimulator.seedPrng (mulberry32)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (2 nodes): `firered/behaviorMappings.ts`, `include/constants/metatile_behaviors.h`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (1 nodes): `Accuracy and Evasion`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (1 nodes): `Wild Pokemon Encounters Formula`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (1 nodes): `Stat Calculation (DV+StatExp)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (1 nodes): `Type Effectiveness Chart`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (1 nodes): `Movement System Description`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 121`** (1 nodes): `Sound System (soundManager)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 122`** (1 nodes): `Phase 7: Strength Item Placement`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (1 nodes): `Phase 8: Waterfall HM (post-game)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (1 nodes): `TILE_SIZE constant (=64)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (1 nodes): `BattleTransition wipe component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `ConfigPanel UI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (1 nodes): `DialogueBox (typewriter + confirm)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `WATER_WILD_POKEMON_DATABASE`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (1 nodes): `PLAYER_OVERWORLD_SPRITE`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `CENTER_MAPS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `MART_MAPS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `NpcOverride (interface)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 133`** (1 nodes): `FIRERED_ITEMS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 134`** (1 nodes): `FireredItem (interface)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (1 nodes): `FireredNpc (interface)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (1 nodes): `FireredSign (interface)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (1 nodes): `FireredTrainer (interface)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 138`** (1 nodes): `outdoorEntryByTarget`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 140`** (1 nodes): `MetatileCache (interface)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (1 nodes): `useWindowSize`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 142`** (1 nodes): `BattleAction`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (1 nodes): `logEvent`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (1 nodes): `setGameSpeed`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 145`** (1 nodes): `sdur (scale seconds)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (1 nodes): `fullHeal`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (1 nodes): `cutscenes/types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (1 nodes): `FireredLayoutJson interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (1 nodes): `StitchedDescriptor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (1 nodes): `store/gameStore.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (1 nodes): `reorderTeam`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (1 nodes): `setDialogue`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (1 nodes): `setConfirm (yes/no modal)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (1 nodes): `addInventoryItem`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (1 nodes): `removeInventoryItem`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 157`** (1 nodes): `updatePokedex`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 158`** (1 nodes): `setModifiedTile`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 159`** (1 nodes): `test/setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 160`** (1 nodes): `test/simulator/GameSimulator.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 161`** (1 nodes): `GameSimulator.destroy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 162`** (1 nodes): `GameSimulator.phaseHistory`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 163`** (1 nodes): `Scenario 5-6: Mom heals`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 164`** (1 nodes): `Scenario 7: Wild encounter`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 165`** (1 nodes): `Scenario 8-9: Parcel/Pokedex`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 166`** (1 nodes): `Scenario 10: Pokeball blocked in trainer battle`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 167`** (1 nodes): `Scenario 11: Pokecenter heal`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 168`** (1 nodes): `Scenario 14: Brock leader battle`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 169`** (1 nodes): `test/simulator/useGameLoop.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 170`** (1 nodes): `types/gamePhase.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 171`** (1 nodes): `EXPLORING constant`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `launchBattle()` connect `Battle Launch Pipeline` to `Frame Loop & Process Pipeline`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `GameSimulator` connect `Game Simulator (test harness)` to `Pokemon Stats & FireRed Bridge Helpers`, `Logging & Replay System`, `Auto-Entity Builders (NPC/Item/Trainer)`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `createBattleState()` connect `Battle Launch Pipeline` to `Pokemon Stats & FireRed Bridge Helpers`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `stepBattle()` (e.g. with `.map()` and `doesMoveHit()`) actually correct?**
  _`stepBattle()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `makePokemon()` (e.g. with `strongStarter()` and `calcHp()`) actually correct?**
  _`makePokemon()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Damage Calculation Formula (Gen I)`, `Critical Hit Probability`, `Accuracy and Evasion` to the rest of the system?**
  _216 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Battle UI & Overworld Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._