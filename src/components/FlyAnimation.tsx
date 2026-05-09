import { memo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameStore } from '../store/gameStore';
import { EXPLORING } from '../types';
import { FLY_DESTINATIONS } from '../lib/flyDestinations';

interface FlyAnimationProps {
  pokemonName: string;
  pokemonSprite: string;
  town: string;
}

const TOWN_NAMES: Record<string, string> = {
  PALLET_TOWN: 'PUEBLO PALETA',
  VIRIDIAN_CITY: 'CIUDAD VIRIDIAN',
  PEWTER_CITY: 'CIUDAD PLATEADA',
  CERULEAN_CITY: 'CIUDAD CELESTE',
  LAVENDER_TOWN: 'PUEBLO LAVANDA',
  VERMILION_CITY: 'CIUDAD CARMÍN',
  CELADON_CITY: 'CIUDAD AZULONA',
  FUCHSIA_CITY: 'CIUDAD FUCSIA',
  SAFFRON_CITY: 'CIUDAD AZAFRÁN',
  CINNABAR_ISLAND: 'ISLA CANELA',
  INDIGO_PLATEAU: 'MESETA AÑIL',
  ROUTE_4: 'RUTA 4',
  ROUTE_10: 'RUTA 10',
};

function arrive(town: string) {
  const s = useGameStore.getState();
  const dest = FLY_DESTINATIONS[town];
  if (!dest) {
    console.warn(`[Fly] Unknown destination: ${town}`);
    s.setPhase(EXPLORING);
    return;
  }
  s.setCurrentMap(dest.map);
  s.setPlayerPos(dest.pos);
  s.setDirection(dest.dir);
  s.setPhase(EXPLORING);
  s.setDialogue('¡Has volado a tu destino!');
}

export const FlyAnimation = memo(({ pokemonName, pokemonSprite, town }: FlyAnimationProps) => {
  useEffect(() => {
    const t = setTimeout(() => arrive(town), 2500);
    return () => clearTimeout(t);
  }, [town]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: '#0f1e30' }}
    >
      <motion.div
        initial={{ y: 100, scale: 1.5, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <motion.img
          src={pokemonSprite}
          alt={pokemonName}
          className="w-24 h-24 object-contain pixelated drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="font-game text-white/80 uppercase text-center"
          style={{ fontSize: '7px', letterSpacing: '0.1em' }}
        >
          ¡{pokemonName} usó VUELO!
        </motion.p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
        className="font-game text-white/50 uppercase mt-12"
        style={{ fontSize: '6px', letterSpacing: '0.08em' }}
      >
        Volando a {TOWN_NAMES[town] ?? town.replace(/_/g, ' ')}...
      </motion.p>

      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 2.5, times: [0, 0.8, 1] }}
      />
    </motion.div>
  );
});
