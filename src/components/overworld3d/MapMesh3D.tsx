import { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Tile } from '../../types';
import { TILE_VOXEL, FLOOR_FALLBACK_COLOR } from './tileToVoxel';
import { getTileTexture } from './tileTextures';

interface Bucket {
  color: string;
  height: number;
  yOffset: number;
  positions: Array<[number, number]>;
  textureKey?: string;
  emissive?: string;
  emissiveIntensity?: number;
}

function buildBuckets(tiles: Tile[][]) {
  const floors = new Map<string, Bucket>();
  const walls  = new Map<string, Bucket>();
  const objects = new Map<string, Bucket>();
  const objectsSignpost = new Map<string, Bucket>();
  const waters = new Map<string, Bucket>();
  const grassBlades = new Map<string, Bucket>();

  const addTo = (
    map: Map<string, Bucket>,
    color: string,
    height: number,
    yOffset: number,
    x: number,
    y: number,
    textureKey?: string,
    emissive?: string,
    emissiveIntensity?: number,
  ) => {
    const key = `${color}|${height}|${yOffset}|${textureKey ?? ''}|${emissive ?? ''}|${emissiveIntensity ?? ''}`;
    let b = map.get(key);
    if (!b) {
      b = { color, height, yOffset, positions: [], textureKey, emissive, emissiveIntensity };
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

      if (def.kind !== 'floor') {
        addTo(floors, FLOOR_FALLBACK_COLOR, 0, 0, x, y, 'grass');
      }

      const place = (d: typeof def) => {
        const yOff = d.yOffset ?? 0;
        const tk = d.textureKey;
        if (d.kind === 'floor') {
          addTo(floors, d.color, 0, 0, x, y, tk, d.emissive, d.emissiveIntensity);
        } else if (d.kind === 'wall') {
          addTo(walls, d.color, d.height, yOff, x, y, tk);
        } else if (d.kind === 'water') {
          addTo(waters, d.color, d.height, yOff, x, y, tk);
        } else if (tk === 'grass_blade') {
          addTo(grassBlades, d.color, d.height, yOff, x, y, tk);
        } else if (d.signpost) {
          addTo(objectsSignpost, d.color, d.height, yOff, x, y, tk);
        } else {
          addTo(objects, d.color, d.height, yOff, x, y, tk);
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
    objectsSignpost: [...objectsSignpost.values()],
    waters: [...waters.values()],
    grassBlades: [...grassBlades.values()],
  };
}

interface InstancedBoxesProps {
  bucket: Bucket;
}

function InstancedBoxes({ bucket }: InstancedBoxesProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const texture = bucket.textureKey ? getTileTexture(bucket.textureKey) : undefined;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, bucket.height, 1);
    for (let i = 0; i < bucket.positions.length; i++) {
      const [x, z] = bucket.positions[i];
      pos.set(x + 0.5, bucket.yOffset + bucket.height / 2, z + 0.5);
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
      castShadow
      receiveShadow
      frustumCulled={true}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={bucket.color}
        map={texture ?? undefined}
        roughness={0.85}
        metalness={0}
        emissive={bucket.emissive ?? undefined}
        emissiveIntensity={bucket.emissiveIntensity ?? undefined}
      />
    </instancedMesh>
  );
}

function InstancedFloors({ bucket }: InstancedBoxesProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const texture = bucket.textureKey ? getTileTexture(bucket.textureKey) : undefined;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    const scale = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < bucket.positions.length; i++) {
      const [x, z] = bucket.positions[i];
      pos.set(x + 0.5, 0, z + 0.5);
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
      receiveShadow
      frustumCulled={true}
    >
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={bucket.color}
        map={texture ?? undefined}
        roughness={0.85}
        metalness={0}
        emissive={bucket.emissive ?? undefined}
        emissiveIntensity={bucket.emissiveIntensity ?? undefined}
      />
    </instancedMesh>
  );
}

function AnimatedWater({ bucket }: { bucket: Bucket }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const texture = bucket.textureKey ? getTileTexture(bucket.textureKey) : undefined;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, bucket.height, 1);
    for (let i = 0; i < bucket.positions.length; i++) {
      const [x, z] = bucket.positions[i];
      pos.set(x + 0.5, bucket.yOffset + bucket.height / 2, z + 0.5);
      m.compose(pos, quat, scale);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [bucket]);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.elapsedTime;
    matRef.current.color.setHSL(0.6, 0.7, 0.45 + Math.sin(t * 1.5) * 0.05);
    if (matRef.current.map) {
      matRef.current.map.offset.x = (t * 0.05) % 1;
      matRef.current.map.offset.y = (t * 0.03) % 1;
    }
  });

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, bucket.positions.length]}
      receiveShadow
      frustumCulled={true}
    >
      <boxGeometry args={[1, 0.1, 1]} />
      <meshStandardMaterial
        ref={matRef}
        color="#3a78d8"
        map={texture ?? undefined}
        transparent
        opacity={0.85}
        roughness={0.1}
        metalness={0.3}
      />
    </instancedMesh>
  );
}

function GrassSway({ bucket }: { bucket: Bucket }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  // Initialise static matrices so the mesh renders correctly before the first useFrame tick.
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, bucket.height, 1);
    for (let i = 0; i < bucket.positions.length; i++) {
      const [x, z] = bucket.positions[i];
      pos.set(x + 0.5, bucket.yOffset + bucket.height / 2, z + 0.5);
      m.compose(pos, quat, scale);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [bucket]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    // Reusable objects — allocated once outside the loop.
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, bucket.height, 1);
    const windAxis = new THREE.Vector3(1, 0, 0);
    for (let i = 0; i < bucket.positions.length; i++) {
      const [x, z] = bucket.positions[i];
      const phase = (x * 1.3 + z * 0.7) % (Math.PI * 2);
      const angle = Math.sin(t * 1.8 + phase) * 0.06;
      quat.setFromAxisAngle(windAxis, angle);
      pos.set(x + 0.5, bucket.yOffset + bucket.height / 2, z + 0.5);
      m.compose(pos, quat, scale);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, bucket.positions.length]}
      castShadow
      receiveShadow
      frustumCulled={true}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={bucket.color} roughness={0.9} metalness={0} />
    </instancedMesh>
  );
}

function InstancedSignposts({ bucket }: InstancedBoxesProps) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(0.6, bucket.height, 0.06);
    for (let i = 0; i < bucket.positions.length; i++) {
      const [x, z] = bucket.positions[i];
      pos.set(x + 0.5, bucket.yOffset + bucket.height / 2, z + 0.5);
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
      castShadow
      frustumCulled={true}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={bucket.color} roughness={0.7} metalness={0.1} />
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
      {buckets.objectsSignpost.map((b, i) => (
        <InstancedSignposts key={`sp-${i}`} bucket={b} />
      ))}
      {buckets.waters.map((b, i) => (
        <AnimatedWater key={`wa-${i}`} bucket={b} />
      ))}
      {buckets.grassBlades.map((b, i) => (
        <GrassSway key={`gb-${i}`} bucket={b} />
      ))}
    </group>
  );
}
