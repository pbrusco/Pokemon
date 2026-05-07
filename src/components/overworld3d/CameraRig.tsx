import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import type { Direction } from '../../types';

const CAMERA_DISTANCE = 5;
const CAMERA_HEIGHT = 4.5;
const POS_TAU = 0.08;
const YAW_TAU = 0.06;

// Three.js camera default look direction is -Z
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

  const targetFocus = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  // The point the camera looks at (the player)
  targetFocus.current.set(playerPos.x + 0.5, 0.5, playerPos.y + 0.5);
  const targetYaw = DIR_TO_YAW[direction];

  useFrame((_, dt) => {
    camera.rotation.order = 'YXZ';

    // Calculate ideal camera position (behind and above player)
    const idealPos = new THREE.Vector3(
      targetFocus.current.x + Math.sin(targetYaw) * CAMERA_DISTANCE,
      targetFocus.current.y + CAMERA_HEIGHT,
      targetFocus.current.z + Math.cos(targetYaw) * CAMERA_DISTANCE
    );

    if (!initialized.current) {
      camera.position.copy(idealPos);
      camera.rotation.set(-Math.PI / 6, targetYaw, 0); // look slightly down
      initialized.current = true;
      return;
    }

    // Smooth position
    const posAlpha = 1 - Math.exp(-dt / POS_TAU);
    camera.position.lerp(idealPos, posAlpha);

    // Smooth yaw
    const curYaw = camera.rotation.y;
    let delta = ((targetYaw - curYaw + Math.PI) % (2 * Math.PI)) - Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    const yawAlpha = 1 - Math.exp(-dt / YAW_TAU);
    camera.rotation.y = curYaw + delta * yawAlpha;

    // Fixed pitch (looking down) and no roll
    camera.rotation.x = -Math.PI / 6; 
    camera.rotation.z = 0;
  });

  return null;
}

