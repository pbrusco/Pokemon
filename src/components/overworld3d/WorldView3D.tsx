import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import type { MapID, MapData, NPC, Entity } from '../../types';
import { Scene3D } from './Scene3D';

interface WorldView3DProps {
  currentMap: MapID;
  maps: Record<MapID, MapData>;
  npcs: Record<MapID, Entity[]>;
  items: Record<MapID, Entity[]>;
}

export default function WorldView3D({ currentMap, maps, npcs, items }: WorldView3DProps) {
  const mapData = maps[currentMap];
  const mapNpcs = (npcs[currentMap] ?? []) as NPC[];
  const mapItems = items[currentMap] ?? [];

  return (
    <div className="absolute inset-0 bg-slate-900">
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.05, far: 200 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene3D mapData={mapData} npcs={mapNpcs} items={mapItems} />
        </Suspense>
      </Canvas>
    </div>
  );
}
