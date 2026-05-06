import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { motion, useAnimate } from 'motion/react';
import { type Pokemon, type Move, type BattleLogEntry } from '../types';
import { STRUGGLE_MOVE } from '../constants/moves';
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

const STATUS_INFO: Record<string, { label: string; bg: string; color: string }> = {
  poison:    { label: 'PSN', bg: '#B060D0', color: 'white' },
  paralysis: { label: 'PAR', bg: '#C8C000', color: 'white' },
  burn:      { label: 'QUE', bg: '#F04000', color: 'white' },
  freeze:    { label: 'HLO', bg: '#90C0F8', color: '#383838' },
  sleep:     { label: 'DOR', bg: '#908090', color: 'white' },
  confusion: { label: 'CON', bg: '#E080E0', color: '#383838' },
};

function StatusBadge({ status }: { status: string | undefined }) {
  if (!status || status === 'none') return null;
  const info = STATUS_INFO[status];
  if (!info) return null;
  return (
    <span
      className="font-game rounded-sm px-1 py-px shrink-0"
      style={{ fontSize: '7px', background: info.bg, color: info.color }}
    >
      {info.label}
    </span>
  );
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal:   { bg: '#A8A878', text: '#383838' },
  fire:     { bg: '#F08030', text: 'white' },
  water:    { bg: '#6890F0', text: 'white' },
  grass:    { bg: '#78C850', text: 'white' },
  electric: { bg: '#F8D030', text: '#383838' },
  ice:      { bg: '#98D8D8', text: '#383838' },
  fighting: { bg: '#C03028', text: 'white' },
  poison:   { bg: '#A040A0', text: 'white' },
  ground:   { bg: '#E0C068', text: '#383838' },
  flying:   { bg: '#A890F0', text: 'white' },
  psychic:  { bg: '#F85888', text: 'white' },
  bug:      { bg: '#A8B820', text: 'white' },
  rock:     { bg: '#B8A038', text: 'white' },
  ghost:    { bg: '#705898', text: 'white' },
  dragon:   { bg: '#7038F8', text: 'white' },
  dark:     { bg: '#705848', text: 'white' },
  steel:    { bg: '#B8B8D0', text: '#383838' },
  fairy:    { bg: '#EE99AC', text: '#383838' },
};

function TypeBadge({ type }: { type: string | undefined }) {
  if (!type) return null;
  const c = TYPE_COLORS[type.toLowerCase()] ?? { bg: '#A8A878', text: '#383838' };
  return (
    <span
      className="font-game rounded-sm px-1.5 py-px uppercase shrink-0"
      style={{ fontSize: '7px', background: c.bg, color: c.text }}
    >
      {type}
    </span>
  );
}

function MoveMenu({ moves, onAttack, onBack }: {
  moves: Move[];
  onAttack: (m: Move) => void;
  onBack: () => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const allNoPP = moves.every(m => m.pp <= 0);
  const infoMove = hovered !== null ? (moves[hovered] ?? moves[0]) : moves[0];

  return (
    <div className="flex flex-col h-full">
      {/* 2×2 move grid, separated by the border color */}
      <div className="grid grid-cols-2 flex-1 gap-px bg-[#4f6e69] overflow-hidden">
        {allNoPP ? (
          <button
            className="col-span-2 bg-[#f8f8f8] text-left px-3 py-2 hover:bg-[#edf4ef] flex items-center gap-1"
            onClick={() => onAttack(STRUGGLE_MOVE)}
          >
            <span className="text-red-500 text-xs">▶</span>
            <span className="font-bold text-[#2f2f2f] text-sm uppercase tracking-tight">{STRUGGLE_MOVE.name}</span>
          </button>
        ) : (
          moves.map((move, i) => {
            const noPP = move.pp <= 0;
            const isHov = hovered === i;
            return (
              <button
                key={`${move.name}-${i}`}
                disabled={noPP}
                className={`bg-[#f8f8f8] text-left px-2 sm:px-3 py-2 flex flex-col justify-center transition-colors ${
                  noPP ? 'opacity-40 cursor-not-allowed' : isHov ? 'bg-[#d8ecd8]' : 'hover:bg-[#edf4ef]'
                }`}
                onClick={() => { if (!noPP) onAttack(move); }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="inline-flex items-center gap-0.5 sm:gap-1 w-full overflow-hidden">
                  <span className={`text-red-500 text-[10px] transition-opacity shrink-0 ${isHov && !noPP ? 'opacity-100' : 'opacity-0'}`}>▶</span>
                  <span className="font-bold text-[#2f2f2f] text-[10px] sm:text-sm uppercase tracking-tight leading-tight truncate">{move.name}</span>
                </span>
                <span className="text-[8px] text-slate-400 font-mono ml-3.5 mt-0.5">[{i + 1}]</span>
              </button>
            );
          })
        )}
      </div>

      {/* Type / PP info strip */}
      <div className="border-t-2 border-[#4f6e69] bg-[#edf4ef] px-2 py-1.5 flex items-center gap-2 shrink-0">
        <TypeBadge type={infoMove?.type} />
        <span className="font-game text-[#383838] flex-1" style={{ fontSize: '8px' }}>
          PP&nbsp;&nbsp;{infoMove?.pp ?? '--'}&nbsp;/&nbsp;{infoMove?.maxPp ?? '--'}
        </span>
        <button
          className="font-game text-slate-500 hover:text-slate-700 uppercase"
          style={{ fontSize: '7px' }}
          onClick={onBack}
        >
          ← VOLVER
        </button>
      </div>
    </div>
  );
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

type Terrain = 'grass' | 'cave' | 'gym' | 'building' | 'water';

function getTerrainFromMap(map: string): Terrain {
  const m = map.toUpperCase();
  if (m.includes('CAVE') || m.includes('MT_') || m.includes('TUNNEL') || m.includes('VICTORY_ROAD') || m.includes('POKEMON_TOWER')) return 'cave';
  if (m.includes('GYM')) return 'gym';
  if (m.includes('OCEAN') || m.includes('SEAFOAM') || m.includes('SEA')) return 'water';
  if (!m.includes('ROUTE') && !m.includes('PALLET') && !m.includes('VIRIDIAN') && !m.includes('PEWTER') &&
      !m.includes('CERULEAN') && !m.includes('VERMILION') && !m.includes('LAVENDER') && !m.includes('CELADON') &&
      !m.includes('FUCHSIA') && !m.includes('SAFFRON') && !m.includes('CINNABAR') &&
      (m.includes('MART') || m.includes('CENTER') || m.includes('LAB') || m.includes('HOUSE') ||
       m.includes('MANSION') || m.includes('HIDEOUT') || m.includes('SILPH') || m.includes('SS_ANNE') ||
       m.includes('ROCKET') || m.includes('FLOOR') || m.includes('CORP'))) return 'building';
  return 'grass';
}

function getArenaStyle(terrain: Terrain): React.CSSProperties {
  switch (terrain) {
    case 'cave':
      return { background: 'linear-gradient(to bottom, #141414 0%, #242018 55%, #342e26 100%)' };
    case 'gym':
      return {
        backgroundColor: '#c8c0b0',
        backgroundImage: 'repeating-conic-gradient(#d8d0c0 0% 25%, #c0b8a8 0% 50%)',
        backgroundSize: '40px 40px',
      };
    case 'water':
      return { background: 'linear-gradient(to bottom, #90c8f0 0%, #90c8f0 38%, #4870c8 38%, #3860b8 100%)' };
    case 'building':
      return {
        backgroundColor: '#e0d8c8',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 11px, rgba(0,0,0,0.07) 11px, rgba(0,0,0,0.07) 13px)',
      };
    case 'grass':
    default:
      return { background: 'linear-gradient(to bottom, #98d8f0 0%, #98d8f0 36%, #78c840 36%, #60a030 100%)' };
  }
}

function BattlePlatform({ variant, terrain }: { variant: 'enemy' | 'player'; terrain: Terrain }) {
  const isEnemy = variant === 'enemy';
  const platformColors: Record<Terrain, string> = {
    grass:    'from-[#c8e890] to-[#a8d070] border-[#88b850]',
    cave:     'from-[#706860] to-[#584e48] border-[#403830]',
    gym:      'from-[#e0d8c8] to-[#c8c0b0] border-[#a8a098]',
    water:    'from-[#90d0f8] to-[#70b8e8] border-[#50a0d0]',
    building: 'from-[#e8dcc8] to-[#d0c4b0] border-[#b0a490]',
  };
  const colors = platformColors[terrain];
  return (
    <div className={`absolute ${isEnemy ? 'bottom-0' : 'bottom-1'} left-0 right-0 z-0`}>
      <div
        className={`mx-auto rounded-[50%] border-2 opacity-90 bg-gradient-to-b ${colors} ${isEnemy ? 'w-[80%] h-8 sm:h-12' : 'w-[85%] h-10 sm:h-16'}`}
      />
      <div
        className={`mx-auto -mt-1 rounded-[50%] blur-[1px] ${isEnemy ? 'w-[65%] h-4 sm:h-6' : 'w-[70%] h-5 sm:h-8'} bg-black/20`}
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
  const targetPct = maxHp > 0 ? Math.max(0, (hp / maxHp) * 100) : 0;
  const [currentPct, setCurrentPct] = useState(targetPct);
  // Tracks the actual visual position so interruptions always start from there.
  const visualRef = useRef(targetPct);

  useEffect(() => {
    if (!animate) {
      visualRef.current = targetPct;
      setCurrentPct(targetPct);
      return;
    }

    const start = visualRef.current; // always the current rendered position
    const diff = targetPct - start;
    if (Math.abs(diff) < 0.1) {
      visualRef.current = targetPct;
      setCurrentPct(targetPct);
      return;
    }

    const totalTicks = Math.max(4, Math.ceil(Math.abs(diff) / 3));
    const step = diff / totalTicks;
    let tick = 0;

    const interval = setInterval(() => {
      tick++;
      const next = Math.max(0, start + step * tick);
      visualRef.current = next;
      setCurrentPct(next);

      if (tick >= totalTicks) {
        clearInterval(interval);
        visualRef.current = targetPct;
        setCurrentPct(targetPct);
      }
    }, TICK_DURATION * 1000);

    return () => clearInterval(interval);
  }, [hp, maxHp, animate, targetPct]);

  return (
    <div
      className={`h-full border-t-2 border-white/50 ${colorClasses}`}
      style={{ width: `${currentPct}%`, transition: `width ${TICK_DURATION}s linear` }}
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
      <div className="flex flex-col-reverse gap-1 overflow-y-auto">
        {battleLogs.length > 0 ? (
          battleLogs.map((msg, i) => {
            const isLatest = i === 0;
            return (
              <div key={msg.id}>
                {!isLatest && <hr className="border-t border-white/10 my-1" />}
                <div className={`${isLatest ? 'text-white' : 'text-slate-400'}`}>
                  {msg.speaker !== 'Sistema' && (
                    <p className="font-game text-[#f8d870] text-[10px] leading-tight mb-0.5">{msg.speaker}</p>
                  )}
                  <p className={`font-game text-[10px] leading-relaxed ${isLatest ? 'text-white' : 'text-slate-400 opacity-80'}`}>
                    {isLatest && isTyping ? (
                      <TypewriterText text={typingText} onComplete={handleTypingDone} />
                    ) : (
                      msg.text
                    )}
                    {isLatest && !isTyping && (
                      <span className="inline-block text-red-400 ml-1 animate-pulse">◆</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="font-game text-white text-[10px] leading-relaxed">
            {isTyping ? (
              <TypewriterText text={typingText} onComplete={handleTypingDone} />
            ) : (
              battleLog
            )}
            {isTyping && (
              <span className="inline-block w-1.5 h-3 bg-white ml-0.5 align-text-bottom animate-pulse" />
            )}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Six-slot Pokéball strip showing the trainer's remaining party (canonical
 * Gen I/III battle UI). Filled red ball = healthy, empty/grey = fainted, no
 * ball = the slot doesn't exist (team is shorter than 6).
 *
 * `team` is the canonical team (full size). Healthy when hp > 0.
 */
function TrainerBalls({ team, side }: { team: Pokemon[]; side: 'player' | 'enemy' }) {
  if (!team.length) return null;
  // Render right-to-left for the enemy so balls fill from the inside-out, the
  // way they animate in canonical battle intros. Player side renders L→R.
  const ordered = side === 'enemy' ? [...team].reverse() : team;
  return (
    <div
      className={`flex gap-0.5 sm:gap-1 ${side === 'enemy' ? 'justify-end' : 'justify-start'}`}
      data-testid={`${side}-trainer-balls`}
    >
      {ordered.map((p, i) => {
        const fainted = (p.hp ?? 0) <= 0;
        return (
          <span
            key={i}
            aria-label={fainted ? 'fainted-ball' : 'pokeball'}
            className={`inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 ${
              fainted
                ? 'bg-[#7a7a7a] border-[#3a3a3a] opacity-60'
                : 'bg-gradient-to-b from-[#e84030] from-50% to-white to-50% border-[#1a1a1a]'
            }`}
            style={{ boxShadow: fainted ? 'none' : '1px 1px 0 rgba(0,0,0,0.3)' }}
          />
        );
      })}
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
  // Enemy trainer's full party (incl. fainted) — used to render the
  // remaining-pokémon ball strip. Wild battles have a 1-mon "team".
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

  useEffect(() => {
    setEnemySpriteError(false);
  }, [enemyPokemon?.sprite]);

  useEffect(() => {
    setPlayerSpriteError(false);
  }, [playerPkmn?.sprite]);

  const hpColor = (hp: number, max: number): string => {
    const ratio = hp / max;
    if (ratio > 0.5) return 'bg-[#00c000]';
    if (ratio > 0.2) return 'bg-[#f8c000]';
    return 'bg-[#f02000]';
  };

  const terrain = getTerrainFromMap(currentMap);

  const eHp = enemyPokemon?.hp ?? 0;
  const eMax = enemyPokemon?.maxHp ?? 1;
  const pHp = playerPkmn?.hp ?? 0;
  const pMax = playerPkmn?.maxHp ?? 1;
  const isAnimating = playerAnim !== 'idle' || enemyAnim !== 'idle';

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
        <div className="absolute bottom-[5%] sm:bottom-[18%] left-[-5%] sm:left-[15%] w-[200px] sm:w-[350px] flex flex-col items-center scale-90 sm:scale-100 origin-bottom z-10">
          <div className="relative w-full" style={{ height: '170px' }}>
            <div className="absolute bottom-14 left-0 right-0">
              <BattlePlatform variant="player" terrain={terrain} />
            </div>

            <div className="flex items-end gap-2 relative z-10 justify-center h-full">
              {/* Red's trainer back sprite — 64×320 spritesheet, clip to first frame */}
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
        <CinematicPanel
          event={cinematicEvent}
          playerBackSprite={playerPkmn?.sprite.replace('pokemon/', 'pokemon/back/') ?? ''}
          enemySprite={enemyPokemon?.sprite ?? ''}
          onDone={onCinematicDone}
        />
      </div>

      {/* Bottom Menu Area */}
      <div className="h-[35vh] w-full bg-[#26343f] flex flex-col sm:flex-row p-2 sm:p-3 gap-2 sm:gap-3 overflow-hidden border-t-4 border-[#1d2830]">
        <BattleLogArea battleLogs={battleLogs} battleLog={battleLog} />

        {/* Right: actions / moves */}
        <div className="w-full sm:w-1/3 h-[130px] sm:h-auto sm:min-w-[230px] border-4 border-[#4f6e69] bg-[#f8f8f8] rounded-sm p-2 sm:p-3 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.06)] flex flex-col shrink-0">
          {isAnimating ? null : isPlayerTurn && !showMoves ? (
            <div className="grid grid-cols-2 h-full gap-1 sm:gap-2 text-[#2f2f2f] font-bold text-xs sm:text-lg items-center tracking-tight uppercase">
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
