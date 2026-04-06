import { motion, AnimatePresence } from 'motion/react';
import { X, Backpack } from 'lucide-react';
import { ITEMS_DATABASE } from '../constants';
import { soundManager } from '../lib/sounds';
import type { InventoryCounts } from '../types';

export const InventoryUI = ({ items, onClose, onUse }: { items: InventoryCounts, onClose: () => void, onUse?: (itemId: string) => void }) => {
  const entries = Object.entries(items).filter(([, qty]) => qty > 0);
  const inventoryItems = entries.map(([id]) => ITEMS_DATABASE[id]).filter(Boolean);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="bg-red-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <Backpack size={32} />
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Mochila</h2>
          </div>
          <button onClick={() => {
            soundManager.play('SELECT');
            onClose();
          }} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {inventoryItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <Backpack size={64} strokeWidth={1} />
              <p className="font-bold uppercase tracking-widest text-sm">Tu mochila está vacía</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {entries.map(([id, qty], i) => {
                const item = ITEMS_DATABASE[id];
                if (!item) return null;
                return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      if (onUse) onUse(id);
                      onClose();
                    }}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-red-200 hover:bg-red-50 transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-slate-800 uppercase text-sm">{item.name} x{qty}</h3>
                      <p className="text-xs text-slate-500 leading-tight">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Selecciona un objeto para usarlo</p>
        </div>
      </div>
    </motion.div>
  );
};
