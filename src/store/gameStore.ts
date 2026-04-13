import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Pokemon, Position, Direction, Entity, NPC, InventoryCounts, MapID, PokedexState } from '../types';
import { worldConfig } from '../data/worldConfig';
import { buildNPCDatabase, buildItemDatabase } from '../data/npcDatabase';
import { GamePhase, EXPLORING } from '../types/gamePhase';
import type { BattleState } from '../lib/battleEngine';
import type { SetStateAction } from 'react';

// Define the shape of all properties that go into JSON
interface GameSaveState {
  playerPos: Position;
  direction: Direction;
  currentMap: MapID;
  
  hasPokedex: boolean;
  hasParcel: boolean;
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
}

const INITIAL_SAVE_STATE: GameSaveState = {
  playerPos: { x: 10, y: 10 },
  direction: 'down',
  currentMap: 'PALLET_TOWN',
  
  hasPokedex: false,
  hasParcel: false,
  badges: [],
  storyStep: 'START',
  defeatedTrainers: [],
  lastHealLocation: { map: 'PALLET_TOWN', pos: { x: 7, y: 11 } },
  
  inventory: { POTION: 1, POKEBALL: 1 },
  playerTeam: [],
  pcStorage: [],
  money: 3000,
  pickedItemIds: [],
  pokedex: {},
  activeBattle: null,
};

interface GameState extends GameSaveState {
  isMoving: boolean;
  badgeBoostGlitchStacks: number;
  
  phase: GamePhase;
  showMoves: boolean;
  isMuted: boolean;
  dialogue: string | null;
  isLocked: boolean;
  showBattleTransition: boolean;
  
  worldMaps: typeof worldConfig.maps;
  teleports: Record<MapID, Entity[]>;
  
  getNPCs: () => Record<MapID, NPC[]>;
  getItems: () => Record<MapID, Entity[]>;
  
  setPlayerPos: (pos: Position) => void;
  setDirection: (dir: Direction) => void;
  setCurrentMap: (mapId: MapID) => void;
  setIsMoving: (isMoving: boolean) => void;
  
  setPhase: (phase: SetStateAction<GamePhase>) => void;
  setShowMoves: (show: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  
  setHasPokedex: (v: boolean) => void;
  setHasParcel: (v: boolean) => void;
  setBadges: (badges: SetStateAction<string[]>) => void;
  setDefeatedTrainers: (ids: SetStateAction<string[]>) => void;
  setDialogue: (text: string | null) => void;
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
  setBadgeBoostGlitchStacks: (stacks: SetStateAction<number>) => void;
  setActiveBattle: (battle: BattleState | null) => void;
  
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL_SAVE_STATE,
      
      isMoving: false,
      badgeBoostGlitchStacks: 0,
      
      phase: EXPLORING,
      showMoves: false,
      isMuted: false, // Will sync with exact sound defaults
      dialogue: null,
      isLocked: false,
      showBattleTransition: false,
      
      worldMaps: worldConfig.maps,
      teleports: worldConfig.teleports,
      
      getNPCs: () => {
        const state = get();
        return buildNPCDatabase(state.playerTeam, state.hasParcel, state.hasPokedex, state.badges, state.storyStep);
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
      setIsMuted: (muted) => set({ isMuted: muted }),
      
      setHasPokedex: (v) => set({ hasPokedex: v }),
      setHasParcel: (v) => set({ hasParcel: v }),
      setBadges: (badges) => set((state) => ({ badges: typeof badges === 'function' ? badges(state.badges) : badges })),
      setDefeatedTrainers: (ids) => set((state) => ({ defeatedTrainers: typeof ids === 'function' ? ids(state.defeatedTrainers) : ids })),
      setDialogue: (text) => set({ dialogue: text }),
      setIsLocked: (locked) => set({ isLocked: locked }),
      setStoryStep: (step) => set((state) => ({ storyStep: typeof step === 'function' ? step(state.storyStep) : step })),
      setLastHealLocation: (loc) => set({ lastHealLocation: loc }),
      setInventory: (inventory) => set((state) => ({ inventory: typeof inventory === 'function' ? inventory(state.inventory) : inventory })),
      setPlayerTeam: (playerTeam) => set((state) => ({ playerTeam: typeof playerTeam === 'function' ? playerTeam(state.playerTeam) : playerTeam })),
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
      
      updateTeam: (team) => set({ playerTeam: team }),
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
      setBadgeBoostGlitchStacks: (stacks) => set((state) => ({ badgeBoostGlitchStacks: typeof stacks === 'function' ? stacks(state.badgeBoostGlitchStacks) : stacks })),
      setActiveBattle: (battle) => set({ activeBattle: battle }),
      
      resetGame: () => set((state) => ({ ...state, ...INITIAL_SAVE_STATE })),
    }),
    {
      name: 'pokemon-firered-save',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playerPos: state.playerPos,
        direction: state.direction,
        currentMap: state.currentMap,
        hasPokedex: state.hasPokedex,
        hasParcel: state.hasParcel,
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
      }),
    }
  )
);

// Expose store for dev tools / demoMode testing
if (import.meta.env.DEV) {
  (window as any).__gameStore = useGameStore;
}
