interface ShadowBlobProps {
  x: number;
  z: number;
}

export function ShadowBlob({ x, z }: ShadowBlobProps) {
  return (
    <mesh position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.25, 12]} />
      <meshBasicMaterial color="black" transparent opacity={0.3} depthWrite={false} />
    </mesh>
  );
}
