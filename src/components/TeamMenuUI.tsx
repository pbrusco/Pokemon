import { useState, memo } from 'react';
import { motion } from 'motion/react';
import { type Pokemon } from '../types';
import { ITEMS_DATABASE } from '../constants';
import { applyItemToPokemon } from '../lib/itemUtils';

interface TeamMenuUIProps {
  team: Pokemon[];
  onClose: () => void;
  onSwap?: (index: number) => void;
  onUseItem?: (index: number) => void;
  forcedSwitch?: boolean;
  mode?: 'swap' | 'use_item';
  selectedItemId?: string;
}

const STATUS_BADGE: Record<string, { label: string; bg: string }> = {
  poison:    { label: 'PSN', bg: '#B060D0' },
  paralysis: { label: 'PAR', bg: '#C8C000' },
  burn:      { label: 'QUE', bg: '#F04000' },
  freeze:    { label: 'HLO', bg: '#90C0F8' },
  sleep:     { label: 'DOR', bg: '#908090' },
  confusion: { label: 'CON', bg: '#E080E0' },
};

function hpBarColor(hp: number, max: number) {
  const r = hp / max;
  if (r > 0.5) return '#00c000';
  if (r > 0.2) return '#f8c000';
  return '#f02000';
}

function PokemonCard({
  pkmn,
  isLead,
  isSelected,
  isSelectable,
  onHover,
  onSelect,
}: {
  pkmn: Pokemon;
  isLead: boolean;
  isSelected: boolean;
  isSelectable: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  const fainted = pkmn.hp <= 0;
  const hpPct = Math.max(0, (pkmn.hp / pkmn.maxHp) * 100);
  const status = pkmn.status && pkmn.status !== 'none' ? STATUS_BADGE[pkmn.status] : null;

  return (
    <div
      onClick={onSelect}
      onPointerEnter={onHover}
      className="flex items-center gap-3 rounded-sm cursor-pointer transition-colors select-none"
      style={{
        background: isSelected ? '#304868' : '#243850',
        border: `2px solid ${isLead ? '#f8c000' : isSelected ? '#5888b8' : '#3a5878'}`,
        padding: isLead ? '10px 12px' : '7px 10px',
        opacity: fainted && !isSelectable ? 0.5 : 1,
      }}
    >
      {/* Cursor */}
      <span
        className="font-game shrink-0 text-[#f8c000]"
        style={{ fontSize: '8px', opacity: isSelected ? 1 : 0, width: 10 }}
      >
        ▶
      </span>

      {/* Sprite */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: isLead ? 56 : 44, height: isLead ? 56 : 44 }}
      >
        <img
          src={pkmn.sprite}
          alt={pkmn.name}
          className="w-full h-full object-contain pixelated"
          style={{ filter: fainted ? 'grayscale(1) brightness(0.5)' : 'none' }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Name + level row */}
        <div className="flex justify-between items-baseline gap-1">
          <span
            className="font-game text-white uppercase truncate"
            style={{ fontSize: isLead ? '9px' : '7px', letterSpacing: '0.04em' }}
          >
            {pkmn.name}
          </span>
          <span
            className="font-game text-white/70 shrink-0"
            style={{ fontSize: '7px' }}
          >
            Nv{pkmn.level}
          </span>
        </div>

        {/* HP bar */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="font-game shrink-0 text-[#f8d830]" style={{ fontSize: '6px' }}>PS</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#1a1a2e' }}>
            <div
              className="h-full transition-all rounded-full"
              style={{ width: `${hpPct}%`, background: hpBarColor(pkmn.hp, pkmn.maxHp) }}
            />
          </div>
          <span className="font-mono text-white/80 shrink-0" style={{ fontSize: '9px' }}>
            {pkmn.hp}/{pkmn.maxHp}
          </span>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {fainted && (
            <span className="font-game rounded-sm px-1 py-px text-white" style={{ fontSize: '6px', background: '#606060' }}>
              DEB
            </span>
          )}
          {!fainted && status && (
            <span className="font-game rounded-sm px-1 py-px text-white" style={{ fontSize: '6px', background: status.bg }}>
              {status.label}
            </span>
          )}
          {isLead && !fainted && (
            <span className="font-game rounded-sm px-1 py-px" style={{ fontSize: '6px', background: '#f8c000', color: '#383838' }}>
              EN CAMPO
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const TeamMenuUI = memo(({ team, onClose, onSwap, onUseItem, forcedSwitch = false, mode = 'swap', selectedItemId }: TeamMenuUIProps) => {
  const [cursor, setCursor] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const canSelect = (pkmn: Pokemon, i: number) => {
    if (mode === 'use_item' && selectedItemId) {
      const result = applyItemToPokemon(pkmn, selectedItemId);
      if (!result.success) { setFeedbackMsg(result.message); return false; }
      return true;
    }
    if (i === 0) return false;
    if (pkmn.hp <= 0) return false;
    return true;
  };

  const handleSelect = (index: number) => {
    setFeedbackMsg(null);
    if (index >= team.length) {
      if (!forcedSwitch) onClose();
      return;
    }
    if (canSelect(team[index], index)) {
      if (mode === 'use_item' && onUseItem) onUseItem(index);
      else if (onSwap) onSwap(index);
    }
  };

  const headerText = mode === 'use_item' && selectedItemId
    ? `Usar ${ITEMS_DATABASE[selectedItemId]?.name ?? 'Objeto'}`
    : forcedSwitch ? '¡Elige un Pokémon!' : 'Equipo Pokémon';

  const [lead, ...rest] = team;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#1a3050' }}
    >
      {/* Header bar */}
      <div
        className="flex justify-between items-center px-4 py-2 shrink-0"
        style={{ background: '#0f1e30', borderBottom: '3px solid #383838' }}
      >
        <span className="font-game text-white uppercase" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>
          {headerText}
        </span>
        <span className="font-mono text-white/50" style={{ fontSize: '10px' }}>{team.length}/6</span>
      </div>

      {/* Party list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {/* Lead slot — full width, prominent */}
        {lead && (
          <PokemonCard
            pkmn={lead}
            isLead={true}
            isSelected={cursor === 0}
            isSelectable={canSelect(lead, 0)}
            onHover={() => setCursor(0)}
            onSelect={() => { setCursor(0); handleSelect(0); }}
          />
        )}

        {/* Remaining slots — 2-column grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {rest.map((pkmn, i) => {
              const idx = i + 1;
              return (
                <PokemonCard
                  key={idx}
                  pkmn={pkmn}
                  isLead={false}
                  isSelected={cursor === idx}
                  isSelectable={canSelect(pkmn, idx)}
                  onHover={() => setCursor(idx)}
                  onSelect={() => { setCursor(idx); handleSelect(idx); }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="shrink-0 px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: '#0f1e30', borderTop: '3px solid #383838' }}
      >
        {/* Feedback / hint */}
        <p className="font-sans text-[11px] text-white/60 flex-1">
          {feedbackMsg
            ? <span className="text-[#f02000] font-semibold">{feedbackMsg}</span>
            : mode === 'use_item'
              ? 'Elige un Pokémon para usar el objeto.'
              : forcedSwitch
                ? 'Debes elegir un Pokémon con PS.'
                : 'Elige un Pokémon para ponerlo al frente.'}
        </p>

        {/* Cancel button */}
        {!forcedSwitch && (
          <button
            onClick={onClose}
            className="font-game text-white uppercase shrink-0"
            style={{
              fontSize: '8px',
              letterSpacing: '0.06em',
              background: '#383838',
              border: '2px solid #585858',
              borderRadius: 3,
              padding: '6px 14px',
              boxShadow: '0 3px 0 #0a0a0a',
            }}
          >
            ← Cancelar
          </button>
        )}
      </div>
    </motion.div>
  );
});
