import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import type { NPC, Direction } from '../../types';
import { TRAINER_OVERWORLD_SPRITES } from '../../data/trainerSprites';

const DIR_ROW: Record<Direction, number> = {
  down: 0,
  up: 2,
  left: 4,
  right: 4,
};

interface SpriteFrameProps {
  url: string;
  direction: Direction;
  position: [number, number, number];
}

function SpriteFrame({ url, direction, position }: SpriteFrameProps) {
  const baseTex = useLoader(THREE.TextureLoader, url);

  const tex = useMemo(() => {
    const t = baseTex.clone();
    t.needsUpdate = true;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    const row = DIR_ROW[direction];
    // Three.js texture origin is bottom-left; CSS origin is top-left.
    // CSS row N (top-down) maps to texture offset.y = (5 - N) / 6 with repeat.y = 1/6.
    t.repeat.set(1, 1 / 6);
    t.offset.set(0, (5 - row) / 6);
    if (direction === 'right') {
      t.repeat.x = -1;
      t.offset.x = 1;
    }
    return t;
  }, [baseTex, direction]);

  return (
    <sprite position={position} scale={[0.9, 0.9, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} />
    </sprite>
  );
}

interface FallbackBoxProps {
  position: [number, number, number];
}

function FallbackBox({ position }: FallbackBoxProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.5, 0.9, 0.5]} />
      <meshStandardMaterial color="#f8d8b0" />
    </mesh>
  );
}

interface NpcBillboardProps {
  npc: NPC;
}

export function NpcBillboard({ npc }: NpcBillboardProps) {
  const url = npc.trainerClass ? TRAINER_OVERWORLD_SPRITES[npc.trainerClass] : undefined;
  const position: [number, number, number] = [npc.position.x + 0.5, 0.5, npc.position.y + 0.5];
  if (!url) return <FallbackBox position={position} />;
  return <SpriteFrame url={url} direction={npc.direction} position={position} />;
}
