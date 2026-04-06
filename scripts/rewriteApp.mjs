import fs from 'fs';

const originalApp = fs.readFileSync('src/App.tsx', 'utf8');

const getComponentString = (regexStr, str) => {
  const match = str.match(regexStr);
  return match ? match[0] : '';
};

const battleTransitionComponent = getComponentString(/const BattleTransition =.*?};\n/s, originalApp);
const gameTileComponent = getComponentString(/const GameTile =.*?};\n/s, originalApp);
const playerComponent = getComponentString(/const Player =.*?};\n/s, originalApp);
const npcComponent = getComponentString(/const NPCComponent =.*?};\n/s, originalApp);

const newAppStr = `import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Settings, Backpack, MessageSquare } from 'lucide-react';

import { useGameStore } from './store/gameStore';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useInteractionEngine } from './hooks/useInteractionEngine';
import { useBattleEngine } from './hooks/useBattleEngine';

import { BattleScreen } from './components/BattleScreen';
import { PokedexUI } from './components/PokedexUI';
import { TeamMenuUI } from './components/TeamMenuUI';
import { DialogueBox } from './components/DialogueBox';

// We map GRID_SIZE and TILE_SIZE directly from what they were
export const TILE_SIZE = 48;
export const GRID_SIZE = 20;

import { soundManager } from './lib/sounds';
import { Position, Direction } from './types';

// -- Restored Components --
${battleTransitionComponent}
${gameTileComponent}
${playerComponent}
${npcComponent}

export default function App() {
  const store = useGameStore();
  const { handleMove } = usePlayerMovement();
  const { handleAction } = useInteractionEngine();

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showMenu, setShowMenu] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [showPC, setShowPC] = useState(false);
  
  const [playerAnim, setPlayerAnim] = useState<'idle'|'attack'|'hit'|'faint'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle'|'attack'|'hit'|'faint'>('idle');
  const [battleLog, setBattleLog] = useState<string>('');
  const [screenFlash, setScreenFlash] = useState(false);
  const [hitEffect, setHitEffect] = useState<{x: number, y: number, type: string} | null>(null);
  const [projectile, setProjectile] = useState<{from: 'player'|'enemy', type: string} | null>(null);
  const [damageNumber, setDamageNumber] = useState<{x: number, y: number, value: number} | null>(null);
  const [battleShake, setBattleShake] = useState(false);

  const { handleEnemyTurn, handleAttack, handleCatch } = useBattleEngine({
    setPlayerAnim, setEnemyAnim, setBattleLog, setScreenFlash,
    setBattleShake, setProjectile, setHitEffect, setDamageNumber
  });

  const pressedKeys = useRef<Set<Direction | 'A' | 'B' | 'START'>>(new Set());

  useEffect(() => {
    soundManager.init();
    useGameStore.getState().loadPersistedState(JSON.parse(localStorage.getItem('pokemon_save') || '{}'));
    
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (store.playerTeam.length > 0) {
      localStorage.setItem('pokemon_save', JSON.stringify({
        pos: store.playerPos, map: store.currentMap, team: store.playerTeam,
        inventory: store.inventory, defeatedTrainers: store.defeatedTrainers,
        hasPokedex: store.hasPokedex, hasParcel: store.hasParcel,
        storyStep: store.storyStep, lastHealLocation: store.lastHealLocation
      }));
    }
  }, [store.playerPos, store.currentMap, store.playerTeam, store.inventory, store.defeatedTrainers, store.hasPokedex, store.hasParcel, store.storyStep, store.lastHealLocation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'z' || e.key === 'Z') {
        if (!store.isBattle) {
           setShowMenu(prev => !prev);
           soundManager.play('SELECT');
        }
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w') pressedKeys.current.add('up');
      if (e.key === 'ArrowDown' || e.key === 's') pressedKeys.current.add('down');
      if (e.key === 'ArrowLeft' || e.key === 'a') pressedKeys.current.add('left');
      if (e.key === 'ArrowRight' || e.key === 'd') pressedKeys.current.add('right');
      if (e.key === 'x' || e.key === 'X') {
        pressedKeys.current.add('A');
        handleAction();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') pressedKeys.current.delete('up');
      if (e.key === 'ArrowDown' || e.key === 's') pressedKeys.current.delete('down');
      if (e.key === 'ArrowLeft' || e.key === 'a') pressedKeys.current.delete('left');
      if (e.key === 'ArrowRight' || e.key === 'd') pressedKeys.current.delete('right');
      if (e.key === 'x' || e.key === 'X') pressedKeys.current.delete('A');
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const interval = setInterval(() => {
      if (pressedKeys.current.size > 0 && !store.isBattle && !store.dialogue && !store.isMoving) {
         const currentKeys = Array.from(pressedKeys.current);
         const dir = currentKeys[currentKeys.length - 1];
         if (['up','down','left','right'].includes(dir as string)) {
             handleMove(dir as Direction);
         }
      }
    }, 60);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [handleMove, handleAction, store.isBattle, store.dialogue, store.isMoving]);

  useEffect(() => {
    if (store.isBattle) soundManager.play('BATTLE_START');
    else if (store.currentMap === 'PALLET_TOWN') soundManager.play('PALLET_TOWN');
    else if (store.currentMap === 'ROUTE_1' || store.currentMap === 'VIRIDIAN_FOREST') soundManager.play('ROUTE_1');
    else if (Object.keys(store.teleports).includes(store.currentMap) && store.currentMap.includes('CITY')) soundManager.play('PALLET_TOWN');
    else soundManager.play('PALLET_TOWN');
  }, [store.isBattle, store.currentMap]);

  return (
    <div className="w-screen h-screen bg-[#000] flex flex-col font-game select-none overflow-hidden touch-none"
         onContextMenu={e => e.preventDefault()}>
         
      <AnimatePresence>
        {store.showBattleTransition && <BattleTransition onComplete={() => { store.setBattleState(true, store.enemyPokemon); store.setShowBattleTransition(false); store.setIsLocked(false); }} />}
      </AnimatePresence>

      <div className="relative flex-1 w-full overflow-hidden">
        <motion.div 
          className="absolute bg-emerald-50 rounded-[2rem] shadow-2xl overflow-hidden border-8 border-slate-800"
          initial={false}
          animate={{ x: -store.playerPos.x * TILE_SIZE + (windowSize.width/2) - (TILE_SIZE/2), y: -store.playerPos.y * TILE_SIZE + (windowSize.height/2) - (TILE_SIZE/2) }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <div className="grid" style={{ gridTemplateColumns: \`repeat(\${GRID_SIZE}, \${TILE_SIZE}px)\`, width: GRID_SIZE*TILE_SIZE, height: GRID_SIZE*TILE_SIZE }}>
            {store.worldMaps[store.currentMap].map((row, y) => row.map((tile, x) => <GameTile key={\`\${x}-\${y}\`} type={tile.type} />))}
          </div>
          {store.getNPCs()[store.currentMap]?.map(npc => <NPCComponent key={npc.id} npc={npc} />)}
          <Player position={store.playerPos} direction={store.direction} isMoving={store.isMoving} />
        </motion.div>
        
        <DialogueBox text={store.dialogue || ''} onComplete={() => store.setDialogue(null)} />
        
        <AnimatePresence>
          {store.isBattle && store.enemyPokemon && (
            <BattleScreen 
               playerPkmn={store.playerTeam[0]}
               enemyPkmn={store.enemyPokemon}
               playerAnim={playerAnim}
               enemyAnim={enemyAnim}
               battleLog={battleLog}
               onAttack={(move) => handleAttack(move, playerAnim, enemyAnim)}
               onRun={() => store.setBattleState(false, null)}
               onCatch={handleCatch}
               hasPokeballs={store.inventory.includes('POKEBALL')}
            />
          )}
        </AnimatePresence>
        {showTeam && <TeamMenuUI team={store.playerTeam} pc={store.pcStorage} showPC={showPC} onClose={() => { setShowTeam(false); setShowPC(false); }} />}
      </div>
      
      <div className="h-48 sm:h-56 bg-slate-900 border-t-8 border-slate-700 flex p-4 sm:p-8 gap-8 sm:gap-12 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-40">
        <div className="flex-1 max-w-[200px] sm:max-w-[240px] relative">
          <button className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-16 bg-slate-300 z-20" onPointerDown={() => handleMove('up')} />
          <button className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-16 bg-slate-300 z-20" onPointerDown={() => handleMove('down')} />
          <button className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-12 bg-slate-300 z-20" onPointerDown={() => handleMove('left')} />
          <button className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-12 bg-slate-300 z-20" onPointerDown={() => handleMove('right')} />
        </div>
        <div className="flex-1 flex flex-col justify-end items-end gap-6 sm:gap-8 pb-4 sm:pb-8">
          <div className="flex gap-4 sm:gap-8">
            <button className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white" onPointerDown={() => setShowMenu(!showMenu)}>B</button>
            <button className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white" onPointerDown={handleAction}>A</button>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/App.tsx', newAppStr);
