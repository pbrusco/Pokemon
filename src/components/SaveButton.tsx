import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function SaveButton() {
  const lastSavedAt = useGameStore(s => s.lastSavedAt);
  const saveGame = useGameStore(s => s.saveGame);
  const [feedback, setFeedback] = useState<string | null>(null);

  const onSave = () => {
    saveGame();
    setFeedback('¡Partida guardada!');
    setTimeout(() => setFeedback(null), 1800);
  };

  const formatted = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString()
    : 'nunca';

  return (
    <div className="flex flex-col items-stretch gap-1.5 w-full">
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSave}
        className="px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        Guardar partida
      </button>
      <div className="text-[10px] font-mono text-[#383838] text-center">
        {feedback ?? `Última: ${formatted}`}
      </div>
    </div>
  );
}
