import { create } from 'zustand';
import { Pokemon, Position, Direction, Move, Entity, NPC } from '../types';
import { generateWorldNPCs, worldConfig } from '../data/worldConfig';

interface GameState {
  // Player Location & Core State
  playerPos: Position;
  direction: Direction;
  currentMap: string;
  isMoving: boolean;
  
  // Game Flags & Progression
  hasPokedex: boolean;
  hasParcel: boolean;
  badges: string[];
  storyStep: 'START' | 'OAK_STOPPED' | 'IN_LAB' | 'PICKED_STARTER' | 'RIVAL_BATTLE' | 'EXPLORING';
  defeatedTrainers: string[];
  lastHealLocation: { map: string; pos: Position };
  
  // Inventories & Teams
  inventory: string[];
  playerTeam: Pokemon[];
  pcStorage: Pokemon[];
  
  // Ephemeral Action State
  dialogue: string | null;
  isLocked: boolean;
  isBattle: boolean;
  showBattleTransition: boolean;
  isCatching: boolean;
  enemyPokemon: Pokemon | null;

  // Active World Database (Mutable by Editor)
  worldMaps: typeof worldConfig.maps;
  teleports: Record<string, Entity[]>;
  items: Record<string, Entity[]>;
  
  // Dynamically evaluated derived states
  getNPCs: () => Record<string, NPC[]>;
  
  // Action dispatchers
  setPlayerPos: (pos: Position) => void;
  setDirection: (dir: Direction) => void;
  setCurrentMap: (mapId: string) => void;
  setIsMoving: (isMoving: boolean) => void;
  
  setDialogue: (text: string | null) => void;
  setIsLocked: (locked: boolean) => void;
  setStoryStep: (step: any) => void;
  setLastHealLocation: (loc: { map: string; pos: Position }) => void;
  
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
  
  // Global Save/Load Handlers
  loadPersistedState: (savePayload: any) => void;
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
  
  inventory: ['POTION', 'POKEBALL'],
  playerTeam: [],
  pcStorage: [],
  
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
  
  setDialogue: (text) => set({ dialogue: text }),
  setIsLocked: (locked) => set({ isLocked: locked }),
  setStoryStep: (step) => set({ storyStep: step }),
  setLastHealLocation: (loc) => set({ lastHealLocation: loc }),
  
  addInventoryItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),
  removeInventoryItem: (itemName) => set((state) => {
    const idx = state.inventory.indexOf(itemName);
    if (idx === -1) return state;
    const nextArr = [...state.inventory];
    nextArr.splice(idx, 1);
    return { inventory: nextArr };
  }),
  
  updateTeam: (team) => set({ playerTeam: team }),
  updatePcStorage: (pc) => set({ pcStorage: pc }),
  
  setBattleState: (isBattle, enemy = null) => set({ isBattle, enemyPokemon: enemy }),
  setEnemyPokemon: (enemy) => set({ enemyPokemon: enemy }),
  setShowBattleTransition: (show) => set({ showBattleTransition: show }),
  setIsCatching: (c) => set({ isCatching: c }),

  loadPersistedState: (data) => set({
    playerPos: data.pos,
    currentMap: data.map,
    playerTeam: data.team,
    inventory: data.inventory,
    defeatedTrainers: data.defeatedTrainers,
    hasPokedex: data.hasPokedex,
    hasParcel: data.hasParcel,
    storyStep: data.storyStep,
    lastHealLocation: data.lastHealLocation || { map: 'PALLET_TOWN', pos: { x: 7, y: 11 } }
  })
}));
