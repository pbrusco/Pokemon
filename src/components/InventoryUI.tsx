import { useState } from 'react';
import { motion } from 'motion/react';
import { ITEMS_DATABASE } from '../constants';
import { soundManager } from '../lib/sounds';
import type { InventoryCounts } from '../types';

export const InventoryUI = ({ items, onClose, onUse }: { items: InventoryCounts, onClose: () => void, onUse?: (itemId: string) => void }) => {
  const entries = Object.entries(items).filter(([, qty]) => qty > 0);
  const [cursor, setCursor] = useState(0);

  // The last option is always CERRAR
  const totalOptions = entries.length + 1;

  const handleSelect = (index: number) => {
    soundManager.play('SELECT');
    if (index >= entries.length) {
      onClose();
    } else {
      const [id] = entries[index];
      if (onUse) onUse(id);
      else onClose();
    }
  };

  const selectedItem = cursor < entries.length ? ITEMS_DATABASE[entries[cursor][0]] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
    >
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {/* Main item list window */}
        <div className="bg-white border-[4px] border-slate-800 rounded-lg shadow-[6px_6px_0_rgba(0,0,0,0.15)]">
          {/* Header */}
          <div className="border-b-2 border-slate-300 px-4 py-2 bg-slate-50 rounded-t">
            <span className="font-mono font-bold text-slate-800 text-sm tracking-wide uppercase">Bolsa</span>
          </div>

          {/* Items list */}
          <div className="max-h-[50vh] overflow-y-auto">
            {entries.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="font-mono text-slate-500 text-sm">Sin objetos</p>
              </div>
            ) : (
              entries.map(([id, qty], i) => {
                const item = ITEMS_DATABASE[id];
                if (!item) return null;
                return (
                  <div
                    key={id}
                    onClick={() => { setCursor(i); handleSelect(i); }}
                    onPointerEnter={() => setCursor(i)}
                    className={`flex items-center px-4 py-2 cursor-pointer transition-colors ${
                      cursor === i ? 'bg-slate-100' : ''
                    }`}
                  >
                    <span className="w-5 text-slate-800 font-mono text-sm">{cursor === i ? '▶' : ''}</span>
                    <span className="text-lg mr-2">{item.icon}</span>
                    <span className="flex-1 font-mono font-bold text-slate-800 text-sm uppercase">{item.name}</span>
                    <span className="font-mono text-slate-600 text-sm">×{qty}</span>
                  </div>
                );
              })
            )}

            {/* CERRAR option */}
            <div
              onClick={() => { setCursor(entries.length); handleSelect(entries.length); }}
              onPointerEnter={() => setCursor(entries.length)}
              className={`flex items-center px-4 py-2 cursor-pointer border-t border-slate-200 transition-colors ${
                cursor === totalOptions - 1 ? 'bg-slate-100' : ''
              }`}
            >
              <span className="w-5 text-slate-800 font-mono text-sm">{cursor === totalOptions - 1 ? '▶' : ''}</span>
              <span className="font-mono font-bold text-slate-800 text-sm uppercase">Cerrar</span>
            </div>
          </div>
        </div>

        {/* Description window */}
        <div className="bg-white border-[4px] border-slate-800 rounded-lg shadow-[6px_6px_0_rgba(0,0,0,0.15)] px-4 py-3 min-h-[3.5rem]">
          <p className="font-mono text-slate-700 text-xs leading-relaxed">
            {selectedItem ? selectedItem.description : 'Cierra la mochila.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
