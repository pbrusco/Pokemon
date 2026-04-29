import { useMemo } from 'react';
import type { MapData, NPC, Entity, Tile } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { CameraRig } from './CameraRig';
import { MapMesh3D } from './MapMesh3D';
import { NpcBillboard } from './NpcBillboard';
import { ItemBillboard } from './ItemBillboard';
import { WildPokemonBillboard } from './WildPokemonBillboard';

interface Scene3DProps {
  mapData: MapData;
  npcs: NPC[];
  items: Entity[];
}

export function Scene3D({ mapData, npcs, items }: Scene3DProps) {
  const tiles = mapData.tiles as Tile[][];
  const wildPokemon = useGameStore(s => s.wildPokemon);

  const isInterior = useMemo(
    () => tiles.flat().some((t) => t.type === 'floor' || t.type === 'carpet'),
    [tiles],
  );

  const skyColor = isInterior ? '#1a1a2e' : '#87ceeb';
  const fogStart = isInterior ? 6 : 15;
  const fogEnd = isInterior ? 30 : 60;

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, fogStart, fogEnd]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />

      <CameraRig />

      <MapMesh3D tiles={tiles} />

      {npcs.map((npc) => (
        <NpcBillboard key={npc.id} npc={npc} />
      ))}

      {items.map((item) => (
        <ItemBillboard key={item.id} item={item} />
      ))}

      {wildPokemon.map((wild) => (
        <WildPokemonBillboard key={wild.id} wild={wild} />
      ))}
    </>
  );
}
