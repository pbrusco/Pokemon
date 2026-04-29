import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

function cachedTexture(key: string, fn: () => THREE.CanvasTexture): THREE.CanvasTexture {
  let tex = cache.get(key);
  if (tex) return tex;
  tex = fn();
  cache.set(key, tex);
  return tex;
}

function createCanvasTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  draw(ctx, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeGrassTexture(): THREE.CanvasTexture {
  return cachedTexture('grass', () =>
    createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#5fa85a';
      ctx.fillRect(0, 0, w, h);
      const rand = rng(42);
      for (let i = 0; i < 80; i++) {
        const x = Math.floor(rand() * w);
        const y = Math.floor(rand() * h);
        const shade = rand() > 0.5 ? '#4a9a40' : '#6fc860';
        ctx.fillStyle = shade;
        ctx.fillRect(x, y, 2 + Math.floor(rand() * 3), 1);
      }
    }),
  );
}

function makePathTexture(): THREE.CanvasTexture {
  return cachedTexture('path', () =>
    createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#c8b878';
      ctx.fillRect(0, 0, w, h);
      const rand = rng(17);
      for (let i = 0; i < 50; i++) {
        const x = Math.floor(rand() * w);
        const y = Math.floor(rand() * h);
        ctx.fillStyle = '#a89858';
        ctx.beginPath();
        ctx.ellipse(x, y, 3 + rand() * 4, 2 + rand() * 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }),
  );
}

function makeFloorTexture(): THREE.CanvasTexture {
  return cachedTexture('floor', () =>
    createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#c8a878';
      ctx.fillRect(0, 0, w, h);
      const rand = rng(73);
      for (let i = 0; i < 16; i++) {
        const y = Math.floor(rand() * h);
        ctx.fillStyle = rand() > 0.5 ? '#b89068' : '#d8b888';
        ctx.fillRect(0, y, w, 3 + Math.floor(rand() * 2));
      }
    }),
  );
}

function makeCarpetTexture(): THREE.CanvasTexture {
  return cachedTexture('carpet', () =>
    createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#c84848';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#a83030';
      ctx.lineWidth = 1;
      const rand = rng(99);
      for (let i = 0; i < 30; i++) {
        const x = Math.floor(rand() * w);
        const y = Math.floor(rand() * h);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 6, y + 6);
        ctx.stroke();
      }
    }),
  );
}

function makeWallTexture(): THREE.CanvasTexture {
  return cachedTexture('wall', () =>
    createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#888888';
      ctx.fillRect(0, 0, w, h);
      const rand = rng(31);
      const brickH = 8;
      const brickW = 16;
      for (let row = 0; row < h / brickH; row++) {
        const offset = (row % 2) * (brickW / 2);
        for (let col = -1; col < w / brickW + 1; col++) {
          const bx = Math.floor(col * brickW + offset);
          const by = Math.floor(row * brickH);
          ctx.fillStyle = rand() > 0.3 ? '#949494' : '#7a7a7a';
          ctx.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);
        }
      }
    }),
  );
}

function makeWaterTexture(): THREE.CanvasTexture {
  return cachedTexture('water', () =>
    createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#3060c0';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#4080e0';
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += 8) {
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const yy = y + Math.sin((x / w) * Math.PI * 2 + y * 0.5) * 2;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    }),
  );
}

function makeTrunkTexture(): THREE.CanvasTexture {
  return cachedTexture('trunk', () =>
    createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(0, 0, w, h);
      const rand = rng(55);
      for (let i = 0; i < 20; i++) {
        const x = Math.floor(rand() * w);
        ctx.fillStyle = rand() > 0.5 ? '#4a2a15' : '#6e4a2a';
        ctx.fillRect(x, 0, 2 + Math.floor(rand() * 3), h);
      }
    }),
  );
}

function makeCanopyTexture(): THREE.CanvasTexture {
  return cachedTexture('canopy', () =>
    createCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#2f7a3a';
      ctx.fillRect(0, 0, w, h);
      const rand = rng(88);
      const colors = ['#2a6a30', '#3a8a45', '#4a9a50'];
      for (let i = 0; i < 120; i++) {
        const x = Math.floor(rand() * w);
        const y = Math.floor(rand() * h);
        ctx.fillStyle = colors[Math.floor(rand() * 3)];
        ctx.beginPath();
        ctx.ellipse(x, y, 3 + rand() * 2, 2 + rand() * 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }),
  );
}

const TILE_TEXTURES: Record<string, () => THREE.CanvasTexture> = {
  grass: makeGrassTexture,
  grass_blade: makeGrassTexture,
  path: makePathTexture,
  floor: makeFloorTexture,
  carpet: makeCarpetTexture,
  wall: makeWallTexture,
  water: makeWaterTexture,
  trunk: makeTrunkTexture,
  canopy: makeCanopyTexture,
};

export function getTileTexture(key: string): THREE.CanvasTexture | undefined {
  const fn = TILE_TEXTURES[key];
  return fn ? fn() : undefined;
}
