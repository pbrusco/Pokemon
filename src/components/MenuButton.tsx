import { memo } from 'react';
import { Menu, X } from 'lucide-react';
import { type GamePhase, EXPLORING } from '../types/gamePhase';
import { SfxController } from '../lib/sfx';
import { type Dispatch, type SetStateAction } from 'react';

interface MenuButtonProps {
  phase: GamePhase;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
}

export const MenuButton = memo(({ phase, setPhase }: MenuButtonProps) => {
  const inMenu = phase.type === 'MENU';
  const onClick = () => {
    if (inMenu) {
      SfxController.play('menu_close');
      setPhase(phase.returnTo ?? EXPLORING);
    } else {
      SfxController.play('menu_open');
      setPhase({ type: 'MENU', returnTo: phase });
    }
  };
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={inMenu ? 'Cerrar menú' : 'Abrir menú'}
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[150] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 border-4 border-slate-800 shadow-lg hidden lg:flex items-center justify-center hover:bg-slate-100 active:scale-95 transition"
    >
      {inMenu ? <X size={20} className="text-slate-800" /> : <Menu size={20} className="text-slate-800" />}
    </button>
  );
});
