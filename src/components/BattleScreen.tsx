import { motion, AnimatePresence } from 'motion/react';
import { Pokemon, Move } from '../types';
import { soundManager } from '../lib/sounds';

export interface BattleScreenProps {
  battleShake: boolean;
  enemyPokemon: Pokemon | null;
  enemyAnim: 'idle' | 'attack' | 'hit' | 'faint';
  isCatching: boolean;
  projectile: { type: string, from: 'player' | 'enemy' } | null;
  hitEffect: { x: number, y: number, type: string } | null;
  damageNumber: { x: number, y: number, value: number } | null;
  playerTeam: Pokemon[];
  playerAnim: 'idle' | 'attack' | 'hit' | 'faint';
  battleLog: string;
  showMoves: boolean;
  setShowMoves: (show: boolean) => void;
  setIsBattle: (isBattle: boolean) => void;
  setShowInventory: (show: boolean) => void;
  setShowTeam: (show: boolean) => void;
  handleAttack: (move: Move) => void;
}

export function BattleScreen({
  battleShake, enemyPokemon, enemyAnim, isCatching, projectile, hitEffect, damageNumber,
  playerTeam, playerAnim, battleLog, showMoves, setShowMoves, setIsBattle,
  setShowInventory, setShowTeam, handleAttack
}: BattleScreenProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, x: battleShake ? [0, -10, 10, -10, 10, 0] : 0 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-[90] bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-8"
    >
      <div className="w-full max-w-4xl flex flex-col gap-4 sm:gap-8">
        {/* Enemy */}
        <div className="flex justify-end">
          <div className="bg-white/10 p-4 sm:p-8 rounded-3xl border-2 border-white/20 flex items-center gap-4 sm:gap-8">
            <div className="text-right">
              <h3 className="text-white font-bold text-lg sm:text-2xl uppercase">{enemyPokemon?.name}</h3>
              <p className="text-emerald-400 font-mono text-xs sm:text-base">Lv {enemyPokemon?.level}</p>
              <div className="w-32 sm:w-48 h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: `${(enemyPokemon?.hp || 0) / (enemyPokemon?.maxHp || 1) * 100}%` }}
                  className={`h-full ${(enemyPokemon?.hp || 0) > 10 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                />
              </div>
            </div>
            <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white/5 rounded-full flex items-center justify-center text-2xl sm:text-4xl">
              <motion.div 
                variants={{
                  idle: { 
                    y: [0, -10, 0], 
                    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } 
                  },
                  attack: { 
                    x: [0, -60, 0], 
                    scale: [1, 1.2, 1],
                    rotate: [0, -10, 0],
                    transition: { duration: 0.3 } 
                  },
                  hit: { 
                    x: [0, -15, 15, -15, 15, 0], 
                    y: [0, -10, 0],
                    filter: ["brightness(1)", "brightness(2)", "brightness(1)"],
                    transition: { duration: 0.4 } 
                  },
                  faint: { 
                    y: [0, 20, 100], 
                    opacity: [1, 1, 0], 
                    scale: [1, 0.8, 0.5],
                    transition: { duration: 0.8, ease: "easeIn" } 
                  }
                }}
                animate={isCatching ? { opacity: 0, scale: 0 } : enemyAnim}
              >
                {enemyPokemon?.sprite ? <img src={enemyPokemon.sprite} className="w-full h-full object-contain pixelated" alt="enemy" /> : '❓'}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Projectile Effect */}
        <AnimatePresence>
          {projectile && (
            <motion.div
              initial={{ 
                left: projectile.from === 'player' ? '30%' : '70%',
                top: projectile.from === 'player' ? '70%' : '30%',
                scale: 0,
                opacity: 0
              }}
              animate={{ 
                left: projectile.from === 'player' ? '70%' : '30%',
                top: projectile.from === 'player' ? '30%' : '70%',
                scale: [1, 1.5, 1],
                opacity: 1,
                rotate: projectile.from === 'player' ? 45 : -135
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="fixed z-[105] text-4xl pointer-events-none"
            >
              {(() => {
                switch (projectile.type) {
                  case 'fire': return '🔥';
                  case 'water': return '💧';
                  case 'grass': return '🍃';
                  case 'electric': return '⚡';
                  case 'bug': return '🕸️';
                  case 'flying': return '🌪️';
                  default: return '⚪';
                }
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hit Effect Overlay */}
        <AnimatePresence>
          {hitEffect && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              className="fixed z-[100] pointer-events-none"
              style={{ 
                left: `${hitEffect.x}%`, 
                top: `${hitEffect.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="relative">
                <div className={`absolute inset-0 blur-xl rounded-full w-32 h-32 opacity-50 ${
                  hitEffect.type === 'fire' ? 'bg-orange-500' :
                  hitEffect.type === 'water' ? 'bg-blue-500' :
                  hitEffect.type === 'grass' ? 'bg-green-500' :
                  hitEffect.type === 'electric' ? 'bg-yellow-400' :
                  hitEffect.type === 'bug' ? 'bg-lime-600' :
                  hitEffect.type === 'flying' ? 'bg-sky-300' :
                  'bg-slate-400'
                }`} />
                <div className="text-6xl">
                  {hitEffect.type === 'fire' ? '🔥' :
                   hitEffect.type === 'water' ? '🌊' :
                   hitEffect.type === 'grass' ? '🌿' :
                   hitEffect.type === 'electric' ? '⚡' :
                   hitEffect.type === 'bug' ? '🕸️' :
                   hitEffect.type === 'flying' ? '💨' :
                   '💥'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Damage Number Overlay */}
        <AnimatePresence>
          {damageNumber && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: -50 }}
              exit={{ opacity: 0 }}
              className="fixed z-[110] pointer-events-none font-black text-4xl text-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
              style={{ 
                left: `${damageNumber.x}%`, 
                top: `${damageNumber.y}%`,
              }}
            >
              -{damageNumber.value}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Poké Ball Catch Animation */}
        <AnimatePresence>
          {isCatching && (
            <motion.div
              initial={{ left: '30%', top: '70%', scale: 0 }}
              animate={{ 
                left: ['30%', '50%', '70%'],
                top: ['70%', '40%', '30%'],
                rotate: [0, 720],
                scale: [0, 1.5, 1]
              }}
              className="fixed z-[120] text-5xl pointer-events-none"
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, -20, 20, -20, 20, 0],
                  x: [0, -5, 5, -5, 5, 0]
                }}
                transition={{ delay: 1, duration: 1, repeat: 2 }}
              >
                🔴
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player */}
        <div className="flex justify-start">
          <div className="bg-white/10 p-4 sm:p-8 rounded-3xl border-2 border-white/20 flex items-center gap-4 sm:gap-8">
            <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white/5 rounded-full flex items-center justify-center text-2xl sm:text-4xl">
              <motion.div 
                variants={{
                  idle: { 
                    y: [0, -5, 0], 
                    transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } 
                  },
                  attack: { 
                    x: [0, 60, 0], 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, 0],
                    transition: { duration: 0.3 } 
                  },
                  hit: { 
                    x: [0, -15, 15, -15, 15, 0], 
                    y: [0, 10, 0],
                    filter: ["brightness(1)", "brightness(2)", "brightness(1)"],
                    transition: { duration: 0.4 } 
                  },
                  faint: { 
                    y: [0, 20, 100], 
                    opacity: [1, 1, 0], 
                    scale: [1, 0.8, 0.5],
                    transition: { duration: 0.8, ease: "easeIn" } 
                  }
                }}
                animate={playerAnim}
              >
                {playerTeam[0]?.sprite ? <img src={playerTeam[0].sprite} className="w-full h-full object-contain pixelated" alt="player" /> : '❓'}
              </motion.div>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg sm:text-2xl uppercase">{playerTeam[0]?.name}</h3>
              <p className="text-emerald-400 font-mono text-xs sm:text-base">Lv {playerTeam[0]?.level}</p>
              <div className="w-32 sm:w-48 h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: `${(playerTeam[0]?.hp || 0) / (playerTeam[0]?.maxHp || 1) * 100}%` }}
                  className={`h-full ${(playerTeam[0]?.hp || 0) > (playerTeam[0]?.maxHp || 0) / 2 ? 'bg-emerald-500' : (playerTeam[0]?.hp || 0) > (playerTeam[0]?.maxHp || 0) / 5 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                />
              </div>
              {/* EXP Bar */}
              <div className="w-32 sm:w-48 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${(playerTeam[0]?.exp || 0) / (playerTeam[0]?.expToNextLevel || 100) * 100}%` }}
                  className="h-full bg-blue-400" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="bg-white/90 p-4 rounded-2xl border-4 border-slate-800">
          <p className="text-slate-800 font-bold text-lg">{battleLog}</p>
        </div>

        {/* Battle Menu */}
        <div className="grid grid-cols-2 gap-4">
          {showMoves ? (
            playerTeam[0]?.moves.map((move, i) => (
              <button 
                key={i}
                onClick={() => {
                  soundManager.play('SELECT');
                  handleAttack(move);
                  setShowMoves(false);
                }}
                className="p-6 bg-white/5 hover:bg-red-500 border-2 border-white/10 rounded-2xl text-white font-black text-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center"
              >
                <span>{move.name}</span>
                <span className="text-[10px] text-white/50 uppercase tracking-widest mt-1">{move.type}</span>
              </button>
            ))
          ) : (
            ['LUCHAR', 'BOLSA', 'POKÉMON', 'HUIR'].map((action) => (
              <button 
                key={action}
                onClick={() => {
                  soundManager.play('SELECT');
                  if (action === 'HUIR') setIsBattle(false);
                  if (action === 'LUCHAR') setShowMoves(true);
                  if (action === 'BOLSA') setShowInventory(true);
                  if (action === 'POKÉMON') setShowTeam(true);
                }}
                className="p-6 bg-white/5 hover:bg-red-500 border-2 border-white/10 rounded-2xl text-white font-black text-xl transition-all hover:scale-105 active:scale-95"
              >
                {action}
              </button>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
