# Graph Report - poke  (2026-05-08)

## Corpus Check
- 868 files · ~1,757,804 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 13939 nodes · 43880 edges · 61 communities detected
- Extraction: 53% EXTRACTED · 47% INFERRED · 0% AMBIGUOUS · INFERRED: 20482 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 541|Community 541]]
- [[_COMMUNITY_Community 542|Community 542]]
- [[_COMMUNITY_Community 543|Community 543]]
- [[_COMMUNITY_Community 544|Community 544]]
- [[_COMMUNITY_Community 545|Community 545]]
- [[_COMMUNITY_Community 546|Community 546]]
- [[_COMMUNITY_Community 547|Community 547]]
- [[_COMMUNITY_Community 548|Community 548]]
- [[_COMMUNITY_Community 549|Community 549]]
- [[_COMMUNITY_Community 550|Community 550]]
- [[_COMMUNITY_Community 551|Community 551]]
- [[_COMMUNITY_Community 552|Community 552]]
- [[_COMMUNITY_Community 553|Community 553]]
- [[_COMMUNITY_Community 554|Community 554]]

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
- `listSavedLogs()` --calls--> `Json()`  [INFERRED]
  src/lib/eventLog.ts → pokefirered_dissasembly/tools/mapjson/json11.cpp
- `loadLogFromDisk()` --calls--> `Json()`  [INFERRED]
  src/lib/eventLog.ts → pokefirered_dissasembly/tools/mapjson/json11.cpp
- `processNext()` --calls--> `play()`  [INFERRED]
  src/lib/cutscenes/runner.ts → vitest.setup.ts
- `extractTrainerScripts()` --calls--> `slice()`  [INFERRED]
  scripts/extract-game-data.mjs → pokefirered_dissasembly/tools/jsonproc/inja.hpp
- `splitPages()` --calls--> `slice()`  [INFERRED]
  src/components/DialogueBox.tsx → pokefirered_dissasembly/tools/jsonproc/inja.hpp

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
Nodes (1302): AddSpriteIndex(), BattleAnimAdjustPanning(), BattleAnimAdjustPanning2(), AnimLeechLifeNeedle(), AnimMegahornHorn(), AnimMissileArc(), AnimMissileArc_Step(), AnimSpiderWeb() (+1294 more)

### Community 1 - "Community 1"
Cohesion: 0.01
Nodes (1123): BagCreateYesNoMenuBottomRight(), BagCreateYesNoMenuTopRight(), BagDrawDepositItemTextBox(), BagDrawTextBoxOnWindow(), BagPrintMoneyAmount(), BagPrintTextOnWin1CenteredColor0(), BagPrintTextOnWindow(), CloseBagWindow() (+1115 more)

### Community 2 - "Community 2"
Cohesion: 0.01
Nodes (1058): SetBackdropFromColor(), ReadPng(), SetPngPalette(), WritePng(), ClearBattleAnimationVars(), Cmd_stopsound(), Cmd_waitsound(), AnimAirWaveProjectile() (+1050 more)

### Community 3 - "Community 3"
Cohesion: 0.0
Nodes (927): apply(), BattleSetup_GetTerrainId(), ConfigureAndSetUpOneTrainerBattle(), HasTrainerBeenFought(), SetUpTrainerMovement(), AngledWipes_TryEnd(), Blur_End(), ClockwiseWipe_End() (+919 more)

### Community 4 - "Community 4"
Cohesion: 0.0
Nodes (880): starts_with(), HandleEndTurn_BattleLost(), Cmd_getmoneyreward(), Cmd_givecaughtmon(), Cmd_incrementgamestat(), BattleSetup_ConfigureTrainerBattle(), BattleSetup_GetBattleTowerBattleTransition(), BattleSetup_GetScriptAddrAfterBattle() (+872 more)

### Community 5 - "Community 5"
Cohesion: 0.01
Nodes (774): Cmd_end(), DoMoveAnim(), AnimTask_LeafBlade_Step2_Callback(), AnimTask_MusicNotesClearRainbowBlend(), AnimTask_ShowBattlersHealthbox(), IsDoubleBattle(), AnimTask_ImprisonOrbs_Step(), SpriteCB_SmokescreenImpact() (+766 more)

### Community 6 - "Community 6"
Cohesion: 0.01
Nodes (747): DoBattleSpriteAffineAnim(), SpriteCB_EnemyMon(), AcroWheelieFaceDirection(), AreElevationsCompatible(), CalcWhetherObjectIsOffscreen(), CameraObject_0(), CameraObject_1(), CameraObjectGetFollowedObjectId() (+739 more)

### Community 7 - "Community 7"
Cohesion: 0.01
Nodes (669): SetBackdropFromPalette(), InitBagWindows(), AnimTask_LoadMusicNotesPals(), AnimFlatterSpotlight(), AnimSpotlight(), AnimTask_CreateSpotlight(), AnimTask_RemoveSpotlight(), AnimTask_GhostGetOut_Step1() (+661 more)

### Community 8 - "Community 8"
Cohesion: 0.01
Nodes (512): splitPages(), walkable(), move(), getKantoRegion(), decodePngIndices(), decodePngToIndices(), decompressZlib(), drawTileToImageData() (+504 more)

### Community 9 - "Community 9"
Cohesion: 0.01
Nodes (419): AIStackPop(), AIStackPushVar(), BattleAI_ChooseMoveOrAction(), BattleAI_DoAIProcessing(), BattleAI_HandleItemUseBeforeAISetup(), BattleAI_SetupAIData(), Cmd_call(), Cmd_count_alive_pokemon() (+411 more)

### Community 10 - "Community 10"
Cohesion: 0.01
Nodes (514): PrepareOwnMultiPartnerBuffer(), UpdatePartyOwnerOnSwitch_NonMulti(), ExpandBattleTextBuffPlaceholders(), Task_WaitButton(), Cmd_forcerandomswitch(), GetSeeingLinkPlayerCardMsg(), AlterEggSpeciesWithIncenseItem(), AppendGenderSymbol() (+506 more)

### Community 11 - "Community 11"
Cohesion: 0.01
Nodes (478): rfu_LMAN_checkNICommunicateStatus(), rfu_LMAN_CHILD_checkEnableParentCandidate(), rfu_LMAN_CHILD_checkSendChildName(), rfu_LMAN_CHILD_checkSendChildName2(), rfu_LMAN_CHILD_connectParent(), rfu_LMAN_CHILD_linkRecoveryProcess(), rfu_LMAN_clearVariables(), rfu_LMAN_disconnect() (+470 more)

### Community 12 - "Community 12"
Cohesion: 0.01
Nodes (321): BlitBitmapRect4Bit(), BlitBitmapRect4BitTo8Bit(), BlitBitmapRect4BitWithoutColorKey(), FillBitmapRect4Bit(), FillBitmapRect8Bit(), IsThereRoomInAnyBoxForMorePokemon(), Task_HofPC_HandlePaletteOnExit(), HandleMenuInput() (+313 more)

### Community 13 - "Community 13"
Cohesion: 0.02
Nodes (247): TranslateSpriteLinearFixedPointIconFrame(), CreatePartyStatusSummarySprites(), Task_HidePartyStatusSummary_BattleStart_2(), Task_HidePartyStatusSummary_DuringBattle(), PutMonIconOnLvlUpBanner(), WhiteBarsFade_StartBars(), LoadCompressedSpritePaletteOverrideBuffer(), LoadCompressedSpriteSheetOverrideBuffer() (+239 more)

### Community 14 - "Community 14"
Cohesion: 0.01
Nodes (132): run(), save(), start(), stop(), canSelect(), handleSelect(), baseExpFor(), expForLevel() (+124 more)

### Community 15 - "Community 15"
Cohesion: 0.02
Nodes (186): PrintResultsText(), DynamicPlaceholderTextUtil_ExpandPlaceholders(), DynamicPlaceholderTextUtil_GetPlaceholderPtr(), DynamicPlaceholderTextUtil_Reset(), DynamicPlaceholderTextUtil_SetPlaceholderPtr(), ResetSpecialVars(), SetUsedPkmnCenterQuestLogEvent(), ShowDiploma() (+178 more)

### Community 16 - "Community 16"
Cohesion: 0.02
Nodes (158): VBlankCB_Battle(), VBlankCB(), AngledWipes_DoWipe(), AngledWipes_SetWipeData(), BattleTransition_Start(), BigPokeball_Init(), BigPokeball_SetGfx(), Blur_Main() (+150 more)

### Community 17 - "Community 17"
Cohesion: 0.03
Nodes (180): BackOutFromGroupToFieldSelect(), Cancel_CreateYesNoMenu(), Cancel_HandleYesNoMenu(), CommitECWords(), CompareProfileResponseWithPassphrase(), CompareQuestionnaireResponseWithPassphrase(), Confirm_CreateYesNoMenu(), Confirm_HandleYesNoMenu() (+172 more)

### Community 18 - "Community 18"
Cohesion: 0.02
Nodes (171): BattleStringExpandPlaceholders(), AwardBattleTowerRibbons(), BattleTower_SoftReset(), BattleTowerMapScript2(), BattleTowerUtil(), BufferBattleTowerTrainerMessage(), BufferEReaderTrainerGreeting(), CB2_FinishEReaderBattle() (+163 more)

### Community 19 - "Community 19"
Cohesion: 0.02
Nodes (174): GetDecompressedDataSize(), CopyWorkToOam(), DigitObjUtil_CreatePrinter(), DigitObjUtil_DeletePrinter(), DigitObjUtil_Free(), DigitObjUtil_HideOrShow(), DigitObjUtil_PrintNumOn(), DrawNumObjsLeadingZeros() (+166 more)

### Community 20 - "Community 20"
Cohesion: 0.05
Nodes (128): FlagGet(), ApplyGlobalFieldPaletteTint(), DoPokemonLeagueLightingEffect(), SetDeoxysTrianglePalette(), ShowTownMap(), Task_CancelPokemonLeagueLightingEffect(), Task_RunPokemonLeagueLightingEffect(), ApplyGlobalTintToPaletteEntries() (+120 more)

### Community 21 - "Community 21"
Cohesion: 0.03
Nodes (111): BlendPalettesAt(), ApplyDroughtGammaShiftWithBlend(), ApplyFogBlend(), ApplyGammaShift(), ApplyGammaShiftWithBlend(), ApplyWeatherGammaShiftToPal(), BuildGammaShiftTables(), DroughtStateInit() (+103 more)

### Community 22 - "Community 22"
Cohesion: 0.04
Nodes (120): RequestDma3Copy(), BuildAndPrintMainTopicsListMenu(), BuildAndPrintSubmenuList(), BuildMainTopicsListAndMoveToH00(), GetHelpSystemMenuLevel(), HasGottenAtLeastOneHM(), HelpMenuSubroutine_HelpItemPrint(), HelpMenuSubroutine_HelpItemWaitButton() (+112 more)

### Community 23 - "Community 23"
Cohesion: 0.03
Nodes (100): IdentifyFlash(), WaitForFlashWrite_Common(), EraseFlashChip_MX(), EraseFlashSector_MX(), ProgramByte(), ProgramFlashByte_MX(), ProgramFlashSector_MX(), ProgramFlashSectorAndVerify() (+92 more)

### Community 24 - "Community 24"
Cohesion: 0.04
Nodes (91): ConvertBitDepth(), PngReadOpen(), ReadPng(), ReadPngPalette(), SetPngPalette(), WritePng(), ConvertFromFullwidthJapaneseFont(), ConvertFromHalfwidthJapaneseFont() (+83 more)

### Community 25 - "Community 25"
Cohesion: 0.04
Nodes (86): Task_HidePartyStatusSummary(), ChangePokemonNickname(), StartTimer1(), AddTextCharacter(), BufferCharacter(), CreateBackOkSprites(), CreateButtonFlashTask(), CreateCursorSprite() (+78 more)

### Community 26 - "Community 26"
Cohesion: 0.06
Nodes (82): Task_CreateLevelUpVerticalStripes(), IsMonGettingExpSentOut(), Scene3_Task_GengarAttack(), Menu2_GetMonPosAttribute(), Menu2_GetStarSpritePosAttribute(), Task_RunPokeJumpGfxFunc(), GetAnimTypeByItemId(), GetClosenessFromFriendship() (+74 more)

### Community 27 - "Community 27"
Cohesion: 0.06
Nodes (69): AddCoins(), GetCoins(), RemoveCoins(), SetCoins(), SetQLPlayedTheSlots(), ScrCmd_updatecoinsbox(), CalcPayout(), CalcSlotBias() (+61 more)

### Community 28 - "Community 28"
Cohesion: 0.05
Nodes (36): CgbModVol(), CgbOscOff(), CgbPan(), CgbSound(), Clear64byte(), ClearModM(), m4aMPlayAllContinue(), m4aMPlayFadeOut() (+28 more)

### Community 29 - "Community 29"
Cohesion: 0.1
Nodes (37): AddPointillismPoints(), ApplyImageEffect_BlackAndWhite(), ApplyImageEffect_BlackOutline(), ApplyImageEffect_Blur(), ApplyImageEffect_BlurDown(), ApplyImageEffect_BlurRight(), ApplyImageEffect_Grayscale(), ApplyImageEffect_Invert() (+29 more)

### Community 30 - "Community 30"
Cohesion: 0.1
Nodes (26): CreatePostEvoSparkleSet1(), CreatePostEvoSparkleSet2(), CreatePreEvoSparkleSet1(), CreatePreEvoSparkleSet2(), EvoTask_ChooseNextEvoSpriteAnim(), EvoTask_CreatePostEvoSparklesSet1(), EvoTask_CreatePostEvoSparklesSet2(), EvoTask_CreatePostEvoSparklesSet2Trade() (+18 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (23): AGBAssert(), AGBPrint(), AGBPrintf(), AGBPrintFlush(), AGBPrintFlush1Block(), AGBPrintInit(), AGBPrintTransferDataInternal(), AGBPutc() (+15 more)

### Community 32 - "Community 32"
Cohesion: 0.2
Nodes (19): CloseSerial(), DetermineSendRecvState(), DisableTm3(), EnableSio(), EReader_Recv(), EReader_Send(), EReaderHandleTransfer(), EReaderHelper_ClearsSendRecvMgr() (+11 more)

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

### Community 41 - "Community 41"
Cohesion: 0.83
Nodes (3): ExtractData(), main(), ReadWholeFile()

### Community 43 - "Community 43"
Cohesion: 0.5
Nodes (4): Story Progression / storyStep flags, Phase 4: Persist Map Mutations, Dynamic NPC Generation (buildNPCDatabase), Zustand GameState Store

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (2): HeaderComplement(), main()

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (2): cssFrame(), getSpriteFrame()

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (3): Critical Hit Probability, Battle System (engine + hook), PP Tracking + Struggle

### Community 53 - "Community 53"
Cohesion: 0.67
Nodes (3): Blackout Flow, Overworld Poison Logic, Status Effects Reference

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (3): Menus (Mochila/Equipo/Pokedex/PC/Tienda), BattleSubPhase enum, GamePhase FSM (discriminated union)

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (2): Experience Growth Rates, Leveling and Evolution Rules

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (2): Damage Calculation Formula (Gen I), Damage Formula Implementation

### Community 79 - "Community 79"
Cohesion: 1.0
Nodes (2): Pokemon Catch Likelihood (Gen I), Catch Rate Implementation

### Community 541 - "Community 541"
Cohesion: 1.0
Nodes (1): Accuracy and Evasion

### Community 542 - "Community 542"
Cohesion: 1.0
Nodes (1): Wild Pokemon Encounters Formula

### Community 543 - "Community 543"
Cohesion: 1.0
Nodes (1): Stat Calculation (DV+StatExp)

### Community 544 - "Community 544"
Cohesion: 1.0
Nodes (1): Type Effectiveness Chart

### Community 545 - "Community 545"
Cohesion: 1.0
Nodes (1): Movement System Description

### Community 546 - "Community 546"
Cohesion: 1.0
Nodes (1): Sound System (soundManager)

### Community 547 - "Community 547"
Cohesion: 1.0
Nodes (1): Game Controls (Keyboard / Mobile)

### Community 548 - "Community 548"
Cohesion: 1.0
Nodes (1): Phase 1: Pipeline Metatile Bridge Refinement

### Community 549 - "Community 549"
Cohesion: 1.0
Nodes (1): Phase 2: HM Teaching Flow

### Community 550 - "Community 550"
Cohesion: 1.0
Nodes (1): Phase 3: Surf HM

### Community 551 - "Community 551"
Cohesion: 1.0
Nodes (1): Phase 5: Flash HM

### Community 552 - "Community 552"
Cohesion: 1.0
Nodes (1): Phase 6: Fly HM

### Community 553 - "Community 553"
Cohesion: 1.0
Nodes (1): Phase 7: Strength Item Placement

### Community 554 - "Community 554"
Cohesion: 1.0
Nodes (1): Phase 8: Waterfall HM (post-game)

## Knowledge Gaps
- **42 isolated node(s):** `FunctionStorage`, `exception`, `invalid_iterator`, `type_error`, `out_of_range` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 45`** (3 nodes): `HeaderComplement()`, `main()`, `gbafix.c`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (3 nodes): `cssFrame()`, `getSpriteFrame()`, `spriteFormat.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (2 nodes): `Experience Growth Rates`, `Leveling and Evolution Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (2 nodes): `Damage Calculation Formula (Gen I)`, `Damage Formula Implementation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (2 nodes): `Pokemon Catch Likelihood (Gen I)`, `Catch Rate Implementation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 541`** (1 nodes): `Accuracy and Evasion`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 542`** (1 nodes): `Wild Pokemon Encounters Formula`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 543`** (1 nodes): `Stat Calculation (DV+StatExp)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 544`** (1 nodes): `Type Effectiveness Chart`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 545`** (1 nodes): `Movement System Description`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 546`** (1 nodes): `Sound System (soundManager)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 547`** (1 nodes): `Game Controls (Keyboard / Mobile)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 548`** (1 nodes): `Phase 1: Pipeline Metatile Bridge Refinement`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 549`** (1 nodes): `Phase 2: HM Teaching Flow`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 550`** (1 nodes): `Phase 3: Surf HM`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 551`** (1 nodes): `Phase 5: Flash HM`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 552`** (1 nodes): `Phase 6: Fly HM`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 553`** (1 nodes): `Phase 7: Strength Item Placement`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 554`** (1 nodes): `Phase 8: Waterfall HM (post-game)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Random()` connect `Community 9` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 10`, `Community 11`, `Community 14`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 21`, `Community 23`, `Community 27`, `Community 30`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `PlaySE()` connect `Community 10` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 11`, `Community 12`, `Community 13`, `Community 16`, `Community 17`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 25`, `Community 26`, `Community 27`, `Community 30`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `DestroyTask()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 7`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 15`, `Community 16`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 26`, `Community 27`, `Community 30`, `Community 34`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 383 inferred relationships involving `PlaySE()` (e.g. with `Mugshot_StartOpponentSlide()` and `Task_RunEasyChat()`) actually correct?**
  _`PlaySE()` has 383 INFERRED edges - model-reasoned connections that need verification._
- **Are the 380 inferred relationships involving `DestroyTask()` (e.g. with `IsBattleTransitionDone()` and `Task_Intro()`) actually correct?**
  _`DestroyTask()` has 380 INFERRED edges - model-reasoned connections that need verification._
- **Are the 349 inferred relationships involving `CreateTask()` (e.g. with `LaunchBattleTransitionTask()` and `Transition_StartIntro()`) actually correct?**
  _`CreateTask()` has 349 INFERRED edges - model-reasoned connections that need verification._
- **Are the 337 inferred relationships involving `SetGpuReg()` (e.g. with `Blur_Init()` and `Blur_Main()`) actually correct?**
  _`SetGpuReg()` has 337 INFERRED edges - model-reasoned connections that need verification._