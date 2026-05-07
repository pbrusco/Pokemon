import { useMemo, useState, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { PLAYER_OVERWORLD_SPRITE } from '../../data/npcSpriteMap';
import type { Direction } from '../../types';
import { ShadowBlob } from './ShadowBlob';

const FRAME_H = 32;
const WALK_SPEED = 8; // frames per second

// In Three.js, offset.y = 0 is the bottom of the image.
// The spritesheet rows top-to-bottom: down (top), up (middle), left/right (bottom).
const ROW_Y: Record<Direction, number> = {
  down: 2 / 3,
  up: 1 / 3,
  left: 0,
  right: 0,
};

export function PlayerBillboard() {
  const playerPos = useGameStore(s => s.playerPos);
  const direction = useGameStore(s => s.direction);
  const isSurfing = useGameStore(s => s.isSurfing);
  const playerTeam = useGameStore(s => s.playerTeam);
  const isMoving = useGameStore(s => s.isMoving);

  const [spriteError, setSpriteError] = useState(false);
  const materialRef = useRef<THREE.SpriteMaterial>(null);

  const surfPkmn = isSurfing
    ? playerTeam.find(p => p.moves.some(m => m.name === 'SURF'))
    : null;
  const spriteUrl = surfPkmn?.sprite ?? PLAYER_OVERWORLD_SPRITE;

  const baseTex = useLoader(
    THREE.TextureLoader,
    spriteUrl,
    undefined,
    () => setSpriteError(true),
  );

  const tex = useMemo(() => {
    if (spriteError) return baseTex.clone();
    const t = baseTex.clone();
    t.needsUpdate = true;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }, [baseTex, spriteError]);

  useFrame(({ clock }) => {
    if (!materialRef.current || !materialRef.current.map) return;
    const t = materialRef.current.map;

    if (surfPkmn) {
      t.repeat.set(1, 1);
      t.offset.set(0, 0);
    } else {
      // 4 columns, 3 rows
      const isFlipped = direction === 'right';
      t.repeat.set(isFlipped ? -0.25 : 0.25, 1 / 3);
      
      let col = 0;
      if (isMoving) {
        // Ping-pong animation: 0, 1, 2, 3, 2, 1
        // For simplicity, just cycle 0, 1, 2, 3
        col = Math.floor(clock.elapsedTime * WALK_SPEED) % 4;
      }

      t.offset.y = ROW_Y[direction];
      t.offset.x = (col * 0.25) + (isFlipped ? 0.25 : 0);
    }
  });

  const scaleX = surfPkmn ? 0.8 : 0.45;
  const scaleY = surfPkmn ? 0.8 : scaleX * (FRAME_H / 16);
  const position: [number, number, number] = [playerPos.x + 0.5, 0.5, playerPos.y + 0.5];

  return (
    <group>
      <ShadowBlob x={playerPos.x + 0.5} z={playerPos.y + 0.5} />
      <sprite position={position} scale={[scaleX, scaleY, 1]}>
        <spriteMaterial ref={materialRef} map={tex} transparent depthWrite={true} alphaTest={0.5} />
      </sprite>
    </group>
  );
}
