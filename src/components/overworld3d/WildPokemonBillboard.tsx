import { useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WildPokemonEntity } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { ShadowBlob } from './ShadowBlob';

interface WildPokemonBillboardProps {
  wild: WildPokemonEntity;
}

function PokemonSprite({ url, position, proximity }: { url: string; position: [number, number, number]; proximity: boolean }) {
  const tex = useLoader(THREE.TextureLoader, url);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;

  const ref = useRef<THREE.Sprite>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const pulse = proximity ? 1 + Math.sin(clock.elapsedTime * 6) * 0.08 : 1;
      ref.current.scale.set(0.8 * pulse, 0.8 * pulse, 1);
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2) * 0.04;
    }
  });

  return (
    <sprite ref={ref} position={position} scale={[0.8, 0.8, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} />
    </sprite>
  );
}

export function WildPokemonBillboard({ wild }: WildPokemonBillboardProps) {
  const playerPos = useGameStore(s => s.playerPos);
  const { x, y } = wild.position;
  const position: [number, number, number] = [x + 0.5, 0.5, y + 0.5];
  const sprite = wild.pokemon.sprite;
  if (!sprite) return null;

  const dist = Math.hypot(x - playerPos.x, y - playerPos.y);
  const proximity = dist < 2;

  return (
    <group>
      <ShadowBlob x={x + 0.5} z={y + 0.5} />
      <PokemonSprite url={sprite} position={position} proximity={proximity} />
    </group>
  );
}
