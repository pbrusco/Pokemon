import { memo } from 'react';
import { motion } from 'motion/react';
import { Map as MapIcon, X } from 'lucide-react';
import { POKEMON_LIST } from '../constants';

export const PokedexUI = memo(({ pokedex, onClose }: { pokedex: Record<string, { seen: boolean, caught: boolean }>, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-red-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <MapIcon size={32} />
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Pokédex</h2>
          </div>
          <button onClick={() => {
            onClose();
          }} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POKEMON_LIST.map((pkmn, i) => {
              const status = pokedex[pkmn.id] || { seen: false, caught: false };
              return (
                <motion.div 
                  key={pkmn.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${status.seen ? 'bg-slate-50 border-slate-100' : 'bg-slate-100 border-slate-200 grayscale opacity-50'}`}
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                    {status.seen ? <img src={pkmn.sprite} className="w-full h-full object-contain pixelated" alt={pkmn.name} /> : '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 uppercase text-xs">
                        {status.seen ? pkmn.name : '??????'}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">#{String(i + 1).padStart(3, '0')}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {status.seen && <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-1.5 rounded uppercase">Visto</span>}
                      {status.caught && <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-1.5 rounded uppercase">Atrapado</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vistos: {Object.values(pokedex).filter(p => p.seen).length}</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Atrapados: {Object.values(pokedex).filter(p => p.caught).length}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">¡Hazte con todos!</p>
        </div>
      </div>
    </motion.div>
  );
});
