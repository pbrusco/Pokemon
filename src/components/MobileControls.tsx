import { memo } from 'react';
import { DPad } from './DPad';
import { type Direction } from '../types';
import { type GamePhase, EXPLORING } from '../types/gamePhase';
import { type Dispatch, type SetStateAction } from 'react';

interface MobileControlsProps {
  onMove: (dir: Direction) => void;
  onDirChange: (dir: Direction | null) => void;
  onAction: () => void;
  onBack: () => void;
  onSelect: () => void;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
}

const pillStyle: React.CSSProperties = {
  fontSize: '6px',
  letterSpacing: '0.05em',
  background: '#1e1e1e',
  border: 'none',
  borderRadius: 20,
  padding: '7px 13px',
  boxShadow: '0 3px 0 #0a0a0a, inset 0 1px 0 rgba(255,255,255,0.08)',
  color: 'white',
};

const actionBtn = (size: number, mb = 0): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: '50%',
  background: 'radial-gradient(circle at 32% 28%, #ef4444, #b91c1c)',
  boxShadow: `0 ${size < 60 ? 4 : 5}px 0 #7f1d1d, inset 0 1px 0 rgba(255,255,255,0.2)`,
  fontFamily: '"Press Start 2P", monospace',
  fontSize: size < 60 ? 10 : 13,
  color: 'white',
  border: 'none',
  marginBottom: mb,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const MobileControls = memo(({ onMove, onDirChange, onAction, onBack, onSelect, setPhase }: MobileControlsProps) => (
  <div className="fixed bottom-0 left-0 w-full px-4 pb-5 lg:hidden flex items-end z-30 pointer-events-none"
    style={{ gap: '0' }}
  >
    {/* Left — D-pad */}
    <div className="pointer-events-auto shrink-0">
      <DPad onMove={onMove} onDirChange={onDirChange} />
    </div>

    {/* Center — SEL + STA pills */}
    <div className="flex-1 flex justify-center gap-3 pointer-events-auto pb-5">
      <button
        className="font-game uppercase active:brightness-75 touch-none"
        style={pillStyle}
        onPointerDown={(e) => { e.preventDefault(); onSelect(); }}
      >
        SEL
      </button>
      <button
        className="font-game uppercase active:brightness-75 touch-none"
        style={pillStyle}
        onPointerDown={(e) => {
          e.preventDefault();
          setPhase(prev =>
            prev.type === 'MENU' ? (prev.returnTo || EXPLORING) : { type: 'MENU', returnTo: prev }
          );
        }}
      >
        STA
      </button>
    </div>

    {/* Right — B + A (A raised, GBA-style diagonal) */}
    <div className="pointer-events-auto flex items-end shrink-0" style={{ gap: 14 }}>
      <button
        className="active:brightness-75 touch-none"
        style={{
          ...actionBtn(50),
          transform: 'none',
          transition: 'transform 0.1s',
        }}
        onPointerDown={(e) => { e.preventDefault(); e.currentTarget.style.transform = 'scale(0.92)'; onBack(); }}
        onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        B
      </button>
      <button
        className="active:brightness-75 touch-none"
        style={{
          ...actionBtn(62, 18),
          transform: 'none',
          transition: 'transform 0.1s',
        }}
        onPointerDown={(e) => { e.preventDefault(); e.currentTarget.style.transform = 'scale(0.92)'; onAction(); }}
        onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        A
      </button>
    </div>
  </div>
));
