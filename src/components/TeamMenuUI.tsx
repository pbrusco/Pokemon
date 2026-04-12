import { motion } from 'motion/react';
import { X, User } from 'lucide-react';
import { Pokemon } from '../types';
import { soundManager } from '../lib/sounds';

interface TeamMenuUIProps {
  team: Pokemon[];
  onClose: () => void;
  onSwap: (index: number) => void;
  forcedSwitch?: boolean; // cuando es true: debe elegir un nuevo pokemon, no puede cerrar
}

export const TeamMenuUI = ({ team, onClose, onSwap, forcedSwitch = false }: TeamMenuUIProps) => {
  // Helper para determinar si un Pokémon puede ser seleccionado para el cambio
  const canSelect = (pkmn: Pokemon, i: number) => {
    if (i === 0) return false;          // Ya está activo
    if (pkmn.hp <= 0) return false;     // Debilitado
    return true;
  };

  // Determinar color de la barra de PS basado en el porcentaje actual
  const getHpColor = (hp: number, max: number) => {
    const ratio = hp / max;
    if (ratio > 0.5) return 'bg-emerald-500';
    if (ratio > 0.2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Cabecera del Menú */}
        <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <User size={32} />
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Tu Equipo</h2>
              {forcedSwitch && (
                <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mt-0.5">
                  ¡Elige tu próximo Pokémon!
                </p>
              )}
            </div>
          </div>
          {!forcedSwitch && (
            <button
              onClick={() => { soundManager.play('SELECT'); onClose(); }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors flex items-center gap-1"
            >
              <span className="text-[10px] font-mono tracking-widest text-emerald-200 uppercase">[ESC]</span>
              <X size={24} />
            </button>
          )}
        </div>

        {/* Lista de Pokémon */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {team.map((pkmn, i) => {
            const selectable = canSelect(pkmn, i);
            const fainted = pkmn.hp <= 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  if (selectable) {
                    soundManager.play('SELECT');
                    onSwap(i);
                  }
                }}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all
                  ${i === 0 ? 'bg-emerald-50 border-emerald-200' : ''}
                  ${selectable ? 'cursor-pointer hover:border-emerald-300 bg-slate-50 border-slate-100' : ''}
                  ${fainted ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' : ''}
                  ${!selectable && !fainted && i !== 0 ? 'bg-slate-50 border-slate-100' : ''}
                `}
              >
                {/* Miniatura del Pokémon */}
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <img src={pkmn.sprite} className="w-full h-full object-contain pixelated" alt={pkmn.name} />
                </div>

                <div className="flex-1">
                  {/* Nombre y Nivel */}
                  <div className="flex justify-between items-end mb-1">
                    <h3 className="font-black text-slate-800 uppercase text-sm">{pkmn.name}</h3>
                    <span className="text-xs font-mono font-bold text-slate-500">Lv {pkmn.level}</span>
                  </div>

                  {/* Barra de PS (Puntos de Salud) */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    <motion.div
                      initial={false}
                      animate={{ width: `${(pkmn.hp / pkmn.maxHp) * 100}%` }}
                      className={`h-full ${getHpColor(pkmn.hp, pkmn.maxHp)}`}
                    />
                  </div>

                  {/* Estadísticas de PS y Estado */}
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] font-mono font-bold text-slate-600">{pkmn.hp}/{pkmn.maxHp} PS</span>
                    <div className="flex gap-1">
                      {fainted && <span className="text-[8px] font-black bg-slate-400 px-1.5 rounded text-white uppercase">KO</span>}
                      {!fainted && pkmn.status && pkmn.status !== 'none' && (
                        <span className="text-[8px] font-black bg-yellow-400 px-1.5 rounded text-white uppercase">{pkmn.status}</span>
                      )}
                    </div>
                  </div>

                  {/* Barra de Experiencia (EXP) integrada */}
                  <div className="mt-2 pt-1 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter italic">Exp</span>
                      <span className="text-[9px] font-mono font-bold text-slate-400">
                        {pkmn.exp || 0} / {pkmn.expToNextLevel || 100}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((pkmn.exp || 0) / (pkmn.expToNextLevel || 100)) * 100}%` }}
                        className="h-full bg-blue-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Indicador de Líder */}
                {i === 0 && (
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest rotate-90 shrink-0">
                    Líder
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer Informativo */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            {forcedSwitch
              ? 'Debes elegir un Pokémon con PS para continuar'
              : 'Selecciona un Pokémon para ponerlo al frente'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};