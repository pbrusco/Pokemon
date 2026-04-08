import { create } from 'zustand';
import { Pokemon, Position, Direction, Entity, NPC, InventoryCounts, MapID } from '../types';
import { generateWorldNPCs, worldConfig } from '../data/worldConfig';
import type { SetStateAction } from 'react';

interface GameState {
  // Player Location & Core State
  playerPos: Position;
  direction: Direction;
  currentMap: MapID;
  isMoving: boolean;
  
  // Game Flags & Progression
  hasPokedex: boolean;
  hasParcel: boolean;
  badges: string[];
  storyStep: 'START' | 'OAK_STOPPED' | 'IN_LAB' | 'PICKED_STARTER' | 'RIVAL_BATTLE' | 'EXPLORING';
  defeatedTrainers: string[];
  lastHealLocation: { map: MapID; pos: Position };
  
  // Inventories & Teams
  inventory: InventoryCounts;
  playerTeam: Pokemon[];
  pcStorage: Pokemon[];
  money: number;
  badgeBoostGlitchStacks: number;
  
  // Ephemeral Action State
  dialogue: string | null;
  isLocked: boolean;
  isBattle: boolean;
  showBattleTransition: boolean;
  isCatching: boolean;
  enemyPokemon: Pokemon | null;

  // Active World Database (Mutable by Editor)
  worldMaps: typeof worldConfig.maps;
  teleports: Record<MapID, Entity[]>;
  items: Record<MapID, Entity[]>;
  
  // Dynamically evaluated derived states
  getNPCs: () => Record<MapID, NPC[]>;
  
  // Action dispatchers
  setPlayerPos: (pos: Position) => void;
  setDirection: (dir: Direction) => void;
  setCurrentMap: (mapId: MapID) => void;
  setIsMoving: (isMoving: boolean) => void;
  
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
  
  // State Mutators
  addInventoryItem: (item: string) => void;
  removeInventoryItem: (item: string) => void;
  updateTeam: (team: Pokemon[]) => void;
  updatePcStorage: (pc: Pokemon[]) => void;
  
  // Battle Mutators
  setBattleState: (isBattle: boolean, enemy?: Pokemon | null) => void;
  setEnemyPokemon: (enemy: Pokemon | null) => void;
  setShowBattleTransition: (show: boolean) => void;
  setIsCatching: (c: boolean) => void;
  
  setMoney: (money: SetStateAction<number>) => void;
  setBadgeBoostGlitchStacks: (stacks: SetStateAction<number>) => void;

}

export const useGameStore = create<GameState>((set, get) => ({
  // Core initial states
  playerPos: { x: 10, y: 10 },
  direction: 'down',
  currentMap: 'PALLET_TOWN',
  isMoving: false,
  
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
  badgeBoostGlitchStacks: 0,
  
  dialogue: null,
  isLocked: false,
  isBattle: false,
  showBattleTransition: false,
  isCatching: false,
  enemyPokemon: null,

  worldMaps: worldConfig.maps,
  teleports: worldConfig.teleports,
  items: worldConfig.items,

  getNPCs: () => {
    // Generate NPC mapping tracking live player state booleans 
    // This allows conditional NPC spawns/dialogue strings on the fly!
    const state = get();
    return generateWorldNPCs(state.hasParcel, state.hasPokedex, state.badges);
  },

  setPlayerPos: (pos) => set({ playerPos: pos }),
  setDirection: (dir) => set({ direction: dir }),
  setCurrentMap: (map) => set({ currentMap: map }),
  setIsMoving: (isM) => set({ isMoving: isM }),
  
  setHasPokedex: (v) => set({ hasPokedex: v }),
  setHasParcel: (v) => set({ hasParcel: v }),
  setBadges: (badges) => set((state) => ({
    badges: typeof badges === 'function' ? badges(state.badges) : badges,
  })),
  setDefeatedTrainers: (ids) => set((state) => ({
    defeatedTrainers: typeof ids === 'function' ? ids(state.defeatedTrainers) : ids,
  })),
  setDialogue: (text) => set({ dialogue: text }),
  setIsLocked: (locked) => set({ isLocked: locked }),
  setStoryStep: (step) => set((state) => ({
    storyStep: typeof step === 'function' ? step(state.storyStep) : step,
  })),
  setLastHealLocation: (loc) => set({ lastHealLocation: loc }),
  setInventory: (inventory) => set((state) => ({
    inventory: typeof inventory === 'function' ? inventory(state.inventory) : inventory,
  })),
  setPlayerTeam: (playerTeam) => set((state) => ({
    playerTeam: typeof playerTeam === 'function' ? playerTeam(state.playerTeam) : playerTeam,
  })),
  setPcStorage: (pcStorage) => set((state) => ({
    pcStorage: typeof pcStorage === 'function' ? pcStorage(state.pcStorage) : pcStorage,
  })),
  
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
  
  setMoney: (money) => set((state) => ({ money: typeof money === 'function' ? money(state.money) : money })),
  setBadgeBoostGlitchStacks: (stacks) => set((state) => ({ badgeBoostGlitchStacks: typeof stacks === 'function' ? stacks(state.badgeBoostGlitchStacks) : stacks })),

  setBattleState: (isBattle, enemy = null) => set({ isBattle, enemyPokemon: enemy }),
  setEnemyPokemon: (enemy) => set({ enemyPokemon: enemy }),
  setShowBattleTransition: (show) => set({ showBattleTransition: show }),
  setIsCatching: (c) => set({ isCatching: c }),

}));

// Expose store for dev tools / preview testing
if (import.meta.env.DEV) {
  (window as any).__gameStore = useGameStore;
}
