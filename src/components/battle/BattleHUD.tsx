import { useState, useEffect, useRef } from 'react';
import type { Pokemon } from '../../types';

const STATUS_INFO: Record<string, { label: string; bg: string; color: string }> = {
  poison:    { label: 'PSN', bg: '#B060D0', color: 'white' },
  paralysis: { label: 'PAR', bg: '#C8C000', color: 'white' },
  burn:      { label: 'QUE', bg: '#F04000', color: 'white' },
  freeze:    { label: 'HLO', bg: '#90C0F8', color: '#383838' },
  sleep:     { label: 'DOR', bg: '#908090', color: 'white' },
  confusion: { label: 'CON', bg: '#E080E0', color: '#383838' },
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal:   { bg: '#A8A878', text: '#383838' },
  fire:     { bg: '#F08030', text: 'white' },
  water:    { bg: '#6890F0', text: 'white' },
  grass:    { bg: '#78C850', text: 'white' },
  electric: { bg: '#F8D030', text: '#383838' },
  ice:      { bg: '#98D8D8', text: '#383838' },
  fighting: { bg: '#C03028', text: 'white' },
  poison:   { bg: '#A040A0', text: 'white' },
  ground:   { bg: '#E0C068', text: '#383838' },
  flying:   { bg: '#A890F0', text: 'white' },
  psychic:  { bg: '#F85888', text: 'white' },
  bug:      { bg: '#A8B820', text: 'white' },
  rock:     { bg: '#B8A038', text: 'white' },
  ghost:    { bg: '#705898', text: 'white' },
  dragon:   { bg: '#7038F8', text: 'white' },
  dark:     { bg: '#705848', text: 'white' },
  steel:    { bg: '#B8B8D0', text: '#383838' },
  fairy:    { bg: '#EE99AC', text: '#383838' },
};

export function StatusBadge({ status }: { status: string | undefined }) {
  if (!status || status === 'none') return null;
  const info = STATUS_INFO[status];
  if (!info) return null;
  return (
    <span
      className="font-game rounded-sm px-1 py-px shrink-0"
      style={{ fontSize: '7px', background: info.bg, color: info.color }}
    >
      {info.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: string | undefined }) {
  if (!type) return null;
  const c = TYPE_COLORS[type.toLowerCase()] ?? { bg: '#A8A878', text: '#383838' };
  return (
    <span
      className="font-game rounded-sm px-1.5 py-px uppercase shrink-0"
      style={{ fontSize: '7px', background: c.bg, color: c.text }}
    >
      {type}
    </span>
  );
}

export function StatBoostBadges({ boosts }: { boosts: Pokemon['statBoosts'] }) {
  if (!boosts) return null;
  const labels: Record<string, string> = { attack: 'ATQ', defense: 'DEF', special: 'ESP', speed: 'VEL' };
  const entries = Object.entries(boosts).filter(([, v]) => v !== 0) as [string, number][];
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-0.5 mt-1">
      {entries.map(([stat, val]) => (
        <span
          key={stat}
          className={`text-[8px] font-black px-1 rounded ${val > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
        >
          {labels[stat]}{val > 0 ? '↑'.repeat(Math.min(val, 3)) : '↓'.repeat(Math.min(-val, 3))}
        </span>
      ))}
    </div>
  );
}

export function TrainerBalls({ team, side }: { team: Pokemon[]; side: 'player' | 'enemy' }) {
  if (!team.length) return null;
  const ordered = side === 'enemy' ? [...team].reverse() : team;
  return (
    <div
      className={`flex gap-0.5 sm:gap-1 ${side === 'enemy' ? 'justify-end' : 'justify-start'}`}
      data-testid={`${side}-trainer-balls`}
    >
      {ordered.map((p, i) => {
        const fainted = (p.hp ?? 0) <= 0;
        return (
          <span
            key={i}
            aria-label={fainted ? 'fainted-ball' : 'pokeball'}
            className={`inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 ${
              fainted
                ? 'bg-[#7a7a7a] border-[#3a3a3a] opacity-60'
                : 'bg-gradient-to-b from-[#e84030] from-50% to-white to-50% border-[#1a1a1a]'
            }`}
            style={{ boxShadow: fainted ? 'none' : '1px 1px 0 rgba(0,0,0,0.3)' }}
          />
        );
      })}
    </div>
  );
}

export function hpColor(hp: number, max: number): string {
  const ratio = hp / max;
  if (ratio > 0.5) return 'bg-[#00c000]';
  if (ratio > 0.2) return 'bg-[#f8c000]';
  return 'bg-[#f02000]';
}

const TICK_DURATION = 0.06;

export function TickHpBar({ hp, maxHp, colorClasses, animate }: {
  hp: number;
  maxHp: number;
  colorClasses: string;
  animate?: boolean;
}) {
  const targetPct = maxHp > 0 ? Math.max(0, (hp / maxHp) * 100) : 0;
  const [currentPct, setCurrentPct] = useState(targetPct);
  const visualRef = useRef(targetPct);

  useEffect(() => {
    if (!animate) {
      visualRef.current = targetPct;
      setCurrentPct(targetPct);
      return;
    }

    const start = visualRef.current;
    const diff = targetPct - start;
    if (Math.abs(diff) < 0.1) {
      visualRef.current = targetPct;
      setCurrentPct(targetPct);
      return;
    }

    const totalTicks = Math.max(4, Math.ceil(Math.abs(diff) / 3));
    const step = diff / totalTicks;
    let tick = 0;

    const interval = setInterval(() => {
      tick++;
      const next = Math.max(0, start + step * tick);
      visualRef.current = next;
      setCurrentPct(next);

      if (tick >= totalTicks) {
        clearInterval(interval);
        visualRef.current = targetPct;
        setCurrentPct(targetPct);
      }
    }, TICK_DURATION * 1000);

    return () => clearInterval(interval);
  }, [hp, maxHp, animate, targetPct]);

  return (
    <div
      className={`h-full border-t-2 border-white/50 ${colorClasses}`}
      style={{ width: `${currentPct}%`, transition: `width ${TICK_DURATION}s linear` }}
    />
  );
}
