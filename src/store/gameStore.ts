import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type Pokemon, type Position, type Direction, type Entity, type InventoryCounts, type MapID, type PokedexState, type WildPokemonEntity, type BattleLogEntry, type Tile } from '../types';
import { worldConfig } from '../data/worldConfig';
import { buildNPCDatabase, buildItemDatabase } from '../data/npcDatabase';
import { EVOLUTION_RULES } from '../constants/pokemon';
import { type GamePhase, EXPLORING } from '../types';
import type { BattleState } from '../lib/battleEngine';
import type { SetStateAction } from 'react';

interface GameSaveState {
  playerPos: Position;
  direction: Direction;
  currentMap: MapID;
  
  hasPokedex: boolean;
  hasParcel: boolean;
  hasSilphScope: boolean;
  hasPokeFlute: boolean;
  hasSsTicket: boolean;
  clearedSnorlax: string[];
  pendingSnorlaxId: string | null;
  eventFlags: string[];
  badges: string[];
  storyStep: 'START' | 'OAK_STOPPED' | 'IN_LAB' | 'PICKED_STARTER' | 'RIVAL_BATTLE' | 'EXPLORING';
  defeatedTrainers: string[];
  lastHealLocation: { map: MapID; pos: Position };
  
  inventory: InventoryCounts;
  playerTeam: Pokemon[];
  pcStorage: Pokemon[];
  money: number;
  pickedItemIds: string[];
  pokedex: PokedexState;
  activeBattle: BattleState | null;

  musicMuted: boolean;
  musicVolume: number;
  sfxMuted: boolean;
  sfxVolume: number;
  lastOverworldPos: Position | null;
  lastOverworldDir: Direction | null;

  isSurfing: boolean;
  flashActive: boolean;
  visitedTowns: string[];
  /** Persisted tile mutations keyed by "mapId:x:y" → serialized Tile */
  modifiedTiles: Record<string, { type: string; walkable: boolean }>;
}

const safeLocalStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage.getItem(name);
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
      window.localStorage.removeItem(name);
    }
  },
};

const INITIAL_SAVE_STATE: GameSaveState = {
  // Start upstairs in the player's house (tile 4,4 = center of the room).
  playerPos: { x: 4, y: 4 },
  direction: 'down',
  currentMap: 'PLAYERS_HOUSE_2F',

  hasPokedex: false,
  hasParcel: false,
  hasSilphScope: false,
  hasPokeFlute: false,
  hasSsTicket: false,
  clearedSnorlax: [],
  pendingSnorlaxId: null,
  eventFlags: [],
  badges: [],
  storyStep: 'START',
  defeatedTrainers: [],
  // FireRed PalletTown_PlayersHouse_1F door is at (4,8)/(5,8); land one tile
  // inside so the next move doesn't immediately re-warp out.
  lastHealLocation: { map: 'PLAYERS_HOUSE_1F', pos: { x: 5, y: 7 } },
  
  inventory: { POTION: 5, POKEBALL: 10 },
  playerTeam: [],
  pcStorage: [],
  money: 3000,
  pickedItemIds: [],
  pokedex: {},
  activeBattle: null,

  musicMuted: false,
  musicVolume: 0.5,
  sfxMuted: false,
  sfxVolume: 0.7,
  lastOverworldPos: { x: 123, y: 202 },
  lastOverworldDir: 'up',

  isSurfing: false,
  flashActive: false,
  visitedTowns: ['PALLET_TOWN'],
  modifiedTiles: {},
};

interface GameState extends GameSaveState {
  setGrassEffect: (pos: Position | null) => void;
  setSpottedTrainerId: (id: string | null) => void;
  setSpottedTrainerPos: (pos: SetStateAction<Position | null>) => void;
  setEnemyPokemon: (p: Pokemon | null) => void;
  setIsTrainerBattle: (v: boolean) => void;
  setTrainerBattleSprite: (url: string | null) => void;
  setBattleLog: (log: string) => void;
  setBattleLogs: (logs: SetStateAction<BattleLogEntry[]>) => void;
  setCatchResult: (v: boolean | null) => void;

  isMoving: boolean;
  
  phase: GamePhase;
  showMoves: boolean;
  dialogue: string | null;
  dialogueCallback: (() => void) | null;
  /**
   * Modal yes/no confirmation. When non-null, the DialogueBox renders Sí/No
   * buttons (and disables the click-to-advance behaviour) so the player has
   * to make an explicit choice before the prompt closes.
   */
  confirm: { text: string; onYes: () => void; onNo: () => void } | null;
  teleportError: string | null;
  oakCutscenePos: Position | null;
  oakCutsceneDir: Direction | null;
  isLocked: boolean;
  showBattleTransition: boolean;
  
  // New Viz/Battle state moved to store
  grassEffect: Position | null;
  spottedTrainerId: string | null;
  spottedTrainerPos: Position | null;
  enemyPokemon: Pokemon | null;
  isTrainerBattle: boolean;
  trainerBattleSprite: string | null;
  battleLog: string;
  battleLogs: BattleLogEntry[];
  catchResult: boolean | null;
  ghostMode: boolean;
  showMinimap: boolean;
  viewMode: '2d' | '3d';
  wildPokemon: WildPokemonEntity[];
  
  worldMaps: typeof worldConfig.maps;

  getNPCs: () => Record<MapID, Entity[]>;
  getItems: () => Record<MapID, Entity[]>;
  
  setPlayerPos: (pos: Position) => void;
  setDirection: (dir: Direction) => void;
  setCurrentMap: (mapId: MapID) => void;
  setIsMoving: (isMoving: boolean) => void;
  
  setPhase: (phase: SetStateAction<GamePhase>) => void;
  setShowMoves: (show: boolean) => void;
  
  setHasPokedex: (v: boolean) => void;
  setHasParcel: (v: boolean) => void;
  setHasSilphScope: (v: boolean) => void;
  setHasPokeFlute: (v: boolean) => void;
  setHasSsTicket: (v: boolean) => void;
  setClearedSnorlax: (ids: string[]) => void;
  setPendingSnorlaxId: (id: string | null) => void;
  setEventFlag: (flag: string) => void;
  setBadges: (badges: SetStateAction<string[]>) => void;
  setDefeatedTrainers: (ids: SetStateAction<string[]>) => void;
  setDialogue: (text: string | null, onComplete?: () => void) => void;
  setConfirm: (c: { text: string; onYes: () => void; onNo: () => void } | null) => void;
  setTeleportError: (err: string | null) => void;
  setOakCutscenePos: (pos: Position | null, dir?: Direction | null) => void;
  setIsLocked: (locked: boolean) => void;
  setStoryStep: (step: SetStateAction<GameState['storyStep']>) => void;
  setLastHealLocation: (loc: { map: MapID; pos: Position }) => void;
  setInventory: (inventory: SetStateAction<InventoryCounts>) => void;
  setPlayerTeam: (team: SetStateAction<Pokemon[]>) => void;
  setPcStorage: (pc: SetStateAction<Pokemon[]>) => void;
  setPickedItemIds: (ids: SetStateAction<string[]>) => void;
  
  addInventoryItem: (item: string) => void;
  removeInventoryItem: (item: string) => void;
  updateTeam: (team: Pokemon[]) => void;
  updatePcStorage: (pc: Pokemon[]) => void;
  updatePokedex: (pokemonId: string, caught?: boolean) => void;
  
  setMoney: (money: SetStateAction<number>) => void;
  setActiveBattle: (battle: BattleState | null) => void;
  setWildPokemon: (pokemon: SetStateAction<WildPokemonEntity[]>) => void;
  
  syncTeamStats: (battleTeam: Pokemon[]) => void;
  reorderTeam: (startIndex: number, endIndex: number) => void;
  toggleGhostMode: () => void;
  toggleMinimap: () => void;
  setViewMode: (mode: '2d' | '3d') => void;

  setMusicMuted: (muted: boolean) => void;
  setMusicVolume: (volume: number) => void;
  toggleMusicMute: () => void;
  setSfxMuted: (muted: boolean) => void;
  setSfxVolume: (volume: number) => void;
  toggleSfxMute: () => void;
  setLastOverworldPos: (pos: Position | null, dir: Direction | null) => void;

  setIsSurfing: (v: boolean) => void;
  setFlashActive: (v: boolean) => void;
  addVisitedTown: (town: string) => void;
  setModifiedTile: (mapId: MapID, x: number, y: number, tile: Tile | null) => void;

  resetGame: () => void;
}

const ensureUid = (p: Pokemon) => p.uid ? p : { ...p, uid: Math.random().toString(36).substring(2, 9) };

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL_SAVE_STATE,
      
      isMoving: false,
      
      phase: EXPLORING,
      showMoves: false,
      dialogue: null,
      dialogueCallback: null,
      confirm: null,
      teleportError: null,
      oakCutscenePos: null,
      oakCutsceneDir: null,
      isLocked: false,
      showBattleTransition: false,

      grassEffect: null,
      spottedTrainerId: null,
      spottedTrainerPos: null,
      enemyPokemon: null,
      isTrainerBattle: false,
      trainerBattleSprite: null,
      battleLog: '',
      battleLogs: [],
      catchResult: null,
      ghostMode: false,
      showMinimap: false,
      viewMode: '2d',
      wildPokemon: [],
      
      worldMaps: worldConfig.maps,

      getNPCs: () => {
        const state = get();
        return buildNPCDatabase(
          state.playerTeam, state.hasParcel, state.hasPokedex, state.badges, state.storyStep,
          state.oakCutscenePos, state.oakCutsceneDir,
          state.hasSilphScope, state.hasPokeFlute, state.hasSsTicket, state.clearedSnorlax
        );
      },
      getItems: () => {
        const state = get();
        return buildItemDatabase(state.pickedItemIds, state.storyStep);
      },
      
      setPlayerPos: (pos) => set({ playerPos: pos }),
      setDirection: (dir) => set({ direction: dir }),
      setCurrentMap: (map) => set({ currentMap: map }),
      setIsMoving: (isM) => set({ isMoving: isM }),
      
      setPhase: (phase) => set((state) => ({ phase: typeof phase === 'function' ? phase(state.phase) : phase })),
      setShowMoves: (show) => set({ showMoves: show }),
      
      setHasPokedex: (v) => set({ hasPokedex: v }),
      setHasParcel: (v) => set({ hasParcel: v }),
      setHasSilphScope: (v) => set({ hasSilphScope: v }),
      setHasPokeFlute: (v) => set({ hasPokeFlute: v }),
      setHasSsTicket: (v) => set({ hasSsTicket: v }),
      setClearedSnorlax: (ids) => set({ clearedSnorlax: ids }),
      setPendingSnorlaxId: (id) => set({ pendingSnorlaxId: id }),
      setEventFlag: (flag) => set(s => ({ eventFlags: [...s.eventFlags, flag] })),
      setBadges: (badges) => set((state) => ({ badges: typeof badges === 'function' ? badges(state.badges) : badges })),
      setDefeatedTrainers: (ids) => set((state) => ({ defeatedTrainers: typeof ids === 'function' ? ids(state.defeatedTrainers) : ids })),
      setDialogue: (text, onComplete) => set({ dialogue: text, dialogueCallback: onComplete || null }),
      setConfirm: (c) => set({ confirm: c }),
      setTeleportError: (err) => set({ teleportError: err }),
      setOakCutscenePos: (pos, dir) => set({ oakCutscenePos: pos, oakCutsceneDir: dir !== undefined ? dir : null }),
      setIsLocked: (locked) => set({ isLocked: locked }),
      setStoryStep: (step) => set((state) => ({ storyStep: typeof step === 'function' ? step(state.storyStep) : step })),
      setLastHealLocation: (loc) => set({ lastHealLocation: loc }),
      setInventory: (inventory) => set((state) => ({ inventory: typeof inventory === 'function' ? inventory(state.inventory) : inventory })),
      setPlayerTeam: (playerTeam) => set((state) => {
        const next = typeof playerTeam === 'function' ? playerTeam(state.playerTeam) : playerTeam;
        return { playerTeam: next.map(ensureUid) };
      }),
      setPcStorage: (pcStorage) => set((state) => ({ pcStorage: typeof pcStorage === 'function' ? pcStorage(state.pcStorage) : pcStorage })),
      setPickedItemIds: (ids) => set((state) => ({ pickedItemIds: typeof ids === 'function' ? ids(state.pickedItemIds) : ids })),
      
      addInventoryItem: (item) => set((state) => ({ inventory: { ...state.inventory, [item]: (state.inventory[item] ?? 0) + 1 } })),
      removeInventoryItem: (itemName) => set((state) => {
        const nextQty = (state.inventory[itemName] ?? 0) - 1;
        if (nextQty <= 0) {
          const { [itemName]: _removed, ...rest } = state.inventory;
          return { inventory: rest };
        }
        return { inventory: { ...state.inventory, [itemName]: nextQty } };
      }),
      
      updateTeam: (team) => set({ playerTeam: team.map(ensureUid) }),
      updatePcStorage: (pc) => set({ pcStorage: pc }),
      updatePokedex: (pokemonId, caught = false) => set((state) => ({
        pokedex: {
          ...state.pokedex,
          [pokemonId]: {
            seen: true,
            caught: caught || (state.pokedex[pokemonId]?.caught || false),
          }
        }
      })),
      
      setMoney: (money) => set((state) => ({ money: typeof money === 'function' ? money(state.money) : money })),
      setActiveBattle: (battle) => set({ activeBattle: battle }),
      setWildPokemon: (pokemon) => set((state) => ({ wildPokemon: typeof pokemon === 'function' ? pokemon(state.wildPokemon) : pokemon })),
      
      syncTeamStats: (battleTeam) => set((state) => {
        const safeTeam = state.playerTeam.filter(Boolean).map(ensureUid);
        const currentOrderUids = safeTeam.map(p => p.uid);
        const mappedTeam: Pokemon[] = [];
        
        for (const uid of currentOrderUids) {
          const bp = battleTeam.find(p => p.uid === uid) || battleTeam.find(p => p.id === safeTeam.find(s => s.uid === uid)?.id);
          const sp = safeTeam.find(p => p.uid === uid);
          if (bp) mappedTeam.push(ensureUid(bp));
          else if (sp) mappedTeam.push(sp);
        }
        
        for (const bp of battleTeam) {
          if (!bp) continue;
          if (!mappedTeam.some(m => m.uid === bp.uid || m.id === bp.id)) {
            mappedTeam.push(ensureUid(bp));
          }
        }
        
        return { playerTeam: mappedTeam.length ? mappedTeam : state.playerTeam };
      }),

      reorderTeam: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.playerTeam);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { playerTeam: result };
      }),

      toggleGhostMode: () => set((state) => ({ ghostMode: !state.ghostMode })),
      toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
      setViewMode: (mode) => set({ viewMode: mode }),

      setMusicMuted: (muted) => set({ musicMuted: muted }),
      setMusicVolume: (volume) => set({ musicVolume: volume }),
      toggleMusicMute: () => set((state) => ({ musicMuted: !state.musicMuted })),
      setSfxMuted: (muted) => set({ sfxMuted: muted }),
      setSfxVolume: (volume) => set({ sfxVolume: volume }),
      toggleSfxMute: () => set((state) => ({ sfxMuted: !state.sfxMuted })),
      setLastOverworldPos: (pos, dir) => set({ lastOverworldPos: pos, lastOverworldDir: dir }),

      setIsSurfing: (v) => set({ isSurfing: v }),
      setFlashActive: (v) => set({ flashActive: v }),
      addVisitedTown: (town) => set(s => ({ visitedTowns: s.visitedTowns.includes(town) ? s.visitedTowns : [...s.visitedTowns, town] })),
      setModifiedTile: (mapId, x, y, tile) => set(s => {
        const key = `${mapId}:${x}:${y}`;
        const next = { ...s.modifiedTiles };
        if (tile) {
          next[key] = { type: tile.type, walkable: tile.walkable };
        } else {
          delete next[key];
        }
        return { modifiedTiles: next };
      }),

      setGrassEffect: (pos) => set({ grassEffect: pos }),
      setSpottedTrainerId: (id) => set({ spottedTrainerId: id }),
      setSpottedTrainerPos: (pos) => set((state) => ({ spottedTrainerPos: typeof pos === 'function' ? pos(state.spottedTrainerPos) : pos })),
      setEnemyPokemon: (p) => set({ enemyPokemon: p }),
      setIsTrainerBattle: (v) => set({ isTrainerBattle: v }),
      setTrainerBattleSprite: (url) => set({ trainerBattleSprite: url }),
      setBattleLog: (log) => set({ battleLog: log }),
      setBattleLogs: (logs) => set((state) => ({ battleLogs: typeof logs === 'function' ? logs(state.battleLogs) : logs })),
      setCatchResult: (v) => set({ catchResult: v }),

      resetGame: () => {
        if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
          window.localStorage.removeItem('pokemon-firered-save');
        }
        set((state) => ({
          ...state,
          ...INITIAL_SAVE_STATE,
          phase: EXPLORING,
          dialogue: null,
          dialogueCallback: null,
          confirm: null,
          activeBattle: null,
          enemyPokemon: null,
          isTrainerBattle: false,
          trainerBattleSprite: null,
          battleLog: '',
          battleLogs: [],
          catchResult: null,
          showMoves: false,
          isMoving: false,
          grassEffect: null,
          spottedTrainerId: null,
          spottedTrainerPos: null,
          oakCutscenePos: null,
          oakCutsceneDir: null,
          ghostMode: false,
        }));
      },
    }),
    {
      name: 'pokemon-firered-save-v3',
      storage: createJSONStorage(() => safeLocalStorage),
      onRehydrateStorage: () => (state) => {
        // Backfill evolution data on saves predating EVOLUTION_RULES.
        // Existing wild-spawned / mystery-ball Pokémon have undefined
        // evolutionLevel/evolvesTo and would be stuck at base form.
        const fix = (p: Pokemon): Pokemon => {
          if (p.evolutionLevel != null || p.evolvesTo != null) return p;
          const rule = EVOLUTION_RULES[p.id];
          if (!rule) return p;
          return { ...p, evolutionLevel: rule.evolutionLevel, evolvesTo: rule.evolvesTo };
        };
        if (state) {
          state.playerTeam = state.playerTeam.map(fix);
          state.pcStorage = state.pcStorage.map(fix);
        }
      },
      partialize: (state) => ({
        playerPos: state.playerPos,
        direction: state.direction,
        currentMap: state.currentMap,
        hasPokedex: state.hasPokedex,
        hasParcel: state.hasParcel,
        hasSilphScope: state.hasSilphScope,
        hasPokeFlute: state.hasPokeFlute,
        hasSsTicket: state.hasSsTicket,
        clearedSnorlax: state.clearedSnorlax,
        badges: state.badges,
        storyStep: state.storyStep,
        defeatedTrainers: state.defeatedTrainers,
        lastHealLocation: state.lastHealLocation,
        inventory: state.inventory,
        playerTeam: state.playerTeam,
        pcStorage: state.pcStorage,
        money: state.money,
        pickedItemIds: state.pickedItemIds,
        pokedex: state.pokedex,
        activeBattle: state.activeBattle,
        phase: state.phase,
        musicMuted: state.musicMuted,
        musicVolume: state.musicVolume,
        sfxMuted: state.sfxMuted,
        sfxVolume: state.sfxVolume,
      }),
    }
  )
);

// Expose store for dev tools
if (import.meta.env.DEV) {
  (window as any).__gameStore = useGameStore; // eslint-disable-line @typescript-eslint/no-explicit-any
}
