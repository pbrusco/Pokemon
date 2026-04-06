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
  playerTeam: Pokemon[];
  playerAnim: 'idle' | 'attack' | 'hit' | 'faint';
  battleLog: string;
  showMoves: boolean;
  setShowMoves: (show: boolean) => void;
  isTrainerBattle: boolean;
  isPlayerTurn: boolean;
  setIsBattle: (isBattle: boolean) => void;
  setShowInventory: (show: boolean) => void;
  setShowTeam: (show: boolean) => void;
  handleAttack: (move: Move) => void;
}

export function BattleScreen({
  battleShake, enemyPokemon, enemyAnim, isCatching, projectile, hitEffect, damageNumber,
  playerTeam, playerAnim, battleLog, isTrainerBattle, isPlayerTurn, setIsBattle,
  setShowInventory, setShowTeam, handleAttack
}: BattleScreenProps) {

  const playerPkmn = playerTeam[0];

  const hpColor = (hp: number, max: number) => {
    const ratio = hp / max;
    if (ratio > 0.5) return 'bg-[#48d0b0] border-[#38a888]';
    if (ratio > 0.2) return 'bg-[#f8d030] border-[#c8a020]';
    return 'bg-[#f85838] border-[#c84028]';
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
        <div className="absolute top-[20%] right-[10%] w-[300px] flex flex-col items-center">
          <div className="absolute bottom-2 w-full h-12 bg-black/10 rounded-[100%] border-4 border-black/5 blur-[2px]" />

          <motion.div
            className="w-40 h-40 relative z-10"
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

        {/* Enemy HUD */}
        <div className="absolute top-[10%] left-[5%]">
          <div className="bg-[#f8f8f0] border-t-4 border-l-4 border-b-4 border-r-[12px] rounded-tl-2xl rounded-bl-2xl border-[#506860] p-3 w-[260px] shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-end border-b-2 border-slate-300 pb-1 mb-2">
              <h3 className="text-[#383838] font-bold text-xl uppercase tracking-tighter">{enemyPokemon?.name}</h3>
              <p className="text-[#383838] font-bold text-lg">Nv{enemyPokemon?.level}</p>
            </div>
            <div className="flex items-center gap-2 bg-[#d8d8d8] p-1 rounded-full border-2 border-[#506860]">
              <span className="text-[10px] font-black text-[#f8d830] tracking-widest pl-1 drop-shadow-[1px_1px_0_#c8a020]">PS</span>
              <div className="flex-1 h-3 bg-white rounded-full border border-slate-400 overflow-hidden ml-1">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: `${(enemyPokemon?.hp || 0) / (enemyPokemon?.maxHp || 1) * 100}%` }}
                  className={`h-full border-t-2 border-white/50 ${hpColor(enemyPokemon?.hp || 0, enemyPokemon?.maxHp || 1)}`}
                />
              </div>
            </div>
            {/* Debug stats */}
            {enemyPokemon && (
              <div className="mt-2 grid grid-cols-4 gap-1">
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
        <div className="absolute bottom-[20%] left-[10%] w-[350px] flex flex-col items-center">
          <div className="absolute bottom-4 w-full h-16 bg-black/15 rounded-[100%] border-4 border-black/5 blur-[2px]" />

          <div className="flex items-end gap-2 relative z-10">
            {/* Player character sprite — shown in trainer battles */}
            {isTrainerBattle && (
              <div
                className="w-16 h-16 mb-4 opacity-90"
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
              className="w-56 h-56"
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
        <div className="absolute bottom-[30%] right-[5%]">
          <div className="bg-[#f8f8f0] border-t-4 border-r-4 border-b-4 border-l-[12px] rounded-tr-2xl rounded-br-2xl border-[#506860] p-3 pl-4 w-[280px] shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-end border-b-2 border-slate-300 pb-1 mb-2">
              <h3 className="text-[#383838] font-bold text-xl uppercase tracking-tighter">{playerPkmn?.name}</h3>
              <p className="text-[#383838] font-bold text-lg">Nv{playerPkmn?.level}</p>
            </div>
            <div className="flex items-center gap-2 bg-[#d8d8d8] p-1 rounded-full border-2 border-[#506860]">
              <span className="text-[10px] font-black text-[#f8d830] tracking-widest pl-1 drop-shadow-[1px_1px_0_#c8a020]">PS</span>
              <div className="flex-1 h-3 bg-white rounded-full border border-slate-400 overflow-hidden ml-1">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: `${(playerPkmn?.hp || 0) / (playerPkmn?.maxHp || 1) * 100}%` }}
                  className={`h-full border-t-2 border-white/50 ${hpColor(playerPkmn?.hp || 0, playerPkmn?.maxHp || 1)}`}
                />
              </div>
            </div>
            <div className="text-right mt-1 pr-1">
              <span className="text-[#383838] font-bold text-lg tracking-widest">{playerPkmn?.hp} /  {playerPkmn?.maxHp}</span>
            </div>
            <div className="h-1.5 w-full bg-[#d8d8d8] mt-1 flex border border-slate-400">
              <div className="bg-[#58a8f8] h-full" style={{ width: `${(playerPkmn?.exp || 0) / (playerPkmn?.expToNextLevel || 100) * 100}%` }} />
            </div>
            {/* Debug stats */}
            {playerPkmn && (
              <div className="mt-2 grid grid-cols-4 gap-1">
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
              className="fixed z-[100] pointer-events-none text-6xl"
              style={{ left: `${hitEffect.x}%`, top: `${hitEffect.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              💥
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Menu Area */}
      <div className="h-[35vh] w-full bg-[#383838] flex p-2 pt-0 pb-0 gap-2 overflow-hidden border-t-8 border-[#282828]">

        {/* Left: battle log (always visible) + moves (when player's turn) */}
        <div className={`flex-grow border-8 ${isPlayerTurn ? 'border-[#f87858]' : 'border-[#506860]'} bg-[#f8f8f8] rounded-xl m-2 p-4 relative shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] flex flex-col`}>

          {/* Battle log — small when moves are shown, large otherwise */}
          <p className={`text-[#383838] font-bold uppercase tracking-tighter transition-all ${isPlayerTurn ? 'text-base opacity-60 mb-3' : 'text-3xl leading-relaxed mt-2'}`}>
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
                className="grid grid-cols-2 gap-3 flex-1"
              >
                {playerPkmn?.moves.map((move, i) => (
                  <button
                    key={i}
                    className="flex items-center gap-2 text-[#383838] font-bold text-xl uppercase tracking-tighter cursor-pointer hover:text-red-500 transition-colors text-left px-2"
                    onClick={() => {
                      soundManager.play('SELECT');
                      handleAttack(move);
                    }}
                  >
                    <span className="text-red-500 text-sm">▶</span>
                    {move.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: utility actions */}
        <div className="w-1/3 min-w-[200px] border-8 border-[#506860] bg-[#f8f8f8] rounded-xl m-2 ml-0 p-4 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
          <div className="grid grid-cols-2 grid-rows-2 h-full gap-4 text-[#383838] font-bold text-xl items-center tracking-tighter uppercase">
            {(['BOLSA', 'POKÉMON', 'HUIR'] as const).map((action) => {
              const lockedByTurn = !isPlayerTurn && action !== 'HUIR';
              const disabled = (action === 'HUIR' && isTrainerBattle) || lockedByTurn;
              return (
                <div
                  key={action}
                  className={`relative flex justify-center ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-red-500'}`}
                  onClick={() => {
                    if (disabled) return;
                    soundManager.play('SELECT');
                    if (action === 'HUIR') setIsBattle(false);
                    if (action === 'BOLSA') setShowInventory(true);
                    if (action === 'POKÉMON') setShowTeam(true);
                  }}
                >
                  {action}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
