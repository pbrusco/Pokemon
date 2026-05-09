import { useState } from 'react';
import type { Move } from '../../types';
import { STRUGGLE_MOVE } from '../../constants/moves';
import { TypeBadge } from './BattleHUD';

export function MoveMenu({ moves, onAttack, onBack }: {
  moves: Move[];
  onAttack: (m: Move) => void;
  onBack: () => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const allNoPP = moves.every(m => m.pp <= 0);
  const infoMove = hovered !== null ? (moves[hovered] ?? moves[0]) : moves[0];

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 flex-1 gap-px bg-[#4f6e69] overflow-hidden">
        {allNoPP ? (
          <button
            className="col-span-2 bg-[#f8f8f8] text-left px-3 py-2 hover:bg-[#edf4ef] flex items-center gap-1"
            onClick={() => onAttack(STRUGGLE_MOVE)}
          >
            <span className="text-red-500 text-xs">▶</span>
            <span className="font-bold text-[#2f2f2f] text-sm uppercase tracking-tight">{STRUGGLE_MOVE.name}</span>
          </button>
        ) : (
          moves.map((move, i) => {
            const noPP = move.pp <= 0;
            const isHov = hovered === i;
            return (
              <button
                key={`${move.name}-${i}`}
                disabled={noPP}
                className={`bg-[#f8f8f8] text-left px-2 sm:px-3 py-2 flex flex-col justify-center transition-colors ${
                  noPP ? 'opacity-40 cursor-not-allowed' : isHov ? 'bg-[#d8ecd8]' : 'hover:bg-[#edf4ef]'
                }`}
                onClick={() => { if (!noPP) onAttack(move); }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="inline-flex items-center gap-0.5 sm:gap-1 w-full overflow-hidden">
                  <span className={`text-red-500 text-[10px] transition-opacity shrink-0 ${isHov && !noPP ? 'opacity-100' : 'opacity-0'}`}>▶</span>
                  <span className="font-bold text-[#2f2f2f] text-[10px] sm:text-sm uppercase tracking-tight leading-tight truncate">{move.name}</span>
                </span>
                <span className="text-[8px] text-slate-400 font-mono ml-3.5 mt-0.5">[{i + 1}]</span>
              </button>
            );
          })
        )}
      </div>

      <div className="border-t-2 border-[#4f6e69] bg-[#edf4ef] px-2 py-1.5 flex items-center gap-2 shrink-0">
        <TypeBadge type={infoMove?.type} />
        <span className="font-game text-[#383838] flex-1" style={{ fontSize: '8px' }}>
          PP&nbsp;&nbsp;{infoMove?.pp ?? '--'}&nbsp;/&nbsp;{infoMove?.maxPp ?? '--'}
        </span>
        <button
          className="font-game text-slate-500 hover:text-slate-700 uppercase"
          style={{ fontSize: '7px' }}
          onClick={onBack}
        >
          ← VOLVER
        </button>
      </div>
    </div>
  );
}
