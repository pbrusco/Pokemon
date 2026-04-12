import { useEffect, useRef, useState } from 'react';
import { motion, useAnimate } from 'framer-motion';
import { Pokemon, Move } from '../types';
import { soundManager } from '../lib/sounds';
import { sd, sdur } from '../lib/gameSpeed';

export interface BattleScreenProps {
  currentMap: string;
  battleShake: boolean;
  enemyPokemon: Pokemon | null;
  enemyAnim: 'idle' | 'attack' | 'hit' | 'faint';
  isCatching: boolean;
  catchResult: boolean | null;
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

function PokeballAnim({ isCatching, catchResult }: { isCatching: boolean; catchResult: boolean | null }) {
  const [scope, animate] = useAnimate();
  const [visible, setVisible] = useState(false);
  const catchResultRef = useRef<boolean | null>(null);

  useEffect(() => { catchResultRef.current = catchResult; }, [catchResult]);

  useEffect(() => {
    if (!isCatching) { setVisible(false); return; }
    setVisible(true);

    (async () => {
      await new Promise(r => setTimeout(r, sd(30))); // wait for mount
      if (!scope.current) return;

      // Reset to start position
      await animate(scope.current, { x: 0, y: 0, rotate: 0, scale: 0.7, opacity: 1 }, { duration: 0 });

      // Phase 1: Throw arc toward enemy (upper-right)
      await animate(scope.current,
        { x: [0, 260], y: [0, -190], rotate: [0, 540], scale: [0.7, 1.1, 1] },
        { duration: sdur(0.65), ease: 'easeOut' }
      );

      // Phase 2: Drop to resting spot
      await animate(scope.current,
        { y: [-190, -110] },
        { duration: sdur(0.25), ease: 'easeIn' }
      );

      // Small bounce
      await animate(scope.current,
        { y: [-110, -130, -110] },
        { duration: sdur(0.2), ease: 'easeOut' }
      );

      // Phase 3: Three wobbles, tapering off
      const wobbleAngles = [[540, 516, 564, 540], [540, 520, 560, 540], [540, 524, 556, 540]];
      for (let i = 0; i < 3; i++) {
        await animate(scope.current, { rotate: wobbleAngles[i] }, { duration: sdur(0.45), ease: 'easeInOut' });
        if (i < 2) await new Promise(r => setTimeout(r, sd(120)));
      }

      // Brief pause — catchResult should be set by now
      await new Promise(r => setTimeout(r, sd(350)));

      const result = catchResultRef.current;
      if (result === true) {
        // Caught: three quick flashes then settle
        for (let i = 0; i < 3; i++) {
          await animate(scope.current, { opacity: [1, 0.15, 1] }, { duration: sdur(0.28) });
        }
        await animate(scope.current, { scale: [1, 1.15, 1] }, { duration: sdur(0.35) });
      } else {
        // Escaped: ball bursts open
        await animate(scope.current, { scale: [1, 1.5], rotate: [540, 610], opacity: [1, 0] }, { duration: sdur(0.4) });
      }
    })();
  }, [isCatching]);

  if (!visible) return null;

  return (
    <div
      ref={scope}
      className="absolute z-[102] pointer-events-none"
      style={{ bottom: '30%', left: '22%' }}
    >
      <div className="relative w-10 h-10 sm:w-14 sm:h-14 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
        {/* Ball shell */}
        <div className="absolute inset-0 rounded-full border-[3px] border-black overflow-hidden">
          <div className="absolute top-0 w-full h-1/2 bg-red-500" />
          <div className="absolute bottom-0 w-full h-1/2 bg-white" />
        </div>
        {/* Center band */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-[3px] bg-black z-10" />
        {/* Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20
                        w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black border-[2px] border-black
                        flex items-center justify-center">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}

export function BattleScreen({
  currentMap,
  battleShake, enemyPokemon, enemyAnim, isCatching, catchResult,
  playerTeam, playerAnim, battleLog, isTrainerBattle, isPlayerTurn, onFlee,
  setShowInventory, setShowTeam, handleAttack, showMoves, setShowMoves
}: BattleScreenProps) {

  const playerPkmn = playerTeam[0];
  const [hoveredMoveIdx, setHoveredMoveIdx] = useState<number | null>(null);
  const [enemySpriteError, setEnemySpriteError] = useState(false);
  const [playerSpriteError, setPlayerSpriteError] = useState(false);

  useEffect(() => {
    setEnemySpriteError(false);
  }, [enemyPokemon?.sprite]);

  useEffect(() => {
    setPlayerSpriteError(false);
  }, [playerPkmn?.sprite]);

  const hpColor = (hp: number, max: number) => {
    const ratio = hp / max;
    if (ratio > 0.5) return 'bg-[#48d0b0] border-[#38a888]';
    if (ratio > 0.2) return 'bg-[#f8d030] border-[#c8a020]';
    return 'bg-[#f85838] border-[#c84028]';
  };

  const getBattleBackground = () => {
    if (currentMap.includes('GYM')) return 'linear-gradient(to bottom, #f4f7f9 0%, #eef3f7 100%)';
    if (currentMap.includes('FOREST') || currentMap.includes('ROUTE')) return 'linear-gradient(to bottom, #f7fbf5 0%, #f5f7ef 100%)';
    return 'linear-gradient(to bottom, #f8fbf7 0%, #f6f8ef 100%)';
  };

  const getMoveDescription = (m: Move) => {
    if (m.power === 0) {
      if (m.statusEffect) return `Aplica ${m.statusEffect} (${m.statusChance ?? 100}%).`;
      if (m.statChange) {
        const dir = m.statChange.stages > 0 ? 'sube' : 'baja';
        const target = m.statChange.target === 'enemy' ? 'del rival' : 'propio';
        return `${dir} ${m.statChange.stat} ${target}.`;
      }
      return 'Movimiento de estado.';
    }
    return `${m.type.toUpperCase()} · Poder ${m.power} · Precisión ${m.accuracy}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: battleShake ? [0, -10, 10, -10, 10, 0] : 0 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex flex-col font-game"
      style={{
        backgroundImage: getBattleBackground(),
      }}
    >
      {/* Top Background area */}
      <div className="flex-1 relative w-full h-[65vh] overflow-hidden">

        {/* Enemy Platform & Sprite */}
        <div className="absolute top-[22%] right-[14%] sm:right-[18%] w-[180px] sm:w-[300px] flex flex-col items-center">
          <div className="absolute bottom-2 w-full h-8 sm:h-12 bg-white/90 rounded-[100%] border-2 border-slate-200" />

          <div className="flex items-end gap-2 relative z-10">
            <motion.div
              className="w-24 h-24 sm:w-40 sm:h-40 relative z-10"
              variants={{
                idle: { y: [0, -4, 0], transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } },
                attack: { x: [0, -40, 0], scale: [1, 1.1, 1], transition: { duration: sdur(0.3) } },
                hit: { x: [0, -10, 10, -10, 10, 0], filter: ["brightness(1)", "invert(1)", "brightness(1)"], transition: { duration: sdur(0.4) } },
                faint: { y: [0, 100], opacity: [1, 0], transition: { duration: sdur(0.6), ease: "easeIn" } }
              }}
              animate={isCatching ? { opacity: 0, scale: 0 } : enemyAnim}
            >
              {enemyPokemon?.sprite && !enemySpriteError && (
                <img
                  src={enemyPokemon.sprite}
                  className="w-full h-full object-contain pixelated drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]"
                  alt="enemy"
                  onError={() => setEnemySpriteError(true)}
                />
              )}
              {enemySpriteError && (
                <div
                  className="w-full h-full bg-[#2c2c2c]/80 border-2 border-[#1a1a1a] rounded-full"
                  aria-label="enemy-fallback"
                />
              )}
            </motion.div>
          </div>
        </div>

        {/* Enemy HUD */}
        <div className="absolute top-[10%] right-[6%] sm:right-[10%]">
          <div className="bg-[#f8f8f0] border-[3px] border-[#4f6e69] rounded-sm p-2 sm:p-3 w-[180px] sm:w-[260px] shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
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
                  transition={{ duration: sdur(0.7), ease: 'linear' }}
                  className={`h-full border-t-2 border-white/50 ${hpColor(enemyPokemon?.hp || 0, enemyPokemon?.maxHp || 1)}`}
                />
              </div>
            </div>
            <StatBoostBadges boosts={enemyPokemon?.statBoosts} />
            {enemyPokemon?.status && enemyPokemon.status !== 'none' && (
              <div className="mt-1 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-center">{enemyPokemon.status}</div>
            )}
          </div>
        </div>

        {/* Player Platform & Sprite */}
        <div className="absolute bottom-[22%] left-[14%] sm:left-[18%] w-[200px] sm:w-[350px] flex flex-col items-center">
          <div className="absolute bottom-4 w-full h-10 sm:h-16 bg-white/90 rounded-[100%] border-2 border-slate-200" />

          <div className="flex items-end gap-2 relative z-10">
            <motion.div
              className="w-32 h-32 sm:w-56 sm:h-56"
              variants={{
                idle: { y: [0, -2, 0], opacity: 1, x: 0, transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
                attack: { x: [0, 40, 0], scale: [1, 1.05, 1], transition: { duration: sdur(0.3) } },
                hit: { x: [0, -10, 10, -10, 10, 0], filter: ["brightness(1)", "invert(1)", "brightness(1)"], transition: { duration: sdur(0.4) } },
                faint: { y: [0, 100], opacity: [1, 0], transition: { duration: sdur(0.5), ease: "easeIn" } }
              }}
              animate={playerAnim}
            >
              {playerPkmn?.sprite && !playerSpriteError && (
                <img
                  src={playerPkmn.sprite.replace('pokemon/', 'pokemon/back/')}
                  className="w-full h-full object-contain pixelated drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]"
                  alt="player"
                  onError={() => setPlayerSpriteError(true)}
                />
              )}
              {playerSpriteError && (
                <div
                  className="w-full h-full bg-[#2c2c2c]/80 border-2 border-[#1a1a1a] rounded-full"
                  aria-label="player-fallback"
                />
              )}
            </motion.div>
          </div>
        </div>

       {/* Player HUD */}
<div className="absolute bottom-[25%] sm:bottom-[30%] left-[3%] sm:left-[5%]">
  <div className="bg-[#f8f8f0] border-[3px] border-[#4f6e69] rounded-sm p-2 sm:p-3 pl-3 sm:pl-4 w-[180px] sm:w-[280px] shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
    <div className="flex justify-between items-end border-b-2 border-slate-300 pb-1 mb-1 sm:mb-2">
      <h3 className="text-[#383838] font-bold text-sm sm:text-xl uppercase tracking-tighter truncate mr-1">{playerPkmn?.name}</h3>
      <p className="text-[#383838] font-bold text-xs sm:text-lg shrink-0">Nv{playerPkmn?.level}</p>
    </div>
    
    {/* HP Section */}
    <div className="flex items-center gap-1 sm:gap-2 bg-[#d8d8d8] p-1 rounded-full border-2 border-[#506860]">
      <span className="text-[8px] sm:text-[10px] font-black text-[#f8d830] tracking-widest pl-1 drop-shadow-[1px_1px_0_#c8a020]">PS</span>
      <div className="flex-1 h-2 sm:h-3 bg-white rounded-full border border-slate-400 overflow-hidden ml-1">
        <motion.div
          initial={false}
          animate={{ width: `${(playerPkmn?.hp || 0) / (playerPkmn?.maxHp || 1) * 100}%` }}
          transition={{ duration: sdur(0.7), ease: 'linear' }}
          className={`h-full border-t-2 border-white/50 ${hpColor(playerPkmn?.hp || 0, playerPkmn?.maxHp || 1)}`}
        />
      </div>
    </div>
    
    <div className="text-right mt-0.5 sm:mt-1 pr-1">
      <span className="text-[#383838] font-bold text-sm sm:text-lg tracking-widest">{playerPkmn?.hp} / {playerPkmn?.maxHp}</span>
    </div>

    {/* UPDATED: Experience Section with Numbers */}
    <div className="mt-1">
      <div className="flex justify-between items-center px-1 mb-0.5">
        <span className="text-[8px] sm:text-[10px] font-black text-[#58a8f8] italic uppercase tracking-tighter">Exp</span>
        <span className="text-[9px] sm:text-[11px] font-mono font-bold text-slate-600">
          {playerPkmn?.exp || 0} / {playerPkmn?.expToNextLevel || 100}
        </span>
      </div>
      <div className="h-1 sm:h-1.5 w-full bg-[#d8d8d8] flex border border-slate-400 overflow-hidden">
        <motion.div 
          initial={false}
          animate={{ width: `${((playerPkmn?.exp || 0) / (playerPkmn?.expToNextLevel || 100)) * 100}%` }}
          className="bg-[#58a8f8] h-full border-t border-white/30" 
        />
      </div>
    </div>

    <StatBoostBadges boosts={playerPkmn?.statBoosts} />
    {playerPkmn?.status && playerPkmn.status !== 'none' && (
      <div className="mt-1 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-center">{playerPkmn.status}</div>
    )}
  </div>
</div>
        {/* Pokeball animation */}
        <PokeballAnim isCatching={isCatching} catchResult={catchResult} />

      </div>

      {/* Bottom Menu Area */}
      <div className="h-[35vh] w-full bg-[#26343f] flex p-2 sm:p-3 gap-2 sm:gap-3 overflow-hidden border-t-4 border-[#1d2830]">

        {/* Left: battle log */}
        <div className="flex-grow border-4 border-[#f8d870] bg-[#1f3558] rounded-sm p-3 sm:p-4 relative shadow-[inset_0_0_0_2px_#0f1f38] flex flex-col">

          <p className="text-white font-bold tracking-tight text-base sm:text-2xl leading-relaxed mt-1">
            {battleLog}
          </p>
        </div>

        {/* Right: actions / moves */}
        <div className="w-1/3 min-w-[120px] sm:min-w-[230px] border-4 border-[#4f6e69] bg-[#f8f8f8] rounded-sm p-2 sm:p-3 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.06)] flex flex-col">
          {(playerAnim !== 'idle' || enemyAnim !== 'idle') ? null : isPlayerTurn && !showMoves ? (
            /* Branch A: Main battle menu */
            <div className="grid grid-cols-2 h-full gap-2 text-[#2f2f2f] font-bold text-sm sm:text-lg items-center tracking-tight uppercase">
              {([
                { label: 'LUCHAR', shortcut: '1', action: () => setShowMoves(true), disabled: false },
                { label: 'POKÉMON', shortcut: '2', action: () => setShowTeam(true), disabled: false },
                { label: 'BOLSA', shortcut: '3', action: () => setShowInventory(true), disabled: false },
                { label: 'HUIR', shortcut: '4', action: () => onFlee(), disabled: isTrainerBattle },
              ] as { label: string; shortcut: string; action: () => void; disabled: boolean }[]).map((entry) => (
                <button
                  key={entry.label}
                  disabled={entry.disabled}
                  className={`text-left px-2 py-1 rounded-sm border ${
                    entry.disabled
                      ? 'opacity-35 cursor-not-allowed border-transparent'
                      : 'border-transparent hover:border-[#4f6e69] hover:bg-[#edf4ef]'
                  }`}
                  onClick={() => { if (!entry.disabled) { soundManager.play('SELECT'); entry.action(); } }}
                >
                  <span className="inline-flex items-center gap-1">
                    {!entry.disabled && <span className="text-red-500">▶</span>}
                    {entry.label}
                  </span>
                  <span className="block text-[10px] text-slate-400 normal-case font-normal">[{entry.shortcut}]</span>
                </button>
              ))}
            </div>
          ) : isPlayerTurn && showMoves ? (
            /* Branch B: Moves submenu */
            <div className="flex flex-col h-full gap-1">
              <div className="grid grid-cols-2 flex-1 gap-2 text-[#2f2f2f] font-bold text-sm sm:text-lg items-center tracking-tight uppercase">
                {playerPkmn?.moves.map((move, i) => {
                  const noPP = move.pp <= 0;
                  return (
                    <button
                      key={`${move.name}-${i}`}
                      disabled={noPP}
                      className={`text-left px-2 py-1 rounded-sm border ${
                        noPP
                          ? 'opacity-35 cursor-not-allowed border-transparent'
                          : 'border-transparent hover:border-[#4f6e69] hover:bg-[#edf4ef]'
                      }`}
                      onClick={() => { if (!noPP) { soundManager.play('SELECT'); handleAttack(move); } }}
                      onMouseEnter={() => setHoveredMoveIdx(i)}
                      onMouseLeave={() => setHoveredMoveIdx(null)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {!noPP && <span className="text-red-500">▶</span>}
                        {move.name}
                      </span>
                      <span className="block text-[10px] text-slate-500 normal-case">
                        PP {move.pp}/{move.maxPp} <span className="text-slate-400 font-normal">[{i + 1}]</span>
                      </span>
                      {hoveredMoveIdx === i && (
                        <span className="block text-[9px] text-slate-600 normal-case mt-0.5 leading-tight">
                          {getMoveDescription(move)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                className="text-left px-2 py-1 text-[11px] text-slate-500 font-bold hover:text-slate-700 hover:bg-[#edf4ef] rounded-sm border border-transparent hover:border-[#4f6e69] uppercase tracking-tight"
                onClick={() => { soundManager.play('SELECT'); setShowMoves(false); }}
              >
                ← VOLVER <span className="font-normal normal-case">[ESC]</span>
              </button>
            </div>
          ) : null}
        </div>

      </div>
    </motion.div>
  );
}
