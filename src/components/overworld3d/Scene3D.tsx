import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { MapData, NPC, Entity, Tile } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { CameraRig } from './CameraRig';
import { MapMesh3D } from './MapMesh3D';
import { NpcBillboard } from './NpcBillboard';
import { ItemBillboard } from './ItemBillboard';
import { WildPokemonBillboard } from './WildPokemonBillboard';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

const skyGradientVertexShader = /* glsl */ `
  varying float vY;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vY = -normalize(mvPosition.xyz).y;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const skyGradientFragmentShader = /* glsl */ `
  varying float vY;
  uniform vec3 horizonColor;
  uniform vec3 zenithColor;
  void main() {
    float t = clamp(vY, 0.0, 1.0);
    gl_FragColor = vec4(mix(horizonColor, zenithColor, t), 1.0);
  }
`;

interface Scene3DProps {
  mapData: MapData;
  npcs: NPC[];
  items: Entity[];
}

export function Scene3D({ mapData, npcs, items }: Scene3DProps) {
  const tiles = mapData.tiles as Tile[][];
  const wildPokemon = useGameStore(s => s.wildPokemon);
  const currentMap = useGameStore(s => s.currentMap);

  const isInterior = useMemo(
    () => tiles.flat().some((t) => t.type === 'floor' || t.type === 'carpet'),
    [tiles],
  );

  const skyColor = isInterior ? '#1a1a2e' : '#87ceeb';
  const fogStart = isInterior ? 8 : 20;
  const fogEnd = isInterior ? 25 : 65;

  const mapCenterX = tiles[0]?.length ? tiles[0].length / 2 : 0;
  const mapCenterZ = tiles.length / 2;
  const mapW = tiles[0]?.length ?? 0;
  const mapH = tiles.length;

  const isCave = useMemo(
    () => currentMap.startsWith('ROCK_TUNNEL') || currentMap.startsWith('MT_MOON') || currentMap.startsWith('DIGLETT'),
    [currentMap],
  );
  const caveFog = isCave && !isInterior;

  const activeFogStart = caveFog ? 3 : fogStart;
  const activeFogEnd = caveFog ? 18 : fogEnd;
  const fogColor = caveFog ? '#383848' : skyColor;

  const skyUnis = useRef({
    horizonColor: { value: new THREE.Color('#e8f4ff') },
    zenithColor: { value: new THREE.Color('#5ba8e8') },
  });

  // Spin sky sphere slowly so it follows the player but rotates gently
  const skyRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (skyRef.current) {
      skyRef.current.position.x = mapCenterX;
      skyRef.current.position.z = mapCenterZ;
      skyRef.current.rotation.y = clock.elapsedTime * 0.005;
    }
  });

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[fogColor, activeFogStart, activeFogEnd]} />

      {!isInterior && (
        <mesh ref={skyRef} position={[mapCenterX, 0, mapCenterZ]} scale={[100, 100, 100]}>
          <sphereGeometry args={[1, 24, 12]} />
          <shaderMaterial
            vertexShader={skyGradientVertexShader}
            fragmentShader={skyGradientFragmentShader}
            uniforms={skyUnis.current}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {isInterior ? (
        <>
          <ambientLight intensity={0.4} color="#ffe8c0" />
          <pointLight position={[mapCenterX, 2.2, mapCenterZ]} intensity={1.2} color="#ffd890" distance={20} decay={2} />
          <mesh position={[mapCenterX, 2.5, mapCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[mapW, mapH]} />
            <meshStandardMaterial color="#b8a070" side={THREE.BackSide} />
          </mesh>
        </>
      ) : (
        <>
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[8, 16, 8]}
            intensity={1.0}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.5}
            shadow-camera-far={120}
            shadow-camera-left={-40}
            shadow-camera-right={40}
            shadow-camera-top={40}
            shadow-camera-bottom={-40}
          />
          <hemisphereLight color="#87ceeb" groundColor="#5fa85a" intensity={0.3} />
        </>
      )}

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

      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.2}
        />
        <Vignette offset={0.3} darkness={0.6} />
      </EffectComposer>
    </>
  );
}
