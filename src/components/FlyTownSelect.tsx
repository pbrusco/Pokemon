import { useState, memo } from 'react';
import { motion } from 'motion/react';

interface FlyTownSelectProps {
  towns: string[];
  onSelect: (town: string) => void;
  onCancel: () => void;
}

const TOWN_NAMES: Record<string, string> = {
  PALLET_TOWN: 'PUEBLO PALETA',
  VIRIDIAN_CITY: 'CIUDAD VIRIDIAN',
  PEWTER_CITY: 'CIUDAD PLATEADA',
  CERULEAN_CITY: 'CIUDAD CELESTE',
  LAVENDER_TOWN: 'PUEBLO LAVANDA',
  VERMILION_CITY: 'CIUDAD CARMÍN',
  CELADON_CITY: 'CIUDAD AZULONA',
  FUCHSIA_CITY: 'CIUDAD FUCSIA',
  SAFFRON_CITY: 'CIUDAD AZAFRÁN',
  CINNABAR_ISLAND: 'ISLA CANELA',
  INDIGO_PLATEAU: 'MESETA AÑIL',
  ROUTE_4: 'RUTA 4',
  ROUTE_10: 'RUTA 10',
};

function townDisplayName(id: string): string {
  return TOWN_NAMES[id] ?? id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export const FlyTownSelect = memo(({ towns, onSelect, onCancel }: FlyTownSelectProps) => {
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
          ¿A dónde volar?
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {towns.map((town, i) => (
          <div
            key={town}
            onClick={() => { setCursor(i); onSelect(town); }}
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
              {townDisplayName(town)}
            </span>
          </div>
        ))}
        {towns.length === 0 && (
          <p className="font-game text-white/60" style={{ fontSize: '8px' }}>
            No hay ciudades visitadas aún.
          </p>
        )}
      </div>

      <div
        className="shrink-0 px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: '#0f1e30', borderTop: '3px solid #383838' }}
      >
        <p className="font-sans text-[11px] text-white/60 flex-1">
          Selecciona tu destino.
        </p>
        <button onClick={onCancel}
          className="font-game text-white uppercase shrink-0"
          style={{ fontSize: '8px', letterSpacing: '0.06em', background: '#383838', border: '2px solid #585858', borderRadius: 3, padding: '6px 14px', boxShadow: '0 3px 0 #0a0a0a' }}
        >
          CANCELAR
        </button>
      </div>
    </motion.div>
  );
});
