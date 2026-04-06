import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pokemon, Move } from '../types';
import { soundManager } from '../lib/sounds';
import { calcStat } from '../lib/damage';

export interface BattleScreenProps {
  battleShake: boolean;
  enemyPokemon: Pokemon | null;
  enemyAnim: 'idle' | 'attack' | 'hit' | 'faint';
  isCatching: boolean;
  projectile: { type: string, from: 'player' | 'enemy' } | null;
  hitEffect: { x: number, y: number, type: string } | null;
  damageNumber: { x: number, y: number, value: number } | null;
  healNumber: { x: number, y: number, value: number } | null;
  playerTeam: Pokemon[];
  playerAnim: 'idle' | 'attack' | 'hit' | 'faint';
  battleLog: string;
  showMoves: boolean;
  setShowMoves: (show: boolean) => void;
  isTrainerBattle: boolean;
  isPlayerTurn: boolean;
  setIsBattle: (isBattle: boolean) => void;
  onFlee: () => void;
  setShowInventory: (show: boolean) => void;
  setShowTeam: (show: boolean) => void;
  handleAttack: (move: Move) => void;
}

const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-slate-400', fire: 'bg-orange-500', water: 'bg-blue-500',
  grass: 'bg-green-500', electric: 'bg-yellow-400', ice: 'bg-cyan-400',
  fighting: 'bg-red-700', poison: 'bg-purple-500', ground: 'bg-yellow-600',
  flying: 'bg-indigo-400', psychic: 'bg-pink-500', bug: 'bg-lime-500',
  rock: 'bg-yellow-700', ghost: 'bg-violet-700', dragon: 'bg-indigo-700',
};

/** Small colored stat boost/drop indicators, e.g. ATK↓ DEF↑ */
function StatBoostBadges({ boosts }: { boosts: Pokemon['statBoosts'] }) {
  if (!boosts) return null;
  const labels: Record<string, string> = { attack: 'ATQ', defense: 'DEF', special: 'ESP', speed: 'VEL' };
  const entries = Object.entries(boosts).filter(([, v]) => v !== 0) as [string, number][];
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-0.5 mt-1">
      {entries.map(([stat, val]) => (
        <span
          key={stat}
          className={`text-[8px] font-black px-1 rounded ${val > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
        >
          {labels[stat]}{val > 0 ? '↑'.repeat(Math.min(val, 3)) : '↓'.repeat(Math.min(-val, 3))}
        </span>
      ))}
    </div>
  );
}

/** Trainer NPC silhouette shown on enemy side during trainer battles */
function TrainerSilhouette() {
  return (
    <div className="w-8 h-8 sm:w-12 sm:h-12 mb-4 flex flex-col items-center justify-end opacity-80 shrink-0">
      {/* Head */}
      <div className="w-5 h-5 sm:w-7 sm:h-7 bg-[#d8d8d8] rounded-full border-2 border-[#383838] flex items-center justify-center mb-0.5">
        <div className="flex gap-1">
          <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-[#383838] rounded-full" />
          <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-[#383838] rounded-full" />
        </div>
      </div>
      {/* Body */}
      <div className="w-6 h-5 sm:w-9 sm:h-7 bg-[#f8f8f8] border-2 border-[#383838] rounded-sm" />
    </div>
  );
}

export function BattleScreen({
  battleShake, enemyPokemon, enemyAnim, isCatching, projectile, hitEffect, damageNumber, healNumber,
  playerTeam, playerAnim, battleLog, isTrainerBattle, isPlayerTurn, onFlee,
  setShowInventory, setShowTeam, handleAttack
}: BattleScreenProps) {

  const playerPkmn = playerTeam[0];
  const [hoveredMoveIdx, setHoveredMoveIdx] = useState<number | null>(null);

  const hpColor = (hp: number, max: number) => {
    const ratio = hp / max;
    if (ratio > 0.5) return 'bg-[#48d0b0] border-[#38a888]';
    if (ratio > 0.2) return 'bg-[#f8d030] border-[#c8a020]';
    return 'bg-[#f85838] border-[#c84028]';
  };

  const getMoveCategory = (m: Move) => {
    if (m.power === 0) return m.statChange ? 'Estado' : 'Estado';
    const physical = ['normal','fighting','flying','poison','ground','rock','bug','ghost'];
    return physical.includes(m.type) ? 'Físico' : 'Especial';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: battleShake ? [0, -10, 10, -10, 10, 0] : 0 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-[#f8f8d8] flex flex-col font-game"
      style={{
        backgroundImage: 'linear-gradient(to bottom, #d8f0f8 0%, #f8f8d8 50%, #d8e8b0 100%)'
      }}
    >
      {/* Top Background area */}
      <div className="flex-1 relative w-full h-[65vh] overflow-hidden">

        {/* Enemy Platform & Sprite */}
        <div className="absolute top-[20%] right-[5%] sm:right-[10%] w-[180px] sm:w-[300px] flex flex-col items-center">
          <div className="absolute bottom-2 w-full h-8 sm:h-12 bg-black/10 rounded-[100%] border-4 border-black/5 blur-[2px]" />

          <div className="flex items-end gap-2 relative z-10">
            {/* Trainer silhouette on enemy side in trainer battles */}
            {isTrainerBattle && <TrainerSilhouette />}

            <motion.div
              className="w-24 h-24 sm:w-40 sm:h-40 relative z-10"
              variants={{
                idle: { y: [0, -4, 0], transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } },
                attack: { x: [0, -40, 0], scale: [1, 1.1, 1], transition: { duration: 0.3 } },
                hit: { x: [0, -10, 10, -10, 10, 0], filter: ["brightness(1)", "invert(1)", "brightness(1)"], transition: { duration: 0.4 } },
                faint: { y: [0, 100], opacity: [1, 0], transition: { duration: 0.6, ease: "easeIn" } }
              }}
              animate={isCatching ? { opacity: 0, scale: 0 } : enemyAnim}
            >
              {enemyPokemon?.sprite && <img src={enemyPokemon.sprite} className="w-full h-full object-contain pixelated drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]" alt="enemy" />}
            </motion.div>
          </div>
        </div>

        {/* Enemy HUD */}
        <div className="absolute top-[10%] left-[3%] sm:left-[5%]">
          <div className="bg-[#f8f8f0] border-t-4 border-l-4 border-b-4 border-r-[12px] rounded-tl-2xl rounded-bl-2xl border-[#506860] p-2 sm:p-3 w-[180px] sm:w-[260px] shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-end border-b-2 border-slate-300 pb-1 mb-1 sm:mb-2">
              <h3 className="text-[#383838] font-bold text-sm sm:text-xl uppercase tracking-tighter truncate mr-1">{enemyPokemon?.name}</h3>
              <p className="text-[#383838] font-bold text-xs sm:text-lg shrink-0">Nv{enemyPokemon?.level}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-[#d8d8d8] p-1 rounded-full border-2 border-[#506860]">
              <span className="text-[8px] sm:text-[10px] font-black text-[#f8d830] tracking-widest pl-1 drop-shadow-[1px_1px_0_#c8a020]">PS</span>
              <div className="flex-1 h-2 sm:h-3 bg-white rounded-full border border-slate-400 overflow-hidden ml-1">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: `${(enemyPokemon?.hp || 0) / (enemyPokemon?.maxHp || 1) * 100}%` }}
                  className={`h-full border-t-2 border-white/50 ${hpColor(enemyPokemon?.hp || 0, enemyPokemon?.maxHp || 1)}`}
                />
              </div>
            </div>
            <StatBoostBadges boosts={enemyPokemon?.statBoosts} />
            {/* Debug stats — hidden on mobile */}
            {enemyPokemon && (
              <div className="mt-2 grid-cols-4 gap-1 hidden sm:grid">
                {(['attack','defense','special','speed'] as const).map(stat => (
                  <div key={stat} className="bg-slate-100 rounded px-1 py-0.5 text-center">
                    <div className="text-[8px] text-slate-400 uppercase font-bold">{stat.slice(0,3)}</div>
                    <div className="text-[10px] font-mono font-black text-slate-700">{calcStat(enemyPokemon.baseStats[stat], enemyPokemon.level)}</div>
                  </div>
                ))}
              </div>
            )}
            {enemyPokemon?.status && enemyPokemon.status !== 'none' && (
              <div className="mt-1 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-center">{enemyPokemon.status}</div>
            )}
          </div>
        </div>

        {/* Player Platform & Sprite */}
        <div className="absolute bottom-[20%] left-[5%] sm:left-[10%] w-[200px] sm:w-[350px] flex flex-col items-center">
          <div className="absolute bottom-4 w-full h-10 sm:h-16 bg-black/15 rounded-[100%] border-4 border-black/5 blur-[2px]" />

          <div className="flex items-end gap-2 relative z-10">
            {/* Player character sprite — shown in trainer battles */}
            {isTrainerBattle && (
              <div
                className="w-10 h-10 sm:w-16 sm:h-16 mb-4 opacity-90"
                style={{
                  backgroundImage: "url('/player.png')",
                  backgroundSize: "400% 300%",
                  backgroundPositionX: "0%",
                  backgroundPositionY: "0%",
                  imageRendering: "pixelated",
                  transform: "scaleX(-1)",
                  filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.3))",
                }}
              />
            )}

            <motion.div
              className="w-32 h-32 sm:w-56 sm:h-56"
              variants={{
                idle: { y: [0, -2, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
                attack: { x: [0, 40, 0], scale: [1, 1.05, 1], transition: { duration: 0.3 } },
                hit: { x: [0, -10, 10, -10, 10, 0], filter: ["brightness(1)", "invert(1)", "brightness(1)"], transition: { duration: 0.4 } },
                faint: { y: [0, 100], opacity: [1, 0], transition: { duration: 0.5, ease: "easeIn" } }
              }}
              animate={playerAnim}
            >
              {playerPkmn?.sprite && <img src={playerPkmn.sprite.replace('pokemon/', 'pokemon/back/')} className="w-full h-full object-contain pixelated drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]" alt="player" />}
            </motion.div>
          </div>
        </div>

        {/* Player HUD */}
        <div className="absolute bottom-[25%] sm:bottom-[30%] right-[3%] sm:right-[5%]">
          <div className="bg-[#f8f8f0] border-t-4 border-r-4 border-b-4 border-l-[12px] rounded-tr-2xl rounded-br-2xl border-[#506860] p-2 sm:p-3 pl-3 sm:pl-4 w-[180px] sm:w-[280px] shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-end border-b-2 border-slate-300 pb-1 mb-1 sm:mb-2">
              <h3 className="text-[#383838] font-bold text-sm sm:text-xl uppercase tracking-tighter truncate mr-1">{playerPkmn?.name}</h3>
              <p className="text-[#383838] font-bold text-xs sm:text-lg shrink-0">Nv{playerPkmn?.level}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-[#d8d8d8] p-1 rounded-full border-2 border-[#506860]">
              <span className="text-[8px] sm:text-[10px] font-black text-[#f8d830] tracking-widest pl-1 drop-shadow-[1px_1px_0_#c8a020]">PS</span>
              <div className="flex-1 h-2 sm:h-3 bg-white rounded-full border border-slate-400 overflow-hidden ml-1">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: `${(playerPkmn?.hp || 0) / (playerPkmn?.maxHp || 1) * 100}%` }}
                  className={`h-full border-t-2 border-white/50 ${hpColor(playerPkmn?.hp || 0, playerPkmn?.maxHp || 1)}`}
                />
              </div>
            </div>
            <div className="text-right mt-0.5 sm:mt-1 pr-1">
              <span className="text-[#383838] font-bold text-sm sm:text-lg tracking-widest">{playerPkmn?.hp} /  {playerPkmn?.maxHp}</span>
            </div>
            <div className="h-1 sm:h-1.5 w-full bg-[#d8d8d8] mt-1 flex border border-slate-400">
              <div className="bg-[#58a8f8] h-full" style={{ width: `${(playerPkmn?.exp || 0) / (playerPkmn?.expToNextLevel || 100) * 100}%` }} />
            </div>
            <StatBoostBadges boosts={playerPkmn?.statBoosts} />
            {/* Debug stats — hidden on mobile */}
            {playerPkmn && (
              <div className="mt-2 grid-cols-4 gap-1 hidden sm:grid">
                {(['attack','defense','special','speed'] as const).map(stat => (
                  <div key={stat} className="bg-slate-100 rounded px-1 py-0.5 text-center">
                    <div className="text-[8px] text-slate-400 uppercase font-bold">{stat.slice(0,3)}</div>
                    <div className="text-[10px] font-mono font-black text-slate-700">{calcStat(playerPkmn.baseStats[stat], playerPkmn.level)}</div>
                  </div>
                ))}
              </div>
            )}
            {playerPkmn?.status && playerPkmn.status !== 'none' && (
              <div className="mt-1 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-center">{playerPkmn.status}</div>
            )}
          </div>
        </div>

        {/* Visual FX */}
        <AnimatePresence>
          {projectile && (
            <motion.div
              initial={{ left: projectile.from === 'player' ? '30%' : '70%', top: projectile.from === 'player' ? '70%' : '30%', scale: 0, opacity: 0 }}
              animate={{ left: projectile.from === 'player' ? '70%' : '30%', top: projectile.from === 'player' ? '30%' : '70%', scale: [1, 1.5, 1], opacity: 1, rotate: projectile.from === 'player' ? 45 : -135 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed z-[105] text-4xl pointer-events-none"
            >
              {projectile.type === 'fire' ? '🔥' : projectile.type === 'water' ? '💧' : '⚪'}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {hitEffect && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              className="fixed z-[100] pointer-events-none text-4xl sm:text-6xl"
              style={{ left: `${hitEffect.x}%`, top: `${hitEffect.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              💥
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {healNumber && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: -60, scale: [0.5, 1.2, 1, 1] }}
              transition={{ duration: 1 }}
              className="fixed z-[110] pointer-events-none font-black text-2xl sm:text-3xl text-emerald-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              style={{ left: `${healNumber.x}%`, top: `${healNumber.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              +{healNumber.value}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Move tooltip — shown above move buttons when hovering */}
        <AnimatePresence>
          {hoveredMoveIdx !== null && playerPkmn?.moves[hoveredMoveIdx] && (() => {
            const m = playerPkmn.moves[hoveredMoveIdx];
            const typeColor = TYPE_COLORS[m.type] ?? 'bg-slate-400';
            return (
              <motion.div
                key="move-tooltip"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-[35%] left-1/2 -translate-x-1/2 z-[120] pointer-events-none"
              >
                <div className="bg-[#383838] border-2 border-[#282828] rounded-xl px-3 py-2 shadow-xl text-white min-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white ${typeColor}`}>{m.type}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{getMoveCategory(m)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div>
                      <div className="text-slate-400 uppercase text-[9px]">Poder</div>
                      <div className="font-black">{m.power > 0 ? m.power : '—'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase text-[9px]">Precisión</div>
                      <div className="font-black">{m.accuracy}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase text-[9px]">PP</div>
                      <div className={`font-black ${m.pp === 0 ? 'text-red-400' : ''}`}>{m.pp}/{m.maxPp}</div>
                    </div>
                  </div>
                  {m.statusEffect && (
                    <div className="mt-1 text-[9px] text-yellow-300 uppercase font-bold text-center">
                      {m.statusEffect} ({m.statusChance}%)
                    </div>
                  )}
                  {m.statChange && (
                    <div className="mt-1 text-[9px] text-cyan-300 uppercase font-bold text-center">
                      {m.statChange.target === 'enemy' ? 'Rival' : 'Propio'} {m.statChange.stat}{m.statChange.stages > 0 ? '↑' : '↓'}
                    </div>
                  )}
                </div>
                {/* Arrow */}
                <div className="w-3 h-3 bg-[#383838] rotate-45 border-b-2 border-r-2 border-[#282828] mx-auto -mt-1.5" />
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Bottom Menu Area */}
      <div className="h-[35vh] w-full bg-[#383838] flex p-1 sm:p-2 pt-0 pb-0 gap-1 sm:gap-2 overflow-hidden border-t-4 sm:border-t-8 border-[#282828]">

        {/* Left: battle log (always visible) + moves (when player's turn) */}
        <div className={`flex-grow border-4 sm:border-8 ${isPlayerTurn ? 'border-[#f87858]' : 'border-[#506860]'} bg-[#f8f8f8] rounded-lg sm:rounded-xl m-1 sm:m-2 p-2 sm:p-4 relative shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] flex flex-col`}>

          {/* Battle log — small when moves are shown, large otherwise */}
          <p className={`text-[#383838] font-bold uppercase tracking-tighter transition-all ${isPlayerTurn ? 'text-xs sm:text-base opacity-60 mb-1 sm:mb-3' : 'text-lg sm:text-3xl leading-relaxed mt-1 sm:mt-2'}`}>
            {battleLog}
          </p>

          {/* Move buttons — only when it's the player's turn */}
          <AnimatePresence>
            {isPlayerTurn && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-2 gap-1 sm:gap-3 flex-1"
              >
                {playerPkmn?.moves.map((move, i) => {
                  const noPP = move.pp <= 0;
                  return (
                    <button
                      key={i}
                      disabled={noPP}
                      className={`relative flex items-center gap-1 sm:gap-2 font-bold text-sm sm:text-xl uppercase tracking-tighter text-left px-1 sm:px-2 transition-colors rounded ${noPP ? 'text-slate-300 cursor-not-allowed' : 'text-[#383838] cursor-pointer hover:text-red-500 hover:bg-red-50'}`}
                      onClick={() => {
                        if (noPP) return;
                        soundManager.play('SELECT');
                        handleAttack(move);
                      }}
                      onMouseEnter={() => setHoveredMoveIdx(i)}
                      onMouseLeave={() => setHoveredMoveIdx(null)}
                    >
                      {/* Keyboard hint */}
                      <span className="text-[8px] font-mono text-slate-400 shrink-0 hidden sm:inline">[{i + 1}]</span>
                      <span className={`text-xs sm:text-sm ${noPP ? 'text-slate-300' : 'text-red-500'}`}>▶</span>
                      <span className="flex-1 truncate">{move.name}</span>
                      <span className={`text-[10px] sm:text-xs font-mono shrink-0 ${noPP ? 'text-red-400' : 'text-slate-400'}`}>{move.pp}/{move.maxPp}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: utility actions */}
        <div className="w-1/3 min-w-[100px] sm:min-w-[200px] border-4 sm:border-8 border-[#506860] bg-[#f8f8f8] rounded-lg sm:rounded-xl m-1 sm:m-2 ml-0 p-2 sm:p-4 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 grid-rows-3 sm:grid-rows-2 h-full gap-1 sm:gap-4 text-[#383838] font-bold text-sm sm:text-xl items-center tracking-tighter uppercase">
            {([
              { label: 'BOLSA', hint: 'B' },
              { label: 'POKÉMON', hint: 'P' },
              { label: 'HUIR', hint: null },
            ] as const).map(({ label, hint }) => {
              const lockedByTurn = !isPlayerTurn && label !== 'HUIR';
              const disabled = (label === 'HUIR' && isTrainerBattle) || lockedByTurn;
              return (
                <div
                  key={label}
                  className={`relative flex flex-col items-center ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-red-500'}`}
                  onClick={() => {
                    if (disabled) return;
                    soundManager.play('SELECT');
                    if (label === 'HUIR') onFlee();
                    if (label === 'BOLSA') setShowInventory(true);
                    if (label === 'POKÉMON') setShowTeam(true);
                  }}
                >
                  <span>{label}</span>
                  {hint && !disabled && (
                    <span className="text-[8px] font-mono text-slate-400 hidden sm:block">[{hint}]</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
