# Graph Report - poke  (2026-05-09)

## Corpus Check
- 876 files · ~1,761,080 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 13942 nodes · 43866 edges · 61 communities detected
- Extraction: 53% EXTRACTED · 47% INFERRED · 0% AMBIGUOUS · INFERRED: 20485 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 549|Community 549]]
- [[_COMMUNITY_Community 550|Community 550]]
- [[_COMMUNITY_Community 551|Community 551]]
- [[_COMMUNITY_Community 552|Community 552]]
- [[_COMMUNITY_Community 553|Community 553]]
- [[_COMMUNITY_Community 554|Community 554]]
- [[_COMMUNITY_Community 555|Community 555]]
- [[_COMMUNITY_Community 556|Community 556]]
- [[_COMMUNITY_Community 557|Community 557]]
- [[_COMMUNITY_Community 558|Community 558]]
- [[_COMMUNITY_Community 559|Community 559]]
- [[_COMMUNITY_Community 560|Community 560]]
- [[_COMMUNITY_Community 561|Community 561]]
- [[_COMMUNITY_Community 562|Community 562]]

## God Nodes (most connected - your core abstractions)
1. `PlaySE()` - 384 edges
2. `DestroyTask()` - 381 edges
3. `CreateTask()` - 351 edges
4. `SetGpuReg()` - 342 edges
5. `GetBattlerSide()` - 326 edges
6. `SetMainCallback2()` - 270 edges
7. `StartSpriteAnim()` - 252 edges
8. `CopyWindowToVram()` - 247 edges
9. `DestroyAnimVisualTask()` - 236 edges
10. `CreateSprite()` - 228 edges

## Surprising Connections (you probably didn't know these)
- `randomStarter()` --calls--> `Random()`  [INFERRED]
  src/hooks/useInteractionEngine.ts → pokefirered_dissasembly/src/random.c
- `play()` --calls--> `processNext()`  [INFERRED]
  vitest.setup.ts → src/lib/cutscenes/runner.ts
- `slice()` --calls--> `extractTrainerScripts()`  [INFERRED]
  pokefirered_dissasembly/tools/jsonproc/inja.hpp → scripts/extract-game-data.mjs
- `slice()` --calls--> `splitPages()`  [INFERRED]
  pokefirered_dissasembly/tools/jsonproc/inja.hpp → src/components/DialogueBox.tsx
- `get()` --calls--> `reverseConnectionsToPlaced()`  [INFERRED]
  pokefirered_dissasembly/tools/jsonproc/nlohmann/json.hpp → scripts/stitch-firered-overworld.mjs

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

### Community 0 - "Community 0"
Cohesion: 0.0
Nodes (1536): BagCreateYesNoMenuBottomRight(), BagCreateYesNoMenuTopRight(), BagDrawDepositItemTextBox(), BagDrawTextBoxOnWindow(), BagPrintMoneyAmount(), BagPrintTextOnWin1CenteredColor0(), BagPrintTextOnWindow(), CloseBagWindow() (+1528 more)

### Community 1 - "Community 1"
Cohesion: 0.0
Nodes (1231): AddSpriteIndex(), BattleAnimAdjustPanning(), BattleAnimAdjustPanning2(), AnimLeechLifeNeedle(), AnimMegahornHorn(), AnimMissileArc(), AnimMissileArc_Step(), AnimSpiderWeb() (+1223 more)

### Community 2 - "Community 2"
Cohesion: 0.01
Nodes (1218): SetBackdropFromColor(), SetBackdropFromPalette(), ReadPng(), SetPngPalette(), WritePng(), Cmd_monbg(), AnimTask_LoadMusicNotesPals(), AnimFlatterSpotlight() (+1210 more)

### Community 3 - "Community 3"
Cohesion: 0.0
Nodes (994): HandleEndTurn_BattleLost(), Cmd_incrementgamestat(), BattleSetup_ConfigureTrainerBattle(), BattleSetup_GetBattleTowerBattleTransition(), BattleSetup_GetScriptAddrAfterBattle(), BattleSetup_GetTerrainId(), BattleSetup_GetTrainerPostBattleScript(), CB2_EndMarowakBattle() (+986 more)

### Community 4 - "Community 4"
Cohesion: 0.01
Nodes (817): starts_with(), Cmd_getmoneyreward(), Cmd_givecaughtmon(), Cmd_weightdamagecalculation(), ClearTrainerFlag(), SetTrainerFlag(), CleanupLinkRoomState(), CreateTask_EnterCableClubSeatNoFollowup() (+809 more)

### Community 5 - "Community 5"
Cohesion: 0.01
Nodes (735): Cmd_end(), Cmd_stopsound(), Cmd_waitsound(), DoMoveAnim(), AnimMoveTwisterParticle(), AnimTask_ShowBattlersHealthbox(), AnimFacadeSweatDrop(), AnimGlareEyeDot() (+727 more)

### Community 6 - "Community 6"
Cohesion: 0.01
Nodes (748): DoBattleSpriteAffineAnim(), SpriteCB_EnemyMon(), PokeballsTrail_Main(), SpriteCB_FldEffPokeballTrail(), VarGetObjectEventGraphicsId(), AcroWheelieFaceDirection(), AreElevationsCompatible(), CalcWhetherObjectIsOffscreen() (+740 more)

### Community 7 - "Community 7"
Cohesion: 0.01
Nodes (469): splitPages(), walkable(), onClickSave(), canSelect(), handleSelect(), move(), baseExpFor(), expForLevel() (+461 more)

### Community 8 - "Community 8"
Cohesion: 0.01
Nodes (416): AIStackPop(), AIStackPushVar(), BattleAI_ChooseMoveOrAction(), BattleAI_DoAIProcessing(), BattleAI_HandleItemUseBeforeAISetup(), BattleAI_SetupAIData(), Cmd_call(), Cmd_count_alive_pokemon() (+408 more)

### Community 9 - "Community 9"
Cohesion: 0.01
Nodes (499): SetBattleEndCallbacks(), Task_HandleSendLinkBuffersData(), TryReceiveLinkBattleData(), BattleInterfaceSetWindowPals(), BufferPartyVsScreenHealth_AtStart(), CB2_HandleStartBattle(), CB2_HandleStartMultiBattle(), CB2_PreInitMultiBattle() (+491 more)

### Community 10 - "Community 10"
Cohesion: 0.01
Nodes (474): rfu_LMAN_checkNICommunicateStatus(), rfu_LMAN_CHILD_checkEnableParentCandidate(), rfu_LMAN_CHILD_checkSendChildName(), rfu_LMAN_CHILD_checkSendChildName2(), rfu_LMAN_CHILD_connectParent(), rfu_LMAN_CHILD_linkRecoveryProcess(), rfu_LMAN_clearVariables(), rfu_LMAN_disconnect() (+466 more)

### Community 11 - "Community 11"
Cohesion: 0.01
Nodes (327): BlitBitmapRect4Bit(), BlitBitmapRect4BitTo8Bit(), BlitBitmapRect4BitWithoutColorKey(), FillBitmapRect4Bit(), FillBitmapRect8Bit(), IsThereRoomInAnyBoxForMorePokemon(), ItemIsMail(), HandleMenuInput() (+319 more)

### Community 12 - "Community 12"
Cohesion: 0.01
Nodes (322): Task_GiveExpToMon(), Task_GiveExpWithExpBar(), Task_GiveExpToMon(), Task_GiveExpWithExpBar(), InitPokedudePartyAndOpponent(), Task_GiveExpToMon(), Task_GiveExpWithExpBar(), CreateNPCTrainerParty() (+314 more)

### Community 13 - "Community 13"
Cohesion: 0.02
Nodes (197): CB2_EndTrainerBattle(), DynamicPlaceholderTextUtil_ExpandPlaceholders(), DynamicPlaceholderTextUtil_GetPlaceholderPtr(), DynamicPlaceholderTextUtil_Reset(), DynamicPlaceholderTextUtil_SetPlaceholderPtr(), GetColorFromTextColorTable(), ResetSpecialVars(), FieldClearPlayerInput() (+189 more)

### Community 14 - "Community 14"
Cohesion: 0.03
Nodes (160): PrintAgbFooter(), PrintAgbHeader(), PrintAgbTrack(), PrintByte(), PrintControllerOp(), PrintEndOfTieOp(), PrintExtendedOp(), PrintMemAcc() (+152 more)

### Community 15 - "Community 15"
Cohesion: 0.03
Nodes (179): BackOutFromGroupToFieldSelect(), Cancel_CreateYesNoMenu(), Cancel_HandleYesNoMenu(), CommitECWords(), CompareProfileResponseWithPassphrase(), CompareQuestionnaireResponseWithPassphrase(), Confirm_CreateYesNoMenu(), Confirm_HandleYesNoMenu() (+171 more)

### Community 16 - "Community 16"
Cohesion: 0.02
Nodes (136): VBlankCB_Battle(), VBlankCB(), AngledWipes_DoWipe(), AngledWipes_SetWipeData(), BattleTransition_Start(), BigPokeball_Init(), BigPokeball_SetGfx(), Blur_Main() (+128 more)

### Community 17 - "Community 17"
Cohesion: 0.03
Nodes (167): GetDecompressedDataSize(), CopyWorkToOam(), DigitObjUtil_CreatePrinter(), DigitObjUtil_DeletePrinter(), DigitObjUtil_Free(), DigitObjUtil_HideOrShow(), DigitObjUtil_Init(), DigitObjUtil_PrintNumOn() (+159 more)

### Community 18 - "Community 18"
Cohesion: 0.03
Nodes (126): DecompressGlyph_Braille(), FontFunc_Braille(), RequestDma3Copy(), BuildAndPrintMainTopicsListMenu(), BuildAndPrintSubmenuList(), BuildMainTopicsListAndMoveToH00(), GetHelpSystemMenuLevel(), HasGottenAtLeastOneHM() (+118 more)

### Community 19 - "Community 19"
Cohesion: 0.03
Nodes (124): ShowEasyChatScreen(), InitQuestionnaireWords(), MEScrCmd_initramscript(), ClearMysteryGift(), ClearSavedTrainerIds(), ClearSavedWonderCard(), ClearSavedWonderCardAndRelated(), ClearSavedWonderCardMetadata() (+116 more)

### Community 20 - "Community 20"
Cohesion: 0.03
Nodes (112): BlendPalettesAt(), ApplyDroughtGammaShiftWithBlend(), ApplyFogBlend(), ApplyGammaShift(), ApplyGammaShiftWithBlend(), ApplyWeatherGammaShiftToPal(), BuildGammaShiftTables(), DroughtStateInit() (+104 more)

### Community 21 - "Community 21"
Cohesion: 0.04
Nodes (125): IsLinkRecvQueueAtOverworldMax(), IsMoveHm(), DestroySpriteAndFreeResources_Ball(), CheckPartyPokerus(), GetMonFlavorRelation(), GetNature(), IsMonShiny(), ShouldIgnoreDeoxysForm() (+117 more)

### Community 22 - "Community 22"
Cohesion: 0.05
Nodes (122): ShowTownMap(), Task_UseTownMapFromField(), UseTownMapFromBag(), GetMapTypeByGroupAndId(), BrightenScreenForSwitchMapMenu(), BufferRegionMapBg(), CB2_OpenFlyMap(), CB2_OpenRegionMap() (+114 more)

### Community 23 - "Community 23"
Cohesion: 0.04
Nodes (114): BattleIntroRecordMonsToDex(), Cmd_handleballthrow(), Cmd_trysetcaughtmondexflags(), DestroyPersonPicSprite(), SetSeenMon(), Task_Hof_DisplayMon(), Task_Hof_SpawnPlayerPic(), ChangeListMenuCoords() (+106 more)

### Community 24 - "Community 24"
Cohesion: 0.04
Nodes (100): IdentifyFlash(), WaitForFlashWrite_Common(), EraseFlashChip_MX(), EraseFlashSector_MX(), ProgramByte(), ProgramFlashByte_MX(), ProgramFlashSector_MX(), ProgramFlashSectorAndVerify() (+92 more)

### Community 25 - "Community 25"
Cohesion: 0.04
Nodes (92): ConvertBitDepth(), PngReadOpen(), ReadPng(), ReadPngPalette(), SetPngPalette(), WritePng(), ConvertFromFullwidthJapaneseFont(), ConvertFromHalfwidthJapaneseFont() (+84 more)

### Community 26 - "Community 26"
Cohesion: 0.04
Nodes (86): AnimFlyingSandCrescent(), AnimTask_FrozenIceCube(), Task_HidePartyStatusSummary(), ChangeBoxPokemonNickname(), ChangePokemonNickname(), StartTimer1(), AddTextCharacter(), BufferCharacter() (+78 more)

### Community 27 - "Community 27"
Cohesion: 0.06
Nodes (74): AddCoins(), GetCoins(), RemoveCoins(), SetCoins(), SetQLPlayedTheSlots(), ScrCmd_showcoinsbox(), ScrCmd_updatecoinsbox(), CalcPayout() (+66 more)

### Community 28 - "Community 28"
Cohesion: 0.06
Nodes (62): CompleteOnBattlerSpriteCallbackDummy(), CompleteOnFinishedBattleAnimation(), CompleteOnFinishedStatusAnimation(), CompleteOnHealthboxSpriteCallbackDummy(), CompleteOnInactiveTextPrinter(), CompleteOnSpecialAnimDone(), CompleteWhenChosePokeblock(), HandleChooseActionAfterDma3() (+54 more)

### Community 29 - "Community 29"
Cohesion: 0.06
Nodes (58): WhiteBarsFade_StartBars(), AddSpritesToOamBuffer(), AddSpriteToOamBuffer(), AddSubspritesToOamBuffer(), AffineAnimCmd_end(), AffineAnimCmd_frame(), AffineAnimCmd_jump(), AffineAnimCmd_loop() (+50 more)

### Community 30 - "Community 30"
Cohesion: 0.1
Nodes (37): AddPointillismPoints(), ApplyImageEffect_BlackAndWhite(), ApplyImageEffect_BlackOutline(), ApplyImageEffect_Blur(), ApplyImageEffect_BlurDown(), ApplyImageEffect_BlurRight(), ApplyImageEffect_Grayscale(), ApplyImageEffect_Invert() (+29 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (23): AGBAssert(), AGBPrint(), AGBPrintf(), AGBPrintFlush(), AGBPrintFlush1Block(), AGBPrintInit(), AGBPrintTransferDataInternal(), AGBPutc() (+15 more)

### Community 32 - "Community 32"
Cohesion: 0.09
Nodes (9): mapEnginePhase(), useBattleEngine(), randomStarter(), useInteractionEngine(), applyOverworldPoison(), useMovementEngine(), useGameLoop(), battle() (+1 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (7): ClearPulseBlendPalettesSettings(), RouletteFlash_FadePalette(), RouletteFlash_FlashPalette(), RouletteFlash_Run(), UnloadUsedPulseBlendPalettes(), UnmarkUsedPulseBlendPalettes(), UpdatePulseBlend()

### Community 34 - "Community 34"
Cohesion: 0.32
Nodes (12): CB2_BerryFix(), SetScene(), Task_BerryFixMain(), MultiBootCheckComplete(), MultiBootHandShake(), MultiBootInit(), MultiBootMain(), MultiBootSend() (+4 more)

### Community 35 - "Community 35"
Cohesion: 0.4
Nodes (10): Callback_Dummy_ID(), Callback_Dummy_M(), Callback_Dummy_S(), handshake_wait(), IntrSIO32(), sio32intr_clock_master(), sio32intr_clock_slave(), STWI_init_slave() (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.33
Nodes (5): IsAsciiAlpha(), IsAsciiAlphanum(), IsAsciiDigit(), IsIdentifierChar(), IsIdentifierStartingChar()

### Community 40 - "Community 40"
Cohesion: 0.83
Nodes (3): ExtractData(), main(), ReadWholeFile()

### Community 44 - "Community 44"
Cohesion: 0.5
Nodes (4): Story Progression / storyStep flags, Phase 4: Persist Map Mutations, Dynamic NPC Generation (buildNPCDatabase), Zustand GameState Store

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (2): HeaderComplement(), main()

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (2): cssFrame(), getSpriteFrame()

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (3): Critical Hit Probability, Battle System (engine + hook), PP Tracking + Struggle

### Community 56 - "Community 56"
Cohesion: 0.67
Nodes (3): Blackout Flow, Overworld Poison Logic, Status Effects Reference

### Community 57 - "Community 57"
Cohesion: 0.67
Nodes (3): Menus (Mochila/Equipo/Pokedex/PC/Tienda), BattleSubPhase enum, GamePhase FSM (discriminated union)

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (2): Pokemon Catch Likelihood (Gen I), Catch Rate Implementation

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (2): Experience Growth Rates, Leveling and Evolution Rules

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (2): Damage Calculation Formula (Gen I), Damage Formula Implementation

### Community 549 - "Community 549"
Cohesion: 1.0
Nodes (1): Accuracy and Evasion

### Community 550 - "Community 550"
Cohesion: 1.0
Nodes (1): Wild Pokemon Encounters Formula

### Community 551 - "Community 551"
Cohesion: 1.0
Nodes (1): Stat Calculation (DV+StatExp)

### Community 552 - "Community 552"
Cohesion: 1.0
Nodes (1): Type Effectiveness Chart

### Community 553 - "Community 553"
Cohesion: 1.0
Nodes (1): Movement System Description

### Community 554 - "Community 554"
Cohesion: 1.0
Nodes (1): Sound System (soundManager)

### Community 555 - "Community 555"
Cohesion: 1.0
Nodes (1): Game Controls (Keyboard / Mobile)

### Community 556 - "Community 556"
Cohesion: 1.0
Nodes (1): Phase 1: Pipeline Metatile Bridge Refinement

### Community 557 - "Community 557"
Cohesion: 1.0
Nodes (1): Phase 2: HM Teaching Flow

### Community 558 - "Community 558"
Cohesion: 1.0
Nodes (1): Phase 3: Surf HM

### Community 559 - "Community 559"
Cohesion: 1.0
Nodes (1): Phase 5: Flash HM

### Community 560 - "Community 560"
Cohesion: 1.0
Nodes (1): Phase 6: Fly HM

### Community 561 - "Community 561"
Cohesion: 1.0
Nodes (1): Phase 7: Strength Item Placement

### Community 562 - "Community 562"
Cohesion: 1.0
Nodes (1): Phase 8: Waterfall HM (post-game)

## Knowledge Gaps
- **42 isolated node(s):** `FunctionStorage`, `exception`, `invalid_iterator`, `type_error`, `out_of_range` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 46`** (3 nodes): `HeaderComplement()`, `main()`, `gbafix.c`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (3 nodes): `cssFrame()`, `getSpriteFrame()`, `spriteFormat.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (2 nodes): `Pokemon Catch Likelihood (Gen I)`, `Catch Rate Implementation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (2 nodes): `Experience Growth Rates`, `Leveling and Evolution Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (2 nodes): `Damage Calculation Formula (Gen I)`, `Damage Formula Implementation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 549`** (1 nodes): `Accuracy and Evasion`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 550`** (1 nodes): `Wild Pokemon Encounters Formula`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 551`** (1 nodes): `Stat Calculation (DV+StatExp)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 552`** (1 nodes): `Type Effectiveness Chart`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 553`** (1 nodes): `Movement System Description`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 554`** (1 nodes): `Sound System (soundManager)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 555`** (1 nodes): `Game Controls (Keyboard / Mobile)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 556`** (1 nodes): `Phase 1: Pipeline Metatile Bridge Refinement`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 557`** (1 nodes): `Phase 2: HM Teaching Flow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 558`** (1 nodes): `Phase 3: Surf HM`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 559`** (1 nodes): `Phase 5: Flash HM`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 560`** (1 nodes): `Phase 6: Fly HM`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 561`** (1 nodes): `Phase 7: Strength Item Placement`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 562`** (1 nodes): `Phase 8: Waterfall HM (post-game)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Random()` connect `Community 8` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 12`, `Community 15`, `Community 16`, `Community 17`, `Community 19`, `Community 20`, `Community 23`, `Community 24`, `Community 27`, `Community 32`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `DestroyTask()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 16`, `Community 17`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 26`, `Community 27`, `Community 34`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `CreateTask()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 16`, `Community 17`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 26`, `Community 27`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Are the 383 inferred relationships involving `PlaySE()` (e.g. with `Mugshot_StartOpponentSlide()` and `Task_RunEasyChat()`) actually correct?**
  _`PlaySE()` has 383 INFERRED edges - model-reasoned connections that need verification._
- **Are the 380 inferred relationships involving `DestroyTask()` (e.g. with `IsBattleTransitionDone()` and `Task_Intro()`) actually correct?**
  _`DestroyTask()` has 380 INFERRED edges - model-reasoned connections that need verification._
- **Are the 349 inferred relationships involving `CreateTask()` (e.g. with `LaunchBattleTransitionTask()` and `Transition_StartIntro()`) actually correct?**
  _`CreateTask()` has 349 INFERRED edges - model-reasoned connections that need verification._
- **Are the 337 inferred relationships involving `SetGpuReg()` (e.g. with `Blur_Init()` and `Blur_Main()`) actually correct?**
  _`SetGpuReg()` has 337 INFERRED edges - model-reasoned connections that need verification._