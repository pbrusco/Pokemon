/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Home, 
  Trees as Tree, 
  DoorOpen, 
  MessageSquare, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Backpack,
  Settings,
  Map as MapIcon,
  Package,
  Zap,
  Circle,
  X,
  Gamepad2
} from 'lucide-react';
import { Direction, Position, TILE_SIZE, GRID_SIZE, NPC, Entity, Pokemon, Move, InventoryItem, Tile, MapID, MAP_IDS, InventoryCounts } from './types';
import { GamePhase, BattlePhase, EXPLORING, MENU, INVENTORY, TEAM, SHOP, POKEDEX, PC, EDITOR, BATTLE_TRANSITION, BLACKOUT, HEALING, battle, B_CHOOSING, B_PLAYER_ATTACK, B_ENEMY_ATTACK, B_PLAYER_FAINTED, B_FORCED_SWITCH, B_ENEMY_FAINTED, B_CATCHING, B_LEVEL_UP, B_EVOLVING, B_BATTLE_INVENTORY, B_BATTLE_TEAM } from './types/gamePhase';
import { MAP_PALLET_TOWN, MAP_OAKS_LAB, MAP_ROUTE_1, MAP_VIRIDIAN_CITY, MAP_POKECENTER, MAP_POKEMART, MAP_VIRIDIAN_FOREST, MAP_PEWTER_CITY, MAP_PEWTER_GYM, MAP_ROUTE_3 } from './data/maps';
import { soundManager } from './lib/sounds';
import { MOVES, STARTERS, EVOLUTIONS, WILD_POKEMON_DATABASE, POKEMON_LIST, ITEMS_DATABASE, BASE_STATS, makePokemon } from './constants';
import { calculateDamage, calcHp, doesMoveHit, ZERO_BOOSTS } from './lib/damage';
import { InventoryUI } from './components/InventoryUI';
import { TeamMenuUI } from './components/TeamMenuUI';
import { DialogueBox } from './components/DialogueBox';
import { MapEditor } from './components/MapEditor';
import { PokedexUI } from './components/PokedexUI';
import { PCStorageUI } from './components/PCStorageUI';
import { BattleScreen } from './components/BattleScreen';
import { Joystick } from './components/Joystick';
import { useInteractionEngine } from './hooks/useInteractionEngine';

// --- Constants & Data ---

// --- Components ---

const NPCComponent = ({ npc, isSpotted }: { npc: NPC, key?: string, isSpotted?: boolean }) => {
  return (
    <motion.div
      className="absolute top-0 left-0 flex items-center justify-center"
      animate={{
        x: npc.position.x * TILE_SIZE,
        y: npc.position.y * TILE_SIZE,
      }}
      style={{ width: TILE_SIZE, height: TILE_SIZE, zIndex: 20 + npc.position.y }}
    >
      <div className="relative">
        {/* Exclamation mark when spotted */}
        <AnimatePresence>
          {isSpotted && (
            <motion.div
              key="exclamation"
              initial={{ opacity: 0, y: 8, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-14 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center"
            >
              <div className="bg-white border-2 border-[#383838] rounded-sm px-2 py-0.5 shadow-lg">
                <span className="text-[#f83838] font-black text-xl leading-none">!</span>
              </div>
              <div className="w-2 h-2 bg-white border-b-2 border-r-2 border-[#383838] rotate-45 -mt-1" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm" />
        <div className="w-11 h-13 bg-white rounded-lg border-[3px] border-[#383838] shadow-md flex flex-col items-center overflow-hidden">
          {/* Hair/Head */}
          <div className="w-full h-1/3 bg-[#d8d8d8] border-b-2 border-[#383838]" />
          {/* Face */}
          <div className="w-full h-1/3 bg-[#f8d8b0] flex items-center justify-center gap-1">
            <div className="w-0.5 h-0.5 bg-[#383838] rounded-full" />
            <div className="w-0.5 h-0.5 bg-[#383838] rounded-full" />
          </div>
          {/* Body */}
          <div className="w-full h-1/3 bg-[#f8f8f8]" />
        </div>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1 rounded-full border-2 border-[#58c8f8] shadow-sm">
          <span className="text-[11px] font-black text-[#383838] whitespace-nowrap uppercase tracking-wider">{npc.name}</span>
        </div>
      </div>
    </motion.div>
  );
};

const SHOP_PRICES: Record<string, number> = { POTION: 200, POKEBALL: 200 };
const SAVE_SLOT_NAMES: Record<string, string> = { slot1: 'Perfil 1', slot2: 'Perfil 2', slot3: 'Perfil 3' };

const ShopUI = ({ onBuy, onClose, money }: { onBuy: (itemId: string) => void, onClose: () => void, money: number }) => {
  const shopItems = ['POTION', 'POKEBALL'];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-black italic tracking-tighter uppercase">Poké Mart</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="px-6 pt-4 pb-2 flex justify-between items-center bg-blue-50 border-b border-blue-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tu dinero</span>
          <span className="font-mono font-black text-blue-700 text-lg">₽{money.toLocaleString()}</span>
        </div>
        <div className="p-6 space-y-4">
          {shopItems.map(id => {
            const item = ITEMS_DATABASE[id];
            const price = SHOP_PRICES[id];
            const canAfford = money >= price;
            return (
              <button
                key={id}
                onClick={() => {
                  if (!canAfford) return;
                  onBuy(id);
                  soundManager.play('SELECT');
                }}
                disabled={!canAfford}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${canAfford ? 'bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer' : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'}`}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-slate-800 uppercase text-sm">{item.name}</h3>
                  <p className="text-[10px] text-slate-500">Objeto útil para tu viaje</p>
                </div>
                <span className={`font-mono font-bold ${canAfford ? 'text-blue-600' : 'text-slate-400'}`}>₽{price}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

const BattleTransition = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <motion.div 
      initial={{ scale: 0, rotate: 0, opacity: 0 }}
      animate={{ 
        scale: [0, 1.5, 1], 
        rotate: [0, 360, 720], 
        opacity: [0, 1, 1] 
      }}
      exit={{ opacity: 0, scale: 2 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
    >
      <div className="w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,transparent_70%)]" />
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className="absolute text-white font-black text-6xl italic tracking-tighter"
      >
        ¡BATTLE!
      </motion.div>
    </motion.div>
  );
};

interface TileProps {
  type: string;
  key?: string;
  hasEncounters?: boolean;
}


// --- Main App ---


// --- Main App ---

const GameTile = ({ type, isGrassActive, hasEncounters }: TileProps & { isGrassActive?: boolean }) => {
  const isEncounterGrass = type === 'grass' && hasEncounters;
  const getTileStyle = () => {
    switch (type) {
      case 'grass': return isEncounterGrass ? 'bg-[#48a868] border-[#389858]/40' : 'bg-[#88d8b0] border-[#78c8a0]/30';
      case 'path': return 'bg-[#e0f8d0] border-[#d0e8c0]/50';
      case 'wall': return 'bg-[#f8f8f8] border-[#d8d8d8]';
      case 'door': return 'bg-[#a05030] border-[#803010]';
      case 'floor': return 'bg-[#f0f0f0] border-[#e0e0e0]';
      case 'carpet': return 'bg-[#f85858] border-[#d83838]';
      case 'table': return 'bg-[#d8d8d8] border-[#383838]';
      case 'tree': return 'bg-[#88d8b0] border-[#78c8a0]/30';
      case 'cut_tree': return 'bg-[#72c08f] border-[#4c9b6b]';
      case 'boulder': return 'bg-[#b8b8b8] border-[#8a8a8a]';
      case 'sign': return 'bg-[#e0f8d0] border-[#d0e8c0]/50';
      default: return 'bg-white';
    }
  };

  return (
    <div 
      className={`w-[${TILE_SIZE}px] h-[${TILE_SIZE}px] border-[0.5px] relative overflow-hidden transition-colors duration-500 ${getTileStyle()}`}
      style={{ width: TILE_SIZE, height: TILE_SIZE }}
    >
      {type === 'sign' && (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
          <div className="w-1 h-3 bg-[#a05030] border-x-2 border-[#383838] absolute bottom-2" />
          <div className="w-10 h-8 bg-[#d8b888] border-2 border-[#383838] rounded-sm absolute bottom-5 flex flex-col items-center justify-center gap-1">
            <div className="w-6 h-0.5 bg-[#383838]/20" />
            <div className="w-6 h-0.5 bg-[#383838]/20" />
          </div>
        </div>
      )}
      {type === 'tree' && (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
          <div className="absolute bottom-0 w-6 h-10 bg-[#a05030] border-2 border-[#383838] rounded-sm" />
        </div>
      )}
      {type === 'cut_tree' && (
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="w-10 h-10 bg-[#3d8b5b] border-2 border-[#24563a] rounded-md shadow-sm" />
        </div>
      )}
      {type === 'boulder' && (
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="w-10 h-10 bg-[#9a9a9a] border-2 border-[#6f6f6f] rounded-full shadow-sm" />
        </div>
      )}
      {type === 'grass' && !isEncounterGrass && (
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full bg-[radial-gradient(circle,#58a880_1px,transparent_1px)] bg-[size:12px_12px]" />
          <div className="absolute top-2 left-2 w-1 h-2 bg-[#58a880] rounded-full rotate-12" />
          <div className="absolute bottom-3 right-4 w-1 h-3 bg-[#58a880] rounded-full -rotate-12" />
        </div>
      )}
      {isEncounterGrass && (
        <div className="absolute inset-0">
          {/* Tall grass blades */}
          <div className="absolute bottom-1 left-2 w-1 h-5 bg-[#2d7a48] rounded-t-full rotate-[-8deg] origin-bottom" />
          <div className="absolute bottom-1 left-4 w-1 h-7 bg-[#38904f] rounded-t-full rotate-[5deg] origin-bottom" />
          <div className="absolute bottom-1 left-6 w-1 h-5 bg-[#2d7a48] rounded-t-full rotate-[-3deg] origin-bottom" />
          <div className="absolute bottom-1 left-8 w-1 h-8 bg-[#227040] rounded-t-full rotate-[10deg] origin-bottom" />
          <div className="absolute bottom-1 left-10 w-1 h-6 bg-[#38904f] rounded-t-full rotate-[-6deg] origin-bottom" />
          <div className="absolute bottom-1 right-3 w-1 h-7 bg-[#2d7a48] rounded-t-full rotate-[4deg] origin-bottom" />
          <div className="absolute bottom-1 right-6 w-1 h-5 bg-[#38904f] rounded-t-full rotate-[-8deg] origin-bottom" />
        </div>
      )}
      <AnimatePresence>
        {type === 'grass' && isGrassActive && (
          <motion.div
            key="grass-rustle"
            initial={{ opacity: 0, scale: 0.6, y: 4 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.1, 1, 0.8], y: [4, -2, 0, 2] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none text-base"
          >
            🌿
          </motion.div>
        )}
      </AnimatePresence>
      {type === 'wall' && (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-full h-1/3 bg-[#f85858] border-b-2 border-[#383838]" />
          <div className="w-full h-2/3 bg-[#f8f8f8] flex items-center justify-center">
             <div className="w-4 h-4 border-2 border-[#d8d8d8] rounded-sm" />
          </div>
        </div>
      )}
      {type === 'door' && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-10 h-12 bg-[#a05030] border-2 border-[#383838] rounded-t-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-yellow-400 rounded-full ml-4" />
          </div>
        </div>
      )}
      {type === 'carpet' && (
        <div className="w-full h-full flex items-center justify-center opacity-40">
          <div className="w-8 h-2 bg-white/30 rounded-full" />
        </div>
      )}
      {type === 'table' && (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-full h-1/2 bg-[#d8d8d8] border-b-2 border-[#383838]" />
          <div className="w-full h-1/2 bg-[#b8b8b8]" />
        </div>
      )}
      {type === 'path' && (
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[radial-gradient(circle,#c0d8b0_1px,transparent_1px)] bg-[size:16px_16px]" />
        </div>
      )}
    </div>
  );
};

const Player = ({ position, direction, isMoving }: { position: Position, direction: Direction, isMoving: boolean }) => {
  const getRotation = () => {
    switch (direction) {
      case 'up': return 0;
      case 'down': return 180;
      case 'left': return -90;
      case 'right': return 90;
      default: return 0;
    }
  };

  return (
    <motion.div
      className="absolute top-0 left-0 flex items-center justify-center"
      initial={false}
      animate={{ 
        x: position.x * TILE_SIZE, 
        y: position.y * TILE_SIZE,
      }}
      transition={{ type: "tween", duration: 0.1, ease: "linear" }}
      style={{ width: TILE_SIZE, height: TILE_SIZE, zIndex: 30 + position.y }}
    >
      <div className="relative">
        {/* Floating Indicator */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        >
          <ChevronDown size={32} strokeWidth={3} />
        </motion.div>

        {/* Shadow */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/40 rounded-full blur-sm" />
        
        {/* Character Sprite */}
        <div 
          className={`w-16 h-16 pointer-events-none drop-shadow-md ${isMoving ? 'animate-walk' : ''}`}
          style={{
            backgroundImage: "url('/player.png')",
            backgroundSize: "400% 300%",
            backgroundPositionX: isMoving ? undefined : "0%",
            backgroundPositionY: direction === 'down' ? '0%' : direction === 'up' ? '50%' : '100%',
            transform: direction === 'right' ? 'scaleX(-1)' : 'none',
            imageRendering: "pixelated",
          }}
        />
      </div>
    </motion.div>
  );
};


// --- Main App ---

export default function App() {
  const [currentMap, setCurrentMap] = useState<MapID>('PALLET_TOWN');
  const [playerPos, setPlayerPos] = useState<Position>({ x: 10, y: 10 });
  const [direction, setDirection] = useState<Direction>('down');
  const [isMoving, setIsMoving] = useState(false);
  const [dialogue, setDialogue] = useState<string | null>("¡Bienvenido a Pueblo Paleta! Usa las flechas para moverte.");
  const [phase, setPhase] = useState<GamePhase>(EXPLORING);
  const [isTrainerBattle, setIsTrainerBattle] = useState(false);
  const [pickedItemIds, setPickedItemIds] = useState<string[]>([]);

  // Phase-derived helpers
  const inBattle = phase.type === 'BATTLE';
  const battlePhase = phase.type === 'BATTLE' ? phase.sub : null;
  const [hasPokedex, setHasPokedex] = useState(false);
  const [hasParcel, setHasParcel] = useState(false);
  const [pokedex, setPokedex] = useState<Record<string, { seen: boolean, caught: boolean }>>({});
  const [pcStorage, setPcStorage] = useState<Pokemon[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [defeatedTrainers, setDefeatedTrainers] = useState<string[]>([]);
  // isBattle and showBattleTransition replaced by phase
  const [grassEffect, setGrassEffect] = useState<{ x: number; y: number } | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    handleResize(); // Update on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [playerTeam, setPlayerTeam] = useState<Pokemon[]>([]);
  const [enemyPokemon, setEnemyPokemon] = useState<Pokemon | null>(null);
  const [battleLog, setBattleLog] = useState("");
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [screenFlash, setScreenFlash] = useState(false);
  const [hitEffect, setHitEffect] = useState<{ x: number, y: number, type: string } | null>(null);
  const [projectile, setProjectile] = useState<{ type: string, from: 'player' | 'enemy' } | null>(null);
  const [damageNumber, setDamageNumber] = useState<{ x: number, y: number, value: number } | null>(null);
  const [healNumber, setHealNumber] = useState<{ x: number, y: number, value: number } | null>(null);
  const [battleShake, setBattleShake] = useState(false);
  // isCatching, isBlackout, isHealing, isLevelUp, isEvolving, forcedSwitch replaced by phase
  const [lastHealLocation, setLastHealLocation] = useState<{ map: MapID; pos: Position }>({ map: 'PALLET_TOWN', pos: { x: 7, y: 11 } });
  const [money, setMoney] = useState(3000);
  const [spottedTrainerId, setSpottedTrainerId] = useState<string | null>(null);
  const [spottedTrainerPos, setSpottedTrainerPos] = useState<Position | null>(null);
  const [overworldShake, setOverworldShake] = useState(false);
  const [badgeBoostGlitchStacks, setBadgeBoostGlitchStacks] = useState(0);
  const [activeSaveSlot, setActiveSaveSlot] = useState('slot1');
  const [playTimeMs, setPlayTimeMs] = useState(0);

  // Story State
  const [storyStep, setStoryStep] = useState<'START' | 'OAK_STOPPED' | 'IN_LAB' | 'PICKED_STARTER' | 'RIVAL_BATTLE' | 'EXPLORING'>('START');
  const [inventory, setInventory] = useState<InventoryCounts>({ POTION: 1, POKEBALL: 1 });
  const hasItem = useCallback((itemId: string) => (inventory[itemId] ?? 0) > 0, [inventory]);
  const addItem = useCallback((itemId: string, amount = 1) => {
    setInventory(prev => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + amount }));
  }, []);
  const removeItem = useCallback((itemId: string, amount = 1) => {
    setInventory(prev => {
      const nextQty = (prev[itemId] ?? 0) - amount;
      if (nextQty <= 0) {
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: nextQty };
    });
  }, []);


  const moveTimeout = useRef<NodeJS.Timeout | null>(null);
  const poisonStepCounter = useRef(0);
  const sessionStartMs = useRef(Date.now());

  // --- Save / Load System ---
  useEffect(() => {
    const slotsRaw = localStorage.getItem('pokemon_save_slots');
    const activeSlot = localStorage.getItem('pokemon_active_slot') || 'slot1';
    setActiveSaveSlot(activeSlot);
    if (slotsRaw) {
      try {
        const slotsPayload = JSON.parse(slotsRaw) as Record<string, { data: any; updatedAt: number; playTimeMs: number }>;
        const selected = slotsPayload[activeSlot]?.data;
        if (!selected) return;
        const data = selected;
        setPlayerPos(data.pos);
        if (MAP_IDS.includes(data.map)) setCurrentMap(data.map);
        setPlayerTeam(data.team);
        const invData = data.inventory;
        if (Array.isArray(invData)) {
          const migrated: InventoryCounts = {};
          for (const id of invData) migrated[id] = (migrated[id] ?? 0) + 1;
          setInventory(migrated);
        } else {
          setInventory(invData ?? {});
        }
        setDefeatedTrainers(data.defeatedTrainers);
        setHasPokedex(data.hasPokedex);
        setHasParcel(data.hasParcel);
        setStoryStep(data.storyStep);
        if (data.lastHealLocation) setLastHealLocation(data.lastHealLocation);
        if (data.pokedex) setPokedex(data.pokedex);
        if (data.money != null) setMoney(data.money);
        if (slotsPayload[activeSlot]?.playTimeMs != null) setPlayTimeMs(slotsPayload[activeSlot].playTimeMs);
      } catch (e) {
        console.error("Error loading save", e);
      }
      return;
    }

    // Backward compatibility: migrate old single-slot save
    const savedData = localStorage.getItem('pokemon_save');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (!data?.team) return;
        setPlayerPos(data.pos);
        if (MAP_IDS.includes(data.map)) setCurrentMap(data.map);
        setPlayerTeam(data.team);
        const invData = data.inventory;
        if (Array.isArray(invData)) {
          const migrated: InventoryCounts = {};
          for (const id of invData) migrated[id] = (migrated[id] ?? 0) + 1;
          setInventory(migrated);
        } else {
          setInventory(invData ?? {});
        }
        setDefeatedTrainers(data.defeatedTrainers);
        setHasPokedex(data.hasPokedex);
        setHasParcel(data.hasParcel);
        setStoryStep(data.storyStep);
        if (data.lastHealLocation) setLastHealLocation(data.lastHealLocation);
        if (data.pokedex) setPokedex(data.pokedex);
        if (data.money != null) setMoney(data.money);
      } catch (e) {
        console.error("Error loading legacy save", e);
      }
    }
  }, []);

  useEffect(() => {
    if (playerTeam.length > 0) {
      const saveData = {
        pos: playerPos,
        map: currentMap,
        team: playerTeam,
        inventory,
        defeatedTrainers,
        hasPokedex,
        hasParcel,
        storyStep,
        lastHealLocation,
        pokedex,
        money
      };
      const slotsRaw = localStorage.getItem('pokemon_save_slots');
      const slotsPayload = slotsRaw ? JSON.parse(slotsRaw) as Record<string, { data: any; updatedAt: number; playTimeMs: number }> : {};
      const totalPlayTime = playTimeMs + (Date.now() - sessionStartMs.current);
      slotsPayload[activeSaveSlot] = {
        data: saveData,
        updatedAt: Date.now(),
        playTimeMs: totalPlayTime,
      };
      localStorage.setItem('pokemon_save_slots', JSON.stringify(slotsPayload));
      localStorage.setItem('pokemon_active_slot', activeSaveSlot);
    }
  }, [activeSaveSlot, playerPos, currentMap, playerTeam, inventory, defeatedTrainers, hasPokedex, hasParcel, storyStep, lastHealLocation, pokedex, money, playTimeMs]);

  useEffect(() => {
    if (inBattle) {
      soundManager.play('BATTLE_START');
    }
  }, [inBattle]);

  // Background music
  useEffect(() => {
    if (inBattle) {
      soundManager.playMusic('BATTLE');
    } else if (currentMap === 'POKECENTER') {
      soundManager.playMusic('POKECENTER');
    } else {
      soundManager.playMusic('OVERWORLD');
    }
  }, [inBattle, currentMap]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
    };
  }, []);

  const maps: Record<MapID, Tile[][]> = {
    PALLET_TOWN: MAP_PALLET_TOWN,
    OAKS_LAB: MAP_OAKS_LAB,
    ROUTE_1: MAP_ROUTE_1,
    VIRIDIAN_CITY: MAP_VIRIDIAN_CITY,
    POKECENTER: MAP_POKECENTER,
    POKEMART: MAP_POKEMART,
    VIRIDIAN_FOREST: MAP_VIRIDIAN_FOREST,
    PEWTER_CITY: MAP_PEWTER_CITY,
    PEWTER_GYM: MAP_PEWTER_GYM,
    ROUTE_3: MAP_ROUTE_3
  };

  const npcs: Record<MapID, NPC[]> = {
    PALLET_TOWN: [
      { id: 'mom', name: 'MAMÁ', type: 'npc', onInteract: 'heal', position: { x: 7, y: 10 }, direction: 'down', dialogue: ["¡Ten cuidado ahí fuera, hijo!", "Recuerda que el Prof. Oak te está buscando."] },
      ...(playerTeam.length === 0 ? [{ id: 'oak_pallet', name: 'PROF. OAK', type: 'npc' as const, position: { x: 10, y: 4 }, direction: 'down' as const, dialogue: ["¡Espera! ¡No vayas por ahí!", "¡Es peligroso ir solo por la hierba alta!", "Ven conmigo a mi laboratorio."] }] : [])
    ],
    OAKS_LAB: [
      { 
        id: 'oak', 
        name: 'PROF. OAK', 
        type: 'npc', 
        onInteract: 'oak_parcel_turnin',
        position: { x: 10, y: 7 }, 
        direction: 'down', 
        dialogue: hasParcel 
          ? ["¡Oh! ¡Es el paquete que pedí!", "¡Gracias! Como recompensa, tomad esto: ¡Una POKÉDEX!", "¡Es un inventario de alta tecnología!"] 
          : hasPokedex 
            ? ["¡La POKÉDEX es un gran invento!", "¡Trata de capturarlos a todos!"]
            : ["¡Hola Pablo! Por fin llegas.", "Toma uno de estos POKÉMON, te ayudará en tu viaje."] 
      },
      { id: 'rival', name: 'AZUL', type: 'npc', position: { x: 11, y: 7 }, direction: 'left', dialogue: ["¡Abuelo! ¡Yo también quiero un POKÉMON!", "¡Ja! Mi POKÉMON es mucho más fuerte que el tuyo."], isRival: true }
    ],
    ROUTE_1: [
      { 
        id: 'youngster_chano', 
        name: 'JOVEN CHANO', 
        type: 'npc', 
        position: { x: 12, y: 10 }, 
        direction: 'left', 
        dialogue: ["¡Eh! ¡Tú! ¡Mis POKÉMON son de lo mejor!", "¡No me ignores cuando te hablo!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('rattata', 'RATTATA', 4, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19)
        ]
      },
      { 
        id: 'bug_catcher', 
        name: 'CAZABICHOS', 
        type: 'npc', 
        position: { x: 7, y: 5 }, 
        direction: 'right', 
        dialogue: ["¿Te gustan los POKÉMON bicho?", "¡Son los más guays del mundo!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('caterpie', 'CATERPIE', 3, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10)
        ]
      }
    ],
    VIRIDIAN_CITY: [
      { id: 'citizen', name: 'CIUDADANO', type: 'npc', position: { x: 10, y: 12 }, direction: 'down', dialogue: ["¡Bienvenido a Ciudad Verde!", "Aquí puedes curar a tus POKÉMON en el Centro."] }
    ],
    POKECENTER: [
      { id: 'joy', name: 'ENFERMERA JOY', type: 'npc', onInteract: 'heal', position: { x: 10, y: 7 }, direction: 'down', dialogue: ["¡Hola! Bienvenida al CENTRO POKÉMON.", "Curaremos a tus POKÉMON hasta que estén a tope."] }
    ],
    POKEMART: [
      { 
        id: 'clerk', 
        name: 'DEPENDIENTE', 
        type: 'npc', 
        position: { x: 7, y: 7 }, 
        direction: 'down', 
        onInteract: 'shop',
        dialogue: (!hasParcel && !hasPokedex) 
          ? ["¡Ah! ¡Tú vienes de PUEBLO PALETA!", "Tengo un paquete para el PROF. OAK. ¿Se lo llevarías?", "¡Gracias! Dile que es de parte de la TIENDA."] 
          : ["¡Hola! ¿En qué puedo ayudarte hoy?"] 
      },
    ],
    VIRIDIAN_FOREST: [
      { 
        id: 'bug_catcher_forest', 
        name: 'CAZABICHOS RICKY', 
        type: 'npc', 
        position: { x: 10, y: 10 }, 
        direction: 'down', 
        dialogue: ["¡Mi POKÉMON bicho es el más fuerte!", "¡No podrás pasar de aquí!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('metapod', 'METAPOD', 6, 'bug', [MOVES.HARDEN, MOVES.TACKLE], 11)
        ]
      }
    ],
    PEWTER_CITY: [
      { id: 'pewter_citizen', name: 'CIUDADANO', type: 'npc', position: { x: 10, y: 15 }, direction: 'down', dialogue: ["¡Bienvenido a Ciudad Plateada!", "Brock es el líder del gimnasio local. ¡Es muy duro!"] }
    ],
    PEWTER_GYM: [
      { 
        id: 'gym_trainer', 
        name: 'ENTRENADOR GYM', 
        type: 'npc', 
        position: { x: 10, y: 11 }, 
        direction: 'down', 
        dialogue: ["¡Para llegar a BROCK tendrás que vencerme!", "¡Mis POKÉMON son duros!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('geodude', 'GEODUDE', 10, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 74, { types: ['rock', 'ground'] })
        ]
      },
      { 
        id: 'brock', 
        name: 'BROCK', 
        type: 'npc', 
        position: { x: 10, y: 7 }, 
        direction: 'down', 
        dialogue: badges.includes('BOULDER') 
          ? ["¡Eres un gran entrenador!", "¡Sigue así!"] 
          : ["¡Soy BROCK! ¡El líder de este gimnasio!", "¡Mis POKÉMON son duros como la roca!", "¡Prepárate para perder!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('geodude', 'GEODUDE', 12, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 74, { types: ['rock', 'ground'] }),
          makePokemon('onix', 'ONIX', 14, 'rock', [MOVES.TACKLE, MOVES.ROCK_THROW], 95, { types: ['rock', 'ground'] })
        ]
      }
    ],
    ROUTE_3: [
      {
        id: 'bug_catcher_rt3',
        name: 'CAZABICHOS LUIS',
        type: 'npc',
        position: { x: 5, y: 6 },
        direction: 'right' as Direction,
        dialogue: ["¡Los bichos son los mejores POKÉMON!", "¡Te voy a demostrar que soy el mejor!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('caterpie', 'CATERPIE', 9, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 10),
          makePokemon('weedle', 'WEEDLE', 9, 'bug', [MOVES.TACKLE, MOVES.STRING_SHOT], 13, { types: ['bug', 'poison'] })
        ]
      },
      {
        id: 'lass_rt3',
        name: 'CHICA ELENA',
        type: 'npc',
        position: { x: 13, y: 11 },
        direction: 'left' as Direction,
        dialogue: ["¡Oye tú! ¡No pases por aquí sin luchar!", "¡Mis POKÉMON son adorables Y fuertes!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('jigglypuff', 'JIGGLYPUFF', 11, 'normal', [MOVES.TACKLE, MOVES.GROWL], 39),
          makePokemon('pidgey', 'PIDGEY', 11, 'flying', [MOVES.TACKLE, MOVES.GUST], 16, { types: ['normal', 'flying'] })
        ]
      },
      {
        id: 'youngster_rt3',
        name: 'CHICO ROBERTO',
        type: 'npc',
        position: { x: 8, y: 14 },
        direction: 'down' as Direction,
        dialogue: ["¡Llevo mis pantalones cortos todo el año!", "¡Eso me hace más fuerte!"],
        isTrainer: true,
        trainerTeam: [
          makePokemon('mankey', 'MANKEY', 12, 'fighting', [MOVES.SCRATCH, MOVES.TACKLE], 56)
        ]
      }
    ]
  };

  const teleports: Record<MapID, Entity[]> = {
    PALLET_TOWN: [
      { id: 'to_lab', type: 'teleport', position: { x: 10, y: 14 }, direction: 'up', targetMap: 'OAKS_LAB', targetPos: { x: 10, y: 14 } },
      { id: 'to_route1', type: 'teleport', position: { x: 10, y: 5 }, direction: 'up', targetMap: 'ROUTE_1', targetPos: { x: 10, y: 19 } }
    ],
    OAKS_LAB: [
      { id: 'to_pallet', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'PALLET_TOWN', targetPos: { x: 10, y: 14 } }
    ],
    ROUTE_1: [
      { id: 'to_pallet_from_route1', type: 'teleport', position: { x: 10, y: 19 }, direction: 'down', targetMap: 'PALLET_TOWN', targetPos: { x: 10, y: 6 } },
      { id: 'to_viridian', type: 'teleport', position: { x: 10, y: 0 }, direction: 'up', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 10, y: 19 } }
    ],
    VIRIDIAN_CITY: [
      { id: 'to_route1_from_viridian', type: 'teleport', position: { x: 10, y: 19 }, direction: 'down', targetMap: 'ROUTE_1', targetPos: { x: 10, y: 1 } },
      { id: 'to_center', type: 'teleport', position: { x: 7, y: 8 }, direction: 'up', targetMap: 'POKECENTER', targetPos: { x: 10, y: 14 } },
      { id: 'to_mart', type: 'teleport', position: { x: 14, y: 8 }, direction: 'up', targetMap: 'POKEMART', targetPos: { x: 10, y: 14 } },
      { id: 'to_forest', type: 'teleport', position: { x: 10, y: 0 }, direction: 'up', targetMap: 'VIRIDIAN_FOREST', targetPos: { x: 10, y: 17 } }
    ],
    POKECENTER: [
      { id: 'to_viridian', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 7, y: 9 } }
    ],
    POKEMART: [
      { id: 'to_viridian', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 14, y: 9 } }

    ],
    VIRIDIAN_FOREST: [
      { id: 'to_viridian_from_forest', type: 'teleport', position: { x: 10, y: 18 }, direction: 'down', targetMap: 'VIRIDIAN_CITY', targetPos: { x: 10, y: 1 } },
      { id: 'to_pewter', type: 'teleport', position: { x: 10, y: 0 }, direction: 'up', targetMap: 'PEWTER_CITY', targetPos: { x: 10, y: 17 } }
    ],
    PEWTER_CITY: [
      { id: 'to_forest_from_pewter', type: 'teleport', position: { x: 10, y: 17 }, direction: 'down', targetMap: 'VIRIDIAN_FOREST', targetPos: { x: 10, y: 1 } },
      { id: 'to_gym', type: 'teleport', position: { x: 10, y: 13 }, direction: 'up', targetMap: 'PEWTER_GYM', targetPos: { x: 10, y: 14 } },
      { id: 'to_route3', type: 'teleport', position: { x: 17, y: 8 }, direction: 'right', targetMap: 'ROUTE_3', targetPos: { x: 1, y: 8 } }
    ],
    PEWTER_GYM: [
      { id: 'to_pewter_from_gym', type: 'teleport', position: { x: 10, y: 15 }, direction: 'down', targetMap: 'PEWTER_CITY', targetPos: { x: 10, y: 14 } }
    ],
    ROUTE_3: [
      { id: 'to_pewter_from_route3', type: 'teleport', position: { x: 0, y: 8 }, direction: 'left', targetMap: 'PEWTER_CITY', targetPos: { x: 16, y: 8 } }
    ]
  };

  const rawItems: Record<MapID, Entity[]> = {
    OAKS_LAB: [
      { id: 'starter_1', type: 'item', position: { x: 9, y: 8 }, direction: 'down', sprite: STARTERS[0].sprite },
      { id: 'starter_2', type: 'item', position: { x: 10, y: 8 }, direction: 'down', sprite: STARTERS[1].sprite },
      { id: 'starter_3', type: 'item', position: { x: 11, y: 8 }, direction: 'down', sprite: STARTERS[2].sprite },
    ],
    PALLET_TOWN: [
      { id: 'sign_home', type: 'object', position: { x: 8, y: 10 }, direction: 'down', sprite: '🪧' },
      { id: 'sign_rival', type: 'object', position: { x: 12, y: 10 }, direction: 'down', sprite: '🪧' },
      { id: 'sign_lab', type: 'object', position: { x: 11, y: 14 }, direction: 'down', sprite: '🪧' },
    ],
    ROUTE_1: [
      { id: 'sign_route1', type: 'object', position: { x: 8, y: 15 }, direction: 'down', sprite: '🪧' },
      { id: 'item_potion_1', type: 'item', position: { x: 12, y: 5 }, direction: 'down', sprite: '🧪' }
    ],
    VIRIDIAN_CITY: [],
    POKECENTER: [],
    POKEMART: [],
    VIRIDIAN_FOREST: [
      { id: 'item_pokeball_1', type: 'item', position: { x: 5, y: 5 }, direction: 'down', sprite: '🔴' },
      { id: 'item_potion_forest', type: 'item', position: { x: 15, y: 15 }, direction: 'down', sprite: '🧪' }
    ],
    PEWTER_CITY: [],
    PEWTER_GYM: [],
    ROUTE_3: []
  };
  const items: Record<MapID, Entity[]> = Object.fromEntries(
    Object.entries(rawItems).map(([map, entities]) => [
      map, entities.filter(e => !pickedItemIds.includes(e.id))
    ])
  ) as Record<MapID, Entity[]>;

  const handlePCSwap = (teamIdx: number, pcIdx: number) => {
    const newTeam = [...playerTeam];
    const newPC = [...pcStorage];
    const temp = newTeam[teamIdx];
    newTeam[teamIdx] = newPC[pcIdx];
    newPC[pcIdx] = temp;
    setPlayerTeam(newTeam);
    setPcStorage(newPC);
    soundManager.play('SELECT');
  };

  const updatePokedex = (pokemonId: string, caught = false) => {
    setPokedex(prev => ({
      ...prev,
      [pokemonId]: {
        seen: true,
        caught: caught || (prev[pokemonId]?.caught || false)
      }
    }));
  };

  const { handleAction } = useInteractionEngine({
    dialogue,
    inBattle,
    playerPos,
    direction,
    currentMap,
    hasParcel,
    hasPokedex,
    badges,
    inventory,
    playerTeam,
    npcs,
    items,
    maps,
    setDialogue,
    setPhase,
    setPlayerTeam,
    setLastHealLocation,
    setHasParcel,
    setHasPokedex,
    setInventory,
    setPickedItemIds,
    setStoryStep,
    setEnemyPokemon,
    setIsTrainerBattle,
  });

  const gameState = useRef({ playerPos, direction, isMoving, dialogue, inBattle, phaseType: phase.type, currentMap, playerTeam, maps, teleports, npcs, items, defeatedTrainers, inventory, storyStep });
  useEffect(() => {
    gameState.current = { playerPos, direction, isMoving, dialogue, inBattle, phaseType: phase.type, battleSubPhase: phase.type === 'BATTLE' ? phase.sub.type : null, currentMap, playerTeam, maps, teleports, npcs, items, defeatedTrainers, inventory, storyStep };
  }, [playerPos, direction, isMoving, dialogue, inBattle, phase, currentMap, playerTeam, maps, teleports, npcs, items, defeatedTrainers, inventory, storyStep]);

  const resetGame = useCallback(() => {
    const slotsRaw = localStorage.getItem('pokemon_save_slots');
    if (slotsRaw) {
      try {
        const slotsPayload = JSON.parse(slotsRaw) as Record<string, { data: any; updatedAt: number; playTimeMs: number }>;
        delete slotsPayload[activeSaveSlot];
        localStorage.setItem('pokemon_save_slots', JSON.stringify(slotsPayload));
      } catch {
        localStorage.removeItem('pokemon_save_slots');
      }
    }
    localStorage.removeItem('pokemon_save');
    setCurrentMap('PALLET_TOWN');
    setPlayerPos({ x: 10, y: 10 });
    setDirection('down');
    setIsMoving(false);
    setDialogue("¡Bienvenido a Pueblo Paleta! Usa las flechas para moverte.");
    setPhase(EXPLORING);
    setHasPokedex(false);
    setHasParcel(false);
    setPokedex({});
    setPcStorage([]);
    setBadges([]);
    setDefeatedTrainers([]);
    setPickedItemIds([]);
    setPlayerTeam([]);
    setEnemyPokemon(null);
    setBattleLog("");
    setPlayerAnim('idle');
    setEnemyAnim('idle');
    setScreenFlash(false);
    setHitEffect(null);
    setProjectile(null);
    setDamageNumber(null);
    setBattleShake(false);
    setStoryStep('START');
    setInventory({ POTION: 1, POKEBALL: 1 });
    setPlayTimeMs(0);
    sessionStartMs.current = Date.now();
    soundManager.play('SELECT');
  }, [activeSaveSlot]);

  const handleMove = useCallback((dir: Direction) => {
    const { isMoving, dialogue, phaseType, playerPos, currentMap, playerTeam, maps, teleports, npcs, items, defeatedTrainers, inventory, storyStep } = gameState.current;
    const lockedPhases = ['BATTLE', 'BATTLE_TRANSITION', 'HEALING', 'BLACKOUT'];
    if (isMoving || dialogue || lockedPhases.includes(phaseType)) return;

    setDirection(dir);

    let nextX = playerPos.x;
    let nextY = playerPos.y;

    switch (dir) {
      case 'up': nextY--; break;
      case 'down': nextY++; break;
      case 'left': nextX--; break;
      case 'right': nextX++; break;
    }

    // Story: Oak stops player
    if (currentMap === 'PALLET_TOWN' && nextY === 5 && playerTeam.length === 0) {
      setDialogue("OAK: ¡Espera! ¡No vayas por ahí!");
      setStoryStep('OAK_STOPPED');
      setTimeout(() => {
        setCurrentMap('OAKS_LAB');
        setPlayerPos({ x: 10, y: 14 });
        setDialogue("OAK: ¡Es peligroso ir solo! Ven, elige un POKÉMON.");
      }, 1000);
      return;
    }

    // Boundary and collision check
    const map = maps[currentMap];
    const npcAtNext = npcs[currentMap]?.some(n => n.position.x === nextX && n.position.y === nextY);
    const objectAtNext = items[currentMap]?.some(i => i.type === 'object' && i.position.x === nextX && i.position.y === nextY);
    if (
      nextX >= 0 && nextX < GRID_SIZE &&
      nextY >= 0 && nextY < GRID_SIZE &&
      map[nextY][nextX].walkable &&
      !npcAtNext &&
      !objectAtNext
    ) {
      setIsMoving(true);
      setPlayerPos({ x: nextX, y: nextY });
      const leadPokemon = playerTeam[0];
      if (leadPokemon?.status === 'poison' && leadPokemon.hp > 1) {
        poisonStepCounter.current += 1;
        if (poisonStepCounter.current >= 4) {
          poisonStepCounter.current = 0;
          setPlayerTeam(prev => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            updated[0] = { ...updated[0], hp: Math.max(1, updated[0].hp - 1) };
            return updated;
          });
          setOverworldShake(true);
          setTimeout(() => setOverworldShake(false), 220);
        }
      } else {
        poisonStepCounter.current = 0;
      }

      if (map[nextY][nextX].type === 'grass') {
        setGrassEffect({ x: nextX, y: nextY });
        setTimeout(() => setGrassEffect(null), 500);
      }

      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      moveTimeout.current = setTimeout(() => {
        setIsMoving(false);
      }, 110);

      // Check for teleports
      const teleport = teleports[currentMap].find(t => t.position.x === nextX && t.position.y === nextY);
      if (teleport && teleport.targetMap && teleport.targetPos) {
        soundManager.play('SELECT');
        setTimeout(() => {
          setCurrentMap(teleport.targetMap);
          setPlayerPos(teleport.targetPos!);
        }, 200);
      }

      // Check for trainers
      const currentMapTrainers = npcs[currentMap].filter(n => n.isTrainer && !defeatedTrainers.includes(n.id));
      for (const trainer of currentMapTrainers) {
        for (let i = 1; i <= 3; i++) {
          let visionX = trainer.position.x;
          let visionY = trainer.position.y;
          if (trainer.direction === 'up') visionY -= i;
          if (trainer.direction === 'down') visionY += i;
          if (trainer.direction === 'left') visionX -= i;
          if (trainer.direction === 'right') visionX += i;
          
          if (visionX === nextX && visionY === nextY) {
            setSpottedTrainerId(trainer.id);
            setSpottedTrainerPos({ ...trainer.position });
            soundManager.play('TRAINER_SPOTTED');
            setDialogue(`${trainer.name}: ¡Eh! ¡Te he visto! ¡Vamos a luchar!`);
            const spottedDistance = i;
            for (let step = 1; step < spottedDistance; step++) {
              setTimeout(() => {
                setSpottedTrainerPos(prev => {
                  if (!prev) return prev;
                  const next = { ...prev };
                  if (trainer.direction === 'up') next.y -= 1;
                  if (trainer.direction === 'down') next.y += 1;
                  if (trainer.direction === 'left') next.x -= 1;
                  if (trainer.direction === 'right') next.x += 1;
                  return next;
                });
              }, step * 220);
            }
            setTimeout(() => {
              setSpottedTrainerId(null);
              setSpottedTrainerPos(null);
              soundManager.play('BATTLE_START');
              setEnemyPokemon(trainer.trainerTeam![0]);
              updatePokedex(trainer.trainerTeam![0].id);
              setIsTrainerBattle(true);
              setBattleLog(`¡${trainer.name} te desafía!`);
              setPhase(BATTLE_TRANSITION);
            }, Math.max(1500, spottedDistance * 240));
            break;
          }
        }
      }

      // Random encounter chance in grass
      if (map[nextY][nextX].type === 'grass' && Math.random() < 0.1 && playerTeam.length > 0) {
        // Don't start battle if all pokemon are fainted
        if (playerTeam.every(p => p.hp === 0)) return;

        const routeWilds = WILD_POKEMON_DATABASE[currentMap] || WILD_POKEMON_DATABASE['ROUTE_1'];
        const randomPkmn = routeWilds[Math.floor(Math.random() * routeWilds.length)];
        const levelVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
        const finalLevel = Math.max(2, randomPkmn.level + levelVariation);
        
        soundManager.play('BATTLE_START');
        const finalMaxHp = calcHp(randomPkmn.baseStats.hp, finalLevel);
        const finalPkmn = {
          ...randomPkmn,
          level: finalLevel,
          hp: finalMaxHp,
          maxHp: finalMaxHp,
        };
        setEnemyPokemon(finalPkmn);
        setIsTrainerBattle(false);
        updatePokedex(randomPkmn.id);
        setBattleLog(`¡Un ${randomPkmn.name} salvaje apareció!`);
        setPhase(BATTLE_TRANSITION);
      }
    }
  }, []);

  const handleEnemyTurn = () => {
    if (!enemyPokemon || playerTeam.length === 0) return;
    const playerPkmn = playerTeam[0];
    
    // Status check: Sleep/Paralysis
    if (enemyPokemon.status === 'sleep') {
      if (Math.random() > 0.3) {
        setBattleLog(`¡${enemyPokemon.name} está profundamente dormido!`);
        setTimeout(() => setPhase(battle(B_CHOOSING)), 1000);
        return;
      } else {
        setBattleLog(`¡${enemyPokemon.name} se ha despertado!`);
        setEnemyPokemon(prev => prev ? { ...prev, status: 'none' } : null);
      }
    }

    if (enemyPokemon.status === 'paralyzed' && Math.random() < 0.25) {
      setBattleLog(`¡${enemyPokemon.name} está paralizado! ¡No puede moverse!`);
      setTimeout(() => setPhase(battle(B_CHOOSING)), 1000);
      return;
    }

    setPhase(battle(B_ENEMY_ATTACK));
    setTimeout(() => {
      setEnemyAnim('attack');
      const enemyMove = enemyPokemon.moves[Math.floor(Math.random() * enemyPokemon.moves.length)];
      if (!doesMoveHit(enemyMove.accuracy)) {
        setBattleLog(`¡${enemyPokemon.name} usó ${enemyMove.name}! ¡Pero falló!`);
        setTimeout(() => {
          setEnemyAnim('idle');
          setPhase(battle(B_CHOOSING));
        }, 700);
        return;
      }

      // Enemy status move (power === 0)
      if (enemyMove.power === 0) {
        soundManager.play('SELECT');
        let log = `¡${enemyPokemon.name} usó ${enemyMove.name}!`;
        const scMsg = applyStatChange(enemyMove, false);
        if (scMsg) log += ' ' + scMsg;
        if (enemyMove.statusEffect && Math.random() * 100 < (enemyMove.statusChance || 100)) {
          setPlayerTeam(prev => {
            const updated = [...prev];
            updated[0] = { ...updated[0], status: enemyMove.statusEffect };
            return updated;
          });
          log += ` ¡${playerPkmn.name} ahora está ${enemyMove.statusEffect}!`;
        }
        setBattleLog(log);
        setTimeout(() => {
          setEnemyAnim('idle');
          setPhase(battle(B_CHOOSING));
        }, 1000);
        return;
      }

      if (enemyMove.type !== 'normal') {
        setProjectile({ type: enemyMove.type, from: 'enemy' });
        setTimeout(() => setProjectile(null), 600);
      }

      soundManager.playMove(enemyMove.sfxType ?? 'pulse');

      setTimeout(() => {
        setEnemyAnim('idle');
        setPlayerAnim('hit');
        soundManager.play('HIT');
        setScreenFlash(true);

        const enemyResult = calculateDamage(enemyPokemon, playerPkmn, enemyMove);
        const enemyDamage = enemyResult.damage;
        setHitEffect({ x: 30, y: 70, type: enemyMove.type });
        setDamageNumber({ x: 30, y: 60, value: enemyDamage });
        setBattleShake(true);
        setTimeout(() => {
          setScreenFlash(false);
          setHitEffect(null);
          setDamageNumber(null);
          setBattleShake(false);
        }, 400);

        const newPlayerHP = Math.max(0, playerPkmn.hp - enemyDamage);
        setPlayerTeam(prev => {
          const updated = [...prev];
          updated[0] = { ...updated[0], hp: newPlayerHP };

          // Apply status effect to player
          if (enemyMove.statusEffect && Math.random() * 100 < (enemyMove.statusChance || 100)) {
            updated[0].status = enemyMove.statusEffect;
            setBattleLog(prevLog => `${prevLog} ¡${playerPkmn.name} ahora está ${enemyMove.statusEffect}!`);
          }

          return updated;
        });

        let enemyLog = `¡${enemyPokemon.name} usó ${enemyMove.name}!`;
        if (enemyResult.effectivenessLabel === 'no_effect') {
          enemyLog += ` No afecta a ${playerPkmn.name}...`;
        } else {
          if (enemyResult.isCritical) enemyLog += ' ¡Golpe crítico!';
          if (enemyResult.effectivenessLabel === 'super_effective') enemyLog += ' ¡Es supereficaz!';
          if (enemyResult.effectivenessLabel === 'not_very_effective') enemyLog += ' No es muy eficaz...';
          enemyLog += ` Causó ${enemyDamage} de daño.`;
        }
        setBattleLog(enemyLog);
        
        setTimeout(() => {
          if (newPlayerHP === 0) {
            const anyAlive = playerTeam.slice(1).some(p => p.hp > 0);
            
            if (!anyAlive) {
              soundManager.play('FAINT');
              setPlayerAnim('faint');
              setBattleLog(`¡${playerPkmn.name} se debilitó! ¡No te quedan POKÉMON sanos!`);

              setTimeout(() => {
                setPlayerAnim('idle');
                setPhase(BLACKOUT);

                // Teleport mid-blackout (while screen is dark)
                setTimeout(() => {
                  setCurrentMap(lastHealLocation.map);
                  setPlayerPos(lastHealLocation.pos);
                }, 1200);

                // Blackout fades — run healing animation on arrival
                setTimeout(() => {
                  setPhase(HEALING);
                  setTimeout(() => {
                    setPlayerTeam(prev => prev.map(p => ({ ...p, hp: p.maxHp, status: 'none', moves: p.moves.map(m => ({ ...m, pp: m.maxPp })) })));
                    soundManager.play('SELECT');
                  }, 800);
                  setTimeout(() => {
                    setPhase(EXPLORING);
                    setDialogue("¡Te has quedado sin POKÉMON! Fuiste llevado al último lugar de descanso.");
                  }, 1600);
                }, 2400);
              }, 1500);
            } else {
              soundManager.play('FAINT');
              setPlayerAnim('faint');
              setBattleLog(`¡${playerPkmn.name} se debilitó! ¡Elige tu siguiente POKÉMON!`);
              setTimeout(() => {
                setPlayerAnim('idle');
                setPhase(battle(B_FORCED_SWITCH));
              }, 1500);
            }
          } else {
            setPlayerAnim('idle');
            setPhase(battle(B_CHOOSING));
          }
        }, 500);
      }, 300);
    }, 1000);
  };

  const handleCatch = () => {
    if (!enemyPokemon) return;
    
    // Remove pokeball from inventory
    removeItem('POKEBALL');

    setBattleLog(`¡Pablo lanzó una POKÉ BALL!`);
    setPhase(battle(B_CATCHING));
    soundManager.play('SELECT');
    
    // Catch logic: higher chance if HP is low
    const hpPercent = enemyPokemon.hp / enemyPokemon.maxHp;
    const catchRate = (1 - hpPercent) * 0.7 + 0.1; // 10% base, up to 80% at 0 HP
    const roll = Math.random();
    
    setTimeout(() => {
      if (roll < catchRate) {
        soundManager.play('SELECT');
        setBattleLog(`¡Ya está! ¡${enemyPokemon.name} atrapado!`);
        
        setTimeout(() => {
          if (playerTeam.length < 6) {
            setPlayerTeam(prev => [...prev, { ...enemyPokemon, hp: enemyPokemon.hp }]);
          } else {
            setPcStorage(prev => [...prev, { ...enemyPokemon, hp: enemyPokemon.hp }]);
            setBattleLog(`¡${enemyPokemon.name} se envió al PC de Pablo!`);
          }
          // Update pokedex
          setPokedex(prev => ({ ...prev, [enemyPokemon.id]: { seen: true, caught: true } }));

          clearBattleStatBoosts();
          setPhase(EXPLORING);
        }, 2000);
      } else {
        setBattleLog(`¡Oh, no! ¡El POKÉMON se ha escapado!`);
        setTimeout(() => {
          setPhase(battle(B_CHOOSING));
          handleEnemyTurn();
        }, 1500);
      }
    }, 2000);
  };

  const handleUseItem = (itemId: string) => {
    if (!hasItem(itemId)) return;
    if (!inBattle) {
      if (itemId === 'POTION') {
        const healedTeam = playerTeam.map(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 20) }));
        setPlayerTeam(healedTeam);
        removeItem('POTION');
        setDialogue("¡Usaste una POCIÓN! Tus POKÉMON recuperaron salud.");
      }
      return;
    }

    if (itemId === 'POKEBALL') {
      handleCatch();
    } else if (itemId === 'POTION') {
      // Use potion on first pokemon
      const playerPkmn = playerTeam[0];
      const healed = Math.min(20, playerPkmn.maxHp - playerPkmn.hp);
      const newHP = playerPkmn.hp + healed;
      const updatedTeam = [...playerTeam];
      updatedTeam[0] = { ...playerPkmn, hp: newHP };
      setPlayerTeam(updatedTeam);

      removeItem('POTION');

      // Show heal number floating effect
      setHealNumber({ x: 30, y: 60, value: healed });
      setTimeout(() => setHealNumber(null), 1200);

      setBattleLog(`¡Usaste una POCIÓN en ${playerPkmn.name}! Recuperó ${healed} PS.`);
      soundManager.play('SELECT');
      setTimeout(() => handleEnemyTurn(), 1000);
    }
  };

  /** Reset player stat boosts at end of every battle */
  const clearBattleStatBoosts = () => {
    setPlayerTeam(prev => prev.map(p => ({ ...p, statBoosts: undefined })));
    setEnemyPokemon(prev => prev ? { ...prev, statBoosts: undefined } : null);
    setBadgeBoostGlitchStacks(0);
  };

  /** Apply a stat stage change to player or enemy, clamped to [-6, +6]. Returns message. */
  const applyStatChange = (
    move: Move,
    attackerIsPlayer: boolean,
  ): string | null => {
    const sc = move.statChange;
    if (!sc) return null;

    const targetIsPlayer = attackerIsPlayer ? sc.target === 'self' : sc.target === 'enemy';
    const statName = sc.stat;
    const stages = sc.stages;

    if (targetIsPlayer) {
      setPlayerTeam(prev => {
        const updated = [...prev];
        const boosts = { ...(updated[0].statBoosts ?? ZERO_BOOSTS) };
        boosts[statName] = Math.max(-6, Math.min(6, (boosts[statName] ?? 0) + stages));
        updated[0] = { ...updated[0], statBoosts: boosts };
        return updated;
      });
      if (badges.includes('BOULDER')) {
        // Gen I badge boost glitch: stat changes re-apply badge-derived boosts.
        setBadgeBoostGlitchStacks(prev => prev + 1);
      }
    } else {
      setEnemyPokemon(prev => {
        if (!prev) return prev;
        const boosts = { ...(prev.statBoosts ?? ZERO_BOOSTS) };
        boosts[statName] = Math.max(-6, Math.min(6, (boosts[statName] ?? 0) + stages));
        return { ...prev, statBoosts: boosts };
      });
    }

    const targetName = targetIsPlayer ? playerTeam[0]?.name : enemyPokemon?.name;
    const statLabels: Record<string, string> = { attack: 'ATAQUE', defense: 'DEFENSA', special: 'ESPECIAL', speed: 'VELOCIDAD' };
    const direction = stages > 0 ? 'subió' : 'bajó';
    const amount = Math.abs(stages) === 1 ? '' : Math.abs(stages) === 2 ? ' mucho' : ' al máximo';
    return `¡${targetName} ${direction} su ${statLabels[statName]}${amount}!`;
  };

  const handleFlee = () => {
    if (!enemyPokemon || playerTeam.length === 0 || battlePhase?.type !== 'CHOOSING') return;
    if (isTrainerBattle) return;

    setPhase(battle(B_PLAYER_ATTACK)); // lock input

    const playerSpeed = playerTeam[0].baseStats.speed;
    const enemySpeed = Math.max(1, enemyPokemon.baseStats.speed);
    const fleeValue = (playerSpeed * 128 / enemySpeed + 30) % 256;
    const roll = Math.floor(Math.random() * 256);

    if (roll < fleeValue) {
      setBattleLog('¡Has escapado con éxito!');
      setTimeout(() => { clearBattleStatBoosts(); setPhase(EXPLORING); }, 1000);
    } else {
      setBattleLog('¡No has podido escapar!');
      setTimeout(() => handleEnemyTurn(), 1000);
    }
  };

  const handleAttack = (move: Move) => {
    if (!enemyPokemon || playerTeam.length === 0 || battlePhase?.type !== 'CHOOSING') return;
    if (move.pp <= 0) return;

    const playerPkmn = playerTeam[0];

    // Deduct PP
    setPlayerTeam(prev => {
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        moves: updated[0].moves.map(m => m.name === move.name ? { ...m, pp: m.pp - 1 } : m),
      };
      return updated;
    });

    // Lock input immediately
    setPhase(battle(B_PLAYER_ATTACK));

    // Status check: Sleep/Paralysis
    if (playerPkmn.status === 'sleep') {
      if (Math.random() > 0.3) {
        setBattleLog(`¡${playerPkmn.name} está profundamente dormido!`);
        setTimeout(handleEnemyTurn, 1000);
        return;
      } else {
        setBattleLog(`¡${playerPkmn.name} se ha despertado!`);
        setPlayerTeam(prev => {
          const updated = [...prev];
          updated[0] = { ...updated[0], status: 'none' };
          return updated;
        });
      }
    }

    if (playerPkmn.status === 'paralyzed' && Math.random() < 0.25) {
      setBattleLog(`¡${playerPkmn.name} está paralizado! ¡No puede moverse!`);
      setTimeout(handleEnemyTurn, 1000);
      return;
    }

    setPlayerAnim('attack');
    soundManager.play('SELECT');
    if (!doesMoveHit(move.accuracy)) {
      setBattleLog(`¡${playerPkmn.name} usó ${move.name}! ¡Pero falló!`);
      setTimeout(() => {
        setPlayerAnim('idle');
        handleEnemyTurn();
      }, 700);
      return;
    }

    // Status / Stat-change move (power === 0): no damage animation
    if (move.power === 0) {
      let log = `¡${playerPkmn.name} usó ${move.name}!`;

      // Stat change
      const scMsg = applyStatChange(move, true);
      if (scMsg) log += ' ' + scMsg;

      // Status effect
      if (move.statusEffect && Math.random() * 100 < (move.statusChance || 100)) {
        setEnemyPokemon(prev => prev ? { ...prev, status: move.statusEffect } : null);
        log += ` ¡${enemyPokemon.name} ahora está ${move.statusEffect}!`;
      }

      setBattleLog(log);
      setTimeout(() => {
        setPlayerAnim('idle');
        handleEnemyTurn();
      }, 1000);
      return;
    }

    // Player Attack Animation
    soundManager.playMove(move.sfxType ?? 'pulse');

    // Show Projectile for special moves
    if (move.type !== 'normal') {
      setProjectile({ type: move.type, from: 'player' });
      setTimeout(() => setProjectile(null), 600);
    }

    setTimeout(() => {
      const attackMultiplier = badges.includes('BOULDER') ? 1 + badgeBoostGlitchStacks * 0.125 : 1;
      const attackerWithBadgeGlitch = attackMultiplier > 1
        ? {
            ...playerPkmn,
            baseStats: {
              ...playerPkmn.baseStats,
              attack: Math.floor(playerPkmn.baseStats.attack * attackMultiplier),
            },
          }
        : playerPkmn;
      const result = calculateDamage(attackerWithBadgeGlitch, enemyPokemon, move);
      const damage = result.damage;
      const newEnemyHP = Math.max(0, enemyPokemon.hp - damage);

      setEnemyAnim('hit');
      setScreenFlash(true);
      setHitEffect({ x: 70, y: 30, type: move.type });
      setDamageNumber({ x: 70, y: 20, value: damage });
      setBattleShake(true);

      setTimeout(() => {
        setScreenFlash(false);
        setHitEffect(null);
        setDamageNumber(null);
        setBattleShake(false);
      }, 400);

      setEnemyPokemon({ ...enemyPokemon, hp: newEnemyHP });
      let attackLog = `¡${playerPkmn.name} usó ${move.name}!`;
      if (result.effectivenessLabel === 'no_effect') {
        attackLog += ` No afecta a ${enemyPokemon.name}...`;
      } else {
        if (result.isCritical) attackLog += ' ¡Golpe crítico!';
        if (result.effectivenessLabel === 'super_effective') attackLog += ' ¡Es supereficaz!';
        if (result.effectivenessLabel === 'not_very_effective') attackLog += ' No es muy eficaz...';
        attackLog += ` Causó ${damage} de daño.`;
      }
      setBattleLog(attackLog);

      // Apply status effect
      if (move.statusEffect && Math.random() * 100 < (move.statusChance || 100)) {
        setEnemyPokemon(prev => prev ? { ...prev, status: move.statusEffect } : null);
        setBattleLog(prevLog => `${prevLog} ¡${enemyPokemon.name} ahora está ${move.statusEffect}!`);
      }

      setTimeout(() => {
        setPlayerAnim('idle');
        if (newEnemyHP === 0) {
          soundManager.play('FAINT');
          setEnemyAnim('faint');
          setBattleLog(`¡${enemyPokemon.name} se debilitó!`);
          
          // Check if it was a trainer pokemon
          const trainer = npcs[currentMap].find(n => n.isTrainer && n.trainerTeam?.some(p => p.id === enemyPokemon.id));
          const moneyReward = trainer ? enemyPokemon.level * 20 : 0;
          if (trainer) {
            setDefeatedTrainers(prev => [...prev, trainer.id]);
            if (moneyReward > 0) setMoney(prev => prev + moneyReward);
            if (trainer.id === 'brock') {
              setBadges(prev => [...prev, 'BOULDER']);
              setBattleLog(prev => `${prev}\n¡Recibiste la MEDALLA ROCA de BROCK!`);
            }
          }

          // EXP Gain — compute everything outside state updaters
          const expGain = Math.floor(enemyPokemon.level * 25);

          setTimeout(() => {
            const rewardLine = moneyReward > 0 ? `\n¡Ganaste ₽${moneyReward}!` : '';
            setBattleLog(`¡${playerPkmn.name} ganó ${expGain} puntos de EXP!${rewardLine}`);

            // Compute new pokemon state synchronously
            let pkmn = { ...playerPkmn };
            pkmn.exp = (pkmn.exp || 0) + expGain;

            let didLevelUp = false;
            let learnedMove: Move | null = null;
            while (pkmn.exp >= (pkmn.expToNextLevel || 100)) {
              pkmn.exp -= (pkmn.expToNextLevel || 100);
              pkmn.level += 1;
              pkmn.expToNextLevel = pkmn.level * 100;
              const newMaxHp = calcHp(pkmn.baseStats.hp, pkmn.level);
              pkmn.hp = Math.min(pkmn.hp + (newMaxHp - pkmn.maxHp), newMaxHp);
              pkmn.maxHp = newMaxHp;
              didLevelUp = true;
              const moveEntry = pkmn.movesToLearn?.find(m => m.level === pkmn.level);
              if (moveEntry && !pkmn.moves.some(m => m.name === moveEntry.move.name)) {
                learnedMove = moveEntry.move;
                pkmn.moves = pkmn.moves.length < 4
                  ? [...pkmn.moves, moveEntry.move]
                  : [moveEntry.move, ...pkmn.moves.slice(1)];
              }
            }

            // Check evolution
            const willEvolve = didLevelUp
              && pkmn.evolutionLevel != null
              && pkmn.level >= pkmn.evolutionLevel
              && pkmn.evolvesTo != null;
            const evoData = willEvolve ? EVOLUTIONS[pkmn.evolvesTo!] : null;
            let evolvedPkmn = pkmn;
            if (evoData) {
              evolvedPkmn = { ...pkmn, ...evoData };
              if (evoData.baseStats) {
                const evoMaxHp = calcHp(evoData.baseStats.hp, pkmn.level);
                evolvedPkmn.hp = Math.min(pkmn.hp + (evoMaxHp - pkmn.maxHp), evoMaxHp);
                evolvedPkmn.maxHp = evoMaxHp;
              }
            }

            // Apply XP (and level stats) now
            setPlayerTeam(prev => { const u = [...prev]; u[0] = pkmn; return u; });

            // Sequence post-battle animations
            let endDelay = 2500;

            if (didLevelUp) {
              endDelay = 4500;
              setTimeout(() => {
                setPhase(battle(B_LEVEL_UP));
                setBattleLog(`¡${pkmn.name} subió al nivel ${pkmn.level}!`);
                soundManager.play('SELECT');
                if (learnedMove) {
                  setTimeout(() => setBattleLog(`¡${pkmn.name} aprendió ${learnedMove!.name}!`), 1500);
                }
                setTimeout(() => setPhase(battle(B_ENEMY_FAINTED)), 2000);
              }, 1500);

              if (evoData) {
                endDelay = 9500;
                setTimeout(() => {
                  setBattleLog(`¡¿Qué?! ¡${pkmn.name} está evolucionando!`);
                  setPhase(battle(B_EVOLVING));
                  setTimeout(() => {
                    setPlayerTeam(prev => { const u = [...prev]; u[0] = evolvedPkmn; return u; });
                    setPhase(battle(B_ENEMY_FAINTED));
                    setBattleLog(`¡Felicidades! ¡${evolvedPkmn.name} ha evolucionado!`);
                    soundManager.play('SELECT');
                  }, 3000);
                }, 4500);
              }
            }

            setTimeout(() => {
              clearBattleStatBoosts();
              setPhase(EXPLORING);
              setEnemyAnim('idle');
              if (storyStep === 'PICKED_STARTER') {
                setStoryStep('RIVAL_BATTLE');
                setDialogue("AZUL: ¡Maldición! ¡He perdido! Pero no volverá a pasar.");
              }
            }, endDelay);
          }, 1500);
        } else {
          setEnemyAnim('idle');
          handleEnemyTurn();
        }
      }, 500);
    }, 300);
  };

  const pressedKeys = useRef<Set<Direction>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inBattle) {
        const { battleSubPhase, playerTeam: team } = gameState.current;
        if (e.key === 'Escape') {
          // Close sub-menus back to choosing, never exit the battle
          if (battleSubPhase === 'BATTLE_INVENTORY' || battleSubPhase === 'BATTLE_TEAM') {
            setPhase(battle(B_CHOOSING));
          }
          // FORCED_SWITCH: don't allow closing without picking
        }
        // Number keys 1-4: select move when it's the player's turn
        if (battleSubPhase === 'CHOOSING') {
          const idx = parseInt(e.key) - 1;
          if (idx >= 0 && idx <= 3) {
            const mv = team[0]?.moves[idx];
            if (mv && mv.pp > 0) handleAttack(mv);
          }
          if (e.key === 'b' || e.key === 'B') setPhase(battle(B_BATTLE_INVENTORY));
          if (e.key === 'p' || e.key === 'P') setPhase(battle(B_BATTLE_TEAM));
        }
        return;
      }

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'E' && e.shiftKey) {
        setPhase(prev => prev.type === 'EDITOR' ? EXPLORING : EDITOR);
        return;
      }

      if (dialogue) {
        setDialogue(null);
        return;
      }

      let dir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp': dir = 'up'; break;
        case 'ArrowDown': dir = 'down'; break;
        case 'ArrowLeft': dir = 'left'; break;
        case 'ArrowRight': dir = 'right'; break;
        case 'z': case 'Enter': case ' ': handleAction(); break;
        case 'x': case 'Shift': case 'Escape': setPhase(prev => prev.type === 'MENU' ? EXPLORING : MENU); break;
      }
      if (dir) {
        const wasEmpty = pressedKeys.current.size === 0;
        pressedKeys.current.add(dir);
        if (wasEmpty) handleMove(dir); // immediate first step on key press
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': pressedKeys.current.delete('up'); break;
        case 'ArrowDown': pressedKeys.current.delete('down'); break;
        case 'ArrowLeft': pressedKeys.current.delete('left'); break;
        case 'ArrowRight': pressedKeys.current.delete('right'); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleMove, handleAction, dialogue, inBattle]);

  // Self-trigger: the moment a move finishes, immediately start the next one if a key is held.
  // This eliminates the interval desync — moves chain with zero gap.
  useEffect(() => {
    if (!isMoving && pressedKeys.current.size > 0) {
      const dir = Array.from(pressedKeys.current)[0] as Direction;
      handleMove(dir);
    }
  }, [isMoving, handleMove]);

  return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-red-500 selection:text-white">
      
      {/* Scanline Effect */}
      <div className="scanline" />

      {/* Game Header */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
        <div className="w-12 h-12 bg-red-600 rounded-xl shadow-lg flex items-center justify-center border-2 border-red-400">
          <Gamepad2 className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-white font-bold text-xl tracking-tight">POKÉMON FIRE RED</h1>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Modern Remake Engine</p>
        </div>
      </div>

      {/* World Container */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* HP HUD */}
        <AnimatePresence>
          {playerTeam.length > 0 && !inBattle && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed top-24 sm:top-24 left-4 sm:left-8 z-20 bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-800 shadow-xl w-32 sm:w-48"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] sm:text-[10px] font-black text-slate-800 uppercase tracking-tighter">{playerTeam[0].name}</span>
                <span className="text-[8px] sm:text-[10px] font-mono font-bold text-slate-500">Lv {playerTeam[0].level}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[6px] sm:text-[8px] font-black text-yellow-600">HP</span>
                <div className="flex-1 h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${(playerTeam[0].hp / playerTeam[0].maxHp) * 100}%` }}
                    className={`h-full ${playerTeam[0].hp > playerTeam[0].maxHp / 2 ? 'bg-emerald-500' : playerTeam[0].hp > playerTeam[0].maxHp / 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  />
                </div>
              </div>
              <div className="text-right mt-0.5 sm:mt-1">
                <span className="text-[8px] sm:text-[10px] font-mono font-bold text-slate-600">{playerTeam[0].hp}/{playerTeam[0].maxHp}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="absolute bg-emerald-50 rounded-[2rem] shadow-2xl overflow-hidden border-8 border-slate-800"
          initial={false}
          animate={{ 
            x: overworldShake
              ? [
                  -playerPos.x * TILE_SIZE + (windowSize.width / 2) - (TILE_SIZE / 2),
                  -playerPos.x * TILE_SIZE + (windowSize.width / 2) - (TILE_SIZE / 2) - 8,
                  -playerPos.x * TILE_SIZE + (windowSize.width / 2) - (TILE_SIZE / 2) + 8,
                  -playerPos.x * TILE_SIZE + (windowSize.width / 2) - (TILE_SIZE / 2),
                ]
              : -playerPos.x * TILE_SIZE + (windowSize.width / 2) - (TILE_SIZE / 2),
            y: -playerPos.y * TILE_SIZE + (windowSize.height / 2) - (TILE_SIZE / 2)
          }}
          transition={{ type: "tween", duration: 0.1, ease: "linear" }}
        >
          {/* Map Grid */}
          <div 
            className="relative" 
            style={{ 
              width: GRID_SIZE * TILE_SIZE,
              height: GRID_SIZE * TILE_SIZE
            }}
          >
            {(() => {
              const mapHasEncounters = currentMap in WILD_POKEMON_DATABASE;
              const cullRadius = 8;
              // Quantize culling bounds to reduce tile-window "sliding" artifacts
              // that can make the floor look like it moves with the player.
              const cullStep = 4;
              const rawMinY = Math.max(0, playerPos.y - cullRadius);
              const rawMaxY = Math.min(GRID_SIZE - 1, playerPos.y + cullRadius);
              const rawMinX = Math.max(0, playerPos.x - cullRadius);
              const rawMaxX = Math.min(GRID_SIZE - 1, playerPos.x + cullRadius);
              const minY = Math.max(0, Math.floor(rawMinY / cullStep) * cullStep);
              const minX = Math.max(0, Math.floor(rawMinX / cullStep) * cullStep);
              const maxY = Math.min(GRID_SIZE - 1, Math.ceil((rawMaxY + 1) / cullStep) * cullStep - 1);
              const maxX = Math.min(GRID_SIZE - 1, Math.ceil((rawMaxX + 1) / cullStep) * cullStep - 1);
              const tiles = [];
              for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                  const tile = maps[currentMap][y][x];
                  tiles.push(
                    <div
                      key={`${x}-${y}`}
                      className="absolute"
                      style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
                    >
                      <GameTile
                        type={tile.type}
                        isGrassActive={grassEffect?.x === x && grassEffect?.y === y}
                        hasEncounters={mapHasEncounters}
                      />
                    </div>
                  );
                }
              }
              return tiles;
            })()}
          </div>

          {/* Trainer vision shadows */}
          {npcs[currentMap]
            .filter(npc => npc.isTrainer && !defeatedTrainers.includes(npc.id))
            .flatMap(trainer =>
              [1, 2, 3].map(i => {
                let vx = trainer.position.x, vy = trainer.position.y;
                if (trainer.direction === 'up') vy -= i;
                if (trainer.direction === 'down') vy += i;
                if (trainer.direction === 'left') vx -= i;
                if (trainer.direction === 'right') vx += i;
                if (vx < 0 || vx >= GRID_SIZE || vy < 0 || vy >= GRID_SIZE) return null;
                return (
                  <div
                    key={`vision-${trainer.id}-${i}`}
                    className="absolute z-10 pointer-events-none"
                    style={{
                      left: vx * TILE_SIZE,
                      top: vy * TILE_SIZE,
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      background: 'rgba(248, 56, 56, 0.18)',
                      borderRadius: 4,
                    }}
                  />
                );
              }).filter(Boolean)
            )
          }

          {/* Teleport exit indicators */}
          {teleports[currentMap]?.map(tp => (
            <div
              key={`tp-${tp.id}`}
              className="absolute z-25 pointer-events-none flex items-end justify-center pb-1"
              style={{ left: tp.position.x * TILE_SIZE, top: tp.position.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                className="text-white text-lg drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
              >
                {tp.direction === 'up' ? '▲' : tp.direction === 'down' ? '▼' : tp.direction === 'left' ? '◀' : '▶'}
              </motion.div>
            </div>
          ))}

          {/* NPCs */}
          {npcs[currentMap].map(npc => (
            <NPCComponent
              key={npc.id}
              npc={
                npc.id === spottedTrainerId && spottedTrainerPos
                  ? { ...npc, position: spottedTrainerPos }
                  : npc
              }
              isSpotted={npc.id === spottedTrainerId}
            />
          ))}

          {/* Items / Pokéballs / Objects */}
          {items[currentMap].map(item => (
            <motion.div
              key={item.id}
              className="absolute top-0 left-0 flex items-center justify-center"
              animate={{ x: item.position.x * TILE_SIZE, y: item.position.y * TILE_SIZE }}
              style={{ width: TILE_SIZE, height: TILE_SIZE, zIndex: 18 + item.position.y }}
            >
              {item.type === 'item' ? (
                <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-[#383838] flex items-center justify-center relative shadow-md">
                  <div className="w-full h-0.5 bg-[#383838] absolute top-1/2 -translate-y-1/2" />
                  <div className="w-2 h-2 bg-white border-2 border-[#383838] rounded-full z-10" />
                  {item.sprite?.startsWith('http') ? <img src={item.sprite} className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 object-contain pixelated drop-shadow-md" alt="item" /> : <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl font-bold text-slate-400 drop-shadow-md">{item.sprite}</div>}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <div className="w-1 h-3 bg-[#a05030] border-x-2 border-[#383838] absolute bottom-2" />
                  <div className="w-10 h-8 bg-[#d8b888] border-2 border-[#383838] rounded-sm absolute bottom-5 flex flex-col items-center justify-center gap-1">
                    <div className="w-6 h-0.5 bg-[#383838]/20" />
                    <div className="w-6 h-0.5 bg-[#383838]/20" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Player */}
          <Player position={playerPos} direction={direction} isMoving={isMoving} />

          {/* Tree canopy overlay layer: appears above actors for perspective */}
          {maps[currentMap].flatMap((row, y) =>
            row.map((tile, x) => {
              if (tile.type !== 'tree') return null;
              return (
                <div
                  key={`tree-canopy-${x}-${y}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: x * TILE_SIZE - 6,
                    top: y * TILE_SIZE - 18,
                    width: TILE_SIZE + 12,
                    height: TILE_SIZE,
                    zIndex: 40 + y,
                  }}
                >
                  <div className="w-full h-full bg-[#88d8b0] border-2 border-[#383838] rounded-full flex flex-col items-center justify-center gap-1 shadow-sm">
                    <div className="w-8 h-1 bg-white/20 rounded-full" />
                    <div className="w-6 h-1 bg-white/20 rounded-full" />
                  </div>
                </div>
              );
            })
          )}

          {/* Interaction Indicator */}
          <AnimatePresence>
            {!inBattle && !dialogue && !isMoving && (() => {
              let targetX = playerPos.x;
              let targetY = playerPos.y;
              switch (direction) {
                case 'up': targetY--; break;
                case 'down': targetY++; break;
                case 'left': targetX--; break;
                case 'right': targetX++; break;
              }
              
              const interactable = 
                npcs[currentMap].some(npc => npc.position.x === targetX && npc.position.y === targetY) ||
                items[currentMap].some(item => item.position.x === targetX && item.position.y === targetY) ||
                (targetX >= 0 && targetX < GRID_SIZE && targetY >= 0 && targetY < GRID_SIZE && 
                 ['tree', 'table', 'cut_tree', 'boulder'].includes(maps[currentMap][targetY][targetX].type));
              
              if (!interactable) return null;

              return (
                <motion.div
                  key="interact-indicator"
                  initial={{ opacity: 0, y: 10, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute z-30 pointer-events-none flex flex-col items-center"
                  style={{ 
                    left: targetX * TILE_SIZE, 
                    top: targetY * TILE_SIZE - 24,
                    width: TILE_SIZE
                  }}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-full w-6 h-6 shadow-lg border-2 border-blue-500 flex items-center justify-center animate-bounce">
                    <span className="text-[10px] font-black text-blue-600">A</span>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rotate-45 -mt-1 shadow-sm" />
                </motion.div>
              );
            })()}
          </AnimatePresence>

        </motion.div>
      </div>

      {/* Mobile Controls (Visible on small screens) */}
      <div className="fixed bottom-0 left-0 w-full p-6 lg:hidden flex justify-between items-end z-30 pointer-events-none">
        {/* Joystick */}
        <Joystick onMove={(dir) => dir && handleMove(dir)} />

        {/* Action Buttons */}
        <div className="flex gap-4 pointer-events-auto mb-4">
          <div className="flex flex-col gap-8">
             <button 
              onPointerDown={(e) => { 
                e.preventDefault(); 
                soundManager.play('SELECT');
                setPhase(prev => prev.type === 'MENU' ? EXPLORING : MENU);
              }} 
              className="w-12 h-12 bg-slate-700/80 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-slate-500 shadow-lg border-2 border-white/10 text-[10px] font-bold"
            >
              START
            </button>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onPointerDown={(e) => { e.preventDefault(); /* B button logic */ }} 
              className="w-16 h-16 bg-red-700/90 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-red-500 shadow-xl border-4 border-black/20 font-black text-2xl"
            >
              B
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); handleAction(); }} 
              className="w-20 h-20 bg-red-600 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-red-400 shadow-xl border-4 border-black/20 font-black text-3xl mb-8"
            >
              A
            </button>
          </div>
        </div>
      </div>

      {/* Side Menu */}
      <AnimatePresence>
        {phase.type === 'MENU' && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-2 sm:right-8 top-1/2 -translate-y-1/2 w-56 sm:w-64 bg-white/95 backdrop-blur-xl border-4 border-slate-800 rounded-3xl p-3 sm:p-4 shadow-2xl z-40 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-4 px-2">Menú Principal</h2>
            <div className="space-y-2">
              {[
                { icon: MapIcon, label: 'Pokédex', color: 'bg-red-500', action: () => {
                  if (hasPokedex) {
                    soundManager.play('SELECT');
                    setPhase(POKEDEX);
                  } else {
                    setDialogue("Aún no tienes una Pokédex.");
                  }
                } },
                { icon: User, label: 'Pokémon', color: 'bg-emerald-500', action: () => {
                  soundManager.play('SELECT');
                  setPhase(TEAM);
                } },
                { icon: Backpack, label: 'Mochila', color: 'bg-orange-500', action: () => {
                  soundManager.play('SELECT');
                  setPhase(INVENTORY);
                } },
                { icon: Gamepad2, label: 'PC Storage', color: 'bg-blue-500', action: () => {
                  soundManager.play('SELECT');
                  setPhase(PC);
                } },
                { icon: Settings, label: 'Guardar', color: 'bg-slate-500', action: () => {
                  soundManager.play('SELECT');
                  setDialogue(`¡Partida guardada en ${SAVE_SLOT_NAMES[activeSaveSlot] || activeSaveSlot}!`);
                } },
                { icon: X, label: 'Reiniciar', color: 'bg-red-500', action: () => {
                  resetGame();
                } },
              ].map((item, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    // Just run the action. 
                    // The action itself (like setPhase(TEAM)) will handle the transition.
                    item.action(); 
                  }}
                  className="w-full flex items-center gap-4 p-3 hover:bg-slate-100 rounded-2xl transition-colors group"
                >
                  <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    <item.icon className="text-white" size={20} />
                  </div>
                  <span className="font-bold text-slate-700">{item.label}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h3 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-2 px-2">Historia</h3>
              <div className="space-y-2 px-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">Paso actual</span>
                  <span className="text-xs font-bold text-red-500">{storyStep}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">Equipo</span>
                  <span className="text-xs font-mono text-slate-400">{playerTeam.length}/6</span>
                </div>
                <div className="mt-2 space-y-1">
                  {playerTeam.map((p, i) => (
  <div key={i} className="flex flex-col gap-1 mt-2">
    {/* HP Row */}
    <div className="flex justify-between text-[10px] font-bold">
      <span>{p.name}</span>
      <span className="text-slate-500">HP {p.hp}/{p.maxHp}</span>
    </div>
    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all ${p.hp > p.maxHp / 2 ? 'bg-emerald-500' : p.hp > p.maxHp / 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
        style={{ width: `${(p.hp / p.maxHp) * 100}%` }}
      />
    </div>

    {/* NEW: Experience Points Row */}
    <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
      <span>EXP</span>
      <span>{p.exp || 0} / {p.expToNextLevel || 100}</span>
    </div>
    <div className="w-full h-0.5 bg-slate-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-400 transition-all"
        style={{ width: `${((p.exp || 0) / (p.expToNextLevel || 100)) * 100}%` }}
      />
    </div>
  </div>
))}
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[10px] text-slate-400 uppercase">Inventario</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(inventory).map(([item, qty]) => (
                      <span key={item} className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{item} x{qty}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <h3 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-2 px-2">Perfiles</h3>
              <div className="grid grid-cols-3 gap-2 px-2">
                {Object.keys(SAVE_SLOT_NAMES).map(slotId => (
                  <button
                    key={slotId}
                    onClick={() => {
                      if (slotId === activeSaveSlot) return;
                      localStorage.setItem('pokemon_active_slot', slotId);
                      setActiveSaveSlot(slotId);
                      window.location.reload();
                    }}
                    className={`text-[10px] font-bold rounded-lg px-2 py-2 border ${
                      slotId === activeSaveSlot
                        ? 'bg-red-500 text-white border-red-600'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {SAVE_SLOT_NAMES[slotId]}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle View */}
      <AnimatePresence>
        {inBattle && (
          <BattleScreen
            currentMap={currentMap}
            battleShake={battleShake}
            enemyPokemon={enemyPokemon}
            enemyAnim={enemyAnim}
            isCatching={battlePhase?.type === 'CATCHING'}
            projectile={projectile}
            hitEffect={hitEffect}
            damageNumber={damageNumber}
            healNumber={healNumber}
            playerTeam={playerTeam}
            playerAnim={playerAnim}
            battleLog={battleLog}
            showMoves={false}
            setShowMoves={() => {}}
            isTrainerBattle={isTrainerBattle}
            isPlayerTurn={battlePhase?.type === 'CHOOSING'}
            setIsBattle={(v) => { if (!v) setPhase(EXPLORING); }}
            onFlee={handleFlee}
            setShowInventory={() => setPhase(battle(B_BATTLE_INVENTORY))}
            setShowTeam={() => setPhase(battle(B_BATTLE_TEAM))}
            handleAttack={handleAttack}
          />
        )}
      </AnimatePresence>


      {/* Battle Transition */}
      <AnimatePresence>
        {phase.type === 'BATTLE_TRANSITION' && (
          <BattleTransition onComplete={() => {
            setPhase(battle(B_CHOOSING));
          }} />
        )}
      </AnimatePresence>

      {phase.type === 'EDITOR' && <MapEditor onClose={() => setPhase(EXPLORING)} />}

      {/* Dialogue */}
      <AnimatePresence>
        {dialogue && (
          <DialogueBox text={dialogue} onComplete={() => setDialogue(null)} />
        )}
      </AnimatePresence>

      {/* Inventory */}
      <AnimatePresence>
        {(phase.type === 'INVENTORY' || battlePhase?.type === 'BATTLE_INVENTORY') && (
          <InventoryUI
            items={inventory}
            onClose={() => setPhase(inBattle ? battle(B_CHOOSING) : EXPLORING)}
            onUse={handleUseItem}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(phase.type === 'TEAM' || battlePhase?.type === 'BATTLE_TEAM' || battlePhase?.type === 'FORCED_SWITCH') && (
          <TeamMenuUI
            team={playerTeam}
            forcedSwitch={battlePhase?.type === 'FORCED_SWITCH'}
            onClose={() => setPhase(battlePhase ? battle(B_CHOOSING) : EXPLORING)}
            onSwap={(index) => {
              setPlayerTeam(prev => {
                const updated = [...prev];
                const [moved] = updated.splice(index, 1);
                updated.unshift(moved);
                return updated;
              });
              if (battlePhase?.type === 'FORCED_SWITCH') {
                setPhase(battle(B_CHOOSING));
              } else if (battlePhase) {
                setPhase(battle(B_CHOOSING));
              } else {
                setPhase(EXPLORING);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Shop */}
      <AnimatePresence>
        {phase.type === 'SHOP' && (
          <ShopUI
            money={money}
            onClose={() => setPhase(EXPLORING)}
            onBuy={(id) => {
              const price = SHOP_PRICES[id] ?? 200;
              setMoney(prev => prev - price);
              addItem(id);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase.type === 'POKEDEX' && (
          <PokedexUI
            pokedex={pokedex}
            onClose={() => setPhase(EXPLORING)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase.type === 'PC' && (
          <PCStorageUI
            team={playerTeam}
            pc={pcStorage}
            onClose={() => setPhase(EXPLORING)}
            onSwap={handlePCSwap}
          />
        )}
      </AnimatePresence>

      {/* Level-up flash */}
      <AnimatePresence>
        {battlePhase?.type === 'LEVEL_UP' && (
          <motion.div
            className="fixed inset-0 bg-yellow-300 z-[300] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0, 0.7, 0, 0.7, 0] }}
            transition={{ duration: 1.8, times: [0, 0.1, 0.3, 0.45, 0.6, 0.75, 1], ease: "linear" }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Evolution flash */}
      <AnimatePresence>
        {battlePhase?.type === 'EVOLVING' && (
          <motion.div
            className="fixed inset-0 bg-white z-[300] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 0, 1, 0, 1, 0] }}
            transition={{ duration: 3, times: [0, 0.1, 0.22, 0.33, 0.44, 0.56, 0.67, 0.78, 1], ease: "linear" }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Blackout overlay (all fainted) */}
      <AnimatePresence>
        {phase.type === 'BLACKOUT' && (
          <motion.div
            className="fixed inset-0 bg-black z-[300] pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.2, 1, 0.2, 1, 0.2, 1, 0] }}
            transition={{ duration: 2.4, times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.88, 1], ease: "linear" }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Heal animation (Nurse Joy / Mom) */}
      <AnimatePresence>
        {phase.type === 'HEALING' && (
          <motion.div
            className="fixed inset-0 bg-white z-[300] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0, 0.85, 0, 0.85, 0] }}
            transition={{ duration: 1.6, times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1], ease: "linear" }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Overlay Vignette */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.2)] z-10" />
    </div>
  );
}
