import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { findFreeSlot, listSlots, SLOT_NUMBERS, type SlotNumber } from '../lib/saveSlots';

function fmtSavedAt(savedAt: number): string {
  const d = new Date(savedAt);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

export function SaveButton() {
  const saveToSlot = useGameStore(s => s.saveToSlot);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  // Re-render trigger after a save so timestamps update.
  const [, bump] = useState(0);

  const onClickSave = () => {
    const free = findFreeSlot();
    if (free !== null) {
      saveToSlot(free);
      setFeedback(`¡Guardado en slot ${free}!`);
      setTimeout(() => setFeedback(null), 1800);
      bump(n => n + 1);
      return;
    }
    setPickerOpen(true);
  };

  const onPickSlot = (n: SlotNumber) => {
    saveToSlot(n);
    setPickerOpen(false);
    setFeedback(`¡Slot ${n} sobrescrito!`);
    setTimeout(() => setFeedback(null), 1800);
    bump(n => n + 1);
  };

  return (
    <>
      <div className="flex flex-col items-stretch gap-1.5 w-full">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClickSave}
          className="px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Guardar partida
        </button>
        {feedback && (
          <div className="text-[10px] font-mono text-emerald-700 text-center">
            {feedback}
          </div>
        )}
      </div>

      {pickerOpen && (
        <SlotOverwriteModal
          onPick={onPickSlot}
          onCancel={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

interface SlotOverwriteModalProps {
  onPick: (n: SlotNumber) => void;
  onCancel: () => void;
}

function SlotOverwriteModal({ onPick, onCancel }: SlotOverwriteModalProps) {
  const slots = listSlots();
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 p-4">
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
          SOBRESCRIBIR SLOT
        </div>
        <div className="px-4 py-3 text-[12px] text-[#383838]">
          Todos los slots están ocupados. Elige uno para sobrescribir:
        </div>
        <div>
          {SLOT_NUMBERS.map(n => {
            const s = slots.find(s => s.slot === n)!;
            const filled = !('empty' in s);
            return (
              <button
                key={n}
                onClick={() => onPick(n)}
                className="w-full text-left px-4 py-3 transition-colors hover:bg-[#383838] hover:text-white"
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
            onClick={onCancel}
            className="w-full px-4 py-2 text-[12px] text-[#d03030] hover:bg-[#d03030] hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
