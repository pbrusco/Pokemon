import { useState, memo } from 'react';
import { motion } from 'motion/react';

interface HMForgetMenuProps {
  existingMoveNames: string[];
  itemName: string;
  pokemonName: string;
  onForget: (index: number) => void;
  onCancel: () => void;
}

export const HMForgetMenu = memo(({ existingMoveNames, itemName, pokemonName, onForget, onCancel }: HMForgetMenuProps) => {
  const [cursor, setCursor] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#203048' }}
    >
      <div
        className="flex justify-between items-center px-4 py-2 shrink-0"
        style={{ background: '#0f1e30', borderBottom: '3px solid #383838' }}
      >
        <span className="font-game text-white uppercase" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>
          ¿Qué mover olvidar?
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        <p className="font-game text-white/80 px-1" style={{ fontSize: '8px' }}>
          {pokemonName} aprenderá {itemName}:
        </p>
        {existingMoveNames.map((name, i) => (
          <div
            key={i}
            onClick={() => { setCursor(i); onForget(i); }}
            onPointerEnter={() => setCursor(i)}
            className="flex items-center gap-3 rounded-sm cursor-pointer transition-colors select-none px-3 py-2.5"
            style={{
              background: cursor === i ? '#304868' : '#1A2840',
              border: `2px solid ${cursor === i ? '#5888b8' : '#304060'}`,
            }}
          >
            <span
              className="font-game shrink-0 text-[#f8c000]"
              style={{ fontSize: '8px', opacity: cursor === i ? 1 : 0, width: 10 }}
            >
              ▶
            </span>
            <span className="font-game text-white uppercase" style={{ fontSize: '8px', letterSpacing: '0.04em' }}>
              {name}
            </span>
          </div>
        ))}
      </div>

      <div
        className="shrink-0 px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: '#0f1e30', borderTop: '3px solid #383838' }}
      >
        <p className="font-sans text-[11px] text-white/60 flex-1">
          Elige el movimiento a reemplazar.
        </p>
        <button
          onClick={onCancel}
          className="font-game text-white uppercase shrink-0"
          style={{
            fontSize: '8px', letterSpacing: '0.06em', background: '#383838',
            border: '2px solid #585858', borderRadius: 3, padding: '6px 14px',
            boxShadow: '0 3px 0 #0a0a0a',
          }}
        >
          CANCELAR
        </button>
      </div>
    </motion.div>
  );
});
