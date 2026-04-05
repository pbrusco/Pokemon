import { motion, AnimatePresence } from 'motion/react';
import { X, User } from 'lucide-react';
import { Pokemon } from '../types';
import { soundManager } from '../lib/sounds';

export const TeamMenuUI = ({ team, onClose, onSwap }: { team: Pokemon[], onClose: () => void, onSwap: (index: number) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <User size={32} />
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Tu Equipo</h2>
          </div>
          <button onClick={() => {
            soundManager.play('SELECT');
            onClose();
          }} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {team.map((pkmn, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => {
                if (i !== 0) {
                  soundManager.play('SELECT');
                  onSwap(i);
                }
              }}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${i === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-emerald-100'}`}
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                {pkmn.sprite}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <h3 className="font-black text-slate-800 uppercase text-sm">{pkmn.name}</h3>
                  <span className="text-xs font-mono font-bold text-slate-500">Lv {pkmn.level}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${(pkmn.hp / pkmn.maxHp) * 100}%` }}
                    className={`h-full ${pkmn.hp > pkmn.maxHp / 2 ? 'bg-emerald-500' : pkmn.hp > pkmn.maxHp / 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] font-mono font-bold text-slate-600">{pkmn.hp}/{pkmn.maxHp} PS</span>
                  {pkmn.status && pkmn.status !== 'none' && (
                    <span className="text-[8px] font-black bg-yellow-400 px-1.5 rounded text-white uppercase">{pkmn.status}</span>
                  )}
                </div>
              </div>
              {i === 0 && <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest rotate-90">Líder</div>}
            </motion.div>
          ))}
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Selecciona un Pokémon para ponerlo al frente</p>
        </div>
      </div>
    </motion.div>
  );
};
