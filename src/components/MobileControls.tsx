import { memo } from 'react';
import { DPad } from './DPad';
import { type Direction } from '../types';
import { type GamePhase, EXPLORING } from '../types/gamePhase';
import { type Dispatch, type SetStateAction } from 'react';

interface MobileControlsProps {
  onMove: (dir: Direction) => void;
  onDirChange: (dir: Direction | null) => void;
  onAction: () => void;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
}

export const MobileControls = memo(({ onMove, onDirChange, onAction, setPhase }: MobileControlsProps) => (
  <div className="fixed bottom-0 left-0 w-full px-5 pb-6 lg:hidden flex justify-between items-end z-30 pointer-events-none">
    {/* D-pad */}
    <div className="pointer-events-auto mb-1">
      <DPad onMove={onMove} onDirChange={onDirChange} />
    </div>

    {/* Action buttons */}
    <div className="flex gap-5 items-end pointer-events-auto mb-2">
      {/* START */}
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          setPhase(prev =>
            prev.type === 'MENU' ? (prev.returnTo || EXPLORING) : { type: 'MENU', returnTo: prev }
          );
        }}
        className="font-game text-white uppercase active:brightness-75 touch-none"
        style={{
          fontSize: '6px',
          letterSpacing: '0.05em',
          background: '#2a2a2a',
          border: 'none',
          borderRadius: 20,
          padding: '8px 14px',
          boxShadow: '0 3px 0 #111, inset 0 1px 0 rgba(255,255,255,0.08)',
          marginBottom: 6,
        }}
      >
        START
      </button>

      {/* B + A */}
      <div className="flex items-end gap-4">
        <button
          onPointerDown={(e) => { e.preventDefault(); }}
          className="flex items-center justify-center active:brightness-75 touch-none"
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #a21c1c, #7f1d1d)',
            boxShadow: '0 4px 0 #450a0a, inset 0 1px 0 rgba(255,255,255,0.15)',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 11,
            color: 'white',
            border: 'none',
          }}
        >
          B
        </button>
        <button
          onPointerDown={(e) => { e.preventDefault(); onAction(); }}
          className="flex items-center justify-center active:brightness-75 touch-none"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #ef4444, #dc2626)',
            boxShadow: '0 5px 0 #7f1d1d, inset 0 1px 0 rgba(255,255,255,0.2)',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 13,
            color: 'white',
            border: 'none',
            marginBottom: 8,
          }}
        >
          A
        </button>
      </div>
    </div>
  </div>
));
