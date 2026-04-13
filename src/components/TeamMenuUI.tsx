import { useState } from 'react';
import { motion } from 'motion/react';
import { Pokemon } from '../types';
import { soundManager } from '../lib/sounds';

interface TeamMenuUIProps {
  team: Pokemon[];
  onClose: () => void;
  onSwap: (index: number) => void;
  forcedSwitch?: boolean;
}

const getHpColor = (hp: number, max: number) => {
  const ratio = hp / max;
  if (ratio > 0.5) return 'bg-green-500';
  if (ratio > 0.2) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const TeamMenuUI = ({ team, onClose, onSwap, forcedSwitch = false }: TeamMenuUIProps) => {
  const [cursor, setCursor] = useState(0);

  const canSelect = (pkmn: Pokemon, i: number) => {
    if (i === 0) return false;
    if (pkmn.hp <= 0) return false;
    return true;
  };

  const handleSelect = (index: number) => {
    if (index >= team.length) {
      if (!forcedSwitch) {
        soundManager.play('SELECT');
        onClose();
      }
      return;
    }
    if (canSelect(team[index], index)) {
      soundManager.play('SELECT');
      onSwap(index);
    }
  };

  const totalOptions = team.length + (forcedSwitch ? 0 : 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-white border-[4px] border-slate-800 rounded-lg shadow-[6px_6px_0_rgba(0,0,0,0.15)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="border-b-2 border-slate-300 px-4 py-2 bg-slate-50 rounded-t flex justify-between items-center">
          <span className="font-mono font-bold text-slate-800 text-sm tracking-wide uppercase">
            {forcedSwitch ? '¡Elige un Pokémon!' : 'Equipo Pokémon'}
          </span>
          <span className="font-mono text-[10px] text-slate-400 uppercase">{team.length}/6</span>
        </div>

        {/* Pokemon list */}
        <div className="flex-1 overflow-y-auto">
          {team.map((pkmn, i) => {
            const fainted = pkmn.hp <= 0;
            const isActive = i === 0;
            const hpPercent = Math.max(0, (pkmn.hp / pkmn.maxHp) * 100);

            return (
              <div
                key={i}
                onClick={() => { setCursor(i); handleSelect(i); }}
                onPointerEnter={() => setCursor(i)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-slate-200 transition-colors ${
                  cursor === i ? 'bg-slate-100' : ''
                } ${fainted ? 'opacity-50' : ''} ${isActive ? 'bg-blue-50' : ''}`}
              >
                {/* Cursor arrow */}
                <span className="w-4 text-slate-800 font-mono text-sm shrink-0">{cursor === i ? '▶' : ''}</span>

                {/* Pokemon sprite */}
                <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                  <img src={pkmn.sprite} className="w-full h-full object-contain pixelated" alt={pkmn.name} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-800 text-sm uppercase truncate">{pkmn.name}</span>
                    <span className="font-mono font-bold text-slate-600 text-xs shrink-0 ml-2">Nv{pkmn.level}</span>
                  </div>

                  {/* HP bar */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-mono font-bold text-[10px] text-slate-500 shrink-0">PS</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-sm overflow-hidden border border-slate-300">
                      <div
                        className={`h-full transition-all ${getHpColor(pkmn.hp, pkmn.maxHp)}`}
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* HP numbers + status */}
                  <div className="flex justify-between mt-0.5">
                    <span className="font-mono text-[10px] text-slate-500">{pkmn.hp}/{pkmn.maxHp}</span>
                    <div className="flex gap-1">
                      {fainted && <span className="font-mono text-[9px] font-bold bg-slate-500 px-1 rounded-sm text-white">DEB</span>}
                      {!fainted && pkmn.status && pkmn.status !== 'none' && (
                        <span className="font-mono text-[9px] font-bold bg-yellow-500 px-1 rounded-sm text-white uppercase">{pkmn.status}</span>
                      )}
                      {isActive && <span className="font-mono text-[9px] font-bold text-blue-600">EN CAMPO</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* CERRAR option */}
          {!forcedSwitch && (
            <div
              onClick={() => { setCursor(team.length); handleSelect(team.length); }}
              onPointerEnter={() => setCursor(team.length)}
              className={`flex items-center px-3 py-2 cursor-pointer transition-colors ${
                cursor === totalOptions - 1 ? 'bg-slate-100' : ''
              }`}
            >
              <span className="w-4 text-slate-800 font-mono text-sm shrink-0">{cursor === totalOptions - 1 ? '▶' : ''}</span>
              <span className="font-mono font-bold text-slate-800 text-sm uppercase ml-3">Cerrar</span>
            </div>
          )}
        </div>

        {/* Footer description */}
        <div className="border-t-2 border-slate-300 px-4 py-2 bg-slate-50 rounded-b">
          <p className="font-mono text-[10px] text-slate-500">
            {forcedSwitch
              ? 'Debes elegir un Pokémon con PS.'
              : 'Elige un Pokémon para ponerlo al frente.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};