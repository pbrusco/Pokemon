import { useMemo, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import type { NPC } from '../../types';
import { NPC_SPRITE_MAP } from '../../data/npcSpriteMap';
import { getSpriteFrame } from '../../lib/spriteFormat';
import { ShadowBlob } from './ShadowBlob';

interface SpriteFrameProps {
  url: string;
  numFrames: number;
  frameH: 16 | 32;
  npc: NPC;
  position: [number, number, number];
}

function SpriteFrame({ url, numFrames, frameH, npc, position }: SpriteFrameProps) {
  const [spriteError, setSpriteError] = useState(false);
  const baseTex = useLoader(
    THREE.TextureLoader,
    url,
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
    const frame = getSpriteFrame(npc.direction, numFrames);
    t.repeat.set(frame.repeatX, 1);
    t.offset.set(frame.offsetX, 0);
    return t;
  }, [baseTex, numFrames, npc.direction, spriteError]);

  // Display: always 0.45 units wide; height reflects the frame's pixel aspect ratio.
  // 16×32 portrait → scaleY = 0.9 (2× scaleX). 16×16 square → scaleY = 0.45.
  const scaleX = 0.45;
  const scaleY = scaleX * (frameH / 16);

  return (
    <sprite position={position} scale={[scaleX, scaleY, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} />
    </sprite>
  );
}

interface NpcBillboardProps {
  npc: NPC;
}

export function NpcBillboard({ npc }: NpcBillboardProps) {
  const entry = npc.trainerClass ? NPC_SPRITE_MAP[npc.trainerClass] : undefined;
  const position: [number, number, number] = [npc.position.x + 0.5, 0.5, npc.position.y + 0.5];
  const url = entry?.overworld || '';

  return (
    <group>
      <ShadowBlob x={npc.position.x + 0.5} z={npc.position.y + 0.5} />
      {url && (entry?.overworldFrames ?? 0) > 0 ? (
        <SpriteFrame url={url} numFrames={entry!.overworldFrames} frameH={entry!.frameH ?? 32} npc={npc} position={position} />
      ) : (
        <mesh position={position}>
          <boxGeometry args={[0.5, 0.9, 0.5]} />
          <meshStandardMaterial color="#f8d8b0" />
        </mesh>
      )}
    </group>
  );
}
