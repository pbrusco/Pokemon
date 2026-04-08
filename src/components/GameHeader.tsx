import { Gamepad2, Volume2, VolumeX } from 'lucide-react';

interface GameHeaderProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHeader = ({ isMuted, onToggleMute }: GameHeaderProps) => (
  <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
    <div className="w-12 h-12 bg-red-600 rounded-xl shadow-lg flex items-center justify-center border-2 border-red-400">
      <Gamepad2 className="text-white" size={24} />
    </div>
    <div>
      <h1 className="text-white font-bold text-xl tracking-tight">POKÉMON FIRE RED</h1>
      <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Modern Remake Engine</p>
    </div>
    <button
      onClick={onToggleMute}
      className="w-9 h-9 bg-slate-700/80 hover:bg-slate-600 rounded-lg flex items-center justify-center border border-slate-500/50 transition-colors"
      title={isMuted ? 'Activar sonido' : 'Silenciar'}
    >
      {isMuted ? <VolumeX className="text-slate-400" size={16} /> : <Volume2 className="text-white" size={16} />}
    </button>
  </div>
);
