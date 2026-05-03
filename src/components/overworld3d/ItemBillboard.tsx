import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { Entity } from '../../types';
import { ShadowBlob } from './ShadowBlob';

const ITEM_COLORS: Record<string, string> = {
  POKEBALL: '#e84a4a',
  GREAT_BALL: '#4a8ae8',
  ULTRA_BALL: '#e8c84a',
  POTION: '#4a8ae8',
  SUPER_POTION: '#4a8ae8',
  HYPER_POTION: '#4a8ae8',
  MAX_POTION: '#4a8ae8',
  FULL_RESTORE: '#e8c84a',
  ANTIDOTE: '#e8c84a',
  AWAKENING: '#4a8ae8',
  BURN_HEAL: '#e8844a',
  ICE_HEAL: '#4ac8e8',
  PARALYZE_HEAL: '#e8c84a',
  FULL_HEAL: '#4ac84a',
  REVIVE: '#e8c84a',
  MAX_REVIVE: '#e8c84a',
  RARE_CANDY: '#e8a4e8',
};

interface ItemBillboardProps {
  item: Entity;
}

function SignPost({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x + 0.5, 0, z + 0.5]}>
      {/* Vertical post */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.07, 0.7, 0.07]} />
        <meshStandardMaterial color="#8b5e3c" />
      </mesh>
      {/* Sign board (face +Z and -Z so visible from both sides) */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.45, 0.28, 0.05]} />
        <meshStandardMaterial color="#f0e8c8" />
      </mesh>
    </group>
  );
}

export function ItemBillboard({ item }: ItemBillboardProps) {
  const ref = useRef<THREE.Mesh>(null);
  const baseY = 0.35;
  const color = ITEM_COLORS[item.itemId ?? ''] ?? '#e84a4a';

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 2 + item.position.x + item.position.y) * 0.05;
  });

  // Signs and blocking objects use a signpost shape, not a floating sphere
  if (item.type === 'object') {
    return <SignPost x={item.position.x} z={item.position.y} />;
  }

  return (
    <group>
      <ShadowBlob x={item.position.x + 0.5} z={item.position.y + 0.5} />
      <mesh ref={ref} position={[item.position.x + 0.5, baseY, item.position.y + 0.5]}>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
