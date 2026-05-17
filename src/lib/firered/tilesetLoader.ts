/**
 * Runtime loader for FireRed tileset assets.
 *
 * Loads `tiles.png` (4-bit indexed) + `palettes.json` (16 × 16 RGB) per
 * tileset, decodes the PNG into a 4-bit index buffer, then composes one
 * 16×16 RGBA ImageBitmap per metatile using the metatile's tile-refs +
 * the assigned palette.
 *
 * Pure runtime, no build-time pre-rendering — this keeps the artifact size
 * small and means a single source of truth (the disassembly).
 */

interface TileRef {
  tile: number;
  hflip: 0 | 1;
  vflip: 0 | 1;
  palette: number;
}

interface TilesetAssets {
  tilesUrl: string;
  palettes: number[][][];     // [paletteIdx][colorIdx][r,g,b]
  metatiles: TileRef[][];     // [metatileId][8 refs: 4 bottom + 4 top]
}

interface LoadedTileset extends TilesetAssets {
  /** Raw 4bpp index buffer of the tile sheet. tilesIndex[y * width + x] = palette slot. */
  tilesIndex: Uint8Array;
  tilesWidth: number;
  tilesHeight: number;
}

const TILE_PX = 8;
const META_PX = 16;
const TILES_PER_ROW = 16; // tile sheet is 128 px wide = 16 tiles

const tilesetCache = new Map<string, Promise<LoadedTileset>>();
const metatileCache = new Map<string, ImageBitmap>(); // key = `${tilesetName}:${metatileId}`

const tilesetModules: Record<string, () => Promise<TilesetAssets>> = {};

/**
 * Register all tileset directories at build time. Vite's import.meta.glob
 * resolves these to URLs/imports — no string concatenation at runtime.
 */
const tilesPngs = import.meta.glob<{ default: string }>(
  '../../artifacts/firered/tilesets/*/tiles.png',
  { query: '?url', eager: false },
);
const palettesJsons = import.meta.glob<{ default: number[][][] }>(
  '../../artifacts/firered/tilesets/*/palettes.json',
  { eager: false },
);
const metatilesJsons = import.meta.glob<{ default: TileRef[][] }>(
  '../../artifacts/firered/tilesets/*/metatiles.json',
  { eager: false },
);

function tilesetKeyToSlug(label: string): string {
  return label
    .replace(/^gTileset_/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/([A-Za-z])([0-9])/g, '$1_$2')
    .toLowerCase();
}

function findGlob<T>(globObj: Record<string, () => Promise<T>>, slug: string, suffix: string): (() => Promise<T>) | null {
  const key = Object.keys(globObj).find(k => k.endsWith(`/${slug}/${suffix}`));
  return key ? globObj[key] : null;
}

async function decodePngToIndices(url: string): Promise<{ buf: Uint8Array; w: number; h: number }> {
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  return decodePngIndices(new Uint8Array(ab));
}

/**
 * Minimal PNG decoder for indexed-color PNGs. Returns palette indices.
 * Handles 4-bit and 8-bit colormap PNGs (PLTE present, no interlacing).
 */
async function decodePngIndices(bytes: Uint8Array): Promise<{ buf: Uint8Array; w: number; h: number }> {
  let p = 8; // skip 8-byte PNG signature
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idatChunks: Uint8Array[] = [];

  while (p < bytes.length) {
    const len = (bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3];
    const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
    const data = bytes.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      width = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
      height = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
    p += 12 + len;
  }
  if (colorType !== 3) throw new Error('expected indexed-color PNG (colorType=3)');

  const total = idatChunks.reduce((s, c) => s + c.length, 0);
  const combined = new Uint8Array(total);
  let o = 0;
  for (const c of idatChunks) { combined.set(c, o); o += c.length; }

  const decompressed = await decompressZlib(combined);
  const rowBytes = Math.ceil((width * bitDepth) / 8);
  const indices = new Uint8Array(width * height);
  let prevFiltered: Uint8Array | null = null;
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1);
    const filter = decompressed[rowStart];
    const rowData = decompressed.subarray(rowStart + 1, rowStart + 1 + rowBytes);
    const filtered = unfilter(rowData, filter, prevFiltered, bitDepth);
    if (bitDepth === 4) {
      for (let x = 0; x < width; x++) {
        const byte = filtered[x >> 1];
        indices[y * width + x] = (x & 1) === 0 ? (byte >> 4) & 0xf : byte & 0xf;
      }
    } else if (bitDepth === 8) {
      for (let x = 0; x < width; x++) indices[y * width + x] = filtered[x];
    } else {
      throw new Error(`unsupported bitDepth ${bitDepth}`);
    }
    prevFiltered = filtered;
  }
  return { buf: indices, w: width, h: height };
}

async function decompressZlib(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Response(new Blob([data as BlobPart])).body!.pipeThrough(new DecompressionStream('deflate'));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

function unfilter(row: Uint8Array, filter: number, prev: Uint8Array | null, bitDepth: number): Uint8Array {
  // For bitDepth < 8, "bytes per complete pixel" rounds up to 1 byte.
  const bpp = Math.max(1, Math.ceil(bitDepth / 8));
  const out = new Uint8Array(row.length);
  for (let i = 0; i < row.length; i++) {
    const a = i >= bpp ? out[i - bpp] : 0;
    const b = prev ? prev[i] : 0;
    const c = prev && i >= bpp ? prev[i - bpp] : 0;
    let v = row[i];
    switch (filter) {
      case 0: break;
      case 1: v = (v + a) & 0xff; break;
      case 2: v = (v + b) & 0xff; break;
      case 3: v = (v + ((a + b) >> 1)) & 0xff; break;
      case 4: v = (v + paeth(a, b, c)) & 0xff; break;
    }
    out[i] = v;
  }
  return out;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/** Resolve and load all assets for one tileset. */
async function loadTileset(label: string): Promise<LoadedTileset> {
  const cached = tilesetCache.get(label);
  if (cached) return cached;

  const slug = tilesetKeyToSlug(label);
  const tilesUrlMod = findGlob(tilesPngs, slug, 'tiles.png');
  const palettesMod = findGlob(palettesJsons, slug, 'palettes.json');
  const metatilesMod = findGlob(metatilesJsons, slug, 'metatiles.json');
  if (!tilesUrlMod || !palettesMod || !metatilesMod) {
    throw new Error(`tileset assets missing for ${label} (slug=${slug})`);
  }

  const promise = (async () => {
    const [tilesUrlRes, palsRes, metasRes] = await Promise.all([
      tilesUrlMod() as Promise<{ default: string }>,
      palettesMod() as Promise<{ default: number[][][] }>,
      metatilesMod() as Promise<{ default: TileRef[][] }>,
    ]);
    const { buf, w, h } = await decodePngToIndices(tilesUrlRes.default);
    return {
      tilesUrl: tilesUrlRes.default,
      palettes: palsRes.default,
      metatiles: metasRes.default,
      tilesIndex: buf,
      tilesWidth: w,
      tilesHeight: h,
    };
  })();
  tilesetCache.set(label, promise);
  return promise;
}

// FireRed canonical splits (pokefirered/include/fieldmap.h):
//   NUM_TILES_IN_PRIMARY     = 640  → tile IDs 0-639 live in primary, 640+ in secondary
//   NUM_METATILES_IN_PRIMARY = 640  → metatile IDs 0-639 live in primary, 640+ in secondary
//   NUM_PALS_IN_PRIMARY      = 7    → palette slots 0-6 come from primary, 7-12 from secondary
const NUM_TILES_IN_PRIMARY = 640;
const NUM_METATILES_IN_PRIMARY = 640;
const NUM_PALS_IN_PRIMARY = 7;

/**
 * Synchronous fast-path: returns a metatile bitmap iff it's already been
 * synthesized for this primary/secondary pair. Used by the map hook to fill
 * the initial cache without waiting on any async work.
 */
export function getCachedMetatileBitmap(
  primaryTileset: string,
  secondaryTileset: string,
  metatileId: number,
): ImageBitmap | undefined {
  return metatileCache.get(`${primaryTileset}|${secondaryTileset}|${metatileId}`);
}

/**
 * Eagerly start loading a tileset (no need to wait for the result). Used to
 * prewarm common tilesets at app start so the first map paint hits warm
 * cache.
 */
export function prewarmTileset(label: string): void {
  loadTileset(label).catch(() => {});
}

/**
 * Render one metatile as a 16×16 ImageBitmap.
 */
export async function getMetatileBitmap(
  primaryTileset: string,
  secondaryTileset: string,
  metatileId: number,
): Promise<ImageBitmap | null> {
  const cacheKey = `${primaryTileset}|${secondaryTileset}|${metatileId}`;
  const cached = metatileCache.get(cacheKey);
  if (cached) return cached;

  const useSecondary = metatileId >= NUM_METATILES_IN_PRIMARY;
  const localId = useSecondary ? metatileId - NUM_METATILES_IN_PRIMARY : metatileId;

  let primary: LoadedTileset, secondary: LoadedTileset | null;
  try {
    primary = await loadTileset(primaryTileset);
    secondary = secondaryTileset ? await loadTileset(secondaryTileset).catch(() => null) : null;
  } catch {
    return null;
  }

  const ts = useSecondary && secondary ? secondary : primary;
  const refs = ts.metatiles[localId];
  if (!refs) return null;

  const canvas = new OffscreenCanvas(META_PX, META_PX);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const img = ctx.createImageData(META_PX, META_PX);

  // 8 tile-refs: 0-3 = bottom layer (4 quadrants TL TR BL BR), 4-7 = top layer.
  // Combined pixel = bottom (always opaque) overlaid by top (color 0 = transparent).
  for (let layer = 0; layer < 2; layer++) {
    for (let q = 0; q < 4; q++) {
      const ref = refs[layer * 4 + q];
      const sx = (q & 1) * TILE_PX;
      const sy = (q >> 1) * TILE_PX;
      drawTileToImageData(img, sx, sy, ref, primary, secondary, layer === 1);
    }
  }
  ctx.putImageData(img, 0, 0);
  const bmp = await createImageBitmap(canvas);
  metatileCache.set(cacheKey, bmp);
  return bmp;
}

function drawTileToImageData(
  img: ImageData,
  dx: number,
  dy: number,
  ref: TileRef,
  primary: LoadedTileset,
  secondary: LoadedTileset | null,
  transparentColor0: boolean,
) {
  // Tile IDs 0..NUM_TILES_IN_PRIMARY-1 are in primary, the rest in secondary.
  const useSecondaryTiles = ref.tile >= NUM_TILES_IN_PRIMARY;
  const ts = useSecondaryTiles && secondary ? secondary : primary;
  const tileId = useSecondaryTiles ? ref.tile - NUM_TILES_IN_PRIMARY : ref.tile;

  // Palette slots 0..NUM_PALS_IN_PRIMARY-1 always live in the *primary*
  // tileset's palette array; slots NUM_PALS_IN_PRIMARY..12 always live in
  // the *secondary*. This is independent of which tileset the tile graphic
  // came from. See pokefirered/src/fieldmap.c LoadTilesetPalette.
  const palSource = ref.palette < NUM_PALS_IN_PRIMARY ? primary : secondary;
  const palette = palSource?.palettes?.[ref.palette];
  if (!palette) return;

  const tilesPerRow = ts.tilesWidth / TILE_PX;
  const srcCol = tileId % tilesPerRow;
  const srcRow = Math.floor(tileId / tilesPerRow);
  const sxBase = srcCol * TILE_PX;
  const syBase = srcRow * TILE_PX;

  for (let py = 0; py < TILE_PX; py++) {
    for (let px = 0; px < TILE_PX; px++) {
      const ssx = ref.hflip ? TILE_PX - 1 - px : px;
      const ssy = ref.vflip ? TILE_PX - 1 - py : py;
      const idx = ts.tilesIndex[(syBase + ssy) * ts.tilesWidth + (sxBase + ssx)];
      if (transparentColor0 && idx === 0) continue;
      const color = palette[idx];
      if (!color) continue;
      const di = ((dy + py) * META_PX + (dx + px)) * 4;
      img.data[di] = color[0];
      img.data[di + 1] = color[1];
      img.data[di + 2] = color[2];
      img.data[di + 3] = 255;
    }
  }
}

export type { TileRef };
// Reserved for explicit per-tileset registration; the import.meta.glob path
// above is the live registration mechanism.
void tilesetModules;
// Constant retained for future use (8 px native tile in the sheet grid).
void TILES_PER_ROW;
