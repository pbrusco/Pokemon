import { memo } from 'react';
import { motion } from 'motion/react';
import { type Pokemon } from '../types';
import { HM_REQUIREMENTS } from '../constants/items';
import { useGameStore } from '../store/gameStore';

interface PokemonSummaryProps {
  pokemon: Pokemon;
  index: number;
  team: Pokemon[];
  onClose: () => void;
  onUseFieldMove: (moveName: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8',
};

const STATUS_BADGE: Record<string, { label: string; bg: string }> = {
  poison: { label: 'PSN', bg: '#B060D0' },
  paralysis: { label: 'PAR', bg: '#C8C000' },
  burn: { label: 'QUE', bg: '#F04000' },
  freeze: { label: 'HLO', bg: '#90C0F8' },
  sleep: { label: 'DOR', bg: '#908090' },
};

const FIELD_HM_MOVES = new Set<string>([
  HM_REQUIREMENTS.cut.move,
  HM_REQUIREMENTS.fly.move,
  HM_REQUIREMENTS.surf.move,
  HM_REQUIREMENTS.strength.move,
  HM_REQUIREMENTS.flash.move,
]);

function isFieldHM(moveName: string): boolean {
  return FIELD_HM_MOVES.has(moveName);
}

function hpBarColor(hp: number, max: number) {
  const r = hp / max;
  if (r > 0.5) return '#00c000';
  if (r > 0.2) return '#f8c000';
  return '#f02000';
}

export const PokemonSummary = memo(({ pokemon, index, team, onClose, onUseFieldMove }: PokemonSummaryProps) => {
  const fainted = pokemon.hp <= 0;
  const hpPct = Math.max(0, (pokemon.hp / pokemon.maxHp) * 100);

  const prev = team[index - 1];
  const next = team[index + 1];

  // Navigate to another Pokemon summary (phase set by parent)
  const summaryPhase = (teamIndex: number) => ({ type: 'POKEMON_SUMMARY' as const, teamIndex });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#203048' }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center px-4 py-2 shrink-0"
        style={{ background: '#0f1e30', borderBottom: '3px solid #383838' }}
      >
        <div className="flex items-center gap-3">
          {prev && (
            <button
              onClick={() => { onClose(); useGameStore.getState().setPhase(summaryPhase(index - 1)); }}
              className="font-game text-white/70 hover:text-white"
              style={{ fontSize: '9px' }}
            >◀</button>
          )}
          <span className="font-game text-white uppercase" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>
            {pokemon.name}
          </span>
          {next && (
            <button
              onClick={() => { onClose(); useGameStore.getState().setPhase(summaryPhase(index + 1)); }}
              className="font-game text-white/70 hover:text-white"
              style={{ fontSize: '9px' }}
            >▶</button>
          )}
        </div>
        <span className="font-game text-white/70" style={{ fontSize: '7px' }}>Nv{pokemon.level}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {/* Sprite + types */}
        <div className="flex items-center gap-4">
          <div
            className="shrink-0 flex items-center justify-center rounded-sm"
            style={{ background: '#1A2840', border: '2px solid #304060', width: 72, height: 72 }}
          >
            <img src={pokemon.sprite} alt={pokemon.name} className="w-full h-full object-contain pixelated"
              style={{ filter: fainted ? 'grayscale(1) brightness(0.5)' : 'none' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            {(pokemon.types || [pokemon.type]).map(t => (
              <span key={t}
                className="font-game rounded-sm px-2 py-0.5 text-white uppercase"
                style={{ fontSize: '7px', background: TYPE_COLORS[t] ?? '#888' }}
              >{t.toUpperCase()}</span>
            ))}
            {fainted && (
              <span className="font-game rounded-sm px-2 py-0.5 text-white uppercase"
                style={{ fontSize: '7px', background: '#606060' }}>DEBILITADO</span>
            )}
            {!fainted && pokemon.status && pokemon.status !== 'none' && (
              <span className="font-game rounded-sm px-2 py-0.5 text-white uppercase"
                style={{ fontSize: '7px', background: STATUS_BADGE[pokemon.status]?.bg ?? '#888' }}
              >{STATUS_BADGE[pokemon.status]?.label ?? pokemon.status}</span>
            )}
          </div>
        </div>

        {/* HP */}
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-game text-[#f8d830]" style={{ fontSize: '7px' }}>PS</span>
            <span className="font-mono text-white/80" style={{ fontSize: '10px' }}>{pokemon.hp}/{pokemon.maxHp}</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: '#1a1a2e' }}>
            <div className="h-full transition-all rounded-full"
              style={{ width: `${hpPct}%`, background: hpBarColor(pokemon.hp, pokemon.maxHp) }}
            />
          </div>
        </div>

        {/* Stats */}
        <div>
          <span className="font-game text-white/60" style={{ fontSize: '7px', letterSpacing: '0.06em' }}>ESTADÍSTICAS</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
            {(['attack', 'defense', 'special', 'speed'] as const).map(stat => (
              <div key={stat} className="flex justify-between">
                <span className="font-game text-white/70 uppercase" style={{ fontSize: '6px' }}>{stat}</span>
                <span className="font-mono text-white" style={{ fontSize: '10px' }}>{pokemon.baseStats[stat]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Moves */}
        <div>
          <span className="font-game text-white/60" style={{ fontSize: '7px', letterSpacing: '0.06em' }}>MOVIMIENTOS</span>
          <div className="flex flex-col gap-1.5 mt-1">
            {pokemon.moves.map((m, i) => {
              const hm = isFieldHM(m.name);
              const typeKey = m.type.toLowerCase();
              const bg = TYPE_COLORS[typeKey] ?? '#888';
              return (
                <div key={i}
                  className="flex items-center justify-between rounded-sm px-3 py-2"
                  style={{ background: '#1A2840', border: '1px solid #304060' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-game rounded-sm px-1.5 py-0.5 text-white"
                      style={{ fontSize: '6px', background: bg }}
                    >{m.type.toUpperCase()}</span>
                    <span className="font-game text-white uppercase" style={{ fontSize: '8px', letterSpacing: '0.04em' }}>
                      {m.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-game text-white/50" style={{ fontSize: '6px' }}>{m.pp}/{m.maxPp}</span>
                    {hm && !fainted && (
                      <button
                        onClick={() => onUseFieldMove(m.name)}
                        className="font-game text-white uppercase rounded-sm px-2 py-0.5 hover:brightness-110"
                        style={{ fontSize: '6px', background: '#4878D8' }}
                      >
                        USAR
                      </button>
                    )}
                    {hm && fainted && (
                      <span className="font-game text-white/30 rounded-sm px-2 py-0.5"
                        style={{ fontSize: '6px', background: '#303030' }}
                      >USAR</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exp */}
        {pokemon.exp !== undefined && pokemon.expToNextLevel !== undefined && (
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-game text-white/60" style={{ fontSize: '7px' }}>EXP</span>
              <span className="font-mono text-white/80" style={{ fontSize: '8px' }}>{pokemon.exp}/{pokemon.expToNextLevel}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#1a1a2e' }}>
              <div className="h-full rounded-full" style={{
                width: `${pokemon.expToNextLevel > 0 ? (pokemon.exp / pokemon.expToNextLevel) * 100 : 0}%`,
                background: '#4878D8',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="shrink-0 px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: '#0f1e30', borderTop: '3px solid #383838' }}
      >
        <p className="font-sans text-[11px] text-white/60 flex-1">
          {fainted ? 'No puede usar movimientos debilitado.' : 'Selecciona un movimiento de campo.'}
        </p>
        <button onClick={onClose}
          className="font-game text-white uppercase shrink-0"
          style={{ fontSize: '8px', letterSpacing: '0.06em', background: '#383838', border: '2px solid #585858', borderRadius: 3, padding: '6px 14px', boxShadow: '0 3px 0 #0a0a0a' }}
        >CERRAR</button>
      </div>
    </motion.div>
  );
});
