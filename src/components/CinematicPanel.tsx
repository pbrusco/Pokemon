import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimate } from 'motion/react';
import { sd, sdur } from '../lib/gameSpeed';
import type { CinematicEvent } from '../hooks/useBattleVFX';

interface CinematicPanelProps {
  event: CinematicEvent;
  playerBackSprite: string;
  enemySprite: string;
  onDone: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  normal:   '#a8a878',
  fire:     '#f08030',
  water:    '#6890f0',
  electric: '#f8d030',
  grass:    '#78c850',
  ice:      '#98d8d8',
  fighting: '#c03028',
  poison:   '#a040a0',
  ground:   '#e0c068',
  flying:   '#a890f0',
  psychic:  '#f85888',
  bug:      '#a8b820',
  rock:     '#b8a038',
  ghost:    '#705898',
  dragon:   '#7038f8',
  dark:     '#705848',
  steel:    '#b8b8d0',
  fairy:    '#ee99ac',
};

const SHOT_DURATIONS = [0.35, 0.25, 0.3]; // unscaled seconds
const SHOT_GAPS = 0.06; // unscaled seconds

function SpeedLines() {
  return (
    <div
      className="absolute inset-0 opacity-[0.08]"
      style={{
        background: 'repeating-conic-gradient(from 0deg at 70% 30%, transparent 0deg 13deg, #000 13deg 15deg)',
      }}
    />
  );
}

function Shot1({ sprite, isPlayer }: { sprite: string; isPlayer: boolean }) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (!scope.current) return;
    const run = async () => {
      await animate(scope.current, { opacity: [0, 1], scale: [1.8, 2.5], rotate: [isPlayer ? 8 : -8, isPlayer ? 5 : -5] }, { duration: sdur(0.12), ease: 'easeOut' });
      await animate(scope.current, { opacity: 1, scale: 2.5, rotate: isPlayer ? 5 : -5 }, { duration: sdur(SHOT_DURATIONS[0] - 0.12) });
    };
    run();
  }, [animate, scope, isPlayer]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full z-10 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
      <SpeedLines />
      <div
        className="absolute border-[3px] border-white/80"
        style={{
          width: '70%',
          height: '70%',
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 70%, 15% 70%, 15% 0)',
        }}
      />
      <motion.div ref={scope} className="relative z-10 w-48 h-48 sm:w-64 sm:h-64">
        {sprite ? (
          <img src={sprite} className="w-full h-full object-contain pixelated drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]" alt="" />
        ) : (
          <div className="w-full h-full bg-white/10 rounded-full" />
        )}
      </motion.div>
    </div>
  );
}

function Shot2({ moveName, moveType }: { moveName: string; moveType: string }) {
  const bgColor = TYPE_COLORS[moveType] || TYPE_COLORS.normal;

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `repeating-conic-gradient(${bgColor} 0% 2%, transparent 2% 10%)`,
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -3 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.15, 1.1, 0.9], rotate: [-3, 0, 0, 2] }}
        transition={{ duration: sdur(SHOT_DURATIONS[1]), times: [0, 0.15, 0.7, 1], ease: 'easeOut' }}
        className="z-10 px-8 py-4 rounded-lg border-[3px] border-white/50 shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_0_30px_rgba(255,255,255,0.1)]"
        style={{ backgroundColor: bgColor }}
      >
        <div
          className="text-white font-black tracking-widest uppercase drop-shadow-[3px_3px_0_rgba(0,0,0,0.4)]"
          style={{
            fontSize: 'clamp(1.2rem, 6vw, 2.5rem)',
            WebkitTextStroke: '2px rgba(0,0,0,0.3)',
          }}
        >
          {moveName}
        </div>
      </motion.div>
    </div>
  );
}

function Shot3({ sprite, isPlayer }: { sprite: string; isPlayer: boolean }) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (!scope.current) return;
    const run = async () => {
      await animate(scope.current, { opacity: [0, 1], x: [isPlayer ? 60 : -60, 0], rotate: [isPlayer ? -8 : 8, 0] }, { duration: sdur(0.1), ease: 'easeOut' });
      await animate(scope.current, { opacity: 1 }, { duration: sdur(SHOT_DURATIONS[2] - 0.25) });
      await animate(scope.current, { x: [0, isPlayer ? -10 : 10, isPlayer ? 10 : -10, isPlayer ? -10 : 10, 0] }, { duration: sdur(0.15) });
      await animate(scope.current, { filter: ['none', 'brightness(3)', 'none'] }, { duration: sdur(0.3) });
    };
    run();
  }, [animate, scope, isPlayer]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-white z-20 pointer-events-none"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 0.3, 0] }}
        transition={{ duration: sdur(SHOT_DURATIONS[2]), ease: 'easeOut' }}
      />
      <div
        className="absolute border-[3px] border-white/60 z-10"
        style={{
          width: '65%',
          height: '65%',
          clipPath: `polygon(${isPlayer ? '15% 0%' : '0% 0%'}, 100% 0%, 100% 100%, 0% 100%)`,
          transform: `rotate(${isPlayer ? 3 : -3}deg)`,
        }}
      />
      <motion.div ref={scope} className="relative z-10 w-40 h-40 sm:w-56 sm:h-56">
        {sprite ? (
          <img src={sprite} className="w-full h-full object-contain pixelated drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]" alt="" />
        ) : (
          <div className="w-full h-full bg-white/10 rounded-full" />
        )}
      </motion.div>
    </div>
  );
}

export function CinematicPanel({
  event,
  playerBackSprite,
  enemySprite,
  onDone,
}: CinematicPanelProps) {
  const [shot, setShot] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!event) {
      setShot(0);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    setShot(1);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setShot(2);
      timerRef.current = setTimeout(() => {
        setShot(3);
        timerRef.current = setTimeout(() => {
          setShot(0);
          doneRef.current();
        }, sd((SHOT_DURATIONS[2]) * 1000 + 50));
      }, sd((SHOT_DURATIONS[1] + SHOT_GAPS) * 1000));
    }, sd((SHOT_DURATIONS[0] + SHOT_GAPS) * 1000));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [event]);

  const isPlayer = event?.attacker === 'player';

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key="cinematic-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          className="absolute inset-0 z-[95] pointer-events-none bg-black/80"
        >
          {shot === 1 && (
            <Shot1
              sprite={isPlayer ? playerBackSprite : enemySprite}
              isPlayer={!!isPlayer}
            />
          )}
          {shot === 2 && (
            <Shot2 moveName={event.moveName} moveType={event.moveType} />
          )}
          {shot === 3 && (
            <Shot3
              sprite={isPlayer ? enemySprite : playerBackSprite}
              isPlayer={!isPlayer}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
