import { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { Tile } from '../../types';
import { TILE_VOXEL, FLOOR_FALLBACK_COLOR } from './tileToVoxel';

interface Bucket {
  color: string;
  height: number;
  yOffset: number;
  positions: Array<[number, number]>;
}

function buildBuckets(tiles: Tile[][]) {
  const floors = new Map<string, Bucket>();
  const walls  = new Map<string, Bucket>();
  const objects = new Map<string, Bucket>();
  const waters = new Map<string, Bucket>();

  const addTo = (
    map: Map<string, Bucket>,
    color: string,
    height: number,
    yOffset: number,
    x: number,
    y: number,
  ) => {
    const key = `${color}|${height}|${yOffset}`;
    let b = map.get(key);
    if (!b) {
      b = { color, height, yOffset, positions: [] };
      map.set(key, b);
    }
    b.positions.push([x, y]);
  };

  for (let y = 0; y < tiles.length; y++) {
    const row = tiles[y];
    for (let x = 0; x < row.length; x++) {
      const t = row[x];
      const def = TILE_VOXEL[t.type as Tile['type']];
      if (!def) continue;

      // Always lay a floor under non-floor tiles so the ground is filled.
      if (def.kind !== 'floor') {
        addTo(floors, FLOOR_FALLBACK_COLOR, 0, 0, x, y);
      }

      const place = (d: typeof def) => {
        const yOff = d.yOffset ?? 0;
        if (d.kind === 'floor') {
          addTo(floors, d.color, 0, 0, x, y);
        } else if (d.kind === 'wall') {
          addTo(walls, d.color, d.height, yOff, x, y);
        } else if (d.kind === 'water') {
          addTo(waters, d.color, d.height, yOff, x, y);
        } else {
          addTo(objects, d.color, d.height, yOff, x, y);
        }
      };
      place(def);
      if (def.extras) for (const e of def.extras) place(e);
    }
  }

  return {
    floors: [...floors.values()],
    walls:  [...walls.values()],
    objects: [...objects.values()],
    waters: [...waters.values()],
  };
}

interface InstancedBoxesProps {
  bucket: Bucket;
}

function InstancedBoxes({ bucket }: InstancedBoxesProps) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, bucket.height, 1);
    for (let i = 0; i < bucket.positions.length; i++) {
      const [x, y] = bucket.positions[i];
      pos.set(x + 0.5, bucket.yOffset + bucket.height / 2, y + 0.5);
      m.compose(pos, quat, scale);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [bucket]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, bucket.positions.length]}
      castShadow={false}
      receiveShadow={false}
      frustumCulled={true}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={bucket.color} />
    </instancedMesh>
  );
}

function InstancedFloors({ bucket }: InstancedBoxesProps) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    const scale = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < bucket.positions.length; i++) {
      const [x, y] = bucket.positions[i];
      pos.set(x + 0.5, 0, y + 0.5);
      m.compose(pos, quat, scale);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [bucket]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, bucket.positions.length]}
      frustumCulled={true}
    >
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial color={bucket.color} />
    </instancedMesh>
  );
}

interface MapMesh3DProps {
  tiles: Tile[][];
}

export function MapMesh3D({ tiles }: MapMesh3DProps) {
  const buckets = useMemo(() => buildBuckets(tiles), [tiles]);

  return (
    <group>
      {buckets.floors.map((b, i) => (
        <InstancedFloors key={`f-${i}`} bucket={b} />
      ))}
      {buckets.walls.map((b, i) => (
        <InstancedBoxes key={`w-${i}`} bucket={b} />
      ))}
      {buckets.objects.map((b, i) => (
        <InstancedBoxes key={`o-${i}`} bucket={b} />
      ))}
      {buckets.waters.map((b, i) => (
        <InstancedBoxes key={`wa-${i}`} bucket={b} />
      ))}
    </group>
  );
}
