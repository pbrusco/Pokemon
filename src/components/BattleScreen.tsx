import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Pokemon, Move, BattleLogEntry } from '../types';
import { sdur } from '../lib/gameSpeed';
import { useGameStore } from '../store/gameStore';
import { StatusBadge, StatBoostBadges, TrainerBalls, TickHpBar, hpColor } from './battle/BattleHUD';
import { PokeballAnim } from './battle/PokeballAnim';
import { MoveMenu } from './battle/MoveMenu';
import { BattleLogArea } from './battle/BattleLogArea';
import { TrainerIntro } from './battle/TrainerIntro';
import { getTerrainFromMap, getArenaStyle, BattlePlatform } from './battle/BattleArena';

interface BattleScreenProps {
  currentMap: string;
  battleShake: boolean;
  enemyPokemon: Pokemon | null;
  enemyAnim: 'idle' | 'attack' | 'hit' | 'faint';
  isCatching: boolean;
  catchResult: boolean | null;
  playerTeam: Pokemon[];
  playerAnim: 'idle' | 'attack' | 'hit' | 'faint';
  battleLog: string;
  battleLogs: BattleLogEntry[];
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

export const BattleScreen = memo(function BattleScreen({
  currentMap,
  battleShake, enemyPokemon, enemyAnim, isCatching, catchResult,
  playerTeam, playerAnim, battleLog, battleLogs, isTrainerBattle, isPlayerTurn,
  setShowInventory, setShowTeam, handleAttack, showMoves, setShowMoves, onFlee,
}: BattleScreenProps) {

  const playerPkmn = playerTeam[0];
  const trainerBattleSprite = useGameStore(s => s.trainerBattleSprite);
  const trainerName = useGameStore(s => s.activeBattle?.trainerName);
  const enemyTeam = useGameStore(s => s.activeBattle?.enemyTeam) ?? [];
  const [enemySpriteError, setEnemySpriteError] = useState(false);
  const [trainerSpriteError, setTrainerSpriteError] = useState(false);
  const [playerSpriteError, setPlayerSpriteError] = useState(false);
  const [showTrainerIntro, setShowTrainerIntro] = useState(false);
  const prevIsTrainerBattle = useRef(isTrainerBattle);
  const prevTrainerName = useRef(trainerName);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isTrainerBattle && (!prevIsTrainerBattle.current || prevTrainerName.current !== trainerName)) {
      setShowTrainerIntro(true);
      timer = setTimeout(() => setShowTrainerIntro(false), 2500);
    }
    prevIsTrainerBattle.current = isTrainerBattle;
    prevTrainerName.current = trainerName;
    return () => { if (timer) clearTimeout(timer); };
  }, [isTrainerBattle, trainerName]);

  useEffect(() => { setEnemySpriteError(false); }, [enemyPokemon?.sprite]);
  useEffect(() => { setPlayerSpriteError(false); }, [playerPkmn?.sprite]);

  const terrain = getTerrainFromMap(currentMap);
  const eHp = enemyPokemon?.hp ?? 0;
  const eMax = enemyPokemon?.maxHp ?? 1;
  const pHp = playerPkmn?.hp ?? 0;
  const pMax = playerPkmn?.maxHp ?? 1;

  const redBackSprite = `${import.meta.env.BASE_URL}sprites/battle/red_back_pic.png`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: battleShake ? [0, -10, 10, -10, 10, 0] : 0 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex flex-col font-game bg-[#26343f]"
    >
      {showTrainerIntro && isTrainerBattle && (
        <TrainerIntro name={trainerName ?? ''} sprite={trainerBattleSprite} />
      )}

      <div className="flex-1 relative w-full h-[65vh] overflow-hidden" style={getArenaStyle(terrain)}>
        {/* Enemy HUD */}
        <div className="absolute top-[5%] sm:top-[10%] right-[3%] sm:right-[10%] scale-90 sm:scale-100 origin-top-right z-20">
          <div className="bg-[#f8f8f0] border-[3px] border-[#4f6e69] rounded-sm p-2 sm:p-3 w-[180px] sm:w-[260px] shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
            {isTrainerBattle && enemyTeam.length > 1 && (
              <div className="mb-1 sm:mb-1.5">
                <TrainerBalls team={enemyTeam} side="enemy" />
              </div>
            )}
            <div className="flex justify-between items-center border-b-2 border-slate-300 pb-1 mb-1 sm:mb-2">
              <h3 className="text-[#383838] font-bold text-sm sm:text-xl uppercase tracking-tighter truncate mr-1">{enemyPokemon?.name}</h3>
              <div className="flex items-center gap-1 shrink-0">
                <StatusBadge status={enemyPokemon?.status} />
                <p className="text-[#383838] font-bold text-xs sm:text-lg">Nv{enemyPokemon?.level}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-[#d8d8d8] p-1 rounded-full border-2 border-[#506860]">
              <span className="text-[8px] sm:text-[10px] font-black text-[#f8d830] tracking-widest pl-1 drop-shadow-[1px_1px_0_#c8a020]">PS</span>
              <div className="flex-1 h-2 sm:h-3 bg-[#585858] rounded-full overflow-hidden ml-1">
                <TickHpBar hp={eHp} maxHp={eMax} colorClasses={hpColor(eHp, eMax)} animate={!isCatching} />
              </div>
            </div>
            <StatBoostBadges boosts={enemyPokemon?.statBoosts} />
          </div>
        </div>

        {/* Enemy Platform & Sprite */}
        <div className="absolute top-[15%] sm:top-[22%] right-[5%] sm:right-[18%] w-[180px] sm:w-[300px] flex flex-col items-center scale-90 sm:scale-100 origin-bottom z-10">
          <div className="relative w-full" style={{ height: '140px' }}>
            <div className="absolute bottom-12 left-0 right-0">
              <BattlePlatform variant="enemy" terrain={terrain} />
            </div>
            <div className="flex items-end gap-2 relative z-10 justify-center h-full">
              {isTrainerBattle && trainerBattleSprite && !trainerSpriteError && (
                <img
                  src={trainerBattleSprite}
                  className="w-16 h-16 sm:w-24 sm:h-24 mb-4 object-contain pixelated opacity-90 shrink-0"
                  alt="trainer"
                  onError={() => setTrainerSpriteError(true)}
                />
              )}
              <motion.div
                className="w-24 h-24 sm:w-40 sm:h-40 relative z-10"
                variants={{
                  // idle resets opacity/x/scale so the next enemy in a
                  // trainer battle isn't stuck at opacity:0/y:100 from the
                  // previous Pokémon's faint animation. Only `y` should loop
                  // — pinning the others to duration:0 prevents framer from
                  // re-tweening them every iteration (which made the sprite
                  // blink while idling).
                  idle: {
                    y: [0, -4, 0],
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    transition: {
                      y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
                      opacity: { duration: 0 },
                      x: { duration: 0 },
                      scale: { duration: 0 },
                    },
                  },
                  attack: { x: [0, -40, 0], scale: [1, 1.1, 1], transition: { duration: sdur(0.3) } },
                  hit: { x: [0, -10, 10, -10, 10, 0], filter: ["brightness(1)", "invert(1)", "brightness(1)"], transition: { duration: sdur(0.4) } },
                  faint: { y: [0, 100], opacity: [1, 0], transition: { duration: sdur(0.6), ease: "easeIn" } }
                }}
                animate={isCatching
                  ? { opacity: [1, 0.4, 0], scale: [1, 0.4, 0], y: [0, 40], transition: { duration: sdur(0.5), ease: 'easeIn' } }
                  : enemyAnim
                }
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
        </div>

        {/* Player Sprite & Platform */}
        <div className="absolute bottom-[5%] sm:bottom-[18%] left-[-5%] sm:left-[15%] w-[200px] sm:w-[350px] flex flex-col items-center scale-90 sm:scale-100 origin-bottom z-10">
          <div className="relative w-full" style={{ height: '170px' }}>
            <div className="absolute bottom-14 left-0 right-0">
              <BattlePlatform variant="player" terrain={terrain} />
            </div>
            <div className="flex items-end gap-2 relative z-10 justify-center h-full">
              <div
                className="shrink-0 mb-4 overflow-hidden opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                style={{ width: 96, height: 96 }}
              >
                <img
                  src={redBackSprite}
                  alt="Red"
                  className="pixelated block"
                  style={{ width: 96, height: 480 }}
                />
              </div>
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
        </div>

        {/* Player HUD */}
        <div className="absolute bottom-[5%] sm:bottom-[30%] right-[3%] sm:right-auto sm:left-[5%] scale-90 sm:scale-100 origin-bottom-right sm:origin-bottom-left z-20">
          <div className="bg-[#f8f8f0] border-[3px] border-[#4f6e69] rounded-sm p-2 sm:p-3 pl-3 sm:pl-4 w-[180px] sm:w-[280px] shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
            {playerTeam.length > 1 && (
              <div className="mb-1 sm:mb-1.5">
                <TrainerBalls team={playerTeam} side="player" />
              </div>
            )}
            <div className="flex justify-between items-center border-b-2 border-slate-300 pb-1 mb-1 sm:mb-2">
              <h3 className="text-[#383838] font-bold text-sm sm:text-xl uppercase tracking-tighter truncate mr-1">{playerPkmn?.name}</h3>
              <div className="flex items-center gap-1 shrink-0">
                <StatusBadge status={playerPkmn?.status} />
                <p className="text-[#383838] font-bold text-xs sm:text-lg">Nv{playerPkmn?.level}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-[#d8d8d8] p-1 rounded-full border-2 border-[#506860]">
              <span className="text-[8px] sm:text-[10px] font-black text-[#f8d830] tracking-widest pl-1 drop-shadow-[1px_1px_0_#c8a020]">PS</span>
              <div className="flex-1 h-2 sm:h-3 bg-[#585858] rounded-full overflow-hidden ml-1">
                <TickHpBar hp={pHp} maxHp={pMax} colorClasses={hpColor(pHp, pMax)} animate={true} />
              </div>
              <span className="text-[8px] sm:text-[10px] font-mono font-bold text-[#383838] shrink-0 pr-1">
                {playerPkmn?.hp}/{playerPkmn?.maxHp}
              </span>
            </div>
            <div className="mt-1.5">
              <div className="flex items-center gap-1 px-1 mb-0.5">
                <span className="text-[8px] sm:text-[10px] font-black text-[#58a8f8] uppercase tracking-tighter">EXP</span>
              </div>
              <div className="h-1 sm:h-1.5 w-full bg-[#585858] rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${((playerPkmn?.exp || 0) / (playerPkmn?.expToNextLevel || 100)) * 100}%` }}
                  className="bg-[#58a8f8] h-full border-t border-white/30"
                />
              </div>
            </div>
            <StatBoostBadges boosts={playerPkmn?.statBoosts} />
          </div>
        </div>
        <PokeballAnim isCatching={isCatching} catchResult={catchResult} />
      </div>

      {/* Bottom Menu Area */}
      <div className="h-[35vh] w-full bg-[#26343f] flex flex-col sm:flex-row p-2 sm:p-3 gap-2 sm:gap-3 overflow-hidden border-t-4 border-[#1d2830]">
        <BattleLogArea battleLogs={battleLogs} battleLog={battleLog} />

        <div className="w-full sm:w-1/3 h-[130px] sm:h-auto sm:min-w-[230px] border-4 border-[#4f6e69] bg-[#f8f8f8] rounded-sm p-2 sm:p-3 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.06)] flex flex-col shrink-0">
          {isPlayerTurn && !showMoves ? (
            <div className="grid grid-cols-2 h-full gap-1 sm:gap-2 text-[#2f2f2f] font-bold text-xs sm:text-lg items-center tracking-tight uppercase">
              {([
                { label: 'LUCHAR', shortcut: '1', action: () => setShowMoves(true), disabled: false },
                { label: 'POKÉMON', shortcut: '2', action: () => setShowTeam(true), disabled: false },
                { label: 'BOLSA', shortcut: '3', action: () => setShowInventory(true), disabled: false },
                { label: 'HUIR', shortcut: '4', action: onFlee, disabled: isTrainerBattle },
              ]).map((entry) => (
                <button
                  key={entry.label}
                  disabled={entry.disabled}
                  className={`text-left px-2 py-1 rounded-sm border ${
                    entry.disabled
                      ? 'opacity-35 cursor-not-allowed border-transparent'
                      : 'border-transparent hover:border-[#4f6e69] hover:bg-[#edf4ef]'
                  }`}
                  onClick={() => { if (!entry.disabled) entry.action(); }}
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
            <MoveMenu
              moves={playerPkmn?.moves ?? []}
              onAttack={handleAttack}
              onBack={() => setShowMoves(false)}
            />
          ) : null}
        </div>
      </div>
    </motion.div>
  );
});
