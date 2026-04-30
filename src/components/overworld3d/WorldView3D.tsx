import { Suspense, useState, useEffect } from 'react';
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
  const [ready, setReady] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  // Force canvas remount + loading state on map change
  useEffect(() => {
    setReady(false);
    setCanvasKey(k => k + 1);
  }, [currentMap]);

  return (
    <div className="absolute inset-0 bg-slate-900">
      {!ready && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-game text-sm tracking-wider uppercase">Cargando vista 3D...</p>
          </div>
        </div>
      )}

      <Canvas
        key={canvasKey}
        shadows
        camera={{ fov: 75, near: 0.05, far: 200 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        onCreated={() => setReady(true)}
      >
        <Suspense fallback={null}>
          <Scene3D mapData={mapData} npcs={mapNpcs} items={mapItems} />
        </Suspense>
      </Canvas>
    </div>
  );
}
