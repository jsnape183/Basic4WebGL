/**
 * One-off generator for the raycaster-p8-tiers demo's placeholder textures.
 *
 *   npx vite-node scripts/genRaycasterTextures.ts
 *
 * Writes six 64x64 PNGs into demo-src/raycaster-p8-tiers/assets/. Every pattern is
 * built from arithmetic that is periodic over 64px on both axes, so each texture
 * tiles seamlessly when the engine wraps its U/V at the tile edge.
 *
 * No PNG library is available in node_modules, so this emits PNG bytes directly:
 * a single IDAT chunk holding zlib-compressed (via Node's zlib) filter-0
 * scanlines. Output is a few KB per file.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SIZE = 64;
const OUT_DIR = 'demo-src/raycaster-p8-tiers/assets';

// --- tiny PNG encoder --------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** rgba: Uint8Array of SIZE*SIZE*4 */
function encodePng(rgba: Uint8Array): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = SIZE * 4;
  const raw = Buffer.alloc((stride + 1) * SIZE);
  for (let y = 0; y < SIZE; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (None)
    for (let x = 0; x < stride; x++) raw[y * (stride + 1) + 1 + x] = rgba[y * stride + x];
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- pattern helpers --------------------------------------------------------

type PixelFn = (x: number, y: number) => [number, number, number];

function build(fn: PixelFn): Uint8Array {
  const out = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const [r, g, b] = fn(x, y);
      const i = (y * SIZE + x) * 4;
      out[i] = clamp(r);
      out[i + 1] = clamp(g);
      out[i + 2] = clamp(b);
      out[i + 3] = 255;
    }
  }
  return out;
}

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));
const wrap = (n: number, m: number) => ((n % m) + m) % m;

// Value noise on an 8x8 lattice (cell = 8px) — indices taken mod 8, so it tiles.
function latticeRand(ix: number, iy: number): number {
  ix = wrap(ix, 8);
  iy = wrap(iy, 8);
  let h = (ix * 374761393 + iy * 668265263) >>> 0;
  h = (Math.imul(h ^ (h >>> 13), 1274126177) >>> 0) as number;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function valueNoise(x: number, y: number, cell: number): number {
  const gx = x / cell;
  const gy = y / cell;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = smooth(gx - x0);
  const fy = smooth(gy - y0);
  const n00 = latticeRand(x0, y0);
  const n10 = latticeRand(x0 + 1, y0);
  const n01 = latticeRand(x0, y0 + 1);
  const n11 = latticeRand(x0 + 1, y0 + 1);
  const nx0 = n00 + fx * (n10 - n00);
  const nx1 = n01 + fx * (n11 - n01);
  return nx0 + fy * (nx1 - nx0);
}

// Shortest wrapped distance between two points on the 64-torus.
function torusDist(x: number, y: number, cx: number, cy: number): number {
  let dx = Math.abs(x - cx);
  let dy = Math.abs(y - cy);
  if (dx > SIZE / 2) dx = SIZE - dx;
  if (dy > SIZE / 2) dy = SIZE - dy;
  return Math.sqrt(dx * dx + dy * dy);
}

// --- the six textures ------------------------------------------------------

const brick: PixelFn = (x, y) => {
  const course = Math.floor(y / 16);
  const offset = (course % 2) * 16;
  const mortar = y % 16 < 2 || wrap(x + offset, 32) < 2;
  if (mortar) return [95, 90, 85];
  const n = valueNoise(x, y, 8) * 26 - 13;
  return [150 + n, 74 + n, 55 + n];
};

const concrete: PixelFn = (x, y) => {
  const n = valueNoise(x, y, 16) * 0.6 + valueNoise(x, y, 8) * 0.4;
  const v = 120 + (n - 0.5) * 70;
  return [v, v + 2, v + 5];
};

const panel: PixelFn = (x, y) => {
  const border = x < 3 || x > SIZE - 4 || y < 3 || y > SIZE - 4;
  const rivet = [
    [6, 6],
    [SIZE - 7, 6],
    [6, SIZE - 7],
    [SIZE - 7, SIZE - 7],
  ].some(([cx, cy]) => torusDist(x, y, cx, cy) < 3);
  if (rivet) return [210, 214, 224];
  if (border) return [70, 76, 90];
  const n = valueNoise(x, y, 32) * 12 - 6;
  return [120 + n, 128 + n, 145 + n];
};

const rock: PixelFn = (x, y) => {
  const n = valueNoise(x, y, 16) * 0.5 + valueNoise(x, y, 8) * 0.5;
  let v = 96 + (n - 0.5) * 80;
  const blobs: Array<[number, number, number]> = [
    [14, 20, 7],
    [44, 12, 6],
    [30, 46, 8],
    [52, 50, 5],
  ];
  for (const [cx, cy, rad] of blobs) {
    const d = torusDist(x, y, cx, cy);
    if (d < rad) v -= (1 - d / rad) * 45;
  }
  return [v, v - 4, v - 10];
};

const floor: PixelFn = (x, y) => {
  const grout = wrap(x, 32) < 2 || wrap(y, 32) < 2;
  const check = (Math.floor(x / 32) + Math.floor(y / 32)) % 2;
  if (grout) return [60, 58, 54];
  const n = valueNoise(x, y, 8) * 16 - 8;
  const base = check ? 120 : 104;
  return [base + n, base + n - 4, base + n - 12];
};

const ceil: PixelFn = (x, y) => {
  const inSquare = x > 20 && x < SIZE - 20 && y > 20 && y < SIZE - 20;
  const n = valueNoise(x, y, 16) * 8 - 4;
  const base = inSquare ? 150 : 92;
  return [base + n, base + n, base + n + 4];
};

// --- write ---------------------------------------------------------------

const TEXTURES: Record<string, PixelFn> = {
  'rc_tex_brick.png': brick,
  'rc_tex_concrete.png': concrete,
  'rc_tex_panel.png': panel,
  'rc_tex_rock.png': rock,
  'rc_tex_floor.png': floor,
  'rc_tex_ceil.png': ceil,
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, fn] of Object.entries(TEXTURES)) {
  const png = encodePng(build(fn));
  const path = join(OUT_DIR, name);
  writeFileSync(path, png);
  console.log(`wrote ${path} (${png.length} bytes)`);
}
