import { Menu, X } from 'lucide-react';
import { soundManager } from '../lib/sounds';
import { GamePhase, EXPLORING } from '../types/gamePhase';
import { Dispatch, SetStateAction } from 'react';

interface MenuButtonProps {
  phase: GamePhase;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
}

export const MenuButton = ({ phase, setPhase }: MenuButtonProps) => {
  const inMenu = phase.type === 'MENU';
  const onClick = () => {
    soundManager.play('SELECT');
    if (inMenu) {
      setPhase(phase.returnTo ?? EXPLORING);
    } else {
      setPhase({ type: 'MENU', returnTo: phase });
    }
  };
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={inMenu ? 'Cerrar menú' : 'Abrir menú'}
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[150] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 border-4 border-slate-800 shadow-lg flex items-center justify-center hover:bg-slate-100 active:scale-95 transition"
    >
      {inMenu ? <X size={20} className="text-slate-800" /> : <Menu size={20} className="text-slate-800" />}
    </button>
  );
};
