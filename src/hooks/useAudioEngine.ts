import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { AudioController } from '../lib/music';
import { SfxController } from '../lib/sfx';
import { getOverworldMusic, getBattleMusic, JINGLES } from '../lib/music';
import type { MusicTrack } from '../lib/music';

export function useAudioEngine() {
  const phase = useGameStore((s) => s.phase);
  const currentMap = useGameStore((s) => s.currentMap);
  const playerPos = useGameStore((s) => s.playerPos);
  const isTrainerBattle = useGameStore((s) => s.isTrainerBattle);
  const musicMuted = useGameStore((s) => s.musicMuted);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const sfxMuted = useGameStore((s) => s.sfxMuted);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const isSurfing = useGameStore((s) => s.isSurfing);

  const lastTrackRef = useRef<MusicTrack | null>(null);
  const wasMusicMutedRef = useRef(musicMuted);
  const wasSfxMutedRef = useRef(sfxMuted);

  // Sync music mute/volume
  useEffect(() => {
    if (musicMuted !== wasMusicMutedRef.current) {
      AudioController.setMuted(musicMuted);
      wasMusicMutedRef.current = musicMuted;
    }
    AudioController.setVolume(musicVolume);
  }, [musicMuted, musicVolume]);

  // Sync SFX mute/volume
  useEffect(() => {
    if (sfxMuted !== wasSfxMutedRef.current) {
      SfxController.setMuted(sfxMuted);
      wasSfxMutedRef.current = sfxMuted;
    }
    SfxController.setVolume(sfxVolume);
  }, [sfxMuted, sfxVolume]);

  // React to phase / map / position changes
  useEffect(() => {
    if (musicMuted) return;

    let track: MusicTrack;
    const ph = phase;

    if (ph.type === 'BATTLE' || ph.type === 'BATTLE_TRANSITION') {
      track = getBattleMusic(ph, isTrainerBattle);
    } else if (ph.type === 'HEALING') {
      track = 'healed';
    } else if (ph.type === 'BLACKOUT') {
      AudioController.stop();
      return;
    } else {
      track = isSurfing ? 'surf' : getOverworldMusic(currentMap, playerPos);
    }

    if (track !== lastTrackRef.current) {
      lastTrackRef.current = track;
      if (JINGLES.has(track)) {
        const fallback = getOverworldMusic(currentMap, playerPos);
        AudioController.playJingle(track, fallback);
      } else {
        AudioController.play(track, { loop: true });
      }
    }
  }, [phase, currentMap, playerPos.x, playerPos.y, isTrainerBattle, musicMuted, isSurfing]);
}
