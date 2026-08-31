# Raycaster Engine — Phase 1: World Model & Map Loader — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `raycaster` engine module that loads a tagged `.stm` tilemap into an in-memory height-aware world model and exposes read accessors, verified by unit tests and an unlisted phase demo.

**Architecture:** A new plain-script engine module `src/components/Runner/engine/raycaster.js` (concatenated into the runtime iframe like `tilemap.js`), a hand-written `raycaster.bas` def exposing the surface, and a separate `devDemoRegistry` so phase demos are seedable by Cypress without appearing on the public `/demos` page. Phase 1 does **no rendering** — it builds a data model from `.stm` layers and marker tags.

**Tech Stack:** TypeScript/React frontend, Vitest unit tests, Cypress e2e, softBASIC `.bas` defs, PIXI (not touched this phase).

**Spec:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` — this plan implements §3 (data model), the loader half of §4, the `loadMap` + cell-accessor portion of §9, and phase 1 of §11. The per-phase unlisted-demo mechanism (§10) is set up here for all later phases to reuse.

---

## File Structure

**Created:**
- `src/components/Runner/engine/raycaster.js` — the engine module: world model, `.stm` parser, tag parser, cell accessors. One responsibility: the raycaster world data model. Rendering/movement come in later phases as separate concerns inside this same file (spec §11), but Phase 1 keeps it to the loader.
- `src/lib/Basic4WebGL/defs/raycaster.bas` — hand-written softBASIC surface (NOT descriptor-generated; not added to `library/registry.ts`).
- `src/features/demos/devDemoRegistry.ts` — registry of unlisted phase demos; same shape as `demoRegistry`, never rendered on `/demos`.
- `tests/components/Runner/raycasterWorld.test.ts` — Vitest unit tests for `_parseTags` and `_buildWorld` (pure functions).
- `tests/lib/Basic4WebGL/unit/transpiler/raycaster.test.ts` — transpiler tests: the `.bas` surface compiles and emits the right `_sb.*` calls.
- `demo-src/raycaster-p1/Main.bas` — demo entry.
- `demo-src/raycaster-p1/MapProbeScene.bas` — demo scene that loads the map and prints cell data.
- `demo-src/raycaster-p1/assets/p1testmap.stm` — the test map.
- `src/docs/demos/RaycasterP1MapLoad.b4wgl.json` — build output (generated, committed).

**Modified:**
- `src/components/Runner/index.tsx` — import and concatenate `raycaster.js`.
- `src/components/Runner/softBasicEngine.js` — spread `_sbRaycaster` into `_sb`.
- `src/components/Runner/engine/stage.js` — call `this._raycasterReset()` in `clear()`.
- `src/constants/packageModules.ts` — import and register `raycaster.bas`.
- `src/pages/DemosPage.tsx` — `__seedDemo` falls back to `devDemoRegistry`.
- `src/features/demos/demoRegistry.ts` — export a shared `loadExportJson(file)` helper reused by both registries.
- `cypress/e2e/demos.cy.ts` — add the Phase 1 demo to a separate `DEV_DEMOS` loop.
- `tests/components/Runner/bootstrapper.test.ts` — add `raycaster.js` to the engine-scripts assertion if one exists (verify in Task 1).

---

## Task 1: Scaffold the engine module and wire it into the runtime

**Files:**
- Create: `src/components/Runner/engine/raycaster.js`
- Modify: `src/components/Runner/index.tsx`
- Modify: `src/components/Runner/softBasicEngine.js`
- Modify: `src/components/Runner/engine/stage.js`
- Test: `tests/components/Runner/raycasterWorld.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/components/Runner/raycasterWorld.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/raycaster.js is a plain script: it declares a bare `const _sbRaycaster`
// that the runner concatenates into the sandboxed iframe. Evaluate it in a
// Function context — the same technique tilemap.test.ts / camera.test.ts use.
// `_sbAssets` is only referenced inside loadMap(), which these tests never call.
function loadRaycaster() {
  const src = readFileSync('src/components/Runner/engine/raycaster.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbRaycaster;`);
  return factory() as {
    _parseTags: (s: string) => Record<string, string | true>;
    _buildWorld: (stm: unknown) => {
      width: number;
      height: number;
      cells: Array<{
        wall: number; floorH: number; ceilH: number;
        wallTex: string | null; floorTex: string | null; ceilTex: string | null;
        upper: number; light: number; flags: number;
      }>;
      upperRegions: Array<{ name: string; floorH: number; ceilH: number }>;
    };
    _raycasterReset: () => void;
    mapWidth: () => number;
    cellWall: (x: number, y: number) => number;
  };
}

describe('raycaster module scaffold', () => {
  test('exposes the expected surface', () => {
    const rc = loadRaycaster();
    expect(typeof rc._parseTags).toBe('function');
    expect(typeof rc._buildWorld).toBe('function');
    expect(typeof rc._raycasterReset).toBe('function');
    expect(typeof rc.mapWidth).toBe('function');
  });

  test('with no world loaded, accessors return safe defaults', () => {
    const rc = loadRaycaster();
    rc._raycasterReset();
    expect(rc.mapWidth()).toBe(0);
    expect(rc.cellWall(0, 0)).toBe(1); // out-of-world reads as solid
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/Runner/raycasterWorld.test.ts`
Expected: FAIL — `ENOENT` reading `src/components/Runner/engine/raycaster.js` (file does not exist yet).

- [ ] **Step 3: Create the engine module**

Create `src/components/Runner/engine/raycaster.js`:

```js
// Raycaster engine module — Phase 1: world model + .stm map loader only.
// No rendering, no movement (spec docs/superpowers/specs/2026-08-31-raycaster-engine-design.md).
// Concatenated as a plain script into the runtime iframe (see src/components/Runner/index.tsx),
// exactly like engine/tilemap.js. `_sbAssets` (engine/assets.js) is a runtime global,
// only touched inside loadMap().
const _sbRaycaster = (() => {
  // ── constants (spec §9.1) ──────────────────────────────────────────────
  const STD_CEIL = 1.0; // default ceiling height in world units when untagged

  const FLAG_DOOR = 1;
  const FLAG_LIFT = 2;
  const FLAG_WATER = 4;
  const FLAG_SKY = 8;

  let _world = null;

  // "floor:2 ftex:grating door" -> { floor: "2", ftex: "grating", door: true }
  function _parseTags(tagString) {
    const props = {};
    if (!tagString) return props;
    for (const token of String(tagString).trim().split(/\s+/)) {
      if (!token) continue;
      const idx = token.indexOf(':');
      if (idx === -1) {
        props[token] = true;
      } else {
        props[token.slice(0, idx)] = token.slice(idx + 1);
      }
    }
    return props;
  }

  function _applyProps(cell, props, upperRegions, upperByName) {
    if ('tex' in props) cell.wallTex = String(props.tex);
    if ('floor' in props) cell.floorH = Number(props.floor);
    if ('ceil' in props) cell.ceilH = Number(props.ceil);
    if ('ftex' in props) cell.floorTex = String(props.ftex);
    if ('ctex' in props) cell.ceilTex = String(props.ctex);
    if ('light' in props) {
      cell.light = props.light === true ? 1 : (Number(props.light) || 1);
    }
    if (props.door) cell.flags |= FLAG_DOOR;
    if (props.lift) cell.flags |= FLAG_LIFT;
    if (props.water) cell.flags |= FLAG_WATER;
    if (props.sky) cell.flags |= FLAG_SKY;
    if ('upper' in props) {
      const name = props.upper === true ? '_default' : String(props.upper);
      let idx = upperByName.get(name);
      if (idx === undefined) {
        idx = upperRegions.length;
        upperRegions.push({
          name,
          floorH: cell.ceilH,
          ceilH: cell.ceilH + STD_CEIL,
          floorTex: null,
          ceilTex: null,
          wallTex: null,
        });
        upperByName.set(name, idx);
      }
      cell.upper = idx;
    }
  }

  // stm: parsed .stm object { tileWidth, tileHeight, tileImage, layers: {...} }.
  // layers values are either a number[][] grid, or { type: 'markers', markers: [...] },
  // or { type: 'collision', data: [...] } (ignored by the raycaster).
  function _buildWorld(stm) {
    const layers = (stm && stm.layers) || {};
    const wallsGrid = Array.isArray(layers.walls) ? layers.walls : null;
    const floorGrid = Array.isArray(layers.floor) ? layers.floor : null;
    const refGrid = wallsGrid || floorGrid;
    if (!refGrid) {
      throw new Error('raycaster.loadMap: .stm has no "walls" or "floor" tile layer');
    }
    const height = refGrid.length;
    const width = refGrid[0] ? refGrid[0].length : 0;

    const cells = new Array(width * height);
    for (let i = 0; i < cells.length; i++) {
      cells[i] = {
        wall: 0,
        floorH: 0,
        ceilH: STD_CEIL,
        wallTex: null,
        floorTex: null,
        ceilTex: null,
        upper: -1,
        light: 0,
        flags: 0,
      };
    }

    if (wallsGrid) {
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const id = (wallsGrid[row] && wallsGrid[row][col]) || 0;
          if (id) cells[row * width + col].wall = id;
        }
      }
    }

    const upperRegions = [];
    const upperByName = new Map();

    for (const layerName of Object.keys(layers)) {
      const layer = layers[layerName];
      if (!layer || Array.isArray(layer) || layer.type !== 'markers') continue;
      for (const m of layer.markers || []) {
        if (m.row < 0 || m.col < 0 || m.row >= height || m.col >= width) continue;
        const cell = cells[m.row * width + m.col];
        _applyProps(cell, _parseTags(m.tag), upperRegions, upperByName);
      }
    }

    return { width, height, cells, upperRegions };
  }

  function _cellAt(x, y) {
    if (!_world) return null;
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    if (cx < 0 || cy < 0 || cx >= _world.width || cy >= _world.height) return null;
    return _world.cells[cy * _world.width + cx];
  }

  return {
    // Called by stage.clear() on every scene switch — see engine/stage.js.
    _raycasterReset() {
      _world = null;
    },

    loadMap(stmPath) {
      const raw = _sbAssets.get(stmPath);
      const stm = typeof raw === 'string' ? JSON.parse(raw) : raw;
      _world = _buildWorld(stm);
    },

    mapWidth() {
      return _world ? _world.width : 0;
    },
    mapHeight() {
      return _world ? _world.height : 0;
    },
    cellWall(x, y) {
      const c = _cellAt(x, y);
      return c ? c.wall : 1; // out-of-world reads as solid wall
    },
    cellFloorHeight(x, y) {
      const c = _cellAt(x, y);
      return c ? c.floorH : 0;
    },
    cellCeilHeight(x, y) {
      const c = _cellAt(x, y);
      return c ? c.ceilH : 0;
    },
    cellFlags(x, y) {
      const c = _cellAt(x, y);
      return c ? c.flags : 0;
    },
    cellHasUpper(x, y) {
      const c = _cellAt(x, y);
      return c && c.upper >= 0 ? 1 : 0;
    },

    // Exposed for unit tests only (tests/components/Runner/raycasterWorld.test.ts).
    _parseTags,
    _buildWorld,
  };
})();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/components/Runner/raycasterWorld.test.ts`
Expected: PASS (both tests).

- [ ] **Step 5: Wire the module into the runtime iframe**

In `src/components/Runner/index.tsx`, add the import next to the other engine imports (after the `sbParticles` line):

```tsx
import sbParticles from './engine/particles.js?raw';
import sbRaycaster from './engine/raycaster.js?raw';
```

Then add `sbRaycaster` to the concatenation array. Find the line beginning `[sbLifecycle, sbInput, ...` and insert `sbRaycaster` immediately before `sbScene`:

```tsx
[sbLifecycle, sbInput, sbAssets, sbFile, sbSave, sbAudio, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, sbTilemaps, sbCollision, sbPathfinding, sbTween, sbAttach, sbParticles, sbRaycaster, sbScene, sbCamera, sbFrameLoop, softBasicEngine].join('\n')
```

- [ ] **Step 6: Spread the module into `_sb`**

In `src/components/Runner/softBasicEngine.js`, add `..._sbRaycaster,` immediately after `..._sbParticles,` (mirroring the concat order in Step 5, and safely before the `..._sbFrameLoop` line that the file's comment says must stay last):

```js
  ..._sbParticles,
  ..._sbRaycaster,
```

- [ ] **Step 7: Reset world state on scene switch**

In `src/components/Runner/engine/stage.js`, inside the `clear()` method, add the raycaster reset next to the other module resets:

```js
    this._cameraReset();
    this._pathfindingReset();
    this._tileCollisionReset();
    this._frameLoopReset();
    this._raycasterReset();
```

- [ ] **Step 8: Check the bootstrapper test for an engine-scripts assertion**

Run: `grep -n "particles.js\|engine/.*\.js?raw\|engineScripts" tests/components/Runner/bootstrapper.test.ts`

If a test asserts the exact list/order of engine scripts concatenated in `index.tsx`, update it to include `./engine/raycaster.js?raw` in the same position used in Step 5. If no such assertion exists (grep is empty), skip — do not add one.

- [ ] **Step 9: Run the full runner test suite**

Run: `npx vitest run tests/components/Runner/`
Expected: PASS (all files, including the existing `bootstrapper.test.ts` and `stage`-related tests).

- [ ] **Step 10: Verify the build**

Run: `npx vite build`
Expected: build completes with no errors.

- [ ] **Step 11: Commit**

```bash
git add src/components/Runner/engine/raycaster.js src/components/Runner/index.tsx src/components/Runner/softBasicEngine.js src/components/Runner/engine/stage.js tests/components/Runner/raycasterWorld.test.ts
git add tests/components/Runner/bootstrapper.test.ts 2>/dev/null || true
git commit -m "feat(raycaster): scaffold engine module with .stm world-model loader"
```

---

## Task 2: Tag parser — full coverage

**Files:**
- Modify: `src/components/Runner/engine/raycaster.js` (no change expected; this task locks behaviour with tests)
- Test: `tests/components/Runner/raycasterWorld.test.ts:` add a `describe('raycaster _parseTags')` block

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/raycasterWorld.test.ts`:

```ts
describe('raycaster _parseTags', () => {
  test('parses key:value tokens', () => {
    const rc = loadRaycaster();
    expect(rc._parseTags('floor:2 ceil:6')).toEqual({ floor: '2', ceil: '6' });
  });

  test('parses bare flags as true', () => {
    const rc = loadRaycaster();
    expect(rc._parseTags('door sky')).toEqual({ door: true, sky: true });
  });

  test('mixes flags and key:value, tolerates extra whitespace', () => {
    const rc = loadRaycaster();
    expect(rc._parseTags('  floor:1   ftex:grating   lift ')).toEqual({
      floor: '1',
      ftex: 'grating',
      lift: true,
    });
  });

  test('empty / null / undefined tag -> empty object', () => {
    const rc = loadRaycaster();
    expect(rc._parseTags('')).toEqual({});
    expect(rc._parseTags(null as unknown as string)).toEqual({});
    expect(rc._parseTags(undefined as unknown as string)).toEqual({});
  });

  test('a value containing a colon keeps everything after the first colon', () => {
    const rc = loadRaycaster();
    expect(rc._parseTags('tex:wall:variant2')).toEqual({ tex: 'wall:variant2' });
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npx vitest run tests/components/Runner/raycasterWorld.test.ts`
Expected: PASS. (The implementation from Task 1 already satisfies these. If any fail, fix `_parseTags` in `raycaster.js` to match the specified behaviour, then re-run.)

- [ ] **Step 3: Commit**

```bash
git add tests/components/Runner/raycasterWorld.test.ts
git commit -m "test(raycaster): lock tag-parser behaviour"
```

---

## Task 3: World builder — grids, heights, flags, upper regions

**Files:**
- Modify: `src/components/Runner/engine/raycaster.js` (only if a test exposes a bug)
- Test: `tests/components/Runner/raycasterWorld.test.ts:` add a `describe('raycaster _buildWorld')` block

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/raycasterWorld.test.ts`:

```ts
describe('raycaster _buildWorld', () => {
  // 3x2 map: row 0 all wall, row 1 open. One marker raises floor of (col1,row1).
  const stm = {
    tileWidth: 16,
    tileHeight: 16,
    tileImage: 'placeholder.png',
    layers: {
      floor: [
        [1, 1, 1],
        [1, 1, 1],
      ],
      walls: [
        [7, 7, 7],
        [0, 0, 0],
      ],
      tags: {
        type: 'markers',
        markers: [
          { row: 1, col: 1, tag: 'floor:2 ftex:grating' },
          { row: 1, col: 2, tag: 'door' },
          { row: 0, col: 0, tag: 'tex:concrete' },
        ],
      },
    },
  };

  test('dimensions come from the walls grid', () => {
    const rc = loadRaycaster();
    const w = rc._buildWorld(stm);
    expect(w.width).toBe(3);
    expect(w.height).toBe(2);
    expect(w.cells).toHaveLength(6);
  });

  test('wall ids are copied from the walls layer, 0 elsewhere', () => {
    const rc = loadRaycaster();
    const w = rc._buildWorld(stm);
    expect(w.cells[0 * 3 + 0].wall).toBe(7);
    expect(w.cells[1 * 3 + 0].wall).toBe(0);
  });

  test('untagged cells get default heights', () => {
    const rc = loadRaycaster();
    const w = rc._buildWorld(stm);
    expect(w.cells[1 * 3 + 0].floorH).toBe(0);
    expect(w.cells[1 * 3 + 0].ceilH).toBe(1.0);
  });

  test('marker tags apply to the addressed cell', () => {
    const rc = loadRaycaster();
    const w = rc._buildWorld(stm);
    const raised = w.cells[1 * 3 + 1];
    expect(raised.floorH).toBe(2);
    expect(raised.floorTex).toBe('grating');
    expect(w.cells[0 * 3 + 0].wallTex).toBe('concrete');
  });

  test('bare flag tokens set the flags bitset (door = 1)', () => {
    const rc = loadRaycaster();
    const w = rc._buildWorld(stm);
    expect(w.cells[1 * 3 + 2].flags & 1).toBe(1);
  });

  test('two markers naming the same upper region share one table entry', () => {
    const rc = loadRaycaster();
    const w = rc._buildWorld({
      ...stm,
      layers: {
        ...stm.layers,
        tags: {
          type: 'markers',
          markers: [
            { row: 1, col: 0, tag: 'upper:vent' },
            { row: 1, col: 1, tag: 'upper:vent' },
            { row: 1, col: 2, tag: 'upper:balcony' },
          ],
        },
      },
    });
    expect(w.upperRegions).toHaveLength(2);
    expect(w.cells[1 * 3 + 0].upper).toBe(w.cells[1 * 3 + 1].upper);
    expect(w.cells[1 * 3 + 2].upper).not.toBe(w.cells[1 * 3 + 0].upper);
  });

  test('falls back to the floor grid for dimensions when there is no walls layer', () => {
    const rc = loadRaycaster();
    const w = rc._buildWorld({
      layers: { floor: [[1, 1, 1, 1]] },
    });
    expect(w.width).toBe(4);
    expect(w.height).toBe(1);
  });

  test('throws when the .stm has no walls and no floor layer', () => {
    const rc = loadRaycaster();
    expect(() => rc._buildWorld({ layers: { collision: { type: 'collision', data: [] } } })).toThrow(
      /no "walls" or "floor"/,
    );
  });

  test('markers outside the grid are ignored, not fatal', () => {
    const rc = loadRaycaster();
    const w = rc._buildWorld({
      ...stm,
      layers: {
        ...stm.layers,
        tags: { type: 'markers', markers: [{ row: 99, col: 99, tag: 'door' }] },
      },
    });
    expect(w.cells.every((c) => c.flags === 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npx vitest run tests/components/Runner/raycasterWorld.test.ts`
Expected: PASS. If any fail, fix the corresponding logic in `_buildWorld` / `_applyProps` in `src/components/Runner/engine/raycaster.js` to match the specified behaviour, then re-run until green.

- [ ] **Step 3: Commit**

```bash
git add tests/components/Runner/raycasterWorld.test.ts src/components/Runner/engine/raycaster.js
git commit -m "test(raycaster): lock world-builder behaviour for grids, heights, flags, upper regions"
```

---

## Task 4: `loadMap` + accessors against a real asset string

**Files:**
- Test: `tests/components/Runner/raycasterWorld.test.ts:` add a `describe('raycaster loadMap + accessors')` block that concatenates `assets.js` + `raycaster.js` with a stub, the way `tilemap.test.ts` does for `loadTilemapWithAssets`.

- [ ] **Step 1: Write the failing test**

Append to `tests/components/Runner/raycasterWorld.test.ts`:

```ts
describe('raycaster loadMap + accessors', () => {
  // Concatenate assets.js + raycaster.js so loadMap()'s `_sbAssets.get` resolves,
  // same technique as tilemap.test.ts's loadTilemapWithAssets.
  function loadWithAssets(assetName: string, rawStm: string) {
    const assetsSrc = readFileSync('src/components/Runner/engine/assets.js', 'utf-8');
    const raycasterSrc = readFileSync('src/components/Runner/engine/raycaster.js', 'utf-8');
    const factory = new Function(
      'PIXI',
      `${assetsSrc}\n${raycasterSrc}\n` +
        `_sbAssets._assetCache = _sbAssets._assetCache || {};\n` +
        `return { _sbAssets, _sbRaycaster };`,
    );
    const { _sbAssets, _sbRaycaster } = factory({});
    // assets.js exposes get() reading an internal cache; seed it directly.
    // If assets.js has no writable cache hook, fall back to monkey-patching get:
    _sbAssets.get = (name: string) => {
      if (name === assetName) return rawStm;
      throw new Error(`unexpected asset ${name}`);
    };
    return _sbRaycaster;
  }

  const rawStm = JSON.stringify({
    tileWidth: 16,
    tileHeight: 16,
    tileImage: 'placeholder.png',
    layers: {
      walls: [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1],
      ],
      tags: {
        type: 'markers',
        markers: [{ row: 1, col: 1, tag: 'floor:3 ceil:5 sky' }],
      },
    },
  });

  test('loadMap parses a JSON string and populates accessors', () => {
    const rc = loadWithAssets('p1testmap.stm', rawStm);
    rc._raycasterReset();
    rc.loadMap('p1testmap.stm');
    expect(rc.mapWidth()).toBe(3);
    expect(rc.mapHeight()).toBe(3);
    expect(rc.cellWall(0, 0)).toBe(1);
    expect(rc.cellWall(1, 1)).toBe(0);
    expect(rc.cellFloorHeight(1, 1)).toBe(3);
    expect(rc.cellCeilHeight(1, 1)).toBe(5);
    expect(rc.cellFlags(1, 1) & 8).toBe(8); // FLAG_SKY
  });

  test('accessors take world coordinates and floor them to a cell', () => {
    const rc = loadWithAssets('p1testmap.stm', rawStm);
    rc._raycasterReset();
    rc.loadMap('p1testmap.stm');
    expect(rc.cellFloorHeight(1.9, 1.1)).toBe(3);
  });

  test('reads outside the loaded map return solid-wall defaults', () => {
    const rc = loadWithAssets('p1testmap.stm', rawStm);
    rc._raycasterReset();
    rc.loadMap('p1testmap.stm');
    expect(rc.cellWall(-1, 0)).toBe(1);
    expect(rc.cellWall(3, 3)).toBe(1);
    expect(rc.cellFloorHeight(9, 9)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails or passes**

Run: `npx vitest run tests/components/Runner/raycasterWorld.test.ts`
Expected: PASS if `assets.js`'s `get` is monkey-patchable as written. If the `new Function` wrapper throws because `assets.js` references a global the stub does not provide (e.g. `PIXI.Assets`), adjust the factory: pass additional stub globals as extra `new Function` parameters (mirror exactly what `tilemap.test.ts`'s `loadTilemapWithAssets` passes) until the module evaluates, keeping the `_sbAssets.get` monkey-patch. Do not change `raycaster.js` for this — the production `loadMap` is already correct; this is test-harness plumbing.

- [ ] **Step 3: Commit**

```bash
git add tests/components/Runner/raycasterWorld.test.ts
git commit -m "test(raycaster): verify loadMap parses a real .stm asset string"
```

---

## Task 5: The `raycaster.bas` softBASIC surface

**Files:**
- Create: `src/lib/Basic4WebGL/defs/raycaster.bas`
- Modify: `src/constants/packageModules.ts`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/raycaster.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/unit/transpiler/raycaster.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const raycasterSource = readFileSync('src/lib/Basic4WebGL/defs/raycaster.bas', 'utf-8');

const transpileWithRaycaster = (lines: string[]) =>
  compiler.transpile({
    lib: [{ name: 'raycaster', source: raycasterSource }],
    files: [{ name: 'Main.bas', source: lines.join('\n') }],
  });

describe('raycaster.bas — Phase 1 surface', () => {
  test('the def file itself compiles with no diagnostics', () => {
    const result = transpileWithRaycaster([
      'function test()',
      '  dim w',
      '  raycaster.loadMap("level.stm")',
      '  w = raycaster.mapWidth()',
      'endfunction',
    ]);
    expect(result.diagnostics).toHaveLength(0);
  });

  test('loadMap emits _sb.loadMap(', () => {
    const result = transpileWithRaycaster([
      'function test()',
      '  raycaster.loadMap("level.stm")',
      'endfunction',
    ]);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.loadMap(');
  });

  test('cell accessors emit their _sb.* calls', () => {
    const result = transpileWithRaycaster([
      'function test()',
      '  dim a',
      '  dim b',
      '  dim c',
      '  dim d',
      '  dim e',
      '  a = raycaster.cellWall(1, 2)',
      '  b = raycaster.cellFloorHeight(1, 2)',
      '  c = raycaster.cellCeilHeight(1, 2)',
      '  d = raycaster.cellFlags(1, 2)',
      '  e = raycaster.cellHasUpper(1, 2)',
      'endfunction',
    ]);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.cellWall(');
    expect(result.code).toContain('_sb.cellFloorHeight(');
    expect(result.code).toContain('_sb.cellCeilHeight(');
    expect(result.code).toContain('_sb.cellFlags(');
    expect(result.code).toContain('_sb.cellHasUpper(');
  });

  test('mapWidth / mapHeight emit their _sb.* calls', () => {
    const result = transpileWithRaycaster([
      'function test()',
      '  dim w',
      '  dim h',
      '  w = raycaster.mapWidth()',
      '  h = raycaster.mapHeight()',
      'endfunction',
    ]);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.mapWidth(');
    expect(result.code).toContain('_sb.mapHeight(');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/raycaster.test.ts`
Expected: FAIL — `ENOENT` reading `src/lib/Basic4WebGL/defs/raycaster.bas`.

- [ ] **Step 3: Create the def file**

Create `src/lib/Basic4WebGL/defs/raycaster.bas` (hand-written; parameter names follow the `<lowercasedfunc>_<arg>` convention used across every def file, e.g. `collision.bas`):

```basic
function loadMap(path)
    call("_sb.loadMap(loadmap_path)")
endfunction

function mapWidth()
    return call("_sb.mapWidth()")
endfunction

function mapHeight()
    return call("_sb.mapHeight()")
endfunction

function cellWall(x, y)
    return call("_sb.cellWall(cellwall_x, cellwall_y)")
endfunction

function cellFloorHeight(x, y)
    return call("_sb.cellFloorHeight(cellfloorheight_x, cellfloorheight_y)")
endfunction

function cellCeilHeight(x, y)
    return call("_sb.cellCeilHeight(cellceilheight_x, cellceilheight_y)")
endfunction

function cellFlags(x, y)
    return call("_sb.cellFlags(cellflags_x, cellflags_y)")
endfunction

function cellHasUpper(x, y)
    return call("_sb.cellHasUpper(cellhasupper_x, cellhasupper_y)")
endfunction
```

- [ ] **Step 4: Register the def for the runtime**

In `src/constants/packageModules.ts`, add the import next to the other def imports (after the `Emitter` import):

```ts
import Emitter from '../lib/Basic4WebGL/defs/Emitter.bas?raw';
import raycaster from '../lib/Basic4WebGL/defs/raycaster.bas?raw';
```

And add `raycaster,` to the `packageModules` object (after `Emitter,`):

```ts
  Emitter,
  raycaster,
};
```

- [ ] **Step 5: Run the transpiler test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/raycaster.test.ts`
Expected: PASS (all tests).

- [ ] **Step 6: Run the full unit suite**

Run: `npx vitest run`
Expected: PASS. Pay attention to any test that snapshots the full module list or `packageModules` keys — if one fails purely because `raycaster` was added, update its expectation.

- [ ] **Step 7: Verify the build**

Run: `npx vite build`
Expected: build completes with no errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/Basic4WebGL/defs/raycaster.bas src/constants/packageModules.ts tests/lib/Basic4WebGL/unit/transpiler/raycaster.test.ts
git commit -m "feat(raycaster): add raycaster.bas Phase 1 surface (loadMap + cell accessors)"
```

---

## Task 6: Unlisted phase-demo infrastructure

**Files:**
- Create: `src/features/demos/devDemoRegistry.ts`
- Modify: `src/features/demos/demoRegistry.ts`
- Modify: `src/pages/DemosPage.tsx`
- Test: `tests/features/demos/devDemoRegistry.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/features/demos/devDemoRegistry.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { devDemoRegistry } from '../../../src/features/demos/devDemoRegistry';
import { demoRegistry } from '../../../src/features/demos/demoRegistry';

describe('devDemoRegistry', () => {
  test('every dev demo has a slug, a file, and a title', () => {
    for (const d of devDemoRegistry) {
      expect(d.slug).toBeTruthy();
      expect(d.file).toBeTruthy();
      expect(d.name).toBeTruthy();
    }
  });

  test('dev demo slugs never collide with public demo slugs', () => {
    const publicSlugs = new Set(demoRegistry.map((d) => d.slug));
    for (const d of devDemoRegistry) {
      expect(publicSlugs.has(d.slug)).toBe(false);
    }
  });

  test('includes the Phase 1 map-load demo', () => {
    const p1 = devDemoRegistry.find((d) => d.slug === 'raycaster-p1-mapload');
    expect(p1).toBeDefined();
    expect(p1?.file).toBe('RaycasterP1MapLoad');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/features/demos/devDemoRegistry.test.ts`
Expected: FAIL — cannot resolve `src/features/demos/devDemoRegistry`.

- [ ] **Step 3: Extract a shared loader in `demoRegistry.ts`**

In `src/features/demos/demoRegistry.ts`, replace the body of `loadDemoJson` so the dynamic-import step is reusable. The current function is:

```ts
export async function loadDemoJson(slug: string): Promise<ProjectExportJson> {
  const entry = demoRegistry.find((d) => d.slug === slug);
  if (!entry) throw new Error(`Unknown demo slug: ${slug}`);
  const mod = await import(`../../docs/demos/${entry.file}.b4wgl.json`);
  return (mod.default ?? mod) as ProjectExportJson;
}
```

Replace it with:

```ts
export async function loadExportJson(file: string): Promise<ProjectExportJson> {
  const mod = await import(`../../docs/demos/${file}.b4wgl.json`);
  return (mod.default ?? mod) as ProjectExportJson;
}

export async function loadDemoJson(slug: string): Promise<ProjectExportJson> {
  const entry = demoRegistry.find((d) => d.slug === slug);
  if (!entry) throw new Error(`Unknown demo slug: ${slug}`);
  return loadExportJson(entry.file);
}
```

- [ ] **Step 4: Create the dev registry**

Create `src/features/demos/devDemoRegistry.ts`:

```ts
import { DemoEntry } from './demoRegistry';

// Phase demos for the raycaster engine build-out. Deliberately NOT rendered on
// the public /demos page (DemosPage only maps `demoRegistry`). They exist so
// each engine phase ships a runnable, Cypress-verified artifact — see
// docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §10.
export const devDemoRegistry: DemoEntry[] = [
  {
    slug: 'raycaster-p1-mapload',
    name: 'Raycaster P1 — Map Load',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 1 probe: loads a tagged .stm into the raycaster world model and prints cell heights, flags and upper-region data. No rendering.',
    docsSlug: '',
    file: 'RaycasterP1MapLoad',
  },
];
```

- [ ] **Step 5: Make `__seedDemo` fall back to the dev registry**

In `src/pages/DemosPage.tsx`, add the import:

```tsx
import { demoRegistry, DemoEntry, loadDemoJson } from '../features/demos/demoRegistry';
import { devDemoRegistry } from '../features/demos/devDemoRegistry';
import { loadExportJson } from '../features/demos/demoRegistry';
```

(If `DemosPage.tsx` already imports from `'../features/demos/demoRegistry'` on one line, add `loadExportJson` to that existing import list instead of a second import line.)

Then find the `__seedDemo` assignment (around line 23):

```tsx
  (window as unknown as { __seedDemo?: (slug: string) => Promise<string> }).__seedDemo = async (
    slug,
  ) => {
    const json = await loadDemoJson(slug);
```

Change the `const json = ...` line to try the dev registry first when the slug is not public:

```tsx
    const devEntry = devDemoRegistry.find((d) => d.slug === slug);
    const json = devEntry ? await loadExportJson(devEntry.file) : await loadDemoJson(slug);
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/features/demos/devDemoRegistry.test.ts`
Expected: FAIL still — the `raycaster-p1-mapload` test passes only once the entry exists (it does now), but the "includes the Phase 1 map-load demo" test needs the registry entry, which Step 4 added. Re-run:

Run: `npx vitest run tests/features/demos/devDemoRegistry.test.ts`
Expected: PASS.

- [ ] **Step 7: Run the broader demo + page suite**

Run: `npx vitest run tests/features/demos/ tests/pages/ 2>/dev/null; npx vitest run tests/features/demos/`
Expected: PASS. If a `demoRegistry` test asserts `loadDemoJson`'s old shape, update it to the new `loadExportJson` + `loadDemoJson` split.

- [ ] **Step 8: Verify the build**

Run: `npx vite build`
Expected: build completes with no errors.

- [ ] **Step 9: Commit**

```bash
git add src/features/demos/devDemoRegistry.ts src/features/demos/demoRegistry.ts src/pages/DemosPage.tsx tests/features/demos/devDemoRegistry.test.ts
git commit -m "feat(demos): unlisted dev-demo registry for engine phase demos"
```

---

## Task 7: The Phase 1 demo — source, map, build, e2e

**Files:**
- Create: `demo-src/raycaster-p1/Main.bas`
- Create: `demo-src/raycaster-p1/MapProbeScene.bas`
- Create: `demo-src/raycaster-p1/assets/p1testmap.stm`
- Create: `src/docs/demos/RaycasterP1MapLoad.b4wgl.json` (generated)
- Modify: `cypress/e2e/demos.cy.ts`

- [ ] **Step 1: Create the test map**

Create `demo-src/raycaster-p1/assets/p1testmap.stm` (a 5×5 room: solid border, open interior, one raised-floor cell, one pit cell, one `upper` cell, one door):

```json
{
  "tileWidth": 16,
  "tileHeight": 16,
  "tileImage": "placeholder.png",
  "layers": {
    "floor": [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1]
    ],
    "walls": [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1]
    ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 1, "col": 1, "tag": "floor:2 ftex:grating" },
        { "row": 2, "col": 2, "tag": "floor:-3 ctex:pipes" },
        { "row": 3, "col": 3, "tag": "upper:vent ceil:4" },
        { "row": 1, "col": 3, "tag": "tex:concrete door" }
      ]
    }
  }
}
```

- [ ] **Step 2: Create the demo scene**

Create `demo-src/raycaster-p1/MapProbeScene.bas`:

```basic
Class
Extends scene

dim titleText as Text
dim line1 as Text
dim line2 as Text
dim line3 as Text

Constructor()
EndConstructor

function onenter()
  world.setBackground(12, 12, 18)
  raycaster.loadMap("p1testmap.stm")

  self.titleText = new Text("Raycaster P1 — map probe", 24, 24)
  self.titleText.setStyle(22, 255, 220, 120)
  hud.add(self.titleText)

  dim w
  dim h
  w = raycaster.mapWidth()
  h = raycaster.mapHeight()

  self.line1 = new Text("map " + string.str(w) + " x " + string.str(h), 24, 60)
  self.line1.setStyle(16, 255, 255, 255)
  hud.add(self.line1)

  dim raisedFloor
  raisedFloor = raycaster.cellFloorHeight(1, 1)
  self.line2 = new Text("floor at (1,1) = " + string.str(raisedFloor), 24, 84)
  self.line2.setStyle(16, 255, 255, 255)
  hud.add(self.line2)

  dim hasUpper
  hasUpper = raycaster.cellHasUpper(3, 3)
  self.line3 = new Text("cell (3,3) has upper region = " + string.str(hasUpper), 24, 108)
  self.line3.setStyle(16, 255, 255, 255)
  hud.add(self.line3)

  self.drawTopDown(w, h)
endfunction

function drawTopDown(w, h)
  dim cx
  dim cy
  dim originX
  dim originY
  dim sizePx
  originX = 24
  originY = 150
  sizePx = 28

  for cy = 0 to h - 1
    for cx = 0 to w - 1
      if raycaster.cellWall(cx, cy) > 0 then
        pen.setFillColor(90, 100, 140)
      else
        pen.setFillColor(30, 34, 44)
      endif
      pen.setLineWidth(1)
      pen.setLineColor(0, 0, 0)
      drawing.drawRect(originX + cx * sizePx + sizePx / 2, originY + cy * sizePx + sizePx / 2, sizePx - 2, sizePx - 2)
    next cx
  next cy
endfunction

EndClass
```

- [ ] **Step 3: Create the demo entry point**

Create `demo-src/raycaster-p1/Main.bas`:

```basic
function oninit()
  world.setPixelPerfect(true)
endfunction

dim probe = new MapProbeScene()
scenemanager.register("probe", probe)
scenemanager.switch("probe")
```

- [ ] **Step 4: Verify the demo source compiles in isolation**

Create `tests/scratch/raycasterP1DemoCompiles.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { packageModules } from '../../src/constants/packageModules';

describe('raycaster P1 demo source compiles', () => {
  test('Main + MapProbeScene transpile with no diagnostics', () => {
    const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
    const result = compiler.transpile({
      lib,
      files: [
        { name: 'MapProbeScene.bas', source: readFileSync('demo-src/raycaster-p1/MapProbeScene.bas', 'utf-8') },
        { name: 'Main.bas', source: readFileSync('demo-src/raycaster-p1/Main.bas', 'utf-8') },
      ],
    });
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

Run: `npx vitest run tests/scratch/raycasterP1DemoCompiles.test.ts`
Expected: PASS. If it fails on a call-syntax error, fix the `.bas` demo source (check `src/lib/Basic4WebGL/defs/string.bas`, `text.bas`, `pen.bas`, `drawing.bas` for exact signatures per CLAUDE.md's "API cross-reference rule"), then re-run.

Once green, mark the scratch test retired per CLAUDE.md (change `describe(` to `describe.skip(`).

- [ ] **Step 5: Build the demo export**

Run: `npm run build:demo -- demo-src/raycaster-p1 RaycasterP1MapLoad`
Expected: `Wrote src/docs/demos/RaycasterP1MapLoad.b4wgl.json (2 file(s), 1 asset(s))`

- [ ] **Step 6: Add the Cypress e2e block**

In `cypress/e2e/demos.cy.ts`, after the existing `DEMOS.forEach(...)` block, add a separate loop for dev demos:

```ts
const DEV_DEMOS: Array<{ slug: string; title: string; waitMs: number }> = [
  { slug: 'raycaster-p1-mapload', title: 'Raycaster P1 — Map Load', waitMs: 3000 },
];

DEV_DEMOS.forEach(({ slug, title, waitMs }) => {
  describe(`Dev demo: ${title}`, () => {
    it('runs without runtime errors', () => {
      cy.visit('/demos');
      cy.window().its('__seedDemo').should('be.a', 'function');
      cy.window()
        .then((win) =>
          (win as unknown as { __seedDemo: (s: string) => Promise<string> }).__seedDemo(slug),
        )
        .then((projectId) => {
          cy.visit(`/projects/${projectId}/edit`);
          cy.get('[aria-label="Run project"]', { timeout: 15000 }).click();
          cy.wait(waitMs);
          cy.get('span').contains('ERR').should('not.exist');
        });
    });
  });
});
```

- [ ] **Step 7: Run the e2e test**

In one terminal: `npm run dev`
In another: `npx cypress run --spec cypress/e2e/demos.cy.ts`
Expected: all demo specs pass, including `Dev demo: Raycaster P1 — Map Load`.

If Cypress cannot start the dev server itself, confirm `npm run dev` is serving on port 5173 first (per CLAUDE.md).

- [ ] **Step 8: Run the full unit suite once more**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add demo-src/raycaster-p1 src/docs/demos/RaycasterP1MapLoad.b4wgl.json cypress/e2e/demos.cy.ts tests/scratch/raycasterP1DemoCompiles.test.ts
git commit -m "test(raycaster): Phase 1 unlisted demo — map-load probe + e2e"
```

---

## Task 8: Documentation & roadmap

**Files:**
- Create: `src/docs/api-reference/raycaster.md`
- Modify: `src/docs/manifest.ts`
- Modify: `docs/roadmap.md`
- Modify: `docs/language/library-roadmap.md`

- [ ] **Step 1: Write the API reference page**

Create `src/docs/api-reference/raycaster.md`. Follow the API-doc writing style in CLAUDE.md (beginner audience, no JS internals, game-like examples, one-sentence description → parameter table → `**Returns:**` → `.bas` example per function):

```markdown
# raycaster

Loads a tilemap into a first-person world you can query for wall positions and
floor/ceiling heights. This is the first piece of the raycaster engine — later
versions draw the world and let the player walk around it.

> The map is built in the Tilemap Editor. Draw walls on a `walls` layer, then add
> **markers** with text tags to give cells height and other properties:
> `floor:2` raises a cell's floor, `ceil:6` raises its ceiling, `door` marks a
> doorway, `upper:vent` gives the cell a second space above it.

## raycaster.loadMap

Loads a `.stm` tilemap file into the raycaster.

| Parameter | Type | Description |
|---|---|---|
| path | string | The name of the `.stm` file in your project. |

```basic
raycaster.loadMap("level1.stm")
```

## raycaster.mapWidth

The width of the loaded map, in cells.

**Returns:** number

```basic
dim w
w = raycaster.mapWidth()
```

## raycaster.mapHeight

The height of the loaded map, in cells.

**Returns:** number

```basic
dim h
h = raycaster.mapHeight()
```

## raycaster.cellWall

Whether a cell holds a wall. `0` means the cell is open; any other number is a
wall texture id.

| Parameter | Type | Description |
|---|---|---|
| x | number | Cell column (world position is floored to a cell). |
| y | number | Cell row. |

**Returns:** number

```basic
if raycaster.cellWall(playerX, playerY) > 0 then
  print "there is a wall here"
endif
```

## raycaster.cellFloorHeight

The floor height of a cell. `0` is the standard floor; higher numbers are raised
platforms and steps, negative numbers are pits.

| Parameter | Type | Description |
|---|---|---|
| x | number | Cell column. |
| y | number | Cell row. |

**Returns:** number

```basic
dim step
step = raycaster.cellFloorHeight(3, 4)
```

## raycaster.cellCeilHeight

The ceiling height of a cell. Lower numbers are crawlspaces; higher numbers are
tall atriums.

| Parameter | Type | Description |
|---|---|---|
| x | number | Cell column. |
| y | number | Cell row. |

**Returns:** number

```basic
dim roof
roof = raycaster.cellCeilHeight(3, 4)
```

## raycaster.cellFlags

A number whose bits mark special cells: `1` door, `2` lift, `4` water, `8` open
sky.

| Parameter | Type | Description |
|---|---|---|
| x | number | Cell column. |
| y | number | Cell row. |

**Returns:** number

```basic
dim isDoor
isDoor = raycaster.cellFlags(2, 5)
```

## raycaster.cellHasUpper

Whether a cell has a second space above it (a `upper:` marker). Returns `1` or
`0`.

| Parameter | Type | Description |
|---|---|---|
| x | number | Cell column. |
| y | number | Cell row. |

**Returns:** number

```basic
if raycaster.cellHasUpper(6, 6) then
  print "there is a room above this one"
endif
```
```

- [ ] **Step 2: Add the page to the docs manifest**

In `src/docs/manifest.ts`, find the API Reference section's `groups` array and add a `raycaster` topic to the most appropriate group (create a new group `{ title: 'Raycaster', topics: [] }` with the topic if none fits). Match the exact `DocTopic` / `DocGroup` shape already used in the file — read the surrounding entries first. The topic's slug must be `raycaster` and its path must resolve to `src/docs/api-reference/raycaster.md`, matching how sibling API pages (e.g. `collision`, `pathfinding`) are declared.

- [ ] **Step 3: Verify the docs page renders**

Run: `npm run dev`, open `http://localhost:5173/docs`, navigate to the new Raycaster API page. Confirm it renders with all eight functions and no broken layout.

- [ ] **Step 4: Update the roadmap files**

In `docs/roadmap.md` and `docs/language/library-roadmap.md`: if either tracks a "raycaster engine" / "3D" / "first-person" item, mark Phase 1 (world model + map loader) done and note the remaining phases (2–10 from the spec) as the open work, linking `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`. If neither file mentions it, add a short tracked item under the appropriate section:

```markdown
- **Raycaster engine** (in progress) — a "DOOM plus a bit" first-person renderer as
  engine modules. Phase 1 (world model + tagged `.stm` loader) shipped. Phases 2–10
  (span cast, renderer, mover, lighting, actors, diagonal tiles, upper regions,
  optimisation) tracked in `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`.
```

Do **not** touch `src/docs/roadmap.md` unless it already has a matching public-facing item; a new internal engine-in-progress note does not belong on the public roadmap yet.

- [ ] **Step 5: Verify the build**

Run: `npx vite build`
Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/docs/api-reference/raycaster.md src/docs/manifest.ts docs/roadmap.md docs/language/library-roadmap.md
git commit -m "docs(raycaster): Phase 1 API reference + roadmap"
```

---

## Task 9: Phase close-out verification

**Files:** none (verification only)

- [ ] **Step 1: Full unit suite**

Run: `npx vitest run`
Expected: PASS, no skipped tests other than the retired scratch file from Task 7 Step 4.

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: clean build.

- [ ] **Step 3: E2E**

`npm run dev` in one terminal; `npx cypress run --spec cypress/e2e/demos.cy.ts` in another.
Expected: all specs pass including the Phase 1 dev demo.

- [ ] **Step 4: Manual smoke**

`npm run dev`, open `/demos` is NOT expected to show the Phase 1 demo (confirm it does **not** appear). Then in the browser console on `/demos`: `await window.__seedDemo('raycaster-p1-mapload')` returns a project id; open `/projects/<id>/edit`, Run, confirm the probe text and top-down grid render and the console panel shows no `ERR`.

- [ ] **Step 5: Confirm the spec's Phase 1 checklist**

Re-read spec §11 Phase 1 and §3. Every cell field in §3.1 is present in the world model (`wall`, `floorH`, `ceilH`, `floorTex`, `ceilTex`, `upper`, `light`, `flags`). The `.stm` authoring model in §3.3 (semantic placeholder tiles + `TileMapSet` tags parsed by the loader) is what Task 3/7 implement. If anything is missing, open a follow-up task before declaring Phase 1 done.

---

## Notes for later phases (not this plan)

- **Spec §3.3 clarification discovered during planning:** markers carry a single free-text `tag` string (`{ row, col, tag }`), not structured properties. The loader parses space-separated `key:value` / bare-flag tokens out of that string, and multiple markers on one cell merge. No `.stm` format or Tilemap Editor change is needed. This should be back-ported into spec §3.3 as a one-line clarification.
- Phase 2 (span builder) adds pure functions to `raycaster.js` and its own `raycaster-p2` dev demo drawing a top-down span visualisation.
- The grid atlas (spec §5.3) and texture-slot resolution land in Phase 3 — Phase 1 stores texture **names** as strings on cells, unresolved.
