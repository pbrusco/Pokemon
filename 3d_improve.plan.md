# 3D First-Person View — Improvement Plan

**Goal:** Transform the current flat-voxel 3D view into something that feels atmospheric and
distinctive — closer to a stylized low-poly world than a Minecraft prototype. Preserve the
pixelated Gen I identity while making the first-person perspective genuinely pleasing.

**Architecture reminder:** All rendering lives in `src/components/overworld3d/`. The pipeline is:
`WorldView3D` → `Scene3D` → `MapMesh3D` + billboard components. Tile visual definitions are in
`tileToVoxel.ts`. The camera is in `CameraRig.tsx`. No post-processing package exists yet.

---

## Current Baseline (what we have)

| Feature | State |
|---|---|
| Tile rendering | Instanced solid-color boxes/planes |
| Lighting | 1 ambient + 1 directional, no shadows |
| Sky | Solid hex color (`#87ceeb` / `#1a1a2e`) |
| Fog | Linear fog, 2 presets (interior/exterior) |
| Water | Static flat blue plane, no animation |
| Grass | Flat floor + 0.28-unit dark-green block, no sway |
| Trees | Two stacked boxes (trunk + canopy) |
| NPCs | Sprite billboards from pokered sprite sheets |
| Wild Pokémon | PokeAPI sprite billboards, gentle bob |
| Items | Bobbing red sphere |
| Head bob | None — movement feels like floating |
| Shadows | Disabled (`castShadow={false}`) |
| Post-processing | None |
| Interior ceiling | None — indoor maps feel open-top |

---

## Phase 1 — Lighting & Shadows (high impact, zero new deps)

**Files:** `Scene3D.tsx`, `MapMesh3D.tsx`

### 1A. Enable shadows

Three.js shadows require: (a) `shadows` on the Canvas, (b) `castShadow` on the light,
(c) `castShadow`/`receiveShadow` on meshes. Currently all stubbed out as `false`.

```tsx
// WorldView3D.tsx — add shadows prop to Canvas
<Canvas shadows ...>

// Scene3D.tsx — upgrade the directional light
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

// MapMesh3D.tsx — enable on instanced meshes
<instancedMesh castShadow receiveShadow ...>
```

Trees casting shadows on grass, buildings casting shadows on paths — immediate depth gain.

**Performance note:** `shadow-mapSize={[1024, 1024]}` is cheap on modern hardware. If it
causes frame drops on low-end devices, gate it with a `lowQuality` store flag.

### 1B. Interior point lights

Detect `isInterior` (already done in `Scene3D`). When true, replace the harsh ambient+directional
combo with warmer, softer interior lighting:

```tsx
// Scene3D.tsx — interior branch
{isInterior ? (
  <>
    <ambientLight intensity={0.4} color="#ffe8c0" />
    <pointLight position={[mapCenterX, 2.2, mapCenterZ]} intensity={1.2} color="#ffd890" distance={20} decay={2} />
  </>
) : (
  <>
    <ambientLight intensity={0.6} />
    <directionalLight ... />
    <hemisphereLight skyColor="#87ceeb" groundColor="#5fa85a" intensity={0.3} />
  </>
)}
```

The hemisphere light is a free outdoor improvement — sky blue from above, grass green reflected
from below.

### 1C. Ceiling for indoor maps

Indoor maps currently feel open-top. Add a flat ceiling plane at y = 2.5 for interior scenes:

```tsx
// Scene3D.tsx
{isInterior && (
  <mesh position={[mapCenterX, 2.5, mapCenterZ]} rotation={[Math.PI / 2, 0, 0]}>
    <planeGeometry args={[mapW, mapH]} />
    <meshStandardMaterial color="#b8a070" side={THREE.BackSide} />
  </mesh>
)}
```

`THREE.BackSide` renders the underside so it's visible from below.

---

## Phase 2 — Procedural Tile Textures (high impact, no new deps)

**Files:** `tileToVoxel.ts`, `MapMesh3D.tsx` (new: `tileTextures.ts`)

Currently all tiles use `meshStandardMaterial color={...}`. Replacing with canvas-generated
textures adds visual richness without network requests.

### 2A. Canvas texture generator

Create `src/components/overworld3d/tileTextures.ts` that generates a `THREE.CanvasTexture`
per tile type, cached in a `Map<string, THREE.CanvasTexture>`:

```typescript
function makeGrassTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  // Base fill
  ctx.fillStyle = '#5fa85a';
  ctx.fillRect(0, 0, 64, 64);
  // Noise patches
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 64, y = Math.random() * 64;
    const shade = Math.random() > 0.5 ? '#4a9a40' : '#6fc860';
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, 2 + Math.random() * 3, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}
```

Patterns per tile type:

| Tile | Technique |
|---|---|
| `grass` | Random short horizontal dashes (2–4 px) in 3 green shades |
| `path` | Irregular cobblestone grid (ellipse stamps with darker grout) |
| `floor` | Plank lines (horizontal stripes, alternating light/dark wood) |
| `carpet` | Diagonal cross-hatch in 2 red shades |
| `wall` | Brick rows (rectangles with mortar gaps) |
| `water` | Wavy horizontal sine lines baked in (static base, animated separately) |
| `tree (trunk)` | Vertical bark streaks |
| `tree (canopy)` | Stippled leaf pattern in 3 greens |

### 2B. Wire textures into MapMesh3D

Change `InstancedBoxes` and `InstancedFloors` to accept an optional texture:

```tsx
// Each bucket gets a `textureKey` field
// MapMesh3D looks up the canvas texture and passes it to the material
<meshStandardMaterial map={texture} roughness={0.85} metalness={0} />
```

Roughness 0.85 gives matte surfaces (no plastic sheen). Add a slight roughness variation
per bucket (grass: 0.9, path: 0.8, wall: 0.7) to differentiate materials perceptually.

---

## Phase 3 — Camera Feel (high impact, no new deps)

**File:** `CameraRig.tsx`

### 3A. Head bobbing

When the player is moving, add a sine-wave vertical oscillation to the camera. Sync the
phase to step count (every 0.5 tile = 1 half-cycle) so the bob matches footsteps:

```typescript
// CameraRig.tsx
const isMoving = useGameStore(s => s.isMoving);
const bobRef = useRef(0);

useFrame((_, dt) => {
  if (isMoving) bobRef.current += dt * 8; // ~4 steps/sec
  const bobY = isMoving ? Math.sin(bobRef.current) * 0.025 : 0;
  // Dampen bob when stopping
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, EYE_HEIGHT + bobY, 0.2);
});
```

Amplitude 0.025 units is subtle but noticeable. More than 0.04 causes motion sickness.

### 3B. Turn inertia / lean

Currently yaw snaps to `DIR_TO_YAW` via lerp. Add a slight camera roll (z-rotation)
during turns to simulate head lean:

```typescript
const leanAmount = angleDelta * 0.08; // tiny roll proportional to turn speed
camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, -leanAmount, 0.15);
```

Settle it back to zero once turn completes. Adds physical weight to direction changes.

---

## Phase 4 — Water & Grass Animation (medium impact, no new deps)

**Files:** `MapMesh3D.tsx`, `tileToVoxel.ts`

### 4A. Animated water

Water tiles currently use `InstancedBoxes` like any other object. Change water to its own
`AnimatedWater` component using `useFrame`:

```tsx
function AnimatedWater({ bucket }: { bucket: Bucket }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.elapsedTime;
    // Pulse color between two blues
    matRef.current.color.setHSL(0.6, 0.7, 0.45 + Math.sin(t * 1.5) * 0.05);
    // Slow UV pan (requires texture)
    if (matRef.current.map) {
      matRef.current.map.offset.x = (t * 0.05) % 1;
      matRef.current.map.offset.y = (t * 0.03) % 1;
    }
  });
  return (
    <instancedMesh ...>
      <boxGeometry args={[1, 0.05, 1]} />
      <meshStandardMaterial ref={matRef} color="#3a78d8" transparent opacity={0.85}
        roughness={0.1} metalness={0.3} />
    </instancedMesh>
  );
}
```

Transparency + reflective metalness gives water a surface quality that solid boxes lack.

### 4B. Grass sway

The grass blade boxes (the 0.28-unit `extras` objects) could sway by rotating instances
per-frame. This requires moving grass blades out of the static `InstancedBoxes` into
a dedicated animated component. The animation: each blade tilts sinusoidally with a
per-instance phase offset based on its position:

```typescript
// offset phase so nearby blades don't all move identically
const phase = (x * 1.3 + z * 0.7) % (Math.PI * 2);
quat.setFromAxisAngle(windAxis, Math.sin(t * 1.8 + phase) * 0.06);
```

`0.06` radians (~3.4°) of tilt is barely perceptible individually but reads as wind
across a field.

**Performance:** Only animate grass within ~10 tiles of the player. Gate via distance check
inside `buildBuckets` to produce a near/far split, only animating near instances.

---

## Phase 5 — Atmosphere (medium impact, no new deps)

**File:** `Scene3D.tsx`

### 5A. Sky gradient

Replace the solid `<color>` background with a large hemisphere (inside of a sphere):

```tsx
// A large inverted sphere with vertex-colored gradient sky
<mesh scale={[100, 100, 100]}>
  <sphereGeometry args={[1, 16, 8]} />
  <meshBasicMaterial color="#87ceeb" side={THREE.BackSide} />
</mesh>
```

For a gradient, use a `ShaderMaterial` with two colors (horizon `#e8f4ff`, zenith `#5ba8e8`):

```glsl
// vertex shader
varying float vY;
void main() { vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1); }
// fragment shader
varying float vY;
uniform vec3 horizonColor;
uniform vec3 zenithColor;
void main() { gl_FragColor = vec4(mix(horizonColor, zenithColor, clamp(vY, 0., 1.)), 1.); }
```

### 5B. Fog density by map type

Extend the `isInterior` check to a 3-way categorization:

| Context | fogStart | fogEnd | color |
|---|---|---|---|
| Outdoor | 20 | 65 | sky blue |
| Interior | 8 | 25 | warm tan |
| Cave (rock tunnel, tower) | 3 | 18 | dark grey-purple |

Detect cave by checking if the map tiles contain zero grass/path and nonzero floor+wall
(indoor pattern but with stone tones). Or add a `mapType` field to `MapData`.

### 5C. Emissive doors

Door tiles are currently floor-colored brown. Add a subtle emissive glow to make them
stand out as interactive:

```typescript
// tileToVoxel.ts
door: { kind: 'floor', height: 0, color: '#704018', emissive: '#1a0800', emissiveIntensity: 0.4 }
```

Extend `VoxelDef` with optional `emissive` and `emissiveIntensity` fields, pass to
`meshStandardMaterial`.

---

## Phase 6 — Post-processing (requires new dep: `@react-three/postprocessing`)

**New dep:** `npm install @react-three/postprocessing`

**File:** `Scene3D.tsx` (wrap render with `<EffectComposer>`)

```tsx
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// Inside Scene3D JSX, after all scene content:
<EffectComposer>
  <Bloom
    intensity={0.4}
    luminanceThreshold={0.7}   // only brightest pixels bloom (water, emissives)
    luminanceSmoothing={0.2}
  />
  <Vignette
    offset={0.3}
    darkness={0.6}
    blendFunction={BlendFunction.NORMAL}
  />
</EffectComposer>
```

The vignette alone makes first-person feel dramatically more immersive. Bloom on water
and emissive doors ties Phase 4 and 5C together.

**Battle flash:** When a battle starts (watch `phase` store value), trigger a `<Glitch>`
effect for 0.3s — brief chromatic noise that cuts into the battle screen.

---

## Phase 7 — Billboard Polish (low effort, nice detail)

**Files:** `NpcBillboard.tsx`, `ItemBillboard.tsx`, `WildPokemonBillboard.tsx`

### 7A. Shadow blobs under all billboards

A flat dark ellipse underneath each NPC/wild Pokémon grounds them visually:

```tsx
// Reusable component
function ShadowBlob({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ellipseGeometry args={[0.25, 0.15, 12]} />
      <meshBasicMaterial color="black" transparent opacity={0.3} depthWrite={false} />
    </mesh>
  );
}
```

### 7B. Item billboard — use actual item sprite

Instead of a red sphere, show the item's sprite image. `Entity` has an `itemId` field.
Map `itemId → sprite emoji or image URL`. For the short term, a colored gem shape per
item category (blue = water item, yellow = TM, red = Pokéball) is better than all-red.

### 7C. Wild Pokémon approach pulse

When a wild Pokémon is within 2 tiles, pulse its scale slightly to signal proximity before
the random encounter triggers:

```typescript
const dist = Math.hypot(wild.position.x - playerPos.x, wild.position.y - playerPos.y);
const pulse = dist < 2 ? 1 + Math.sin(clock.elapsedTime * 6) * 0.08 : 1;
ref.current.scale.set(pulse, pulse, 1);
```

---

## Recommended Execution Order

| Priority | Phase | Effort | Visual Gain |
|---|---|---|---|
| 1 | 1A — Shadows | Low | High |
| 2 | 1B — Interior lighting | Low | High |
| 3 | 3A — Head bob | Low | High (feel) |
| 4 | 2A/2B — Tile textures | Medium | High |
| 5 | 4A — Water animation | Low | Medium |
| 6 | 5A — Sky gradient | Medium | Medium |
| 7 | 1C — Ceiling | Low | Medium |
| 8 | 5B — Fog by map type | Low | Medium |
| 9 | 7A — Shadow blobs | Low | Medium |
| 10 | 3B — Turn lean | Low | Low (feel) |
| 11 | 4B — Grass sway | Medium | Medium |
| 12 | 5C — Emissive doors | Low | Low |
| 13 | 6 — Post-processing | Medium (+dep) | High |
| 14 | 7B/7C — Billboard polish | Low | Low |

**Minimum viable visual upgrade:** Phases 1 (all) + 3A + 4A + 5A = shadows, interior
lighting, ceiling, head bob, animated water, gradient sky. No new dependencies.
Estimated ~4h of implementation.

**Full upgrade including post-processing:** All phases. Adds `@react-three/postprocessing`
(well-maintained, compatible with r3f 9.x). Estimated ~10h total.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `overworld3d/tileTextures.ts` | **Create** — canvas texture generator, cached per tile type |
| `overworld3d/tileToVoxel.ts` | Modify — add `emissive`, `emissiveIntensity`, `textureKey` fields to `VoxelDef` |
| `overworld3d/MapMesh3D.tsx` | Modify — pass textures to materials; split grass/water into animated components |
| `overworld3d/Scene3D.tsx` | Modify — interior/cave lighting, ceiling, sky, EffectComposer |
| `overworld3d/CameraRig.tsx` | Modify — head bob, turn lean |
| `overworld3d/WorldView3D.tsx` | Modify — add `shadows` to Canvas |
| `overworld3d/NpcBillboard.tsx` | Modify — add shadow blob |
| `overworld3d/ItemBillboard.tsx` | Modify — item-category-aware shape/color |
| `overworld3d/WildPokemonBillboard.tsx` | Modify — proximity pulse |
| `overworld3d/AnimatedWater.tsx` | **Create** — dedicated animated water component |
| `overworld3d/ShadowBlob.tsx` | **Create** — reusable ground shadow ellipse |
