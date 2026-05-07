import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { SfxController } from '../lib/sfx';

export function useSoundEngine() {
  const sfxMuted = useGameStore(s => s.sfxMuted);
  const sfxVolume = useGameStore(s => s.sfxVolume);

  const wasMutedRef = useRef(sfxMuted);

  useEffect(() => {
    if (sfxMuted !== wasMutedRef.current) {
      SfxController.setMuted(sfxMuted);
      wasMutedRef.current = sfxMuted;
    }
    SfxController.setVolume(sfxVolume);
  }, [sfxMuted, sfxVolume]);
}
