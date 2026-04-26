import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { ITEMS_DATABASE, SHOP_PRICES } from '../constants';

export const ShopUI = ({ onBuy, onClose, money }: { onBuy: (itemId: string) => void, onClose: () => void, money: number }) => {
  const shopItems = ['POKEBALL', 'POTION', 'ANTIDOTE', 'PARALYZE_HEAL', 'BURN_HEAL'];
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
        <div className="px-6 pt-4 pb-2 flex justify-between items-center bg-blue-50 border-b border-blue-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tu dinero</span>
          <span className="font-mono font-black text-blue-700 text-lg">₽{money.toLocaleString()}</span>
        </div>
        <div className="p-6 space-y-4">
          {shopItems.map(id => {
            const item = ITEMS_DATABASE[id];
            const price = SHOP_PRICES[id];
            const canAfford = money >= price;
            return (
              <button
                key={id}
                onClick={() => {
                  if (!canAfford) return;
                  onBuy(id);
                }}
                disabled={!canAfford}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${canAfford ? 'bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer' : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'}`}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-slate-800 uppercase text-sm">{item.name}</h3>
                  <p className="text-[10px] text-slate-500">{item.description}</p>
                </div>
                <span className={`font-mono font-bold ${canAfford ? 'text-blue-600' : 'text-slate-400'}`}>₽{price}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
