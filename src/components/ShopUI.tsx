import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ITEMS_DATABASE } from '../constants';
import { soundManager } from '../lib/sounds';

export const ShopUI = ({ onBuy, onClose }: { onBuy: (itemId: string) => void, onClose: () => void }) => {
  const shopItems = ['POTION', 'POKEBALL'];
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-black italic tracking-tighter uppercase">Poké Mart</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {shopItems.map(id => {
            const item = ITEMS_DATABASE[id];
            return (
              <button 
                key={id}
                onClick={() => {
                  onBuy(id);
                  soundManager.play('SELECT');
                }}
                className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-slate-800 uppercase text-sm">{item.name}</h3>
                  <p className="text-[10px] text-slate-500">Objeto útil para tu viaje</p>
                </div>
                <span className="font-mono font-bold text-blue-600">$200</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
