import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { motion, useAnimate } from 'motion/react';
import { type Pokemon, type Move, type BattleLogEntry } from '../types';
import { STRUGGLE_MOVE } from '../constants';
import { sd, sdur } from '../lib/gameSpeed';
import { useGameStore } from '../store/gameStore';
import { CinematicPanel } from './CinematicPanel';
import type { CinematicEvent } from '../hooks/useBattleVFX';

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
  cinematicEvent: CinematicEvent;
  onCinematicDone: () => void;
}

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
  const [caughtFinal, setCaughtFinal] = useState(false);

  useEffect(() => { catchResultRef.current = catchResult; }, [catchResult]);

  useEffect(() => {
    if (!isCatching) {
      setVisible(false);
      setCaughtFinal(false);
      return;
    }
    setVisible(true);
    setCaughtFinal(false);

    (async () => {
      await new Promise(r => setTimeout(r, sd(30)));
      if (!scope.current) return;

      await animate(scope.current, { x: 0, y: 0, rotate: 0, scale: 0.7, opacity: 1 }, { duration: 0 });

      await animate(scope.current,
        { x: [0, 260], y: [0, -190], rotate: [0, 540], scale: [0.7, 1.1, 1] },
        { duration: sdur(0.65), ease: 'easeOut' }
      );

      await animate(scope.current,
        { y: [-190, -110] },
        { duration: sdur(0.25), ease: 'easeIn' }
      );

      await animate(scope.current,
        { y: [-110, -130, -110] },
        { duration: sdur(0.2), ease: 'easeOut' }
      );

      const wobbleAngles = [[540, 516, 564, 540], [540, 520, 560, 540], [540, 524, 556, 540]];
      for (let i = 0; i < 3; i++) {
        await animate(scope.current, { rotate: wobbleAngles[i] }, { duration: sdur(0.45), ease: 'easeInOut' });
        if (i < 2) await new Promise(r => setTimeout(r, sd(120)));
      }

      await new Promise(r => setTimeout(r, sd(350)));

      const result = catchResultRef.current;
      if (result === true) {
        for (let i = 0; i < 3; i++) {
          await animate(scope.current, { opacity: [1, 0.1, 1] }, { duration: sdur(0.3) });
          await new Promise(r => setTimeout(r, sd(80)));
        }
        await animate(scope.current, { scale: [1, 1.2, 1] }, { duration: sdur(0.4) });
        setCaughtFinal(true);
      } else {
        await animate(scope.current,
          { scale: [1, 1.6], rotate: [540, 620], opacity: [1, 0] },
          { duration: sdur(0.45) }
        );
        setVisible(false);
      }
    })();
  }, [isCatching, animate, scope]);

  if (!visible) return null;

  return (
    <div
      ref={scope}
      data-testid="pokeball-anim"
      className="absolute z-[102] pointer-events-none"
      style={{ bottom: '30%', left: '22%' }}
    >
      <div className="relative w-10 h-10 sm:w-14 sm:h-14 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
        <div className="absolute inset-0 rounded-full border-[3px] border-black overflow-hidden">
          <div className="absolute top-0 w-full h-1/2 bg-red-500" />
          <div className="absolute bottom-0 w-full h-1/2 bg-white" />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-[3px] bg-black z-10" />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20
                        w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[2px] border-black
                        flex items-center justify-center transition-colors duration-200
                        ${caughtFinal ? 'bg-yellow-300' : 'bg-black'}`}>
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}

function BattlePlatform({ variant }: { variant: 'enemy' | 'player' }) {
  const isEnemy = variant === 'enemy';
  return (
    <div className={`absolute ${isEnemy ? 'bottom-0' : 'bottom-1'} left-0 right-0 z-0`}>
      <div
        className={`mx-auto rounded-[50%] border-2 opacity-90 ${isEnemy ? 'w-[80%] h-8 sm:h-12 bg-gradient-to-b from-white to-slate-200 border-slate-300' : 'w-[85%] h-10 sm:h-16 bg-gradient-to-b from-white to-slate-200 border-slate-300'}`}
      />
      <div
        className={`mx-auto -mt-1 rounded-[50%] blur-[1px] ${isEnemy ? 'w-[65%] h-4 sm:h-6 bg-slate-300/40' : 'w-[70%] h-5 sm:h-8 bg-slate-300/40'}`}
      />
    </div>
  );
}

function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [visible, setVisible] = useState('');
  const charsPerTick = 2;

  useEffect(() => {
    setVisible('');
    if (!text) return;

    let pos = 0;
    const interval = setInterval(() => {
      pos = Math.min(pos + charsPerTick, text.length);
      setVisible(text.slice(0, pos));
      if (pos >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 22);

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <span>{visible}</span>;
}

const TICK_DURATION = 0.06;

function TickHpBar({ hp, maxHp, colorClasses, animate }: {
  hp: number;
  maxHp: number;
  colorClasses: string;
  animate?: boolean;
}) {
  const targetPct = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  const [currentPct, setCurrentPct] = useState(targetPct);
  const startRef = useRef(currentPct);
  const onDoneRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!animate) {
      setCurrentPct(targetPct);
      return;
    }

    const start = startRef.current;
    const diff = targetPct - start;
    if (Math.abs(diff) < 0.1) {
      setCurrentPct(targetPct);
      return;
    }

    const totalTicks = Math.max(4, Math.ceil(Math.abs(diff) / 3));
    const step = diff / totalTicks;
    let tick = 0;

    const interval = setInterval(() => {
      tick++;
      const val = start + step * tick;
      setCurrentPct(Math.max(0, val));

      if (tick >= totalTicks) {
        clearInterval(interval);
        setCurrentPct(targetPct);
        onDoneRef.current?.();
      }
    }, TICK_DURATION * 1000);

    return () => clearInterval(interval);
  }, [hp, maxHp, animate, targetPct]);

  return (
    <motion.div
      initial={false}
      animate={{ width: `${currentPct}%` }}
      transition={{ duration: TICK_DURATION, ease: 'linear' }}
      className={`h-full border-t-2 border-white/50 ${colorClasses}`}
    />
  );
}

function BattleLogArea({ battleLogs, battleLog }: { battleLogs: BattleLogEntry[]; battleLog: string }) {
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const lastTextRef = useRef('');

  const latestMsg = battleLogs.length > 0 ? battleLogs[0] : null;

  useEffect(() => {
    const candidate = latestMsg?.text ?? battleLog;
    if (candidate === lastTextRef.current) return;
    lastTextRef.current = candidate;
    setTypingText(candidate);
    setIsTyping(true);
  }, [latestMsg?.text, battleLog]);

  const handleTypingDone = useCallback(() => {
    setIsTyping(false);
  }, []);

  return (
    <div className="flex-grow border-4 border-[#f8d870] bg-[#1f3558] rounded-sm p-3 sm:p-4 relative shadow-[inset_0_0_0_2px_#0f1f38] flex flex-col justify-start overflow-hidden">
      {battleLogs.length > 0 ? (
        battleLogs.map((msg, i) => {
          const isLatest = i === 0;
          return (
            <div key={msg.id} className={`mb-1 ${isLatest ? 'text-white' : 'text-slate-400'}`}>
              {msg.speaker !== 'Sistema' && (
                <span className="font-bold text-[#f8d870] mr-2">[{msg.speaker}]</span>
              )}
              <span className={`font-bold tracking-tight text-sm sm:text-lg leading-relaxed ${isLatest ? 'text-white' : 'text-slate-400 opacity-80'}`}>
                {isLatest && isTyping ? (
                  <TypewriterText text={typingText} onComplete={handleTypingDone} />
                ) : (
                  msg.text
                )}
              </span>
              {isLatest && isTyping && (
                <span className="inline-block w-1.5 h-4 bg-white ml-0.5 align-text-bottom animate-pulse" />
              )}
            </div>
          );
        })
      ) : (
        <p className="text-white font-bold tracking-tight text-base sm:text-2xl leading-relaxed mt-1">
          {isTyping ? (
            <TypewriterText text={typingText} onComplete={handleTypingDone} />
          ) : (
            battleLog
          )}
          {isTyping && (
            <span className="inline-block w-1.5 h-5 bg-white ml-0.5 align-text-bottom animate-pulse" />
          )}
        </p>
      )}
      <div className="absolute bottom-2 right-3">
        <span className="text-[8px] text-slate-500 font-mono tracking-wider">▼</span>
      </div>
    </div>
  );
}

function TrainerIntro({ name, sprite }: { name: string; sprite: string | null }) {
  const [scope, animate] = useAnimate();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!scope.current) return;
      // Slide in from right
      await animate(scope.current, { x: ['100%', '0%'] }, { duration: 0.3, ease: 'easeOut' });
      // Hold briefly
      await new Promise(r => setTimeout(r, 1200));
      // Slide out to right
      await animate(scope.current, { x: ['0%', '100%'] }, { duration: 0.25, ease: 'easeIn' });
      setShow(false);
    };
    run();
  }, [animate, scope]);

  if (!show) return null;

  return (
    <motion.div
      ref={scope}
      className="absolute top-4 right-4 z-[100] flex items-center gap-3 bg-[#1a1a2e]/90 border-2 border-[#f8d870] rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm"
      style={{ x: '100%' }}
    >
      {sprite && (
        <img src={sprite} alt={name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain pixelated" />
      )}
      <div>
        <p className="text-[#f8d870] font-bold text-xs tracking-widest uppercase">¡{name} te desafía!</p>
        <p className="text-white text-xs mt-0.5">
          {name} {name === 'AZUL' ? 'quiere luchar' : 'quiere luchar'}!
        </p>
      </div>
    </motion.div>
  );
}

export const BattleScreen = memo(function BattleScreen({
  currentMap,
  battleShake, enemyPokemon, enemyAnim, isCatching, catchResult,
  playerTeam, playerAnim, battleLog, battleLogs, isTrainerBattle, isPlayerTurn, onFlee,
  setShowInventory, setShowTeam, handleAttack, showMoves, setShowMoves,
  cinematicEvent, onCinematicDone,
}: BattleScreenProps) {

  const playerPkmn = playerTeam[0];
  const trainerBattleSprite = useGameStore(s => s.trainerBattleSprite);
  const trainerName = useGameStore(s => s.activeBattle?.trainerName);
  const [hoveredMoveIdx, setHoveredMoveIdx] = useState<number | null>(null);
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
    if (currentMap.includes('GYM')) return 'linear-gradient(to bottom, #e8eef4 0%, #dce4ec 100%)';
    if (currentMap.includes('FOREST')) return 'linear-gradient(to bottom, #e8f0e0 0%, #d8e8d0 100%)';
    if (currentMap.includes('CAVE') || currentMap.includes('MT_') || currentMap.includes('TUNNEL') || currentMap.includes('ROCK_TUNNEL')) return 'linear-gradient(to bottom, #2a2a34 0%, #1e1e28 100%)';
    if (currentMap.includes('ROUTE')) return 'linear-gradient(to bottom, #e8f0f4 0%, #dce8ec 100%)';
    return 'linear-gradient(to bottom, #f0f4f0 0%, #e8ece8 100%)';
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

  const eHp = enemyPokemon?.hp ?? 0;
  const eMax = enemyPokemon?.maxHp ?? 1;
  const pHp = playerPkmn?.hp ?? 0;
  const pMax = playerPkmn?.maxHp ?? 1;
  const isAnimating = playerAnim !== 'idle' || enemyAnim !== 'idle';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: battleShake ? [0, -10, 10, -10, 10, 0] : 0 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex flex-col font-game"
      style={{ backgroundImage: getBattleBackground() }}
    >
      {showTrainerIntro && isTrainerBattle && (
        <TrainerIntro name={trainerName ?? ''} sprite={trainerBattleSprite} />
      )}

      <div className="flex-1 relative w-full h-[65vh] overflow-hidden">
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
                <TickHpBar hp={eHp} maxHp={eMax} colorClasses={hpColor(eHp, eMax)} animate={!isCatching} />
              </div>
            </div>
            <StatBoostBadges boosts={enemyPokemon?.statBoosts} />
            {enemyPokemon?.status && enemyPokemon.status !== 'none' && (
              <div className="mt-1 text-[9px] font-bold text-orange-600 uppercase tracking-widest text-center">{enemyPokemon.status}</div>
            )}
          </div>
        </div>

        {/* Enemy Platform & Sprite */}
        <div className="absolute top-[22%] right-[14%] sm:right-[18%] w-[180px] sm:w-[300px] flex flex-col items-center">
          <div className="relative w-full" style={{ height: '140px' }}>
            <div className="absolute bottom-12 left-0 right-0">
              <BattlePlatform variant="enemy" />
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
                  idle: { y: [0, -4, 0], transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } },
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
        <div className="absolute bottom-[18%] left-[10%] sm:left-[15%] w-[200px] sm:w-[350px] flex flex-col items-center">
          <div className="relative w-full" style={{ height: '170px' }}>
            <div className="absolute bottom-14 left-0 right-0">
              <BattlePlatform variant="player" />
            </div>

            <div className="flex items-end gap-2 relative z-10 justify-center h-full">
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
        <div className="absolute bottom-[25%] sm:bottom-[30%] left-[3%] sm:left-[5%]">
          <div className="bg-[#f8f8f0] border-[3px] border-[#4f6e69] rounded-sm p-2 sm:p-3 pl-3 sm:pl-4 w-[180px] sm:w-[280px] shadow-[3px_3px_0_rgba(0,0,0,0.15)]">
            <div className="flex justify-between items-end border-b-2 border-slate-300 pb-1 mb-1 sm:mb-2">
              <h3 className="text-[#383838] font-bold text-sm sm:text-xl uppercase tracking-tighter truncate mr-1">{playerPkmn?.name}</h3>
              <p className="text-[#383838] font-bold text-xs sm:text-lg shrink-0">Nv{playerPkmn?.level}</p>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 bg-[#d8d8d8] p-1 rounded-full border-2 border-[#506860]">
              <span className="text-[8px] sm:text-[10px] font-black text-[#f8d830] tracking-widest pl-1 drop-shadow-[1px_1px_0_#c8a020]">PS</span>
              <div className="flex-1 h-2 sm:h-3 bg-white rounded-full border border-slate-400 overflow-hidden ml-1">
                <TickHpBar hp={pHp} maxHp={pMax} colorClasses={hpColor(pHp, pMax)} animate={true} />
              </div>
            </div>

            <div className="text-right mt-0.5 sm:mt-1 pr-1">
              <span className="text-[#383838] font-bold text-sm sm:text-lg tracking-widest">{playerPkmn?.hp} / {playerPkmn?.maxHp}</span>
            </div>

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
        <PokeballAnim isCatching={isCatching} catchResult={catchResult} />
        <CinematicPanel
          event={cinematicEvent}
          playerBackSprite={playerPkmn?.sprite.replace('pokemon/', 'pokemon/back/') ?? ''}
          enemySprite={enemyPokemon?.sprite ?? ''}
          onDone={onCinematicDone}
        />
      </div>

      {/* Bottom Menu Area */}
      <div className="h-[35vh] w-full bg-[#26343f] flex p-2 sm:p-3 gap-2 sm:gap-3 overflow-hidden border-t-4 border-[#1d2830]">
        <BattleLogArea battleLogs={battleLogs} battleLog={battleLog} />

        {/* Right: actions / moves */}
        <div className="w-1/3 min-w-[120px] sm:min-w-[230px] border-4 border-[#4f6e69] bg-[#f8f8f8] rounded-sm p-2 sm:p-3 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.06)] flex flex-col">
          {isAnimating ? null : isPlayerTurn && !showMoves ? (
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
                  onClick={() => { if (!entry.disabled) { entry.action(); } }}
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
            <div className="flex flex-col h-full gap-1">
              <div className="grid grid-cols-2 flex-1 gap-2 text-[#2f2f2f] font-bold text-sm sm:text-lg items-center tracking-tight uppercase">
                {playerPkmn?.moves.every(m => m.pp <= 0) ? (
                  <button
                    className="col-span-2 text-left px-2 py-1 rounded-sm border border-transparent hover:border-[#4f6e69] hover:bg-[#edf4ef]"
                    onClick={() => { handleAttack(STRUGGLE_MOVE); }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span className="text-red-500">▶</span>
                      {STRUGGLE_MOVE.name}
                    </span>
                    <span className="block text-[10px] text-slate-500 normal-case font-normal">
                      Sin PP — usa Forcejeo [1]
                    </span>
                  </button>
                ) : playerPkmn?.moves.map((move, i) => {
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
                      onClick={() => { if (!noPP) { handleAttack(move); } }}
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
                onClick={() => { setShowMoves(false); }}
              >
                ← VOLVER <span className="font-normal normal-case">[ESC]</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
});
