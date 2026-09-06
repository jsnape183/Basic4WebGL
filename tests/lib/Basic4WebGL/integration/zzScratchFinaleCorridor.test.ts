/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// SCRATCH probe -- spatially resolved evidence for the "one section of the hall
// seems fully lit / tweaks out" report. Walks the REAL finale.stm east down the
// hub->Torch Hall corridor (row 15.5) with the REAL baked static lights, and
// records EVERY drawFlatSeg light sample (screen band + the world depth it was
// sampled at) plus a rasterised frame.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const DIR = 'demo-src/raycaster-p10-finale';
const OUT = process.env.OUTDIR || '/tmp/finalecorridor';
const VIEW_W = 640;
const VIEW_H = 400;

// ---------------------------------------------------------------- PNG writer
function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePng(path: string, w: number, h: number, rgb: Uint8Array) {
  const raw = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w * 3; x++) raw[y * (w * 3 + 1) + 1 + x] = rgb[y * w * 3 + x];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

// -------------------------------------------------- instrumented transpile
// Insert a PROBE marker call in drawFlatSeg at each light sample site.
function instrument(src: string): string {
  let out = src;
  // n = 1 (single-sample) path
  out = out.replace(
    `        smid = self.depthAtScreenY(hh, (yTop + yBot) / 2)
        self.emitFlatBand(destX, yTop, yBot, kind, packed, self.boundLights.sampleAt(self.camX + rayX * smid, self.camY + rayY * smid))`,
    `        smid = self.depthAtScreenY(hh, (yTop + yBot) / 2)
        drawing.drawImageStrip("PROBE", destX, hh, yTop, yBot, smid, self.boundLights.sampleAt(self.camX + rayX * smid, self.camY + rayY * smid), yTop, yBot)
        self.emitFlatBand(destX, yTop, yBot, kind, packed, self.boundLights.sampleAt(self.camX + rayX * smid, self.camY + rayY * smid))`,
  );
  // lattice path
  out = out.replace(
    `        useLite = self.boundLights.sampleAt(self.camX + rayX * smid, self.camY + rayY * smid)
        if segLite < 0 then`,
    `        useLite = self.boundLights.sampleAt(self.camX + rayX * smid, self.camY + rayY * smid)
        drawing.drawImageStrip("PROBE", destX, hh, cellTop, cellBot, smid, useLite, yTop, yBot)
        if segLite < 0 then`,
  );
  return out;
}

function transpileFinale(patch?: (name: string, src: string) => string): string {
  const names = readdirSync(DIR)
    .filter((n) => n.endsWith('.bas') && n !== 'Main.bas' && n !== 'FinaleScene.bas')
    .sort();
  const raw = names.map((name) => {
    let source = readFileSync(`${DIR}/${name}`, 'utf-8');
    if (patch) source = patch(name, source);
    return { name, source };
  });
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

type Draw = { r: number; g: number; b: number; x: number; y: number; w: number; h: number; wall: boolean };
type Probe = {
  destX: number;
  hh: number;
  cellTop: number;
  cellBot: number;
  smid: number;
  lite: number;
  bandTop: number;
  bandBot: number;
};

function build(code: string, draws: Draw[], probes: Probe[]) {
  const stm = JSON.parse(readFileSync(`${DIR}/assets/finale.stm`, 'utf-8'));
  const walls: number[][] = stm.layers.walls;
  const markers: Array<{ row: number; col: number; tag: string }> = stm.layers.tags.markers;

  const stub: Record<string, unknown> = {};
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(t, p: string) {
      if (p === Symbol.toPrimitive || p === 'then') return undefined;
      if (p in t) return t[p];
      return () => proxy;
    },
    set(t, p: string, v) {
      t[p] = v;
      return true;
    },
    apply: () => proxy,
  };
  const proxy = new Proxy(function () {} as never, handler) as never;
  const _sb = new Proxy(stub, handler) as any;
  const tw = 16;
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.tileWidth = () => tw;
  _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => walls[0].length * tw;
  _sb.tileMapHeightPx = () => walls.length * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) => walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers.map((m) => ({ ...m }));
  _sb.getStageWidth = () => VIEW_W;
  _sb.getStageHeight = () => VIEW_H;

  let cur = { r: 255, g: 255, b: 255 };
  _sb.setFillColor = (r: number, g: number, b: number) => {
    cur = { r, g, b };
  };
  _sb.drawRect = (x: number, y: number, w: number, h: number) => {
    draws.push({ ...cur, x, y, w, h, wall: false });
  };
  _sb.drawImageStrip = (
    img: string,
    _srcX: number,
    destX: number,
    destY: number,
    w: number,
    hgt: number,
    tint: number,
    v0: number,
    v1: number,
  ) => {
    if (img === 'PROBE') {
      probes.push({
        destX: _srcX,
        hh: destX,
        cellTop: destY,
        cellBot: w,
        smid: hgt,
        lite: tint,
        bandTop: v0,
        bandBot: v1,
      });
      return;
    }
    const rr = Math.floor(tint / 65536);
    const gg = Math.floor(tint / 256) - rr * 256;
    const bb = tint - rr * 65536 - gg * 256;
    draws.push({ r: rr, g: gg, b: bb, x: destX, y: destY, w, h: hgt, wall: true });
  };

  const deferred: Array<() => void> = [];
  _sb._deferModuleBody = (cb: () => void) => deferred.push(cb);
  const _createArray = (init: unknown[]) =>
    Array.isArray(init) && init.length === 1 && init[0] === 0 ? [] : [...(init ?? [])];
  const helpers: Record<string, unknown> = {
    _sbLength: (x: { length?: number }) => x?.length ?? 0,
    _sbJoin: (x: unknown[], s: string) => x.join(s),
    _sbContains: (x: unknown[], i: unknown) => x.includes(i),
    _sbRemove: () => {},
    _sbClear: (x: unknown[]) => x.splice(0),
    _sbCheckedArrayGet: (a: unknown[], i: number) => a[i],
    _createDict: () => new Map(),
  };
  const factory = new Function(
    '_sb',
    '_createArray',
    ...Object.keys(helpers),
    'console',
    `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRender: _sb_rcrender, RcMover: _sb_rcmover, RcLights: _sb_rclights };`,
  );
  const K = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return K;
}

function rasterise(draws: Draw[]): Uint8Array {
  const buf = new Uint8Array(VIEW_W * VIEW_H * 3);
  for (const d of draws) {
    const x0 = Math.max(0, Math.round(d.x - d.w / 2));
    const x1 = Math.min(VIEW_W, Math.round(d.x + d.w / 2));
    const y0 = Math.max(0, Math.round(d.y - d.h / 2));
    const y1 = Math.min(VIEW_H, Math.round(d.y + d.h / 2));
    const r = Math.max(0, Math.min(255, Math.round(d.r)));
    const g = Math.max(0, Math.min(255, Math.round(d.g)));
    const b = Math.max(0, Math.min(255, Math.round(d.b)));
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const i = (y * VIEW_W + x) * 3;
        buf[i] = r;
        buf[i + 1] = g;
        buf[i + 2] = b;
      }
  }
  return buf;
}

function makeScene(instrumented: boolean) {
  const draws: Draw[] = [];
  const probes: Probe[] = [];
  const code = transpileFinale((n, s) => (instrumented && n === 'RcRender.bas' ? instrument(s) : s));
  const { RcWorld, TileMapSet, RcRender, RcMover, RcLights } = build(code, draws, probes);
  const world = new RcWorld(new TileMapSet('finale.stm'), 'walls');
  const render = new RcRender(world);
  const mover = new RcMover(world, 15.5, 15.5, 0.3, 0.6);
  const lights = new RcLights(world);
  lights.setambient(0.05); // exactly FinaleScene.bas
  render.bindlights(lights);
  render.bindcamera(mover);
  render.setwalltexture('rc_tex_concrete.png');
  render.setflatfill(0);
  return { render, mover, lights, world, draws, probes };
}

describe.skip('finale corridor probe (scratch)', () => {
  test('instrumentation patch applied', () => {
    const src = readFileSync(`${DIR}/RcRender.bas`, 'utf-8');
    const inst = instrument(src);
    expect(inst).not.toEqual(src);
    expect((inst.match(/PROBE/g) || []).length).toBe(2);
  });

  test('walk east down the hub->Torch Hall corridor, per-band sample dump', () => {
    mkdirSync(OUT, { recursive: true });
    const s = makeScene(true);
    const cols = s.render.columncount();
    const centre = Math.floor(cols / 2);
    const destX = centre * 4 + 2;

    console.log(`viewH=${VIEW_H} cols=${cols} centreCol=${centre} destX=${destX}`);
    console.log(`ambient=${s.lights.ambientlevel()} peak=${s.lights.peaklevel()}`);

    for (let x = 14.5; x <= 24.01; x += 0.5) {
      s.mover.warpto(x, 15.5, 0);
      s.draws.length = 0;
      s.probes.length = 0;
      s.render.renderframe();
      const mine = s.probes.filter((p) => Math.abs(p.destX - destX) < 0.01 && p.hh === 0);
      const lines = mine.map((p) => {
        const visTop = Math.max(p.cellTop, p.bandTop);
        const visBot = Math.min(p.cellBot, p.bandBot);
        if (visBot <= visTop) return null;
        // depth at the visible extremes of this lattice cell (floor hh=0)
        const dep = (y: number) => (0.5 * VIEW_H) / (y - VIEW_H / 2);
        const dNear = dep(visBot);
        const dFar = dep(visTop);
        // truth at near/far of the visible slice
        const t = (d: number) => s.lights.sampleat(s.mover.x() + d, s.mover.y());
        return `    y[${visTop.toFixed(0)}..${visBot.toFixed(0)}] depth ${dNear.toFixed(1)}..${dFar > 90 ? 'inf' : dFar.toFixed(1)}  sampledAt d=${p.smid.toFixed(1)} -> lite ${p.lite.toFixed(3)}   truth near ${t(dNear).toFixed(3)} far ${t(Math.min(dFar, 28)).toFixed(3)}`;
      });
      console.log(`x=${x.toFixed(2)}  floor bands (centre column):`);
      lines.filter(Boolean).forEach((l) => console.log(l));

      const buf = rasterise(s.draws);
      writePng(`${OUT}/f_${x.toFixed(2)}.png`, VIEW_W, VIEW_H, buf);
    }
    expect(true).toBe(true);
  });

  test('WHOLE FRAME: how often is the light sample outside the band it shades?', () => {
    const s = makeScene(true);
    const horizon = VIEW_H / 2;
    let camZ = 0;
    const depAt = (hh: number, y: number) => {
      const dy = y - horizon;
      if (Math.abs(dy) < 1e-4) return 999;
      const d = ((camZ + 0.5 - hh) * VIEW_H) / dy;
      return Math.max(0.05, Math.min(32, d));
    };
    for (let x = 14.5; x <= 24.01; x += 0.5) {
      s.mover.warpto(x, 15.5, 0);
      s.probes.length = 0;
      s.draws.length = 0;
      s.render.renderframe();
      camZ = s.mover.z();
      let outOfRange = 0;
      let total = 0;
      let worstErr = 0;
      let worstDesc = '';
      let outPx = 0;
      let totPx = 0;
      const dirX = 1;
      const dirY = 0;
      const plX = 0;
      const plY = 0.66;
      const cols = s.render.columncount();
      for (const p of s.probes) {
        const visTop = Math.max(p.cellTop, p.bandTop);
        const visBot = Math.min(p.cellBot, p.bandBot);
        if (visBot <= visTop) continue;
        total += 1;
        totPx += visBot - visTop;
        const d1 = depAt(p.hh, visTop);
        const d2 = depAt(p.hh, visBot);
        const dn = Math.min(d1, d2);
        const df = Math.max(d1, d2);
        const c = Math.round((p.destX - 2) / 4);
        const cx = (2 * c) / cols - 1;
        const rX = dirX + plX * cx;
        const rY = dirY + plY * cx;
        if (p.smid < dn - 0.02 || p.smid > df + 0.02) {
          outOfRange += 1;
          outPx += visBot - visTop;
          // truth = mean light over the visible slice
          let acc = 0;
          const N = 9;
          for (let i = 0; i < N; i++) {
            const yy = visTop + ((i + 0.5) / N) * (visBot - visTop);
            const dd = depAt(p.hh, yy);
            acc += s.lights.sampleat(s.mover.x() + rX * dd, s.mover.y() + rY * dd);
          }
          const truth = acc / N;
          const err = Math.abs(truth - p.lite);
          if (err > worstErr) {
            worstErr = err;
            worstDesc = `col ${c} hh=${p.hh} y[${visTop.toFixed(0)}..${visBot.toFixed(0)}] visible depth ${dn.toFixed(1)}..${df.toFixed(1)} BUT sampled at d=${p.smid.toFixed(1)} -> drew ${p.lite.toFixed(3)} vs true mean ${truth.toFixed(3)}`;
          }
        }
      }
      console.log(
        `x=${x.toFixed(2)}  bands=${total}  out-of-range=${outOfRange} (${((100 * outOfRange) / total).toFixed(0)}%)  px=${((100 * outPx) / totPx).toFixed(0)}%  worstErr=${worstErr.toFixed(3)}  ${worstDesc}`,
      );
    }
    expect(true).toBe(true);
  });
});
