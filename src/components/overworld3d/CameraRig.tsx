import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import type { Direction } from '../../types';

const EYE_HEIGHT = 0.6;
const POS_TAU = 0.06;
const YAW_TAU = 0.04;

// Three.js camera default look direction is -Z, so:
//   rotation.y = 0     → camera looks -Z (north / tile -y)
//   rotation.y = π     → camera looks +Z (south / tile +y)
//   rotation.y = +π/2  → camera looks -X (west  / tile -x)
//   rotation.y = -π/2  → camera looks +X (east  / tile +x)
const DIR_TO_YAW: Record<Direction, number> = {
  up: 0,
  down: Math.PI,
  left: Math.PI / 2,
  right: -Math.PI / 2,
};

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const playerPos = useGameStore((s) => s.playerPos);
  const direction = useGameStore((s) => s.direction);

  const target = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  target.current.set(playerPos.x + 0.5, EYE_HEIGHT, playerPos.y + 0.5);
  const targetYaw = DIR_TO_YAW[direction];

  useFrame((_, dt) => {
    camera.rotation.order = 'YXZ';

    if (!initialized.current) {
      camera.position.copy(target.current);
      camera.rotation.set(0, targetYaw, 0);
      initialized.current = true;
      return;
    }

    const posAlpha = 1 - Math.exp(-dt / POS_TAU);
    camera.position.lerp(target.current, posAlpha);

    const cur = camera.rotation.y;
    let delta = ((targetYaw - cur + Math.PI) % (2 * Math.PI)) - Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    const yawAlpha = 1 - Math.exp(-dt / YAW_TAU);
    camera.rotation.y = cur + delta * yawAlpha;
    camera.rotation.x = 0;
    camera.rotation.z = 0;
  });

  return null;
}
