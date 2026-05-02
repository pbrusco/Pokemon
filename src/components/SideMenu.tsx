import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RecorderButton } from './RecorderButton';
import { ITEMS_DATABASE } from '../constants';
import { type Pokemon, type InventoryCounts } from '../types';
import { type GamePhase, EXPLORING } from '../types/gamePhase';
import { type Dispatch, type SetStateAction } from 'react';

interface SideMenuProps {
  phase: GamePhase;
  playerTeam: Pokemon[];
  storyStep: string;
  inventory: InventoryCounts;
  hasPokedex: boolean;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  setDialogue: (d: string | null) => void;
  resetGame: () => void;
  giveDemoTeam?: () => void;
}

function hpBarColor(hp: number, max: number) {
  const r = hp / max;
  if (r > 0.5) return '#00c000';
  if (r > 0.2) return '#f8c000';
  return '#f02000';
}

export const SideMenu = memo(({
  phase,
  playerTeam,
  storyStep,
  inventory,
  hasPokedex,
  setPhase,
  setDialogue,
  resetGame,
  giveDemoTeam,
}: SideMenuProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const returnTo = phase.type === 'MENU' ? (phase.returnTo || EXPLORING) : EXPLORING;

  const items: { label: string; action: () => void; danger?: boolean }[] = [
    {
      label: 'Pokédex',
      action: () => {
        if (hasPokedex) setPhase({ type: 'POKEDEX', returnTo });
        else setDialogue('Aún no tienes una Pokédex.');
      },
    },
    { label: 'Equipo',    action: () => setPhase({ type: 'TEAM',      returnTo }) },
    { label: 'Mochila',   action: () => setPhase({ type: 'INVENTORY', returnTo }) },
    { label: 'PC Storage',action: () => setPhase({ type: 'PC',        returnTo }) },
    { label: 'Reiniciar', action: resetGame, danger: true },
    ...(giveDemoTeam ? [{ label: 'Equipo Test', action: giveDemoTeam }] : []),
  ];

  return (
    <AnimatePresence>
      {phase.type === 'MENU' && (
        <motion.div
          initial={{ x: 280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 280, opacity: 0 }}
          transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
          className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-[140] max-h-[90vh] overflow-y-auto"
          style={{
            width: 220,
            background: '#f8f8f0',
            border: '3px solid #383838',
            borderRadius: 4,
            boxShadow: '4px 4px 0 #383838',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-2 font-game text-white"
            style={{ fontSize: '8px', letterSpacing: '0.1em', background: '#383838' }}
          >
            MENÚ
          </div>

          {/* Menu items */}
          <div>
            {items.map((item, i) => {
              const hov = hoveredIdx === i;
              return (
                <button
                  key={i}
                  onClick={item.action}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors"
                  style={{
                    borderBottom: '1px solid #a8a8a8',
                    background: hov ? '#383838' : 'transparent',
                  }}
                >
                  <span
                    className="font-game shrink-0"
                    style={{ fontSize: '8px', color: '#d03030', opacity: hov ? 1 : 0 }}
                  >
                    ▶
                  </span>
                  <span
                    className="font-sans font-semibold tracking-wide"
                    style={{ fontSize: '15px', color: hov ? 'white' : item.danger ? '#d03030' : '#383838' }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Historia section */}
          <div style={{ borderTop: '2px solid #383838' }}>
            <div
              className="px-4 py-1.5 font-game"
              style={{ fontSize: '7px', color: '#a8a8a8', letterSpacing: '0.1em' }}
            >
              PROGRESO
            </div>
            <div className="px-4 pb-3 space-y-2">
              <div className="flex justify-between items-center" style={{ borderBottom: '1px solid #a8a8a8', paddingBottom: 4 }}>
                <span className="font-sans text-[11px] text-[#383838]">Paso</span>
                <span className="font-game text-[#d03030]" style={{ fontSize: '7px' }}>{storyStep}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-sans text-[11px] text-[#383838]">Equipo</span>
                <span className="font-mono text-[11px] text-[#383838]">{playerTeam.length}/6</span>
              </div>
              {playerTeam.map((p, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-sans font-semibold text-[#383838]">{p.name}</span>
                    <span className="font-mono text-[#383838]">{p.hp}/{p.maxHp}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#585858' }}>
                    <div
                      className="h-full transition-all"
                      style={{ width: `${(p.hp / p.maxHp) * 100}%`, background: hpBarColor(p.hp, p.maxHp) }}
                    />
                  </div>
                </div>
              ))}
              {Object.keys(inventory).length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1" style={{ borderTop: '1px solid #a8a8a8' }}>
                  {Object.entries(inventory).map(([item, qty]) => (
                    <span
                      key={item}
                      className="font-sans text-[9px] text-[#383838]"
                      style={{ background: '#e0e0d0', border: '1px solid #a8a8a8', borderRadius: 2, padding: '1px 5px' }}
                    >
                      {ITEMS_DATABASE[item]?.name ?? item} ×{qty}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dev tools */}
          {import.meta.env.DEV && (
            <div style={{ borderTop: '2px solid #383838' }}>
              <div
                className="px-4 py-1.5 font-game"
                style={{ fontSize: '7px', color: '#a8a8a8', letterSpacing: '0.1em' }}
              >
                DEV
              </div>
              <div className="px-4 pb-3">
                <RecorderButton />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
