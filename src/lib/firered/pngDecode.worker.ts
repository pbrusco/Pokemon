/**
 * Web Worker that decodes indexed-color PNGs to raw palette-index buffers.
 *
 * Why this lives off the main thread:
 *   The FireRed tile sheets are 4-bit indexed PNGs. We need the raw palette
 *   *indices* (not RGBA pixels) so each metatile can recolor its tiles using
 *   one of the 13 runtime palettes. The decode (zlib inflate + per-row
 *   unfilter + nibble unpack) costs ~1–5 ms per file. Doing it on the main
 *   thread while the player walks blocks the camera-tween paint frame and
 *   shows up as visible stutter.
 *
 *   Browsers can't natively give us palette indices via `createImageBitmap`,
 *   so the manual decoder stays — just behind a worker boundary.
 *
 * Protocol: postMessage({ id, bytes }) → postMessage({ id, ok, w, h, buf })
 *   or { id, ok: false, error }. `bytes` and `buf` are sent as transferable
 *   ArrayBuffers — no copying across the boundary.
 */

interface DecodeRequest {
  id: number;
  bytes: ArrayBuffer;
}

interface DecodeOk {
  id: number;
  ok: true;
  w: number;
  h: number;
  buf: ArrayBuffer;
}

interface DecodeErr {
  id: number;
  ok: false;
  error: string;
}

self.onmessage = async (e: MessageEvent<DecodeRequest>) => {
  const { id, bytes } = e.data;
  try {
    const { buf, w, h } = await decodePngIndices(new Uint8Array(bytes));
    const msg: DecodeOk = { id, ok: true, w, h, buf: buf.buffer };
    (self as unknown as { postMessage: (m: DecodeOk, transfer: Transferable[]) => void })
      .postMessage(msg, [buf.buffer]);
  } catch (err) {
    const msg: DecodeErr = { id, ok: false, error: err instanceof Error ? err.message : String(err) };
    (self as unknown as { postMessage: (m: DecodeErr) => void }).postMessage(msg);
  }
};

async function decodePngIndices(bytes: Uint8Array): Promise<{ buf: Uint8Array; w: number; h: number }> {
  let p = 8;
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

// Required so this file is treated as a module (the worker bundle).
export {};
