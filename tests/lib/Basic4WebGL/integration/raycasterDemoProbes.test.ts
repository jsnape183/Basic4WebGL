import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// `raycasterDemoSmoke` evaluates the phase demos and drives the Rc* classes
// against a stub world, but it never runs a demo scene's own `onenter` /
// `runProbes` — so a demo whose probe assertions fail at runtime (the thing the
// Cypress "no ERR" guard actually checks) slips straight through the committed
// suite. That happened in Phase 5: `p5room.stm` tagged a cell with a bare
// `light` marker, but `RcWorld.applyFlag` only recognised door/lift/water/sky,
// so nothing was baked and the "static bake present" probe threw only under
// Cypress.
//
// This test transpiles the P5 demo, evaluates it against an `_sb` stub wired to
// the real `p5room.stm` grid + markers, runs `LitScene.onenter()` (which calls
// `runProbes()`), and asserts every probe reported OK. A failed probe raises the
// same caught runtimeError Cypress sees, failing this test in-suite.

const DIR = 'demo-src/raycaster-p5';
const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

function makeSbStub(probeLog: string[], stm: { walls: number[][]; markers: unknown[]; tw: number; th: number }) {
  const cache = new Map<string, unknown>();
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop: string) {
      if (prop === Symbol.toPrimitive || prop === 'then') return undefined;
      if (prop in target) return target[prop];
      if (!cache.has(prop)) {
        const fn = (..._a: unknown[]) => stub;
        cache.set(prop, new Proxy(fn as never, handler));
      }
      return cache.get(prop);
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
    apply() {
      return stub;
    },
  };
  const stub = new Proxy(function () {} as never, handler) as Record<string, unknown> & ((...a: unknown[]) => unknown);

  stub.createTileMapSet = () => 'TMS';
  stub.getTileMapSetLayer = (_h: unknown, name: string) => `LAYER:${name}`;
  stub.tileWidth = () => stm.tw;
  stub.tileHeight = () => stm.th;
  stub.tileMapWidthPx = () => stm.walls[0].length * stm.tw;
  stub.tileMapHeightPx = () => stm.walls.length * stm.th;
  stub.tileAt = (_h: unknown, px: number, py: number) => {
    const c = Math.floor(px / stm.tw);
    const r = Math.floor(py / stm.th);
    return stm.walls[r]?.[c] ?? 0;
  };
  stub.allMarkers = () => stm.markers.map((m) => ({ ...(m as object) }));
  stub.getStageWidth = () => 640;
  stub.getStageHeight = () => 400;
  // `runProbes` writes each result through `new Text(label + ": OK|FAIL", ...)`.
  stub.createText = (content: unknown) => {
    probeLog.push(String(content));
    return {};
  };
  return stub;
}

function evalScene(code: string, stub: ReturnType<typeof makeSbStub>) {
  const deferred: Array<() => void> = [];
  (stub as Record<string, unknown>)._deferModuleBody = (cb: () => void) => deferred.push(cb);

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
    `${code}\n; return typeof _sb_litscene !== 'undefined' ? _sb_litscene : null;`,
  );
  const Scene = factory(stub, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return Scene as (new () => { onenter(): void }) | null;
}

describe('raycaster P5 demo probes execute', () => {
  test('LitScene.onenter runs runProbes and every probe passes', () => {
    const stmJson = JSON.parse(readFileSync(`${DIR}/assets/p5room.stm`, 'utf-8'));
    const stm = {
      walls: stmJson.layers.walls as number[][],
      markers: stmJson.layers.tags.markers as unknown[],
      tw: stmJson.tileWidth as number,
      th: stmJson.tileHeight as number,
    };

    const names = readdirSync(DIR)
      .filter((n) => n.endsWith('.bas'))
      .sort();
    const raw = names.map((name) => ({ name, source: readFileSync(`${DIR}/${name}`, 'utf-8') }));
    const { files, error } = sortByDependencies(raw);
    expect(error, 'dependency sort').toBeUndefined();
    const result = compiler.transpile({ lib, files });
    expect(result.diagnostics, 'diagnostics').toEqual([]);

    const probeLog: string[] = [];
    const stub = makeSbStub(probeLog, stm);
    const Scene = evalScene(String(result.code), stub);
    expect(Scene, 'LitScene class present').toBeTruthy();

    const scene = new Scene!();
    expect(() => scene.onenter()).not.toThrow();

    const results = probeLog.filter((l) => l.includes(': OK') || l.includes(': FAIL'));
    expect(results.length, 'probe count').toBe(5);
    expect(results.filter((l) => l.includes(': FAIL'))).toEqual([]);
  });
});
