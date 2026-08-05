# TileMapSet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-layer tilemap support to softBASIC via a new `.stm` file format and two new classes — `TileMapLayer` (wraps one already-rendered layer, mirroring `TileMap`'s existing API) and `TileMapSet` (parses a `.stm` file, renders every layer, and hands out named `TileMapLayer` handles).

**Architecture:** `TileMapSet.layer(name)` must return a genuine class instance with working methods, not a raw engine handle — softBASIC has no duck typing for method calls, only for plain-data field access (confirmed via `RayHit`). The codebase already has exactly one precedent for "wrap an existing engine handle in a class instance without allocating a new one": `ObjectTransform`'s `Constructor(handle)` (`self._handle = call("constructor_handle")`, no `_sb.create*` call). `TileMapLayer` copies that pattern. `TileMapSet.layer()` then does `dim result as TileMapLayer(call("_sb.getTileMapSetLayer(...)"))` — the same `dim x as ClassName(args)` construction form already used throughout `defs/` (e.g. `dim transform as ObjectTransform(call("this._handle"))`), just called from a plain function instead of a Constructor. This exact combination (constructing-and-returning an object from a non-Constructor function) has no existing precedent in the codebase, so Task 1 proves the mechanism compiles before anything is built on top of it.

**Tech Stack:** softBASIC transpiler (TypeScript, Vitest), PIXI.js v8 engine runtime (vanilla JS, `src/components/Runner/engine/`).

---

### Task 1: `TileMapLayer` class — wraps an existing rendered layer handle

**Files:**
- Create: `src/lib/Basic4WebGL/defs/tilemaplayer.bas`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/tilemaplayer.test.ts`

No engine JS changes in this task — `TileMapLayer` reuses the existing `_sb.tileAt`, `_sb.tileMapWidthPx`, `_sb.tileMapHeightPx`, `_sb.setDepth` functions in `src/components/Runner/engine/tilemap.js` unmodified (they already operate on any container handle with `._map`/`._tileW`/`._tileH`, regardless of how that handle was built).

- [ ] **Step 1: Write the failing test**

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transformSource   = readFileSync('src/lib/Basic4WebGL/defs/transform.bas',    'utf-8');
const tileMapLayerSource = readFileSync('src/lib/Basic4WebGL/defs/tilemaplayer.bas', 'utf-8');

const transpileWithTileMapLayer = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource    },
      { name: 'TileMapLayer.bas',    source: tileMapLayerSource },
      { name: 'Main.bas',            source                     },
    ],
  });

// ─── Construction ─────────────────────────────────────────────────────────────

describe('TileMapLayer — construction', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapLayer(
      'function test()\n  dim m as TileMapLayer(call("null"))\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── tileAt ───────────────────────────────────────────────────────────────────

describe('TileMapLayer — tileAt', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapLayer([
      'function test()',
      '  dim m as TileMapLayer(call("null"))',
      '  dim t',
      '  t = m.tileAt(100, 200)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.tileAt(', () => {
    const result = transpileWithTileMapLayer([
      'function test()',
      '  dim m as TileMapLayer(call("null"))',
      '  dim t',
      '  t = m.tileAt(100, 200)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.tileAt(');
  });
});

// ─── widthPx / heightPx ───────────────────────────────────────────────────────

describe('TileMapLayer — widthPx / heightPx', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapLayer([
      'function test()',
      '  dim m as TileMapLayer(call("null"))',
      '  dim w',
      '  dim h',
      '  w = m.widthPx()',
      '  h = m.heightPx()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── transform ────────────────────────────────────────────────────────────────

describe('TileMapLayer — transform', () => {
  test('setPosition compiles without error', () => {
    const result = transpileWithTileMapLayer([
      'function test()',
      '  dim m as TileMapLayer(call("null"))',
      '  m.transform.setPosition(-100, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── setDepth ─────────────────────────────────────────────────────────────────

describe('TileMapLayer — setDepth', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapLayer(
      'function test()\n  dim m as TileMapLayer(call("null"))\n  m.setDepth(2)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── Returned from a plain function (critical mechanism for TileMapSet.layer()) ─

describe('TileMapLayer — constructed and returned from a plain function', () => {
  test('compiles without error, and the returned value supports method calls', () => {
    const result = transpileWithTileMapLayer([
      'function makeLayer()',
      '  dim result as TileMapLayer(call("null"))',
      '  return result',
      'endfunction',
      '',
      'function test()',
      '  dim layer',
      '  layer = makeLayer()',
      '  dim t',
      '  t = layer.tileAt(10, 20)',
      '  layer.transform.setPosition(5, 5)',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/tilemaplayer.test.ts`
Expected: FAIL — `src/lib/Basic4WebGL/defs/tilemaplayer.bas` does not exist yet (`ENOENT`).

- [ ] **Step 3: Write `tilemaplayer.bas`**

```basic
Class
dim _handle

Constructor(handle)
    self._handle = call("constructor_handle")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function tileAt(x, y)
    return call("_sb.tileAt(this._handle, tileat_x, tileat_y)")
endfunction

function widthPx()
    return call("_sb.tileMapWidthPx(this._handle)")
endfunction

function heightPx()
    return call("_sb.tileMapHeightPx(this._handle)")
endfunction

function setDepth(n)
    call("_sb.setDepth(this._handle, setdepth_n)")
endfunction

EndClass
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/tilemaplayer.test.ts`
Expected: PASS (all tests, including the "returned from a plain function" one)

**If the last describe block fails:** this means constructing-and-returning an object from a plain function doesn't work the way `dim x as new ClassName(...)` + Constructor-only assignment does. Stop and re-scope: `TileMapSet.layer()` will need a different mechanism (e.g. returning the raw handle and giving `TileMapLayer`-equivalent free functions on `TileMapSet` itself, taking a layer name each time — `tm.layerTileAt(name, x, y)` instead of `tm.layer(name).tileAt(x, y)`). Do not proceed to Task 3 until this is resolved one way or the other; note the outcome in the Task 3 preamble.

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/tilemaplayer.bas tests/lib/Basic4WebGL/unit/transpiler/tilemaplayer.test.ts
git commit -m "feat: add TileMapLayer class (wraps an existing rendered tilemap layer handle)"
```

---

### Task 2: Engine support — `createTileMapSet` / `getTileMapSetLayer`

**Files:**
- Modify: `src/components/Runner/engine/tilemap.js`

No test file — per this project's convention (see `CLAUDE.md`, "E2E tests (Cypress)"), Vitest checks transpiler *output*, not engine runtime behaviour; engine JS is exercised at runtime and by Cypress, not by unit tests. Task 7 below does a manual runtime smoke test.

- [ ] **Step 1: Add the two new functions to `_sbTilemaps`**

Add these two methods inside the existing `_sbTilemaps` object literal in `src/components/Runner/engine/tilemap.js` (after `setDepth`/`tileMapHeightPx`, before the closing `};`):

```javascript
  createTileMapSet(stmPath) {
    const data = _sbAssets.get(stmPath);
    const tileW = Number(data.tileWidth);
    const tileH = Number(data.tileHeight);
    const base = _sbAssets.get(data.tileImage);
    const cols = Math.floor(base.width / tileW);
    const rows = Math.floor(base.height / tileH);
    const frames = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        frames.push(
          new PIXI.Texture({
            source: base.source,
            frame: new PIXI.Rectangle(c * tileW, r * tileH, tileW, tileH),
          })
        );
      }
    }

    const layers = {};
    for (const name of Object.keys(data.layers)) {
      const layerData = data.layers[name];
      const container = new PIXI.Container();
      container._tileW = tileW;
      container._tileH = tileH;
      container._frames = frames;
      container._map = layerData;
      for (let row = 0; row < layerData.length; row++) {
        for (let col = 0; col < layerData[row].length; col++) {
          const id = layerData[row][col];
          if (!id) continue;
          if (id < 1 || id > frames.length) continue;
          const sprite = new PIXI.Sprite(frames[id - 1]);
          sprite.x = col * tileW;
          sprite.y = row * tileH;
          container.addChild(sprite);
        }
      }
      layers[name] = container;
      // `this`, not a module-scoped `_sbStage` reference — calling sibling
      // module functions through `this` is required here, not a style choice:
      // `this` is `_sb` (the merged engine object) only when this function is
      // invoked as `_sb.createTileMapSet(...)`, and `addToWorld` reads/writes
      // `this._sbInstances`. A direct `_sbStage.addToWorld(...)` call would
      // bind `this` to the `_sbStage` module object instead, where
      // `_sbInstances` doesn't exist — this exact aliasing mistake was a real,
      // previously-shipped bug (see docs/roadmap.md known issue #16).
      this.addToWorld({ _handle: container });
    }

    return { _layers: layers };
  },

  getTileMapSetLayer(handle, name) {
    const layer = handle._layers[name];
    if (!layer) {
      const available = Object.keys(handle._layers).join(', ') || '(none)';
      throw Error(`TileMapSet: no layer named "${name}". Available layers: ${available}`);
    }
    return layer;
  },
```

- [ ] **Step 2: Verify the file is still valid JS**

Run: `npx vite build`
Expected: build succeeds (no syntax errors). This does not exercise the new functions at runtime — Task 7 does that.

- [ ] **Step 3: Commit**

```bash
git add src/components/Runner/engine/tilemap.js
git commit -m "feat: add TileMapSet engine support (createTileMapSet, getTileMapSetLayer)"
```

---

### Task 3: `TileMapSet` class — loads a `.stm` file and hands out named layers

**Files:**
- Create: `src/lib/Basic4WebGL/defs/tilemapset.bas`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`

**Precondition:** Task 1's "returned from a plain function" test passed. If it didn't and you re-scoped per that task's fallback note, adjust the `.bas` content and tests below accordingly before proceeding.

**Update after Task 1 landed:** Task 1 uncovered and fixed a real compiler bug (`ObjectType` was missing `'Variant'` from its `acceptsTypes` — see commit `e447f91` on `main` and `tests/lib/Basic4WebGL/unit/transpiler/objectVariantAssignment.test.ts`), which is what makes `TileMapSet.layer()`'s return value usable at all. That investigation also surfaced a **separate, permanent language constraint** that shapes every test below: a variable can only be the receiver of `.method()`/`.property` access if it was declared with an explicit `dim x as ClassName` type. A bare `dim x` (untyped/Variant) receiving a function's return value, or chaining directly off a function call (`tm.layer("background").transform.setPosition(...)`), both fail to *parse* (`Expected NewLine,EndOfFile,SoftNewLine got Dot`) — this is unrelated to the `ObjectType`/`Variant` fix and isn't going to change. Every place below that captures a `tm.layer(name)` result must use `dim x as TileMapLayer` followed by a separate `x = tm.layer(name)` assignment — never a bare `dim x` and never inline chaining.

- [ ] **Step 1: Write the failing test**

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transformSource    = readFileSync('src/lib/Basic4WebGL/defs/transform.bas',    'utf-8');
const tileMapLayerSource = readFileSync('src/lib/Basic4WebGL/defs/tilemaplayer.bas', 'utf-8');
const tileMapSetSource   = readFileSync('src/lib/Basic4WebGL/defs/tilemapset.bas',   'utf-8');

const transpileWithTileMapSet = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource    },
      { name: 'TileMapLayer.bas',    source: tileMapLayerSource },
      { name: 'TileMapSet.bas',      source: tileMapSetSource   },
      { name: 'Main.bas',            source                     },
    ],
  });

// ─── Construction ─────────────────────────────────────────────────────────────

describe('TileMapSet — construction', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapSet(
      'function test()\n  dim tm as TileMapSet("level1.stm")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.createTileMapSet(', () => {
    const result = transpileWithTileMapSet(
      'function test()\n  dim tm as TileMapSet("level1.stm")\nendfunction'
    );
    expect(result.code).toContain('_sb.createTileMapSet(');
  });
});

// ─── layer() ──────────────────────────────────────────────────────────────────

describe('TileMapSet — layer', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapSet([
      'function test()',
      '  dim tm as TileMapSet("level1.stm")',
      '  dim bg as TileMapLayer',
      '  bg = tm.layer("background")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getTileMapSetLayer(', () => {
    const result = transpileWithTileMapSet([
      'function test()',
      '  dim tm as TileMapSet("level1.stm")',
      '  dim bg as TileMapLayer',
      '  bg = tm.layer("background")',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.getTileMapSetLayer(');
  });
});

// ─── layer() return value usable exactly like TileMapLayer ────────────────────
//
// Note: `dim bg as TileMapLayer` (explicit type) then a separate `bg = tm.layer(...)`
// assignment is required — a bare `dim bg` or inline chaining
// (`tm.layer("background").tileAt(...)`) fails to parse, since member/method access
// is only recognized on a variable declared with an explicit class type.

describe('TileMapSet — layer() return value supports the full TileMapLayer API', () => {
  test('tileAt / widthPx / heightPx / transform / setDepth all compile without error', () => {
    const result = transpileWithTileMapSet([
      'function test()',
      '  dim tm as TileMapSet("level1.stm")',
      '  dim bg as TileMapLayer',
      '  bg = tm.layer("background")',
      '  dim t',
      '  t = bg.tileAt(100, 200)',
      '  dim w',
      '  w = bg.widthPx()',
      '  dim h',
      '  h = bg.heightPx()',
      '  bg.transform.setPosition(-50, 0)',
      '  bg.setDepth(0)',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── End-to-end ───────────────────────────────────────────────────────────────

describe('TileMapSet — end-to-end', () => {
  test('full multi-layer platformer map program compiles without error', () => {
    const result = transpileWithTileMapSet([
      'dim tm as TileMapSet("level1.stm")',
      'dim solid as TileMapLayer',
      'dim background as TileMapLayer',
      '',
      'function onenter()',
      '  solid = tm.layer("collision")',
      '  background = tm.layer("background")',
      '  background.transform.setPosition(0, 0)',
      'endfunction',
      '',
      'function onupdate()',
      '  dim tileId',
      '  tileId = solid.tileAt(100, 200)',
      '  if tileId > 0',
      '    solid.transform.setPosition(-50, 0)',
      '  endif',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`
Expected: FAIL — `src/lib/Basic4WebGL/defs/tilemapset.bas` does not exist yet (`ENOENT`).

- [ ] **Step 3: Write `tilemapset.bas`**

```basic
Class
dim _handle

Constructor(stmPath)
    self._handle = call("_sb.createTileMapSet(constructor_stmPath)")
EndConstructor

function layer(name)
    dim result as TileMapLayer(call("_sb.getTileMapSetLayer(this._handle, layer_name)"))
    return result
endfunction

EndClass
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/tilemapset.bas tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts
git commit -m "feat: add TileMapSet class (loads .stm files, hands out named TileMapLayer handles)"
```

---

### Task 4: Package registration

**Files:**
- Modify: `src/constants/packageModules.ts`
- Modify: `src/constants/firstPartyPackages.ts`

- [ ] **Step 1: Register both new modules in `packageModules.ts`**

In `src/constants/packageModules.ts`, add two imports after the existing `tilemap` import (line 17):

```typescript
import tilemaplayer from '../lib/Basic4WebGL/defs/tilemaplayer.bas?raw';
import tilemapset from '../lib/Basic4WebGL/defs/tilemapset.bas?raw';
```

And add both to the exported `packageModules` map, after `tilemap,` (line 44):

```typescript
  tilemaplayer,
  tilemapset,
```

- [ ] **Step 2: Add both modules to the `softgfx` package and bump its version**

In `src/constants/firstPartyPackages.ts`, update the `softgfx` entry: bump `version` from `'2.2.0'` to `'2.3.0'` (a new module added — matches this repo's existing convention of a minor package-version bump per added module, see git history on this file), and add `'tilemaplayer'` and `'tilemapset'` to `moduleNames` (placed right after `'tilemap'`, matching import order):

```typescript
  {
    id: 'softgfx',
    name: 'softGfx',
    version: '2.3.0',
    isCore: false,
    isFirstParty: true,
    moduleNames: ['gfx', 'input', 'drawing', 'stage', 'pen', 'assetmanager', 'ObjectTransform', 'sprite', 'animatedsprite', 'text', 'tilemap', 'tilemaplayer', 'tilemapset', 'audio', 'collision', 'rayhit', 'scene', 'scenemanager', 'camera', 'world', 'hud'],
  },
```

- [ ] **Step 3: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass (existing suite unaffected, new `TileMapLayer`/`TileMapSet` tests included).

- [ ] **Step 4: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/constants/packageModules.ts src/constants/firstPartyPackages.ts
git commit -m "feat: register TileMapLayer and TileMapSet in the softgfx package"
```

---

### Task 5: Documentation

**Files:**
- Create: `src/docs/api-reference/tilemapset.md`
- Modify: `src/docs/manifest.ts`
- Modify: `src/docs/api-reference/tilemap.md`

- [ ] **Step 1: Write the new API reference page**

Create `src/docs/api-reference/tilemapset.md`:

```markdown
# tilemapset

A `tilemapset` loads a `.stm` file — a multi-layer tile-based level, with a background layer, a foreground layer, a collision layer, or any other named layers you want. Each layer renders automatically as soon as the `tilemapset` is created, in the order the layers were saved in the file (first layer at the back, last layer at the front). Use [tilemap](tilemap) instead if your level only needs one layer.

## Constructor

```bas
dim level as tilemapset("level1.stm")
```

| Parameter | Type   | Description |
|-----------|--------|--------------|
| stmPath   | string | Filename of the `.stm` file in your project assets |

## layer(name)

Returns one named layer from the loaded `.stm` file, so you can position it, scroll it, or check tiles on it. The returned layer has the same `tileAt`, `widthPx`, `heightPx`, `transform`, and `setDepth` you already know from [tilemap](tilemap).

| Parameter | Type   | Description |
|-----------|--------|--------------|
| name      | string | The layer's name, as it was saved in the `.stm` file |

**Returns:** a tilemap layer object. Store it in a variable declared `as tilemaplayer` — you need the type so you can call methods on it afterwards.

```bas
dim level as tilemapset("level1.stm")
dim solidGround as tilemaplayer

function onenter()
  solidGround = level.layer("collision")
endfunction

function onupdate()
  dim tile
  tile = solidGround.tileAt(player.transform.x(), player.transform.y())
  if tile > 0 then
    print "standing on solid ground"
  endif
endfunction
```

Scrolling a single layer for a parallax effect:

```bas
dim background as tilemaplayer

function onenter()
  background = level.layer("background")
endfunction

function onupdate()
  background.transform.setPosition(-cameraX / 2, 0)
endfunction
```
```

- [ ] **Step 2: Add the manifest entry**

In `src/docs/manifest.ts`, add a new topic line directly after the existing `tilemap` line (around line 72):

```typescript
          { slug: 'tilemapset',      title: 'tilemapset',      file: 'api-reference/tilemapset.md' },
```

- [ ] **Step 3: Cross-reference from the existing `tilemap` page**

In `src/docs/api-reference/tilemap.md`, add a short note right after the intro paragraph (after line 3, before the "Position is controlled..." line):

```markdown
Need more than one layer — a background, a foreground, a collision layer? See [tilemapset](tilemapset) instead, which loads all of them from a single `.stm` file.
```

- [ ] **Step 4: Verify the build**

Run: `npx vite build`
Expected: build succeeds (confirms the new markdown file and manifest entry are wired correctly).

- [ ] **Step 5: Commit**

```bash
git add src/docs/api-reference/tilemapset.md src/docs/manifest.ts src/docs/api-reference/tilemap.md
git commit -m "docs: add tilemapset API reference page"
```

---

### Task 6: Roadmap sync

**Files:**
- Modify: `docs/roadmap.md`
- Modify: `docs/language/library-roadmap.md`
- Check: `src/docs/roadmap.md`

- [ ] **Step 1: Mark known deferred issue #10 resolved in `docs/roadmap.md`**

Find this line (currently issue #10 in the "Known deferred issues" list):

```
10. **`tilemap` has no multi-layer support** — one instance is one flat 2D grid (`tilemap.js`'s `loadTileMap` rebuilds from a single `_map` array, one tile ID per cell). Background/foreground separation is only achievable by stacking multiple whole `tilemap` instances with `setDepth()`, each with its own separate JSON layout. Discovered 2026-08-04 while briefing the coins-platformer demo (decided to skip a background layer for that demo — solid colour background instead — specifically to avoid this workaround). Higher priority than a typical "known deferred issue": this is a direct prerequisite for **Milestone 12 (Tilemap editor)** — see that milestone's entry above — since a visual editor's data model and export format should be designed against real layer support, not the current single-layer-plus-stacking workaround.
```

Replace it with:

```
10. ~~`tilemap` has no multi-layer support~~ **[RESOLVED, 2026-08-05]** — shipped as a new, separate `TileMapSet` class (`.stm` file format: `{tileWidth, tileHeight, tileImage, layers: {name: [[...]]}}`) plus a `TileMapLayer` wrapper class exposing the existing `TileMap` API (`tileAt`, `widthPx`, `heightPx`, `transform`, `setDepth`) per named layer. `TileMap`, `tilemap.bas`, and the bare single-array JSON format are unchanged — `TileMapSet` is additive, for games that want multiple named layers loaded and rendered as one unit instead of stacking independent `TileMap` instances. Design: `docs/superpowers/specs/2026-08-05-tilemapset-design.md`. Tests: `tests/lib/Basic4WebGL/unit/transpiler/tilemaplayer.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`. Docs: `src/docs/api-reference/tilemapset.md`. This closes the prerequisite engine gap for **Milestone 12 (Tilemap editor)** below — the editor itself (painting UI, load/save, tile palette) remains unscheduled.
```

- [ ] **Step 2: Update Milestone 12's entry in `docs/roadmap.md`**

Find:

```
### Milestone 12 — Tilemap editor
Visual tilemap editor integrated with the existing `tilemap` module. Paint tiles onto a grid, configure tile properties, export to a format the runtime can load. Scope TBD.

**Prerequisite engine gap, not just a UI scoping question:** the `tilemap` module currently only supports a single flat layer per instance — one tile ID per cell, no background/foreground/collision-layer concept within one definition (see "Known deferred issues" below). Today that's worked around at the *content* level by stacking multiple `tilemap` instances with `setDepth()`, each loaded from its own separate JSON — fine for hand-written softBASIC, but a visual editor built only around today's single-layer `load(jsonPath)` format would bake that workaround into the tool itself (multiple independent tilemaps to paint and keep aligned, rather than one map with layers). Worth deciding whether `tilemap` gets real multi-layer support at the engine/format level *before* designing this editor, since the editor's data model and the runtime format it exports to are the same design decision.
```

Replace it with:

```
### Milestone 12 — Tilemap editor
Visual tilemap editor for authoring `.stm` files: load/save from assets, load a tileset image and auto-split it by tile width/height, paint/erase tiles onto a grid per layer, and manage layers (add/remove/rename). Scope TBD beyond that core loop.

**Prerequisite engine gap — resolved 2026-08-05.** The `TileMapSet`/`TileMapLayer` runtime classes and the `.stm` multi-layer file format now exist (see known deferred issue #10, resolved). The editor's data model and export format are the `.stm` format defined there — the editor is purely the remaining UI work: no further engine-level design decisions block it.
```

- [ ] **Step 3: Add `TileMapSet`/`TileMapLayer` rows to `docs/language/library-roadmap.md`'s module table**

Find this line:

```
| `TileMap` *(class)* | `constructor(tilesetPath, tileW, tileH)` `load(jsonPath)` `tileAt(x,y)` `widthPx()` `heightPx()` `setDepth(n)` |
```

Add these two lines directly after it:

```
| `TileMapSet` *(class)* | `constructor(stmPath)` — loads a multi-layer `.stm` file and auto-renders every layer; `layer(name)` returns the named layer as a `TileMapLayer` |
| `TileMapLayer` *(class)* | `tileAt(x,y)` `widthPx()` `heightPx()` `setDepth(n)` — same shape as `TileMap`, returned from `TileMapSet.layer(name)` rather than constructed directly |
```

- [ ] **Step 4: Check `src/docs/roadmap.md` for any public claim needing an update**

Run: `grep -n -i "tilemap" src/docs/roadmap.md`

Read the matched line(s) in context. If any line makes a claim that is now stale (e.g. implies multi-layer tilemaps don't exist yet), update it to reflect that `TileMapSet` ships multi-layer support and the remaining gap is the visual editor UI. If the existing wording ("in-app editors for sprites, tilemaps, and basic music") is still accurate as a forward-looking, editor-focused statement, leave it unchanged.

- [ ] **Step 5: Commit**

```bash
git add docs/roadmap.md docs/language/library-roadmap.md src/docs/roadmap.md
git commit -m "docs: sync roadmap — TileMapSet resolves multi-layer tilemap gap (issue #10)"
```

(Skip `src/docs/roadmap.md` in the `git add` if Step 4 concluded no change was needed.)

---

### Task 7: Manual runtime verification

This sub-project has no Cypress e2e spec (per the design doc — no published tutorial/demo uses `TileMapSet` yet) and no engine-level unit tests (per project convention). The Vitest tests in Tasks 1 and 3 only prove the code *compiles* — they don't prove it *renders* or that `tileAt`/`layer()` return correct values at runtime. This task is the only thing that verifies the engine code in Task 2 actually works, so don't skip it.

**Files:** none (scratch verification only — nothing here is committed)

- [ ] **Step 1: Start the dev server and open the app**

Use the Browser pane's `preview_start` with `{name: "dev"}` (or whatever this repo's `.claude/launch.json` dev-server entry is named — check the file first; create an entry running `npm run dev` on port 5173 if none exists yet).

- [ ] **Step 2: Create a scratch project with a tileset image and a `.stm` asset**

In the running app: create a new project. Upload a small tileset PNG asset (any placeholder grid image works — e.g. a 64×32 image = 2 tiles of 32×32). Create a new JSON-type asset named `test.stm` (via the assets panel's "New text file" flow, or by uploading a small `.stm` file) with contents:

```json
{
  "tileWidth": 32,
  "tileHeight": 32,
  "tileImage": "<your uploaded tileset filename>",
  "layers": {
    "background": [[1, 1], [1, 1]],
    "foreground": [[0, 2], [0, 0]]
  }
}
```

- [ ] **Step 3: Write a small test program exercising `TileMapSet`**

In the project's main `.bas` file:

```basic
dim tm as TileMapSet("test.stm")
dim fg as TileMapLayer

function onenter()
  fg = tm.layer("foreground")
  print "foreground widthPx: "
  print fg.widthPx()
endfunction

function onupdate()
  dim tile
  tile = fg.tileAt(48, 16)
  print tile
endfunction
```

- [ ] **Step 4: Run and check the console panel for errors**

Click Run. Using `read_console_messages` or the in-app bottom console panel, confirm:
- No `ERR` entries appear
- The background layer renders visibly behind the foreground layer (2×2 grid of tiles, foreground's single non-zero tile at column 1, row 0 visible on top)
- The printed `widthPx` value is `64` (2 columns × 32px)
- The printed `tileAt` value is `2` (matches `foreground[0][1]`, the tile under world position `(48, 16)`)

If any of these fail, use `systematic-debugging` to root-cause before considering this task done — this is the only check standing between "compiles" and "actually works."

- [ ] **Step 5: Discard the scratch project**

Delete the scratch project from the app (or leave it — it's local `localStorage` state only, nothing to clean up in the repo). No commit for this task.

---

### Task 8: Final full-suite verification

**Files:** none

- [ ] **Step 1: Run the full Vitest suite**

Run: `npx vitest run`
Expected: all tests pass, including every test added in Tasks 1 and 3.

- [ ] **Step 2: Run a final build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 3: Confirm working tree is clean**

Run: `git status`
Expected: nothing to commit (every task above already committed its own changes).
