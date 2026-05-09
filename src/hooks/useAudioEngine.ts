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

  // React to phase / map / position changes. Depend on playerPos.x/y rather
  // than the playerPos object so the effect doesn't re-run on every step's
  // new object identity when the coords haven't changed.
  const { x: playerX, y: playerY } = playerPos;
  useEffect(() => {
    if (musicMuted) return;

    let track: MusicTrack;
    const ph = phase;
    const pos = { x: playerX, y: playerY };

    if (ph.type === 'BATTLE' || ph.type === 'BATTLE_TRANSITION') {
      track = getBattleMusic(ph, isTrainerBattle);
    } else if (ph.type === 'HEALING') {
      track = 'healed';
    } else if (ph.type === 'BLACKOUT') {
      AudioController.stop();
      return;
    } else {
      track = isSurfing ? 'surf' : getOverworldMusic(currentMap, pos);
    }

    if (track !== lastTrackRef.current) {
      lastTrackRef.current = track;
      if (JINGLES.has(track)) {
        const fallback = getOverworldMusic(currentMap, pos);
        AudioController.playJingle(track, fallback);
      } else {
        AudioController.play(track, { loop: true });
      }
    }
  }, [phase, currentMap, playerX, playerY, isTrainerBattle, musicMuted, isSurfing]);
}
