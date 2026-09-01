# Raycaster Engine — Phase 1: `RcWorld` + Map Loader — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `RcWorld.bas` — a softBASIC library module that reads a tagged `.stm` tilemap into an in-memory height-aware world model — plus the one generic engine addition it needs (`tilemap` marker/tile-metric accessors), verified by JS unit tests and an unlisted Cypress phase demo.

**Architecture:** The raycaster is built **in softBASIC** (spec §1.1). Phase 1 adds no `_sb` module. It adds:
1. a small **generic** improvement to the existing `tilemap` engine module (JS + `.bas` def + JS unit tests + docs) — `tilemapset.allMarkers()`, `.tileWidth()`, `.tileHeight()` — because a softBASIC library currently has no way to enumerate markers or learn a map's cell size;
2. `RcWorld.bas`, a pure-softBASIC module that consumes those to build parallel arrays of per-cell `wall / floorH / ceilH / flags / upper / tex` data;
3. the `devDemoRegistry` mechanism so every later phase's demo is Cypress-seedable without appearing on `/demos`.

**Tech Stack:** TypeScript/React, Vitest (JS unit tests only — the `.bas` logic is Cypress-verified per spec §1.2), Cypress e2e, softBASIC.

**Spec:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` — implements §3 (data model + §3.3 authoring), §9.1 (the generic `tilemap` change), §9.4 constants as used, phase 1 of §11, and sets up §10's per-phase demo mechanism.

---

## File Structure

**Created:**
- `demo-src/raycaster/lib/RcWorld.bas` — the world-model module. One responsibility: parse a `.stm` tilemap + marker tags into per-cell arrays and expose read accessors. (Lives under `demo-src/raycaster/lib/` so later phases' `RcCast`, `RcRender`, etc. sit beside it as the growing library.)
- `src/features/demos/devDemoRegistry.ts` — unlisted phase-demo registry; same shape as `demoRegistry`, never rendered on `/demos`.
- `tests/components/Runner/tilemapMarkerEnum.test.ts` — JS unit tests for the new `allMarkers` / `tileWidth` / `tileHeight` engine accessors.
- `tests/features/demos/devDemoRegistry.test.ts` — unit tests for the dev registry.
- `tests/scratch/raycasterP1DemoCompiles.test.ts` — transpile-output check for the Phase 1 `.bas` (retired to `.skip` once green).
- `demo-src/raycaster-p1/Main.bas` — demo entry.
- `demo-src/raycaster-p1/RcWorld.bas` — copy of the library module (buildDemo packages a flat dir; see Task 6 Step 2).
- `demo-src/raycaster-p1/MapProbeScene.bas` — demo scene: builds the world, `print`s assertions, draws a top-down grid.
- `demo-src/raycaster-p1/assets/p1testmap.stm` — the test map.
- `demo-src/raycaster-p1/assets/rc_placeholder_tiles.png` — placeholder tilesheet (copied from an existing demo).
- `src/docs/demos/RaycasterP1MapLoad.b4wgl.json` — build output (generated, committed).

**Modified:**
- `src/components/Runner/engine/tilemap.js` — add `allMarkers`, `tileWidth`, `tileHeight`.
- `src/lib/Basic4WebGL/defs/tilemapset.bas` — add the three matching wrappers.
- `src/features/demos/demoRegistry.ts` — split out a reusable `loadExportJson(file)`.
- `src/pages/DemosPage.tsx` — `__seedDemo` falls back to `devDemoRegistry`.
- `cypress/e2e/demos.cy.ts` — add a `DEV_DEMOS` loop with the Phase 1 demo.
- `src/docs/api-reference/tilemapset.md` (or the tilemap API page — verify path in Task 2) — document the three new functions.
- `docs/roadmap.md`, `docs/language/library-roadmap.md` — note the raycaster library is in progress.

---

## Task 1: Generic engine change — `tilemap` marker enumeration + tile metrics (JS)

**Files:**
- Modify: `src/components/Runner/engine/tilemap.js`
- Test: `tests/components/Runner/tilemapMarkerEnum.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/components/Runner/tilemapMarkerEnum.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// tilemap.js is a plain script declaring bare `const _sbTilemaps` + reading
// `_sbAssets`/`PIXI`/`worldContainer`/`hudContainer` globals. Same harness as
// tests/components/Runner/tilemap.test.ts / tests/integration/tilemapMarkersRoundTrip.ts.
class FakeRectangle {
  constructor(public x: number, public y: number, public width: number, public height: number) {}
}
class FakeContainer {
  children: unknown[] = [];
  x = 0;
  y = 0;
  parent: unknown = null;
  addChild(c: unknown) { this.children.push(c); }
  removeChildren() { this.children = []; }
}
function loadTilemap() {
  const assetsSrc = readFileSync('src/components/Runner/engine/assets.js', 'utf-8');
  const tilemapSrc = readFileSync('src/components/Runner/engine/tilemap.js', 'utf-8');
  const PIXI = {
    Container: FakeContainer,
    Sprite: FakeContainer,
    Rectangle: FakeRectangle,
    Texture: class {},
    Assets: { add() {}, async load() { return {}; } },
  };
  const factory = new Function(
    'PIXI', 'worldContainer', 'hudContainer',
    `${assetsSrc}\n${tilemapSrc}\n return { _sbAssets, _sbTilemaps };`,
  );
  return factory(PIXI, new FakeContainer(), new FakeContainer()) as {
    _sbAssets: { get: (n: string) => unknown };
    _sbTilemaps: {
      createTileMapSet: (p: string) => unknown;
      allMarkers: (h: unknown) => Array<{ col: number; row: number; tag: string }>;
      tileWidth: (h: unknown) => number;
      tileHeight: (h: unknown) => number;
      markersByTag: (h: unknown, t: string) => Array<{ x: number; y: number }>;
    };
  };
}

const STM = JSON.stringify({
  tileWidth: 16,
  tileHeight: 24,
  tileImage: 'tiles.png',
  layers: {
    walls: [
      [1, 1, 1],
      [1, 0, 1],
    ],
    tags: {
      type: 'markers',
      markers: [
        { row: 0, col: 2, tag: 'floor:2 door' },
        { row: 1, col: 1, tag: 'light:spot' },
      ],
    },
  },
});

describe('tilemap — marker enumeration + tile metrics', () => {
  function makeSet() {
    const { _sbAssets, _sbTilemaps } = loadTilemap();
    // getSlices needs the image; stub _sbAssets.get for both the .stm and the png.
    (_sbAssets as unknown as { get: (n: string) => unknown }).get = (name: string) => {
      if (name === 'level.stm') return STM;
      if (name === 'tiles.png') return { source: {}, width: 16, height: 24 };
      throw new Error(`unexpected asset ${name}`);
    };
    return { _sbTilemaps, handle: _sbTilemaps.createTileMapSet('level.stm') };
  }

  test('allMarkers returns every marker with col/row/tag', () => {
    const { _sbTilemaps, handle } = makeSet();
    const all = _sbTilemaps.allMarkers(handle);
    expect(all).toEqual([
      { col: 2, row: 0, tag: 'floor:2 door' },
      { col: 1, row: 1, tag: 'light:spot' },
    ]);
  });

  test('tileWidth / tileHeight report the .stm values', () => {
    const { _sbTilemaps, handle } = makeSet();
    expect(_sbTilemaps.tileWidth(handle)).toBe(16);
    expect(_sbTilemaps.tileHeight(handle)).toBe(24);
  });

  test('existing markersByTag is unchanged', () => {
    const { _sbTilemaps, handle } = makeSet();
    expect(_sbTilemaps.markersByTag(handle, 'light:spot')).toEqual([
      { x: 1 * 16 + 8, y: 1 * 24 + 12 },
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/Runner/tilemapMarkerEnum.test.ts`
Expected: FAIL — `_sbTilemaps.allMarkers is not a function`.

(If it instead fails earlier in `createTileMapSet` / `getSlices` because the `_sbAssets.get` stub shape is wrong, adjust the stub's returned object to whatever `getSlices` in `assets.js` actually destructures — read `assets.js`'s `getSlices` first — then continue.)

- [ ] **Step 3: Implement the three accessors**

In `src/components/Runner/engine/tilemap.js`, inside the `_sbTilemaps` object, next to `markersByTag`, add:

```js
  // Every marker across every marker layer, with grid coords and its raw tag
  // string. Companion to markersByTag (which does exact-tag match and returns
  // world-space {x,y}); this is for callers that need to read/parse tags
  // themselves or build an entity table from all markers at once.
  allMarkers(setHandle) {
    return setHandle._markers.map((m) => ({ col: m.col, row: m.row, tag: m.tag }));
  },

  tileWidth(setHandle) {
    return setHandle._tileW;
  },

  tileHeight(setHandle) {
    return setHandle._tileH;
  },
```

Verify `createTileMapSet` sets `_tileW` / `_tileH` on the handle (grep for `_tileW` in the file — `createTileMap` sets `container._tileW = tileW`; confirm `createTileMapSet`'s wrapping container does too, and if it only stores them on child layer containers, also store `handle._tileW = tileW; handle._tileH = tileH;` on the set's wrapping container in `createTileMapSet` so these accessors work).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/components/Runner/tilemapMarkerEnum.test.ts`
Expected: PASS (all three tests).

- [ ] **Step 5: Run the full tilemap suite for regressions**

Run: `npx vitest run tests/components/Runner/tilemap.test.ts tests/integration/tilemapMarkersRoundTrip.test.ts tests/components/Runner/tilemapMarkerEnum.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/engine/tilemap.js tests/components/Runner/tilemapMarkerEnum.test.ts
git commit -m "feat(tilemap): allMarkers / tileWidth / tileHeight accessors"
```

---

## Task 2: Generic engine change — softBASIC wrappers + docs

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/tilemapset.bas`
- Modify: the tilemap/tilemapset API reference markdown (verify path)
- Test: `tests/lib/Basic4WebGL/unit/transpiler/tilemap.test.ts` (or wherever `tilemapset` transpiler tests live — verify)

- [ ] **Step 1: Find the existing tilemapset transpiler test and API doc**

Run: `ls tests/lib/Basic4WebGL/unit/transpiler/ | grep -i tile` and `ls src/docs/api-reference/ | grep -i tile`
Note the exact filenames — the tests and doc edits below target them.

- [ ] **Step 2: Write the failing transpiler test**

In the tilemapset transpiler test file found in Step 1, add:

```ts
describe('tilemapset — marker enumeration + tile metrics', () => {
  test('allMarkers / tileWidth / tileHeight emit their _sb.* calls', () => {
    const result = /* the file's existing transpile helper */ ([
      'function test()',
      '  dim tm as tilemapset',
      '  dim all',
      '  dim tw',
      '  dim th',
      '  all = tm.allMarkers()',
      '  tw = tm.tileWidth()',
      '  th = tm.tileHeight()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.allMarkers(');
    expect(result.code).toContain('_sb.tileWidth(');
    expect(result.code).toContain('_sb.tileHeight(');
  });
});
```

Match the file's existing transpile-helper name and `tilemapset` construction idiom exactly (read a neighbouring test in the same file first).

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run <that test file>`
Expected: FAIL — output does not contain `_sb.allMarkers(`.

- [ ] **Step 4: Add the wrappers**

In `src/lib/Basic4WebGL/defs/tilemapset.bas`, before `EndClass`, add:

```basic
function allMarkers()
    return call("_sb.allMarkers(this._handle)")
endfunction

function tileWidth()
    return call("_sb.tileWidth(this._handle)")
endfunction

function tileHeight()
    return call("_sb.tileHeight(this._handle)")
endfunction
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run <that test file>`
Expected: PASS.

- [ ] **Step 6: Document the three functions**

In the tilemapset API reference markdown from Step 1, add entries following the house style (one-sentence description → parameter table → `**Returns:**` → `.bas` example), e.g.:

```markdown
## tilemapset.allMarkers

Every marker in the map, each with its grid column, grid row, and its full tag
text. Use this when you need to read the tag yourself (for example to parse
`floor:2 door` into separate values) or build a table from all markers at once.

**Returns:** array of objects with `col`, `row`, and `tag`

```basic
dim all
all = level.allMarkers()
dim i
for i = 0 to array.arrLength(all) - 1
  dim m
  m = all(i)
  print "marker at " + string.str(m.col) + "," + string.str(m.row) + " = " + m.tag
next i
```

## tilemapset.tileWidth

The width of one tile in the map, in pixels.

**Returns:** number

```basic
dim tw
tw = level.tileWidth()
```

## tilemapset.tileHeight

The height of one tile in the map, in pixels.

**Returns:** number

```basic
dim th
th = level.tileHeight()
```
```

- [ ] **Step 7: Full unit suite + build**

Run: `npx vitest run` then `npx vite build`
Expected: both PASS/clean. Update any test that snapshots the `tilemapset.bas` function list.

- [ ] **Step 8: Commit**

```bash
git add src/lib/Basic4WebGL/defs/tilemapset.bas src/docs/api-reference/ tests/lib/Basic4WebGL/unit/transpiler/
git commit -m "feat(tilemapset): softBASIC wrappers + docs for allMarkers / tile metrics"
```

---

## Task 3: `RcWorld.bas` — the world-model module

**Files:**
- Create: `demo-src/raycaster/lib/RcWorld.bas`
- Test: `tests/scratch/raycasterP1DemoCompiles.test.ts` (created in Task 6; this task's verification is Step 4 below + the Task 6 demo)

`RcWorld` has no Vitest unit tests (spec §1.2 — no softBASIC execution harness). Its behaviour is asserted by the Phase 1 demo's `print` output (Task 6) and locked against transpile errors by the scratch check (Task 6 Step 3). Write it carefully against the def files per CLAUDE.md's "API cross-reference rule".

- [ ] **Step 1: Create the module**

Create `demo-src/raycaster/lib/RcWorld.bas`:

```basic
' RcWorld -- raycaster world model (spec docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §3).
' Reads a tagged .stm tilemap into parallel per-cell arrays. Pure softBASIC.
'
' Cell index = row * cols + col. Heights are in world units; 0 = standard floor,
' 1.0 = standard ceiling (RC_STD_CEIL). Negative floor = pit.
' flags bitset: 1 door, 2 lift, 4 water, 8 sky.
Class

dim cols
dim rows

dim wallArr(0)
dim floorHArr(0)
dim ceilHArr(0)
dim wallTexArr(0)
dim floorTexArr(0)
dim ceilTexArr(0)
dim upperArr(0)
dim lightArr(0)
dim flagsArr(0)

dim upNames(0)
dim upFloorHArr(0)
dim upCeilHArr(0)

Constructor(tm as tilemapset, wallsLayerName)
    self.build(tm, wallsLayerName)
EndConstructor

function build(tm as tilemapset, wallsLayerName)
    dim tw
    dim th
    tw = tm.tileWidth()
    th = tm.tileHeight()

    dim wallsLayer as tilemaplayer
    wallsLayer = tm.layer(wallsLayerName)
    self.cols = math.floor(wallsLayer.widthPx() / tw)
    self.rows = math.floor(wallsLayer.heightPx() / th)

    dim total
    total = self.cols * self.rows

    dim i
    for i = 0 to total - 1
        array.push(self.wallArr, 0)
        array.push(self.floorHArr, 0)
        array.push(self.ceilHArr, 1.0)
        array.push(self.wallTexArr, "")
        array.push(self.floorTexArr, "")
        array.push(self.ceilTexArr, "")
        array.push(self.upperArr, -1)
        array.push(self.lightArr, 0)
        array.push(self.flagsArr, 0)
    next i

    dim col
    dim row
    dim id
    for row = 0 to self.rows - 1
        for col = 0 to self.cols - 1
            id = wallsLayer.tileAt(col * tw + tw / 2, row * th + th / 2)
            if id > 0 then
                self.wallArr(row * self.cols + col) = id
            endif
        next col
    next row

    dim markers
    markers = tm.allMarkers()
    dim mi
    dim mk as Marker
    for mi = 0 to array.arrLength(markers) - 1
        mk = markers(mi)
        if mk.col >= 0 then
            if mk.row >= 0 then
                if mk.col < self.cols then
                    if mk.row < self.rows then
                        self.applyTag(mk.row * self.cols + mk.col, mk.tag)
                    endif
                endif
            endif
        endif
    next mi
endfunction

function applyTag(idx, tagStr)
    dim tokens
    tokens = string.split(string.trim(tagStr), " ")
    dim ti
    dim tok
    dim ci
    for ti = 0 to array.arrLength(tokens) - 1
        tok = tokens(ti)
        if string.len(tok) > 0 then
            ci = string.indexof(tok, ":")
            if ci < 0 then
                self.applyFlag(idx, tok)
            else
                self.applyKv(idx, string.substr(tok, 0, ci), string.substr(tok, ci + 1, string.len(tok)))
            endif
        endif
    next ti
endfunction

function applyFlag(idx, name)
    if name = "door" then
        self.flagsArr(idx) = self.flagsArr(idx) + 1
    endif
    if name = "lift" then
        self.flagsArr(idx) = self.flagsArr(idx) + 2
    endif
    if name = "water" then
        self.flagsArr(idx) = self.flagsArr(idx) + 4
    endif
    if name = "sky" then
        self.flagsArr(idx) = self.flagsArr(idx) + 8
    endif
endfunction

function applyKv(idx, key, val)
    if key = "tex" then
        self.wallTexArr(idx) = val
    endif
    if key = "ftex" then
        self.floorTexArr(idx) = val
    endif
    if key = "ctex" then
        self.ceilTexArr(idx) = val
    endif
    if key = "floor" then
        self.floorHArr(idx) = math.val(val)
    endif
    if key = "ceil" then
        self.ceilHArr(idx) = math.val(val)
    endif
    if key = "light" then
        self.lightArr(idx) = 1
    endif
    if key = "upper" then
        self.upperArr(idx) = self.upperRegion(val, self.ceilHArr(idx))
    endif
endfunction

' Returns the index of the upper-region entry named `name`, creating it on first
' use. baseCeil is the host cell's ceiling -- the upper region floor sits on it.
function upperRegion(name, baseCeil)
    dim i
    for i = 0 to array.arrLength(self.upNames) - 1
        if self.upNames(i) = name then
            return i
        endif
    next i
    array.push(self.upNames, name)
    array.push(self.upFloorHArr, baseCeil)
    array.push(self.upCeilHArr, baseCeil + 1.0)
    return array.arrLength(self.upNames) - 1
endfunction

' ── read accessors (col, row are integer cell coords) ────────────────────────

function inBounds(col, row)
    if col < 0 then
        return 0
    endif
    if row < 0 then
        return 0
    endif
    if col >= self.cols then
        return 0
    endif
    if row >= self.rows then
        return 0
    endif
    return 1
endfunction

function wallAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 1
    endif
    return self.wallArr(row * self.cols + col)
endfunction

function floorHeightAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.floorHArr(row * self.cols + col)
endfunction

function ceilHeightAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.ceilHArr(row * self.cols + col)
endfunction

function flagsAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.flagsArr(row * self.cols + col)
endfunction

function hasUpperAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    if self.upperArr(row * self.cols + col) >= 0 then
        return 1
    endif
    return 0
endfunction

function wallTexAt(col, row)
    if self.inBounds(col, row) = 0 then
        return ""
    endif
    return self.wallTexArr(row * self.cols + col)
endfunction

function widthCells()
    return self.cols
endfunction

function heightCells()
    return self.rows
endfunction

EndClass
```

- [ ] **Step 2: Sanity-check every softBASIC call against its def file**

Confirm each of these against `src/lib/Basic4WebGL/defs/`:
- `string.split`, `string.trim`, `string.len`, `string.indexof`, `string.substr` — `string.bas` (all present; `substr(s, start, end)`).
- `array.push`, `array.arrLength` — `array.bas`.
- `math.floor`, `math.val` — `math.bas` (`val(s)` returns `Number(s)`).
- `tm.layer(name)` → `tilemaplayer`; `.widthPx()`, `.heightPx()`, `.tileAt(worldX, worldY)` — `tilemaplayer.bas`. **Runtime risk:** confirm `createTileMapSet` populates each layer container with `_tileW`/`_tileH` and `_map` (grep `getTileMapSetLayer` and the layer-building loop in `tilemap.js`). If a set-layer container lacks tile metrics, `widthPx()`/`tileAt()` on it will misbehave at runtime — that's another small generic `tilemap.js` fix (store `_tileW`/`_tileH` on set-layer containers too), bundled into Task 1, with a unit test. Catch it here, not in Task 6.
- `tm.tileWidth()`, `tm.tileHeight()`, `tm.allMarkers()` — added in Task 2.
- `Marker` has `.x`, `.y` per `marker.bas` — **but `allMarkers` returns `{col, row, tag}`, not `Marker`**. Do NOT type the loop var `as Marker`. Change `dim mk as Marker` to `dim mk` and access `mk.col` / `mk.row` / `mk.tag` as plain fields. Fix this in Step 1's code before proceeding.

- [ ] **Step 3: Fix the `Marker` typing issue flagged in Step 2**

In `demo-src/raycaster/lib/RcWorld.bas`, change:

```basic
    dim mk as Marker
```
to:
```basic
    dim mk
```

(The objects from `allMarkers()` are plain `{col, row, tag}` records, not the `Marker` class which only carries `x`/`y`.)

- [ ] **Step 4: Verify it transpiles (temporary probe)**

Create `tests/scratch/rcWorldCompiles.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { packageModules } from '../../src/constants/packageModules';

describe('RcWorld compiles', () => {
  test('no diagnostics against the standard library', () => {
    const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
    const result = compiler.transpile({
      lib,
      files: [
        { name: 'RcWorld.bas', source: readFileSync('demo-src/raycaster/lib/RcWorld.bas', 'utf-8') },
        { name: 'Main.bas', source: 'dim w\n' },
      ],
    });
    expect(result.diagnostics).toEqual([]);
  });
});
```

Run: `npx vitest run tests/scratch/rcWorldCompiles.test.ts`
Expected: PASS. If diagnostics appear, fix `RcWorld.bas` (common causes: `elseif` not supported — the code above avoids it; a method called before it's defined — softBASIC hoists functions within a class, but verify; `return` inside a `for` — allowed). Iterate until clean, then delete this scratch file (Task 6 adds the permanent one):

```bash
rm tests/scratch/rcWorldCompiles.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add demo-src/raycaster/lib/RcWorld.bas
git commit -m "feat(raycaster): RcWorld.bas world-model module (Phase 1)"
```

---

## Task 4: Unlisted phase-demo infrastructure

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
  test('every dev demo has slug, file, name', () => {
    for (const d of devDemoRegistry) {
      expect(d.slug).toBeTruthy();
      expect(d.file).toBeTruthy();
      expect(d.name).toBeTruthy();
    }
  });

  test('dev slugs never collide with public demo slugs', () => {
    const publicSlugs = new Set(demoRegistry.map((d) => d.slug));
    for (const d of devDemoRegistry) {
      expect(publicSlugs.has(d.slug)).toBe(false);
    }
  });

  test('includes the Phase 1 map-load demo', () => {
    const p1 = devDemoRegistry.find((d) => d.slug === 'raycaster-p1-mapload');
    expect(p1?.file).toBe('RaycasterP1MapLoad');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/features/demos/devDemoRegistry.test.ts`
Expected: FAIL — cannot resolve `src/features/demos/devDemoRegistry`.

- [ ] **Step 3: Extract `loadExportJson` in `demoRegistry.ts`**

In `src/features/demos/demoRegistry.ts`, replace:

```ts
export async function loadDemoJson(slug: string): Promise<ProjectExportJson> {
  const entry = demoRegistry.find((d) => d.slug === slug);
  if (!entry) throw new Error(`Unknown demo slug: ${slug}`);
  const mod = await import(`../../docs/demos/${entry.file}.b4wgl.json`);
  return (mod.default ?? mod) as ProjectExportJson;
}
```

with:

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

// Phase demos for the raycaster softBASIC library (spec
// docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §10). Deliberately
// NOT rendered on /demos (DemosPage only maps `demoRegistry`) and given no docs
// page. They exist so each library phase ships a runnable, Cypress-verified
// artifact.
export const devDemoRegistry: DemoEntry[] = [
  {
    slug: 'raycaster-p1-mapload',
    name: 'Raycaster P1 — Map Load',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 1 probe: builds RcWorld from a tagged .stm and prints cell heights, flags and upper-region data. No rendering.',
    docsSlug: '',
    file: 'RaycasterP1MapLoad',
  },
];
```

- [ ] **Step 5: `__seedDemo` falls back to the dev registry**

In `src/pages/DemosPage.tsx`, add to the existing `'../features/demos/demoRegistry'` import: `loadExportJson`. Add a new import:

```tsx
import { devDemoRegistry } from '../features/demos/devDemoRegistry';
```

Find the `__seedDemo` body's `const json = await loadDemoJson(slug);` and replace with:

```tsx
    const devEntry = devDemoRegistry.find((d) => d.slug === slug);
    const json = devEntry ? await loadExportJson(devEntry.file) : await loadDemoJson(slug);
```

- [ ] **Step 6: Run to verify it passes**

Run: `npx vitest run tests/features/demos/devDemoRegistry.test.ts`
Expected: PASS.

- [ ] **Step 7: Broader suite + build**

Run: `npx vitest run tests/features/demos/` then `npx vite build`
Expected: PASS/clean. Fix any `demoRegistry` test asserting the old `loadDemoJson` internals.

- [ ] **Step 8: Commit**

```bash
git add src/features/demos/devDemoRegistry.ts src/features/demos/demoRegistry.ts src/pages/DemosPage.tsx tests/features/demos/devDemoRegistry.test.ts
git commit -m "feat(demos): unlisted dev-demo registry for raycaster phase demos"
```

---

## Task 5: The Phase 1 test map + placeholder tilesheet

**Files:**
- Create: `demo-src/raycaster-p1/assets/rc_placeholder_tiles.png`
- Create: `demo-src/raycaster-p1/assets/p1testmap.stm`

- [ ] **Step 1: Copy a placeholder tilesheet**

`createTileMapSet` calls `getSlices(tileImage, …)` at construction, so the `.stm`'s `tileImage` must resolve to a real asset even though Phase 1 never renders it.

```bash
mkdir -p demo-src/raycaster-p1/assets
cp demo-src/bullet-hell-shooter/assets/tilesheet.png demo-src/raycaster-p1/assets/rc_placeholder_tiles.png
```

- [ ] **Step 2: Create the test map**

Create `demo-src/raycaster-p1/assets/p1testmap.stm` (5×4 room: solid border on the `walls` layer using tile id `1`, open interior id `0`; markers exercise every tag path). Set `tileWidth`/`tileHeight` to match the copied sheet — inspect it first: `node -e "const s=require('./src/components/Runner/engine/assets.js')" ` is not viable; instead open `demo-src/bullet-hell-shooter/assets/map1.stm` and reuse its `tileWidth`/`tileHeight` (16/16), since the same sheet is used there.

```json
{
  "tileWidth": 16,
  "tileHeight": 16,
  "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1]
    ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 1, "col": 1, "tag": "floor:2 ftex:grating" },
        { "row": 2, "col": 2, "tag": "floor:-3 ceil:4 ctex:pipes" },
        { "row": 1, "col": 2, "tag": "upper:vent" },
        { "row": 2, "col": 3, "tag": "door" },
        { "row": 1, "col": 3, "tag": "tex:concrete sky" }
      ]
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add demo-src/raycaster-p1/assets
git commit -m "test(raycaster): Phase 1 test map + placeholder tilesheet"
```

---

## Task 6: The Phase 1 demo — scene, build, e2e

**Files:**
- Create: `demo-src/raycaster-p1/Main.bas`
- Create: `demo-src/raycaster-p1/RcWorld.bas` (copy)
- Create: `demo-src/raycaster-p1/MapProbeScene.bas`
- Create: `tests/scratch/raycasterP1DemoCompiles.test.ts`
- Create: `src/docs/demos/RaycasterP1MapLoad.b4wgl.json` (generated)
- Modify: `cypress/e2e/demos.cy.ts`

- [ ] **Step 1: Create the demo scene**

Create `demo-src/raycaster-p1/MapProbeScene.bas`:

```basic
Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim titleText as Text
dim l1 as Text
dim l2 as Text
dim l3 as Text
dim l4 as Text

Constructor()
EndConstructor

function onenter()
  world.setBackground(12, 12, 18)

  self.tm = new tilemapset("p1testmap.stm")
  self.wld = new RcWorld(self.tm, "walls")

  self.titleText = new Text("Raycaster P1 - map probe", 24, 20)
  self.titleText.setStyle(20, 255, 220, 120)
  hud.add(self.titleText)

  dim okSize
  okSize = "FAIL"
  if self.wld.widthCells() = 5 then
    if self.wld.heightCells() = 4 then
      okSize = "OK"
    endif
  endif
  self.l1 = new Text("size 5x4: " + okSize + " (" + string.str(self.wld.widthCells()) + "x" + string.str(self.wld.heightCells()) + ")", 24, 52)
  self.l1.setStyle(15, 255, 255, 255)
  hud.add(self.l1)

  dim okBorder
  okBorder = "FAIL"
  if self.wld.wallAt(0, 0) > 0 then
    if self.wld.wallAt(1, 1) = 0 then
      okBorder = "OK"
    endif
  endif
  self.l2 = new Text("wall border: " + okBorder, 24, 74)
  self.l2.setStyle(15, 255, 255, 255)
  hud.add(self.l2)

  dim okFloor
  okFloor = "FAIL"
  if self.wld.floorHeightAt(1, 1) = 2 then
    if self.wld.floorHeightAt(2, 2) = -3 then
      okFloor = "OK"
    endif
  endif
  self.l3 = new Text("floor tags (2 / -3): " + okFloor, 24, 96)
  self.l3.setStyle(15, 255, 255, 255)
  hud.add(self.l3)

  dim okMisc
  okMisc = "FAIL"
  if self.wld.hasUpperAt(2, 1) = 1 then
    if self.wld.flagsAt(3, 2) = 1 then
      if self.wld.flagsAt(3, 1) = 8 then
        okMisc = "OK"
      endif
    endif
  endif
  self.l4 = new Text("upper / door / sky: " + okMisc, 24, 118)
  self.l4.setStyle(15, 255, 255, 255)
  hud.add(self.l4)

  self.drawGrid()
endfunction

function drawGrid()
  dim col
  dim row
  dim ox
  dim oy
  dim s
  ox = 24
  oy = 150
  s = 30
  for row = 0 to self.wld.heightCells() - 1
    for col = 0 to self.wld.widthCells() - 1
      if self.wld.wallAt(col, row) > 0 then
        pen.setFillColor(90, 100, 140)
      else
        pen.setFillColor(30, 34, 44)
      endif
      pen.setLineWidth(1)
      pen.setLineColor(0, 0, 0)
      drawing.drawRect(ox + col * s + s / 2, oy + row * s + s / 2, s - 2, s - 2)
    next col
  next row
endfunction

EndClass
```

- [ ] **Step 2: Create `Main.bas` and stage the library copy**

`npm run build:demo` packages every `.bas` directly inside the source dir (it does not recurse), so the demo needs its own copy of `RcWorld.bas`:

```bash
cp demo-src/raycaster/lib/RcWorld.bas demo-src/raycaster-p1/RcWorld.bas
```

Create `demo-src/raycaster-p1/Main.bas`:

```basic
function oninit()
  world.setPixelPerfect(true)
endfunction

dim probe = new MapProbeScene()
scenemanager.register("probe", probe)
scenemanager.switch("probe")
```

- [ ] **Step 3: Permanent transpile check**

Create `tests/scratch/raycasterP1DemoCompiles.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { packageModules } from '../../src/constants/packageModules';

describe('raycaster P1 demo compiles', () => {
  test('Main + MapProbeScene + RcWorld transpile with no diagnostics', () => {
    const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
    const dir = 'demo-src/raycaster-p1';
    const result = compiler.transpile({
      lib,
      files: [
        { name: 'RcWorld.bas', source: readFileSync(`${dir}/RcWorld.bas`, 'utf-8') },
        { name: 'MapProbeScene.bas', source: readFileSync(`${dir}/MapProbeScene.bas`, 'utf-8') },
        { name: 'Main.bas', source: readFileSync(`${dir}/Main.bas`, 'utf-8') },
      ],
    });
    expect(result.diagnostics).toEqual([]);
  });
});
```

Run: `npx vitest run tests/scratch/raycasterP1DemoCompiles.test.ts`
Expected: PASS. Fix `.bas` call-syntax issues until clean (check `text.bas` for `Text` constructor + `setStyle`, `pen.bas`, `drawing.bas`, `scene.bas` / `SceneManager.bas` for `Extends scene` + `scenemanager.register`/`switch`).

Then retire it per CLAUDE.md — change `describe(` to `describe.skip(`.

- [ ] **Step 4: Build the demo export**

```bash
npm run build:demo -- demo-src/raycaster-p1 RaycasterP1MapLoad
```

Expected: `Wrote src/docs/demos/RaycasterP1MapLoad.b4wgl.json (3 file(s), 2 asset(s))`

- [ ] **Step 5: Add the Cypress block**

In `cypress/e2e/demos.cy.ts`, after the existing `DEMOS.forEach(...)` block:

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

- [ ] **Step 6: Run the e2e**

Terminal 1: `npm run dev`
Terminal 2: `npx cypress run --spec cypress/e2e/demos.cy.ts`
Expected: all specs pass, including `Dev demo: Raycaster P1 — Map Load`.

- [ ] **Step 7: Manual verification of the probe assertions**

`npm run dev`, then in the browser console at `/demos`:
`await window.__seedDemo('raycaster-p1-mapload')` → open `/projects/<id>/edit` → Run.
Confirm all four probe lines read `OK` (`size`, `wall border`, `floor tags`, `upper / door / sky`) and the top-down grid draws a 5×4 room. If any reads `FAIL`, the bug is in `RcWorld.bas` — fix, re-copy to `demo-src/raycaster-p1/`, rebuild the export, re-verify.

- [ ] **Step 8: Full unit suite + build**

Run: `npx vitest run` then `npx vite build`
Expected: PASS / clean.

- [ ] **Step 9: Commit**

```bash
git add demo-src/raycaster-p1 src/docs/demos/RaycasterP1MapLoad.b4wgl.json cypress/e2e/demos.cy.ts tests/scratch/raycasterP1DemoCompiles.test.ts
git commit -m "test(raycaster): Phase 1 unlisted demo — RcWorld map-load probe + e2e"
```

---

## Task 7: Library guide + roadmap

**Files:**
- Create: `src/docs/guides/raycaster-library.md` (verify the guides dir / manifest section in Step 1)
- Modify: `src/docs/manifest.ts`
- Modify: `docs/roadmap.md`, `docs/language/library-roadmap.md`

- [ ] **Step 1: Find where prose guides live**

Run: `ls src/docs/` and `grep -n "Language Guide\|guides\|section" src/docs/manifest.ts | head`
Determine whether there's a "Guides" / "Language Guide" flat section this belongs in, or whether it should be a new section. The raycaster library is **project-level `.bas`, not an engine module**, so it is a guide, not an API Reference page.

- [ ] **Step 2: Write the guide stub**

Create the markdown (path per Step 1). Phase 1 content only — later phases extend it:

```markdown
# Building a Raycaster (softBASIC library)

A first-person raycaster you can drop into a project as a set of `.bas` modules.
This guide is built up phase by phase alongside the library itself.

## RcWorld — the map

`RcWorld` turns a tagged tilemap into a world you can query for wall positions and
floor/ceiling heights.

Draw your level in the Tilemap Editor:

- A **`walls` tile layer** — paint any non-zero tile where a wall should be.
- A **marker layer** — drop markers and give each a text tag to add detail:
  - `floor:2` raises the cell's floor; `floor:-3` makes a pit
  - `ceil:4` lowers the ceiling; `ceil:8` makes an atrium
  - `tex:concrete`, `ftex:grating`, `ctex:pipes` set surface textures
  - `door`, `lift`, `water`, `sky` mark special cells
  - `upper:vent` gives the cell a second space above it

```basic
dim level as tilemapset
dim wld as RcWorld

function onenter()
  self.level = new tilemapset("level1.stm")
  self.wld = new RcWorld(self.level, "walls")

  if self.wld.wallAt(3, 4) > 0 then
    print "wall at 3,4"
  endif
  print "floor height at 5,5 = " + string.str(self.wld.floorHeightAt(5, 5))
endfunction
```

### RcWorld accessors

| Call | Returns |
|---|---|
| `wld.widthCells()` / `wld.heightCells()` | map size in cells |
| `wld.wallAt(col, row)` | `0` open, `>0` wall texture id (out of bounds = `1`) |
| `wld.floorHeightAt(col, row)` | floor height (`0` standard, negative = pit) |
| `wld.ceilHeightAt(col, row)` | ceiling height (`1` standard) |
| `wld.flagsAt(col, row)` | bitset: `1` door, `2` lift, `4` water, `8` sky |
| `wld.hasUpperAt(col, row)` | `1` if the cell has a space above it |
| `wld.wallTexAt(col, row)` | wall texture id, or `""` |
```

- [ ] **Step 3: Register in the manifest**

Add the guide to `src/docs/manifest.ts` in the section identified in Step 1, matching the exact `DocTopic` shape of its siblings (slug `raycaster-library`, path resolving to the file from Step 2).

- [ ] **Step 4: Verify it renders**

`npm run dev` → `/docs` → open the new guide. Confirm it renders cleanly.

- [ ] **Step 5: Roadmap**

In `docs/roadmap.md` and `docs/language/library-roadmap.md`, add or update a tracked item:

```markdown
- **Raycaster library** (in progress) — a "DOOM plus a bit" first-person raycaster
  built in softBASIC as reusable `.bas` modules. Phase 1 (`RcWorld` + tagged `.stm`
  loader, plus the generic `tilemapset.allMarkers` / tile-metric accessors) shipped.
  Phases 2–10 (span cast, renderer, mover, lighting, actors, diagonal tiles, upper
  regions, optimisation) tracked in
  `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`.
```

Touch `src/docs/roadmap.md` only if it already carries a matching public item.

- [ ] **Step 6: Build + commit**

Run: `npx vite build`

```bash
git add src/docs/ docs/roadmap.md docs/language/library-roadmap.md
git commit -m "docs(raycaster): Phase 1 library guide + roadmap"
```

---

## Task 8: Phase close-out

**Files:** none.

- [ ] **Step 1: Full unit suite** — `npx vitest run` → PASS (only the retired `.skip` scratch file skipped).
- [ ] **Step 2: Build** — `npx vite build` → clean.
- [ ] **Step 3: E2E** — `npm run dev` + `npx cypress run --spec cypress/e2e/demos.cy.ts` → all pass incl. the Phase 1 dev demo.
- [ ] **Step 4: Confirm the demo is NOT on `/demos`** — `npm run dev`, open `/demos`, verify "Raycaster P1" does not appear in the list.
- [ ] **Step 5: Spec check** — re-read spec §3 and §11 phase 1. Every cell field in §3.1 is populated by `RcWorld` (`wall`, `floorH`, `ceilH`, `wallTex`, `floorTex`, `ceilTex`, `upper`, `light`, `flags`); §3.2 upper-region arrays exist; §3.3 tag parsing + the §9.1 generic `tilemap` change are done. Note any gap as a follow-up task before declaring Phase 1 complete.

---

## Notes for later phases (not this plan)

- **`math.val`** parses tag numbers (`Number(s)`); confirmed present.
- **Probe scenes must FORCE a runtime error on a failed check** — not just render
  "FAIL" text. The Cypress guard (`cypress/e2e/demos.cy.ts`) only asserts "no ERR
  line appears in the console panel"; canvas text is invisible to it, so a scene
  that only draws "FAIL" would still pass CI. `MapProbeScene.bas` establishes the
  pattern: a `probe(label, passed, y)` helper that renders the OK/FAIL text and,
  when `passed = 0`, executes a statement that throws a caught `runtimeError`
  (here `array.arrLength(missing)` on an unassigned var → reads `.length` of
  `undefined`). That error propagates through scene.js's `onenter` try/catch into
  `_throwError`, which posts a `runtimeError` message that surfaces as `ERR`.
  Every later phase demo's probe scene must reuse this helper pattern.
- Phase 2 (`RcCast`) adds `demo-src/raycaster/lib/RcCast.bas` + a `raycaster-p2` demo drawing a top-down span visualisation. It will likely surface the first `drawing` throughput question — hold the §5.3 contingency until phase 3's real 3D draw.
- Texture ids are stored as plain image-name strings on cells through all phases; `RcRender` (phase 3) resolves them to drawables — no atlas (spec §5.2).
- The library-copy duplication (`demo-src/raycaster/lib/RcWorld.bas` vs `demo-src/raycaster-p1/RcWorld.bas`) is a `build:demo` limitation. If it becomes painful across phases, a small generic `scripts/buildDemo.ts` change to accept a shared-lib dir is the fix — a tooling task, not engine.
```

