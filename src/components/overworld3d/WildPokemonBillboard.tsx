import { useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WildPokemonEntity } from '../../types';

interface WildPokemonBillboardProps {
  wild: WildPokemonEntity;
}

function PokemonSprite({ url, position }: { url: string; position: [number, number, number] }) {
  const tex = useLoader(THREE.TextureLoader, url);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;

  const ref = useRef<THREE.Sprite>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
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
  const { x, y } = wild.position;
  const position: [number, number, number] = [x + 0.5, 0.5, y + 0.5];
  const sprite = wild.pokemon.sprite;
  if (!sprite) return null;
  return <PokemonSprite url={sprite} position={position} />;
}
