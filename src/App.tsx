import { useEffect, useRef, useMemo, useCallback, lazy, Suspense, useState } from 'react';
import { type BattleState, type BattleAction } from './lib/battleEngine';
import { battle, B_CHOOSING, B_FORCED_SWITCH, EXPLORING } from './types/gamePhase';
import { logEvent, withoutLogging } from './lib/eventLog';
import { type Direction } from './types';
import { useInteractionEngine } from './hooks/useInteractionEngine';
import { useWindowSize } from './hooks/useWindowSize';
import { useBattleVFX } from './hooks/useBattleVFX';
import { useOverworldVFX } from './hooks/useOverworldVFX';
import { useGameStore } from './store/gameStore';
import { useInputHandler } from './hooks/useInputHandler';
import { useDebugAPI } from './hooks/useDebugAPI';
import { useBattleEngine } from './hooks/useBattleEngine';
import { useMovementEngine } from './hooks/useMovementEngine';
import { useWildPokemonEngine } from './hooks/useWildPokemonEngine';
import { WorldView } from './components/WorldView';
const WorldView3D = lazy(() => import('./components/overworld3d/WorldView3D'));
import { Minimap } from './components/Minimap';
import { MobileControls } from './components/MobileControls';
import { SideMenu } from './components/SideMenu';
import { MenuButton } from './components/MenuButton';
import { GameModals } from './components/GameModals';
import { ScreenEffects } from './components/ScreenEffects';
import { applyItemToPokemon } from './lib/itemUtils';
import { HM_MOVE_MAP, MOVES } from './constants';

export default function App() {
  // ── Granular store selectors ────────────────────────────────────
  // App MUST NOT subscribe to rapidly-changing values like playerPos,
  // direction, isMoving, cameraOffset, zoomLevel, or wildPokemon.
  // Each selector below only triggers re-render when its value changes.
  const phase = useGameStore(s => s.phase);
  const viewMode = useGameStore(s => s.viewMode);
  const currentMap = useGameStore(s => s.currentMap);
  const worldMaps = useGameStore(s => s.worldMaps);
  const grassEffect = useGameStore(s => s.grassEffect);
  const spottedTrainerId = useGameStore(s => s.spottedTrainerId);
  const spottedTrainerPos = useGameStore(s => s.spottedTrainerPos);
  const defeatedTrainers = useGameStore(s => s.defeatedTrainers);
  const dialogue = useGameStore(s => s.dialogue);
  const playerTeam = useGameStore(s => s.playerTeam);
  const storyStep = useGameStore(s => s.storyStep);
  const inventory = useGameStore(s => s.inventory);
  const hasPokedex = useGameStore(s => s.hasPokedex);
  const isTrainerBattle = useGameStore(s => s.isTrainerBattle);
  const badges = useGameStore(s => s.badges);
  const hasParcel = useGameStore(s => s.hasParcel);
  const hasSilphScope = useGameStore(s => s.hasSilphScope);
  const hasPokeFlute = useGameStore(s => s.hasPokeFlute);
  const hasSsTicket = useGameStore(s => s.hasSsTicket);
  const clearedSnorlax = useGameStore(s => s.clearedSnorlax);
  const oakCutscenePos = useGameStore(s => s.oakCutscenePos);
  const oakCutsceneDir = useGameStore(s => s.oakCutsceneDir);
  const pickedItemIds = useGameStore(s => s.pickedItemIds);
  // Stable method refs (Zustand actions — identity never changes)
  const getNPCs = useGameStore(s => s.getNPCs);
  const getItems = useGameStore(s => s.getItems);
  const setPhase = useGameStore(s => s.setPhase);
  const setDialogue = useGameStore(s => s.setDialogue);
  const resetGame = useGameStore(s => s.resetGame);
  const updateTeam = useGameStore(s => s.updateTeam);
  const setEnemyPokemon = useGameStore(s => s.setEnemyPokemon);
  const setBattleLog = useGameStore(s => s.setBattleLog);

  const inBattle = phase.type === 'BATTLE' || ('returnTo' in phase && phase.returnTo?.type === 'BATTLE');
  const battlePhase = phase.type === 'BATTLE' ? phase.sub : ('returnTo' in phase && phase.returnTo?.type === 'BATTLE' ? phase.returnTo.sub : null);

  // getNPCs/getItems are stable store methods (use get() internally); extra deps signal when to recompute.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const npcs = useMemo(() => getNPCs(), [getNPCs, playerTeam, hasParcel, hasPokedex, badges, storyStep, oakCutscenePos, oakCutsceneDir, hasSilphScope, hasPokeFlute, hasSsTicket, clearedSnorlax]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => getItems(), [getItems, pickedItemIds, storyStep]);

  const windowSize = useWindowSize();
  const { overworldShake, setOverworldShake } = useOverworldVFX();

  // ── Warp flash on map transition ──────────────────────────────────
  const [warpFlash, setWarpFlash] = useState(false);
  const prevMapRef = useRef(currentMap);
  useEffect(() => {
    if (prevMapRef.current === currentMap) return;
    prevMapRef.current = currentMap;
    setWarpFlash(true);
    const t = setTimeout(() => setWarpFlash(false), 80);
    return () => clearTimeout(t);
  }, [currentMap]);
  const { playerAnim, setPlayerAnim, enemyAnim, setEnemyAnim, battleShake, setBattleShake, cinematicEvent, setCinematicEvent } = useBattleVFX();

  const battleStateRef = useRef<BattleState | null>(null);

  const handlePCSwap = useCallback((teamIdx: number, pcIdx: number) => {
    logEvent({ k: 'pcSwap', teamIdx, pcIdx });
    const s = useGameStore.getState();
    const newTeam = [...s.playerTeam];
    const newPC = [...s.pcStorage];
    const temp = newTeam[teamIdx];
    newTeam[teamIdx] = newPC[pcIdx];
    newPC[pcIdx] = temp;
    s.updateTeam(newTeam);
    s.updatePcStorage(newPC);
  }, []);

  const { dispatchBattle: rawDispatchBattle } = useBattleEngine({
    battleStateRef,
    setPlayerAnim,
    setEnemyAnim,
    setBattleShake,
    setCinematicEvent,
  });
  const dispatchBattle = useCallback((action: BattleAction) => {
    if (action.type !== 'TICK') logEvent({ k: 'battle', action });
    rawDispatchBattle(action);
  }, [rawDispatchBattle]);

  // Restore battle state from persisted store on mount
  useEffect(() => {
    const s = useGameStore.getState();
    if (s.activeBattle && (s.phase.type === 'BATTLE' || s.phase.type === 'BATTLE_TRANSITION')) {
      battleStateRef.current = s.activeBattle;
      s.setEnemyPokemon(s.activeBattle.enemyPokemon);
      s.setIsTrainerBattle(s.activeBattle.isTrainerBattle);
      s.setBattleLog(s.activeBattle.log);
      s.setBattleLogs([{ text: s.activeBattle.log, speaker: 'Sistema', id: -1 }]);
      if (s.phase.type === 'BATTLE_TRANSITION') {
        s.setPhase(s.activeBattle?.phase === 'FORCED_SWITCH' ? battle(B_FORCED_SWITCH) : battle(B_CHOOSING));
      }
    } else if (!s.activeBattle && (s.phase.type === 'BATTLE' || s.phase.type === 'BATTLE_TRANSITION')) {
      s.setPhase(EXPLORING);
    }
  }, []);

  const { handleMove: rawHandleMove, initBattle } = useMovementEngine({
    setOverworldShake,
  });
  const handleMove = useCallback((dir: Direction) => {
    logEvent({ k: 'move', dir });
    rawHandleMove(dir);
  }, [rawHandleMove]);

  const { handleAction: rawHandleAction } = useInteractionEngine({
    initBattle,
  });
  const handleAction = useCallback(() => {
    logEvent({ k: 'action' });
    rawHandleAction();
  }, [rawHandleAction]);

  const handleBack = useCallback(() => {
    const s = useGameStore.getState();
    if (s.dialogue) {
      const cb = s.dialogueCallback;
      s.setDialogue(null);
      if (cb) cb();
      return;
    }
    const ph = s.phase;
    if (ph.type === 'MENU') { s.setPhase(ph.returnTo ?? EXPLORING); return; }
    if (ph.type === 'BATTLE' && s.showMoves) { s.setShowMoves(false); }
  }, []);

  const handleSelect = useCallback(() => {
    const s = useGameStore.getState();
    if (!s.hasPokedex) return;
    if (s.phase.type === 'EXPLORING') s.setPhase({ type: 'POKEDEX', returnTo: EXPLORING });
    else if (s.phase.type === 'POKEDEX') s.setPhase(s.phase.returnTo ?? EXPLORING);
  }, []);

  const handleUseItem = useCallback((itemId: string) => {
    logEvent({ k: 'item', itemId });
    withoutLogging(() => {
      const s = useGameStore.getState();
      const hasItem = (s.inventory[itemId] ?? 0) > 0;
      if (!hasItem) return;
      const ph = s.phase;
      const ib = ph.type === 'BATTLE' || ('returnTo' in ph && ph.returnTo?.type === 'BATTLE');
      if (!ib) {
        if (itemId === 'POKEBALL') {
          s.setDialogue('¡No es el momento de usar eso!');
          s.setPhase(EXPLORING);
          return;
        }
        s.setPhase({ type: 'ITEM_TEAM_SELECT', itemId });
        return;
      }
      if (itemId === 'POKEBALL') {
        dispatchBattleRef.current({ type: 'CATCH' });
      } else {
        s.setPhase(battle({ type: 'BATTLE_ITEM_TEAM_SELECT', itemId }));
      }
    });
  }, []);

  // dispatchBattle reference is stable (useCallback with stable dep), so it's
  // safe to reference inside the handler below even though it's not in deps.
  const dispatchBattleRef = useRef(dispatchBattle);
  dispatchBattleRef.current = dispatchBattle;

  const handleApplyItemToPokemon = useCallback((index: number) => {
    withoutLogging(() => {
      const s = useGameStore.getState();
      const ph = s.phase;
      const ib = ph.type === 'BATTLE' || ('returnTo' in ph && ph.returnTo?.type === 'BATTLE');
      let itemId: string | undefined;
      if (ph.type === 'ITEM_TEAM_SELECT') {
        itemId = ph.itemId;
      } else if (ib && ph.type === 'BATTLE') {
        if (ph.sub.type === 'BATTLE_ITEM_TEAM_SELECT') itemId = ph.sub.itemId;
      }

      if (!itemId) return;

      if (!ib) {
        const team = s.playerTeam;
        const hmMoveName = HM_MOVE_MAP[itemId];
        if (hmMoveName) {
          const pkmn = team[index];
          if (pkmn.moves.some(m => m.name === hmMoveName)) {
            s.setDialogue(`¡${pkmn.name} ya sabe ${hmMoveName}!`);
          } else {
            const move = Object.values(MOVES).find(m => m.name === hmMoveName)!;
            const newMoves = pkmn.moves.length < 4
              ? [...pkmn.moves, move]
              : [...pkmn.moves.slice(0, 3), move];
            const newTeam = [...team];
            newTeam[index] = { ...pkmn, moves: newMoves };
            s.updateTeam(newTeam);
            s.setDialogue(`¡${pkmn.name} aprendió ${hmMoveName}!`);
          }
          s.setPhase(EXPLORING);
          return;
        }

        const pkmn = team[index];
        const result = applyItemToPokemon(pkmn, itemId);
        if (result.success) {
          const newTeam = [...team];
          newTeam[index] = result.pokemon;
          s.updateTeam(newTeam);
          s.removeInventoryItem(itemId);
          s.setDialogue(result.message);
        } else {
          s.setDialogue(result.message);
        }
        s.setPhase(EXPLORING);
      } else {
        dispatchBattleRef.current({ type: 'USE_ITEM', itemId, targetIndex: index });
      }
    });
  }, []);

  const { giveDemoTeam } = useDebugAPI({
    dispatchBattle,
    battleStateRef,
    phase,
    setDialogue,
    setPhase,
    handleMove,
    handleAction,
    handleUseItem,
    handlePCSwap,
    isTrainerBattle,
    gameState: { current: useGameStore.getState() } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    setPlayerTeam: updateTeam,
    setEnemyPokemon,
    setBattleLog,
    setIsTrainerBattle: (v: boolean | ((prev: boolean) => boolean)) => {
      const s = useGameStore.getState();
      const next = typeof v === 'function' ? v(s.isTrainerBattle) : v;
      s.setIsTrainerBattle(next);
    },
  });

  const mobileDirRef = useRef<Direction | null>(null);

  useInputHandler({
    handleMove,
    handleAction,
    dispatchBattle,
    isTrainerBattle,
    spottedTrainerId,
    mobileDirRef,
  });

  useWildPokemonEngine();

  return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-red-500 selection:text-white">
      <div className="scanline" />


      {viewMode === '2d' ? (
        <WorldView
          currentMap={currentMap}
          maps={worldMaps}
          npcs={npcs}
          items={items}
          grassEffect={grassEffect}
          overworldShake={overworldShake}
          windowSize={windowSize}
          spottedTrainerId={spottedTrainerId}
          spottedTrainerPos={spottedTrainerPos}
          defeatedTrainers={defeatedTrainers}
          inBattle={inBattle}
          dialogue={dialogue}
        />
      ) : (
        <Suspense fallback={<div className="absolute inset-0 bg-slate-900" />}>
          <WorldView3D
            currentMap={currentMap}
            maps={worldMaps}
            npcs={npcs}
            items={items}
          />
        </Suspense>
      )}

      <Minimap />

      <MobileControls onMove={handleMove} onDirChange={(dir) => { mobileDirRef.current = dir; }} onAction={handleAction} onBack={handleBack} onSelect={handleSelect} setPhase={setPhase} />

      <MenuButton phase={phase} setPhase={setPhase} />

      <SideMenu
        phase={phase}
        playerTeam={playerTeam}
        storyStep={storyStep}
        inventory={inventory}
        hasPokedex={hasPokedex}
        setPhase={setPhase}
        setDialogue={setDialogue}
        resetGame={resetGame}
        giveDemoTeam={giveDemoTeam}
      />

      <GameModals
        battleShake={battleShake}
        enemyAnim={enemyAnim}
        playerAnim={playerAnim}
        cinematicEvent={cinematicEvent}
        onCinematicDone={() => setCinematicEvent(null)}
        handlePCSwap={handlePCSwap}
        handleUseItem={handleUseItem}
        handleApplyItemToPokemon={handleApplyItemToPokemon}
        dispatchBattle={dispatchBattle}
      />

      <ScreenEffects phaseType={phase.type} battlePhase={battlePhase} />

      {/* Warp flash — brief white flash on map transition */}
      {warpFlash && (
        <div className="fixed inset-0 bg-white z-[400] pointer-events-none" />
      )}

    </div>
  );
}