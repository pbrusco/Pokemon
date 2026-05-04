import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { POKEMON_LIST } from '../constants/pokemon';

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

const GEN1_TYPES: Record<string, string[]> = {
  bulbasaur: ['grass', 'poison'], ivysaur: ['grass', 'poison'], venusaur: ['grass', 'poison'],
  charmander: ['fire'], charmeleon: ['fire'], charizard: ['fire', 'flying'],
  squirtle: ['water'], wartortle: ['water'], blastoise: ['water'],
  caterpie: ['bug'], metapod: ['bug'], butterfree: ['bug', 'flying'],
  weedle: ['bug', 'poison'], kakuna: ['bug', 'poison'], beedrill: ['bug', 'poison'],
  pidgey: ['normal', 'flying'], pidgeotto: ['normal', 'flying'], pidgeot: ['normal', 'flying'],
  rattata: ['normal'], raticate: ['normal'],
  spearow: ['normal', 'flying'], fearow: ['normal', 'flying'],
  ekans: ['poison'], arbok: ['poison'],
  pikachu: ['electric'], raichu: ['electric'],
  sandshrew: ['ground'], sandslash: ['ground'],
  'nidoran-f': ['poison'], nidorina: ['poison'], nidoqueen: ['poison', 'ground'],
  'nidoran-m': ['poison'], nidorino: ['poison'], nidoking: ['poison', 'ground'],
  clefairy: ['normal'], clefable: ['normal'],
  vulpix: ['fire'], ninetales: ['fire'],
  jigglypuff: ['normal'], wigglytuff: ['normal'],
  zubat: ['poison', 'flying'], golbat: ['poison', 'flying'],
  oddish: ['grass', 'poison'], gloom: ['grass', 'poison'], vileplume: ['grass', 'poison'],
  paras: ['bug', 'grass'], parasect: ['bug', 'grass'],
  venonat: ['bug', 'poison'], venomoth: ['bug', 'poison'],
  diglett: ['ground'], dugtrio: ['ground'],
  meowth: ['normal'], persian: ['normal'],
  psyduck: ['water'], golduck: ['water'],
  mankey: ['fighting'], primeape: ['fighting'],
  growlithe: ['fire'], arcanine: ['fire'],
  poliwag: ['water'], poliwhirl: ['water'], poliwrath: ['water', 'fighting'],
  abra: ['psychic'], kadabra: ['psychic'], alakazam: ['psychic'],
  machop: ['fighting'], machoke: ['fighting'], machamp: ['fighting'],
  bellsprout: ['grass', 'poison'], weepinbell: ['grass', 'poison'], victreebel: ['grass', 'poison'],
  tentacool: ['water', 'poison'], tentacruel: ['water', 'poison'],
  geodude: ['rock', 'ground'], graveler: ['rock', 'ground'], golem: ['rock', 'ground'],
  ponyta: ['fire'], rapidash: ['fire'],
  slowpoke: ['water', 'psychic'], slowbro: ['water', 'psychic'],
  magnemite: ['electric'], magneton: ['electric'],
  farfetchd: ['normal', 'flying'],
  doduo: ['normal', 'flying'], dodrio: ['normal', 'flying'],
  seel: ['water'], dewgong: ['water', 'ice'],
  grimer: ['poison'], muk: ['poison'],
  shellder: ['water'], cloyster: ['water', 'ice'],
  gastly: ['ghost', 'poison'], haunter: ['ghost', 'poison'], gengar: ['ghost', 'poison'],
  onix: ['rock', 'ground'],
  drowzee: ['psychic'], hypno: ['psychic'],
  krabby: ['water'], kingler: ['water'],
  voltorb: ['electric'], electrode: ['electric'],
  exeggcute: ['grass', 'psychic'], exeggutor: ['grass', 'psychic'],
  cubone: ['ground'], marowak: ['ground'],
  hitmonlee: ['fighting'], hitmonchan: ['fighting'],
  lickitung: ['normal'],
  koffing: ['poison'], weezing: ['poison'],
  rhyhorn: ['ground', 'rock'], rhydon: ['ground', 'rock'],
  chansey: ['normal'],
  tangela: ['grass'],
  kangaskhan: ['normal'],
  horsea: ['water'], seadra: ['water'],
  goldeen: ['water'], seaking: ['water'],
  staryu: ['water'], starmie: ['water', 'psychic'],
  'mr-mime': ['psychic'],
  scyther: ['bug', 'flying'],
  jynx: ['ice', 'psychic'],
  electabuzz: ['electric'],
  magmar: ['fire'],
  pinsir: ['bug'],
  tauros: ['normal'],
  magikarp: ['water'], gyarados: ['water', 'flying'],
  lapras: ['water', 'ice'],
  ditto: ['normal'],
  eevee: ['normal'],
  vaporeon: ['water'], jolteon: ['electric'], flareon: ['fire'],
  porygon: ['normal'],
  omanyte: ['rock', 'water'], omastar: ['rock', 'water'],
  kabuto: ['rock', 'water'], kabutops: ['rock', 'water'],
  aerodactyl: ['rock', 'flying'],
  snorlax: ['normal'],
  articuno: ['ice', 'flying'], zapdos: ['electric', 'flying'], moltres: ['fire', 'flying'],
  dratini: ['dragon'], dragonair: ['dragon'], dragonite: ['dragon', 'flying'],
  mewtwo: ['psychic'],
  mew: ['psychic'],
};

interface PokedexEntry {
  seen: boolean;
  caught: boolean;
}

interface PokedexUIProps {
  pokedex: Record<string, PokedexEntry>;
  onClose: () => void;
}

function TypeBadge({ type }: { type: string }) {
  const c = TYPE_COLORS[type] ?? { bg: '#A8A878', text: '#383838' };
  return (
    <span
      className="font-game rounded-sm px-1.5 py-px uppercase shrink-0"
      style={{ fontSize: '6px', background: c.bg, color: c.text }}
    >
      {type}
    </span>
  );
}

export const PokedexUI = memo(({ pokedex, onClose }: PokedexUIProps) => {
  const [cursor, setCursor] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const seen = useMemo(() => Object.values(pokedex).filter(p => p.seen).length, [pokedex]);
  const caught = useMemo(() => Object.values(pokedex).filter(p => p.caught).length, [pokedex]);

  const selectedEntry = selectedId ? pokedex[selectedId] : null;
  const selectedPkmn = selectedId ? POKEMON_LIST[cursor] : null;
  const selectedTypes = selectedId ? (GEN1_TYPES[selectedId] ?? ['normal']) : [];

  const handleClick = (index: number) => {
    setCursor(index);
    setSelectedId(POKEMON_LIST[index].id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#1a3050' }}
    >
      <div
        className="flex justify-between items-center px-4 py-2 shrink-0"
        style={{ background: '#0f1e30', borderBottom: '3px solid #383838' }}
      >
        <span className="font-game text-white uppercase" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>
          Pokédex
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 shrink-0 overflow-y-auto px-2 py-2 flex flex-col gap-px"
          style={{ background: '#15253a', borderRight: '3px solid #383838' }}
        >
          {POKEMON_LIST.map((pkmn, i) => {
            const entry = pokedex[pkmn.id] ?? { seen: false, caught: false };
            const isSelected = cursor === i;
            return (
              <div
                key={pkmn.id}
                onClick={() => handleClick(i)}
                className="flex items-center gap-2 cursor-pointer select-none rounded-sm"
                style={{
                  background: isSelected ? '#304868' : 'transparent',
                  border: isSelected ? '1px solid #5888b8' : '1px solid transparent',
                  padding: '4px 6px',
                  opacity: entry.seen ? 1 : 0.45,
                }}
              >
                <span
                  className="font-game shrink-0 text-[#f8c000]"
                  style={{ fontSize: '7px', opacity: isSelected ? 1 : 0, width: 10 }}
                >
                  ▶
                </span>

                <div className="shrink-0 flex items-center justify-center" style={{ width: 36, height: 36 }}>
                  {entry.seen ? (
                    <img
                      src={pkmn.sprite}
                      alt=""
                      className="w-full h-full object-contain pixelated"
                      style={{
                        filter: entry.caught ? 'none' : 'grayscale(1) brightness(0.7)',
                      }}
                    />
                  ) : (
                    <span className="font-game text-white/30" style={{ fontSize: '14px' }}>?</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span
                    className="font-game text-white uppercase block truncate"
                    style={{ fontSize: '6px', letterSpacing: '0.04em' }}
                  >
                    {entry.seen ? (
                      entry.caught ? (
                        pkmn.name
                      ) : (
                        '??????'
                      )
                    ) : (
                      '??????'
                    )}
                  </span>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {entry.seen && (
                      <span
                        className="font-game rounded-sm px-1 py-px text-white"
                        style={{ fontSize: '5px', background: '#4878d8' }}
                      >
                        VISTO
                      </span>
                    )}
                    {entry.caught && (
                      <span
                        className="font-game rounded-sm px-1 py-px text-white"
                        style={{ fontSize: '5px', background: '#00c000' }}
                      >
                        ATRAPADO
                      </span>
                    )}
                  </div>
                </div>

                <span className="font-mono text-white/40 shrink-0" style={{ fontSize: '8px' }}>
                  #{String(i + 1).padStart(3, '0')}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col" style={{ background: '#1a3050' }}>
          <AnimatePresence mode="wait">
            {selectedEntry && selectedPkmn ? (
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col items-center justify-center p-8 gap-4"
              >
                <div className="flex items-center justify-center" style={{ width: 128, height: 128 }}>
                  {selectedEntry.seen ? (
                    <img
                      src={selectedPkmn.sprite}
                      alt=""
                      className="w-full h-full object-contain pixelated"
                      style={{
                        filter: selectedEntry.caught ? 'none' : 'grayscale(1) brightness(0.7)',
                      }}
                    />
                  ) : (
                    <span className="font-game text-white/20" style={{ fontSize: '48px' }}>?</span>
                  )}
                </div>

                <div className="text-center">
                  <h2 className="font-game text-white uppercase" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
                    {selectedEntry.seen ? (selectedEntry.caught ? selectedPkmn.name : '??????') : '??????'}
                  </h2>
                  <p className="font-mono text-white/50 mt-1" style={{ fontSize: '10px' }}>
                    N.º {String(cursor + 1).padStart(3, '0')}
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap justify-center">
                  {selectedTypes.map(t => (
                    <TypeBadge key={t} type={t} />
                  ))}
                </div>

                {selectedEntry.seen && selectedEntry.caught && selectedPkmn && (
                  <div className="text-center space-y-1">
                    {(selectedPkmn.height != null || selectedPkmn.weight != null) && (
                      <p className="font-mono text-white/50" style={{ fontSize: '9px' }}>
                        {selectedPkmn.height != null && <span>Altura: {selectedPkmn.height} m</span>}
                        {selectedPkmn.height != null && selectedPkmn.weight != null && ' — '}
                        {selectedPkmn.weight != null && <span>Peso: {selectedPkmn.weight} kg</span>}
                      </p>
                    )}
                    {selectedPkmn.description && (
                      <p className="font-sans text-white/60 max-w-xs leading-relaxed" style={{ fontSize: '11px' }}>
                        {selectedPkmn.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-4 mt-2">
                  <div className="text-center px-4 py-2 rounded-sm"
                    style={{ background: selectedEntry.seen ? '#304868' : '#1a2a3a', border: '1px solid #3a5878' }}
                  >
                    <p className="font-game text-[#f8d830]" style={{ fontSize: '18px' }}>
                      {selectedEntry.seen ? '✓' : '-'}
                    </p>
                    <p className="font-game text-white/60 mt-1" style={{ fontSize: '6px' }}>VISTO</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-sm"
                    style={{ background: selectedEntry.caught ? '#1a4a20' : '#1a2a3a', border: '1px solid #3a5878' }}
                  >
                    <p className="font-game text-[#00c000]" style={{ fontSize: '18px' }}>
                      {selectedEntry.caught ? '✓' : '-'}
                    </p>
                    <p className="font-game text-white/60 mt-1" style={{ fontSize: '6px' }}>ATRAPADO</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center"
              >
                <span className="font-game text-white/30" style={{ fontSize: '8px' }}>
                  Selecciona un Pokémon
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div
        className="shrink-0 px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: '#0f1e30', borderTop: '3px solid #383838' }}
      >
        <div className="flex gap-4">
          <span className="font-game text-[#4878d8]" style={{ fontSize: '7px' }}>
            VISTOS: {seen}
          </span>
          <span className="font-game text-[#00c000]" style={{ fontSize: '7px' }}>
            ATRAPADOS: {caught}
          </span>
        </div>
        <p className="font-game text-white/40" style={{ fontSize: '6px' }}>¡Hazte con todos!</p>
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
      </div>
    </motion.div>
  );
});
