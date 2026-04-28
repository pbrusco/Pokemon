import { motion, AnimatePresence } from 'motion/react';
import { MapIcon, Backpack, Gamepad2, X } from 'lucide-react';
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
}

export const SideMenu = ({
  phase,
  playerTeam,
  storyStep,
  inventory,
  hasPokedex,
  setPhase,
  setDialogue,
  resetGame,
}: SideMenuProps) => (
  <AnimatePresence>
    {phase.type === 'MENU' && (
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className="fixed right-2 sm:right-8 top-1/2 -translate-y-1/2 w-56 sm:w-64 bg-white/95 backdrop-blur-xl border-4 border-slate-800 rounded-3xl p-3 sm:p-4 shadow-2xl z-[140] max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-4 px-2">Menú Principal</h2>
        <div className="space-y-2">
          {[
            { icon: MapIcon, label: 'Pokédex', color: 'bg-red-500', action: () => {
              if (hasPokedex) { setPhase({ type: 'POKEDEX', returnTo: phase.type === 'MENU' ? (phase.returnTo || EXPLORING) : EXPLORING }); }
              else setDialogue("Aún no tienes una Pokédex.");
            }},
            { icon: Backpack, label: 'Mochila', color: 'bg-orange-500', action: () => { setPhase({ type: 'INVENTORY', returnTo: phase.type === 'MENU' ? (phase.returnTo || EXPLORING) : EXPLORING }); }},
            { icon: Gamepad2, label: 'PC Storage', color: 'bg-blue-500', action: () => { setPhase({ type: 'PC', returnTo: phase.type === 'MENU' ? (phase.returnTo || EXPLORING) : EXPLORING }); }},
            { icon: X, label: 'Reiniciar', color: 'bg-red-500', action: resetGame },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center gap-4 p-3 hover:bg-slate-100 rounded-2xl transition-colors group"
            >
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                <item.icon className="text-white" size={20} />
              </div>
              <span className="font-bold text-slate-700">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <h3 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-2 px-2">Historia</h3>
          <div className="space-y-2 px-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Paso actual</span>
              <span className="text-xs font-bold text-red-500">{storyStep}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Equipo</span>
              <span className="text-xs font-mono text-slate-400">{playerTeam.length}/6</span>
            </div>
            <div className="mt-2 space-y-1">
              {playerTeam.map((p, i) => (
                <div key={i} className="flex flex-col gap-1 mt-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>{p.name}</span>
                    <span className="text-slate-500">HP {p.hp}/{p.maxHp}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${p.hp > p.maxHp / 2 ? 'bg-emerald-500' : p.hp > p.maxHp / 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${(p.hp / p.maxHp) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
                    <span>EXP</span>
                    <span>{p.exp || 0} / {p.expToNextLevel || 100}</span>
                  </div>
                  <div className="w-full h-0.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 transition-all"
                      style={{ width: `${((p.exp || 0) / (p.expToNextLevel || 100)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <span className="text-[10px] text-slate-400 uppercase">Inventario</span>
              <div className="flex flex-wrap gap-1">
                {Object.entries(inventory).map(([item, qty]) => (
                  <span key={item} className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{ITEMS_DATABASE[item]?.name ?? item} x{qty}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    )}
  </AnimatePresence>
);
