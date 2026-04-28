import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { Entity } from '../../types';

interface ItemBillboardProps {
  item: Entity;
}

export function ItemBillboard({ item }: ItemBillboardProps) {
  const ref = useRef<THREE.Mesh>(null);
  const baseY = 0.35;

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 2 + item.position.x + item.position.y) * 0.05;
  });

  return (
    <mesh ref={ref} position={[item.position.x + 0.5, baseY, item.position.y + 0.5]}>
      <sphereGeometry args={[0.18, 12, 8]} />
      <meshStandardMaterial color="#e84a4a" />
    </mesh>
  );
}
