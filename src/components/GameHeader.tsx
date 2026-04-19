import { Gamepad2 } from 'lucide-react';

export const GameHeader = () => (
  <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
    <div className="w-12 h-12 bg-red-600 rounded-xl shadow-lg flex items-center justify-center border-2 border-red-400">
      <Gamepad2 className="text-white" size={24} />
    </div>
    <div>
      <h1 className="text-white font-bold text-xl tracking-tight">POKÉMON FIRE RED</h1>
      <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Modern Remake Engine</p>
    </div>
  </div>
);
