import { useState, memo } from 'react';
import { motion } from 'motion/react';
import { X, ArrowLeftRight } from 'lucide-react';
import { type Pokemon } from '../types';

export const PCStorageUI = memo(({ team, pc, onClose, onSwap }: { team: Pokemon[], pc: Pokemon[], onClose: () => void, onSwap: (teamIdx: number, pcIdx: number) => void }) => {
  const [selectedTeamIdx, setSelectedTeamIdx] = useState<number | null>(null);
  const [selectedPCIdx, setSelectedPCIdx] = useState<number | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <ArrowLeftRight size={32} />
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">PC de Pablo</h2>
          </div>
          <button onClick={() => {
            onClose();
          }} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="flex-1 p-6 border-r border-slate-100 overflow-y-auto">
            <h3 className="font-black text-slate-400 uppercase tracking-widest mb-4">Equipo</h3>
            <div className="grid grid-cols-1 gap-2">
              {team.map((pkmn, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    setSelectedTeamIdx(selectedTeamIdx === i ? null : i);
                  }}
                  className={`p-3 rounded-xl border-2 flex items-center gap-4 transition-all ${selectedTeamIdx === i ? 'bg-blue-50 border-blue-400 shadow-md' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm"><img src={pkmn.sprite} className="w-full h-full object-contain pixelated" alt={pkmn.name} /></div>
                  <span className="font-bold text-slate-800 uppercase text-xs">{pkmn.name}</span>
                  <span className="ml-auto text-[10px] font-mono text-slate-500">Lv {pkmn.level}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="font-black text-slate-400 uppercase tracking-widest mb-4">PC</h3>
            {pc.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                <p className="text-xs font-bold uppercase tracking-widest">El PC está vacío</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {pc.map((pkmn, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setSelectedPCIdx(selectedPCIdx === i ? null : i);
                    }}
                    className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${selectedPCIdx === i ? 'bg-blue-50 border-blue-400 shadow-md' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}
                  >
                    <span className="text-3xl mb-1"><img src={pkmn.sprite} className="w-full h-full object-contain pixelated" alt={pkmn.name} /></span>
                    <p className="font-bold text-slate-800 text-[10px] uppercase truncate w-full text-center">{pkmn.name}</p>
                    <p className="text-[9px] text-slate-500 font-mono">Lv {pkmn.level}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            {selectedTeamIdx !== null && selectedPCIdx !== null 
              ? `¿Intercambiar ${team[selectedTeamIdx].name} por ${pc[selectedPCIdx].name}?`
              : "Selecciona un Pokémon de cada lado para intercambiarlos"}
          </p>
          <button 
            disabled={selectedTeamIdx === null || selectedPCIdx === null}
            onClick={() => {
              if (selectedTeamIdx !== null && selectedPCIdx !== null) {
                onSwap(selectedTeamIdx, selectedPCIdx);
                setSelectedTeamIdx(null);
                setSelectedPCIdx(null);
              }
            }}
            className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${selectedTeamIdx !== null && selectedPCIdx !== null ? 'bg-blue-600 text-white shadow-lg hover:scale-105 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            Intercambiar
          </button>
        </div>
      </div>
    </motion.div>
  );
});
