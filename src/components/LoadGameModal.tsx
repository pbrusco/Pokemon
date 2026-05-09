import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { hasAnySave, listSlots, SLOT_NUMBERS, type SlotNumber } from '../lib/saveSlots';

function fmtSavedAt(savedAt: number): string {
  const d = new Date(savedAt);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

/**
 * Mounted at app start. If at least one save slot exists, renders an
 * overlay that lets the player either load a slot or continue with the
 * current (auto-persisted) session. Dismissed permanently once the player
 * makes a choice.
 */
export function LoadGameModal() {
  const loadFromSlot = useGameStore(s => s.loadFromSlot);
  const [open, setOpen] = useState(() => hasAnySave());

  // If slots get created during this session (first save), don't reopen.
  useEffect(() => {
    if (!open) return;
    // Recompute on mount in case a stale render flag was passed in.
    if (!hasAnySave()) setOpen(false);
  }, [open]);

  if (!open) return null;

  const slots = listSlots();

  const onPick = (n: SlotNumber) => {
    const ok = loadFromSlot(n);
    if (ok) setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 p-4">
      <div
        className="w-full max-w-sm font-sans"
        style={{
          background: '#f8f8f0',
          border: '3px solid #383838',
          borderRadius: 2,
          boxShadow: '4px 4px 0 #383838',
        }}
      >
        <div
          className="px-4 py-2 font-game text-white"
          style={{ fontSize: '8px', letterSpacing: '0.1em', background: '#383838' }}
        >
          CARGAR PARTIDA
        </div>
        <div className="px-4 py-3 text-[12px] text-[#383838]">
          Elige un slot para cargar, o continúa con la sesión actual.
        </div>
        <div>
          {SLOT_NUMBERS.map(n => {
            const s = slots.find(s => s.slot === n)!;
            const filled = !('empty' in s);
            return (
              <button
                key={n}
                onClick={() => filled && onPick(n)}
                disabled={!filled}
                className="w-full text-left px-4 py-3 transition-colors enabled:hover:bg-[#383838] enabled:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderTop: '1px solid #a8a8a8' }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[14px]">Slot {n}</span>
                  <span className="font-mono text-[10px] opacity-70">
                    {filled ? fmtSavedAt(s.savedAt) : 'vacío'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ borderTop: '2px solid #383838' }}>
          <button
            onClick={() => setOpen(false)}
            className="w-full px-4 py-2 text-[12px] text-[#383838] hover:bg-[#4878D8] hover:text-white transition-colors"
          >
            Continuar sesión actual
          </button>
        </div>
      </div>
    </div>
  );
}
