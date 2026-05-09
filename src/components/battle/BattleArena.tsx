type Terrain = 'grass' | 'cave' | 'gym' | 'building' | 'water';

export function getTerrainFromMap(map: string): Terrain {
  const m = map.toUpperCase();
  if (m.includes('CAVE') || m.includes('MT_') || m.includes('TUNNEL') || m.includes('VICTORY_ROAD') || m.includes('POKEMON_TOWER')) return 'cave';
  if (m.includes('GYM')) return 'gym';
  if (m.includes('OCEAN') || m.includes('SEAFOAM') || m.includes('SEA')) return 'water';
  if (!m.includes('ROUTE') && !m.includes('PALLET') && !m.includes('VIRIDIAN') && !m.includes('PEWTER') &&
      !m.includes('CERULEAN') && !m.includes('VERMILION') && !m.includes('LAVENDER') && !m.includes('CELADON') &&
      !m.includes('FUCHSIA') && !m.includes('SAFFRON') && !m.includes('CINNABAR') &&
      (m.includes('MART') || m.includes('CENTER') || m.includes('LAB') || m.includes('HOUSE') ||
       m.includes('MANSION') || m.includes('HIDEOUT') || m.includes('SILPH') || m.includes('SS_ANNE') ||
       m.includes('ROCKET') || m.includes('FLOOR') || m.includes('CORP'))) return 'building';
  return 'grass';
}

export function getArenaStyle(terrain: Terrain): React.CSSProperties {
  switch (terrain) {
    case 'cave':
      return { background: 'linear-gradient(to bottom, #141414 0%, #242018 55%, #342e26 100%)' };
    case 'gym':
      return {
        backgroundColor: '#c8c0b0',
        backgroundImage: 'repeating-conic-gradient(#d8d0c0 0% 25%, #c0b8a8 0% 50%)',
        backgroundSize: '40px 40px',
      };
    case 'water':
      return { background: 'linear-gradient(to bottom, #90c8f0 0%, #90c8f0 38%, #4870c8 38%, #3860b8 100%)' };
    case 'building':
      return {
        backgroundColor: '#e0d8c8',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 11px, rgba(0,0,0,0.07) 11px, rgba(0,0,0,0.07) 13px)',
      };
    case 'grass':
    default:
      return { background: 'linear-gradient(to bottom, #98d8f0 0%, #98d8f0 36%, #78c840 36%, #60a030 100%)' };
  }
}

export function BattlePlatform({ variant, terrain }: { variant: 'enemy' | 'player'; terrain: Terrain }) {
  const isEnemy = variant === 'enemy';
  const platformColors: Record<Terrain, string> = {
    grass:    'from-[#c8e890] to-[#a8d070] border-[#88b850]',
    cave:     'from-[#706860] to-[#584e48] border-[#403830]',
    gym:      'from-[#e0d8c8] to-[#c8c0b0] border-[#a8a098]',
    water:    'from-[#90d0f8] to-[#70b8e8] border-[#50a0d0]',
    building: 'from-[#e8dcc8] to-[#d0c4b0] border-[#b0a490]',
  };
  const colors = platformColors[terrain];
  return (
    <div className={`absolute ${isEnemy ? 'bottom-0' : 'bottom-1'} left-0 right-0 z-0`}>
      <div
        className={`mx-auto rounded-[50%] border-2 opacity-90 bg-gradient-to-b ${colors} ${isEnemy ? 'w-[80%] h-8 sm:h-12' : 'w-[85%] h-10 sm:h-16'}`}
      />
      <div
        className={`mx-auto -mt-1 rounded-[50%] blur-[1px] ${isEnemy ? 'w-[65%] h-4 sm:h-6' : 'w-[70%] h-5 sm:h-8'} bg-black/20`}
      />
    </div>
  );
}
