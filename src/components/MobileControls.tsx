import { Joystick } from './Joystick';
import { soundManager } from '../lib/sounds';
import { Direction } from '../types';
import { GamePhase, EXPLORING, MENU } from '../types/gamePhase';
import { Dispatch, SetStateAction } from 'react';

interface MobileControlsProps {
  onMove: (dir: Direction) => void;
  onAction: () => void;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
}

export const MobileControls = ({ onMove, onAction, setPhase }: MobileControlsProps) => (
  <div className="fixed bottom-0 left-0 w-full p-6 lg:hidden flex justify-between items-end z-30 pointer-events-none">
    <Joystick onMove={(dir) => dir && onMove(dir)} />
    <div className="flex gap-4 pointer-events-auto mb-4">
      <div className="flex flex-col gap-8">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            soundManager.play('SELECT');
            setPhase(prev => 
              prev.type === 'MENU' ? (prev.returnTo || EXPLORING) : { type: 'MENU', returnTo: prev }
            );
          }}
          className="w-12 h-12 bg-slate-700/80 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-slate-500 shadow-lg border-2 border-white/10 text-[10px] font-bold"
        >
          START
        </button>
      </div>
      <div className="flex gap-4 items-center">
        <button
          onPointerDown={(e) => { e.preventDefault(); }}
          className="w-16 h-16 bg-red-700/90 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-red-500 shadow-xl border-4 border-black/20 font-black text-2xl"
        >
          B
        </button>
        <button
          onPointerDown={(e) => { e.preventDefault(); onAction(); }}
          className="w-20 h-20 bg-red-600 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-red-400 shadow-xl border-4 border-black/20 font-black text-3xl mb-8"
        >
          A
        </button>
      </div>
    </div>
  </div>
);
