import { type Direction } from '../types';

interface DPadProps {
  onMove: (dir: Direction) => void;
  onDirChange: (dir: Direction | null) => void;
}

const ARROW: Record<Direction, string> = {
  up:    'M6 10L12 4L18 10',
  down:  'M6 14L12 20L18 14',
  left:  'M10 6L4 12L10 18',
  right: 'M14 6L20 12L14 18',
};

const DirectionButton = ({
  dir,
  style,
  onMove,
  onDirChange,
}: {
  dir: Direction;
  style: React.CSSProperties;
  onMove: (d: Direction) => void;
  onDirChange: (d: Direction | null) => void;
}) => (
  <button
    style={style}
    className="absolute flex items-center justify-center active:brightness-75 touch-none"
    onPointerDown={(e) => {
      e.preventDefault();
      onDirChange(dir);
      onMove(dir);
    }}
    onPointerUp={(e) => { e.preventDefault(); onDirChange(null); }}
    onPointerLeave={(e) => { e.preventDefault(); onDirChange(null); }}
    aria-label={dir}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={ARROW[dir]} />
    </svg>
  </button>
);

export const DPad = ({ onMove, onDirChange }: DPadProps) => {
  const btnSize = 44;
  const center = 44;
  const totalSize = center + btnSize * 2;

  const baseStyle: React.CSSProperties = {
    width: btnSize,
    height: btnSize,
    background: '#1e1e1e',
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.5)',
  };

  return (
    <div
      className="relative touch-none"
      style={{ width: totalSize, height: totalSize }}
    >
      {/* Center piece */}
      <div
        className="absolute"
        style={{
          left: btnSize,
          top: btnSize,
          width: center,
          height: center,
          background: '#1a1a1a',
          boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.5), inset -1px -1px 3px rgba(255,255,255,0.06)',
          clipPath: 'polygon(8% 32%, 32% 32%, 32% 8%, 68% 8%, 68% 32%, 92% 32%, 92% 68%, 68% 68%, 68% 92%, 32% 92%, 32% 68%, 8% 68%)',
        }}
      />

      <DirectionButton dir="up"    style={{ ...baseStyle, left: btnSize, top: 0,               borderRadius: '6px 6px 0 0' }}    onMove={onMove} onDirChange={onDirChange} />
      <DirectionButton dir="down"  style={{ ...baseStyle, left: btnSize, top: btnSize + center, borderRadius: '0 0 6px 6px' }}    onMove={onMove} onDirChange={onDirChange} />
      <DirectionButton dir="left"  style={{ ...baseStyle, left: 0,        top: btnSize,          borderRadius: '6px 0 0 6px' }}    onMove={onMove} onDirChange={onDirChange} />
      <DirectionButton dir="right" style={{ ...baseStyle, left: btnSize + center, top: btnSize,  borderRadius: '0 6px 6px 0' }}    onMove={onMove} onDirChange={onDirChange} />
    </div>
  );
};
