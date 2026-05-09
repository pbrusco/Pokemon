import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RecorderButton } from './RecorderButton';
import { ITEMS_DATABASE } from '../constants/items';
import { type Pokemon, type InventoryCounts } from '../types';
import { type GamePhase, EXPLORING } from '../types';
import { type Dispatch, type SetStateAction } from 'react';
import { useGameStore } from '../store/gameStore';

interface SideMenuProps {
  phase: GamePhase;
  playerTeam: Pokemon[];
  storyStep: string;
  inventory: InventoryCounts;
  hasPokedex: boolean;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  setDialogue: (d: string | null) => void;
  resetGame: () => void;
  onUseItem?: (itemId: string) => void;
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
  onUseItem,
  giveDemoTeam,
}: SideMenuProps) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const reorderTeam = useGameStore(s => s.reorderTeam);
  const returnTo = phase.type === 'MENU' ? (phase.returnTo || EXPLORING) : EXPLORING;

  const items: { label: string; action: () => void; danger?: boolean }[] = [
    {
      label: 'Pokédex',
      action: () => {
        if (hasPokedex) setPhase({ type: 'POKEDEX', returnTo });
        else setDialogue('Aún no tienes una Pokédex.');
      },
    },
    { label: 'PC Storage',action: () => setPhase({ type: 'PC',        returnTo }) },
    { label: 'Configurar', action: () => setPhase({ type: 'CONFIG', returnTo }) },
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
          className="fixed right-2 sm:right-6 top-2 sm:top-1/2 sm:-translate-y-1/2 z-[140] max-h-[calc(100vh-220px)] sm:max-h-[90vh] overflow-y-auto w-[min(320px,calc(100vw-1rem))] sm:w-[220px]"
          style={{
            background: '#f8f8f0',
            border: '3px solid #383838',
            borderRadius: 2,
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
                  <motion.span
                    className="font-game shrink-0"
                    animate={{ x: hov ? [0, -4, 0] : 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{ fontSize: '8px', color: '#d03030', opacity: hov ? 1 : 0 }}
                  >
                    ▶
                  </motion.span>
                  <span
                    className="font-sans font-semibold tracking-wide"
                    style={{ fontSize: '16px', color: hov ? '#4878D8' : item.danger ? '#d03030' : '#383838' }}
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
                <div key={i} className="flex items-center gap-1">
                  {/* Reorder arrows */}
                  <div className="flex flex-col gap-px shrink-0">
                    <button
                      onClick={() => i > 0 && reorderTeam(i, i - 1)}
                      disabled={i === 0}
                      className="leading-none text-[9px] text-[#383838] disabled:opacity-20 hover:text-[#4878D8]"
                      style={{ lineHeight: 1, padding: '1px 2px' }}
                    >▲</button>
                    <button
                      onClick={() => i < playerTeam.length - 1 && reorderTeam(i, i + 1)}
                      disabled={i === playerTeam.length - 1}
                      className="leading-none text-[9px] text-[#383838] disabled:opacity-20 hover:text-[#4878D8]"
                      style={{ lineHeight: 1, padding: '1px 2px' }}
                    >▼</button>
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 cursor-pointer"
                    onClick={() => setPhase({ type: 'POKEMON_SUMMARY', teamIndex: i })}
                  >
                    <div className="flex justify-between text-[10px]">
                      <span className="font-sans font-semibold text-[#383838] hover:text-[#4878D8]">{p.name}</span>
                      <span className="font-mono text-[#383838]">{p.hp}/{p.maxHp}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#585858' }}>
                      <div
                        className="h-full transition-all"
                        style={{ width: `${(p.hp / p.maxHp) * 100}%`, background: hpBarColor(p.hp, p.maxHp) }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(inventory).length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1" style={{ borderTop: '1px solid #a8a8a8' }}>
                  {Object.entries(inventory).map(([item, qty]) => (
                    <button
                      key={item}
                      onClick={() => onUseItem?.(item)}
                      className="font-sans text-[9px] text-[#383838] text-left transition-colors"
                      style={{
                        background: '#e0e0d0',
                        border: '1px solid #a8a8a8',
                        borderRadius: 2,
                        padding: '2px 6px',
                        cursor: onUseItem ? 'pointer' : 'default',
                      }}
                      title={onUseItem ? `Usar ${ITEMS_DATABASE[item]?.name ?? item}` : undefined}
                    >
                      {ITEMS_DATABASE[item]?.name ?? item} ×{qty}
                    </button>
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
