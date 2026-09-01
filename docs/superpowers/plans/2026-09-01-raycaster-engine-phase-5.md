# Raycaster Engine — Phase 5: `drawing` Throughput Fix + `RcLights` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two things. (1) A **generic** `drawing.js` fix — pool `PIXI.Graphics`/`PIXI.Sprite` objects and cache strip textures instead of allocating + `destroy()`ing every frame — so the per-frame cost of a loop of `drawRect`/`drawImageStrip` calls stops growing with GC pressure. This benefits every game and is the spec §5.3 rung-1 fix the marginal Phase 3 frame time (16 ms / 127 cols) called for. (2) `RcLights.bas` — a softBASIC light-grid: ambient + baked static lights + dynamic point lights, each with wall-occlusion via `RcCast.los` LOS marches; `RcRender` samples it per strip and shades accordingly. Verified by an unlisted `raycaster-p5` Cypress demo (dark room, camera flashlight + a static wall light casting a hard shadow) with probes on the light grid.

**Architecture:** (1) is a pure internal `drawing.js` change — no softBASIC surface change (`drawing.clear()` / `drawRect` / `drawImageStrip` keep their exact contracts), plus a `_drawingReset()` teardown hook wired into `stage.clear()` (which also fixes a latent cross-scene leak). (2) is pure softBASIC (spec §1.1). `RcLights` owns the ambient colour, a static per-cell light array baked once, and a dynamic-light list re-accumulated each frame. `RcRender.bindLights(rcLights)` + `renderFrame` samples `rcLights.sampleCell(col, row)` per strip and multiplies the base shade. Textured walls + the `drawImageStrip(tint)` param (spec §5.3 rung 3) are still deferred — Phase 5 stays flat-shaded, so light modulates a `drawRect` colour, which needs no engine change.

**Tech Stack:** TypeScript/React, Vitest (JS unit tests for the `drawing` fix; transpile + smoke guards for `.bas`), Cypress e2e, softBASIC.

**Spec:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` §5.3 (the `drawing` contingency — rung 1 only), §6 (lighting: light grid, LOS occlusion, light cap, ambient + point), phase 5 of §11. Deferred: spot lights beyond a basic cone (§6.2 — polish), the `drawImageStrip(tint)` param + texturing (§5.3 rung 3), per-(cell,light) static caching (§6.4 — a later optimisation), coloured light beyond a single scalar per cell.

---

## Background the implementer needs

- **Phases 1–4 shipped** (`d26480e`..`4459698`). Library in `demo-src/raycaster/lib/`: `RcConfig.bas` (const, prefixed access), `RcWorld.bas`, `RcCast.bas` (`cast`/`los`), `RcRender.bas` (`new RcRender(w)`, `setCamera`, `bindCamera(mover)`, `projectY`, `renderFrame`, `columnCount`, `drawStrip(destX,sTop,sBot,winTop,winBot,shadeKind)`), `RcMover.bas`.
- **`RcWorld` already parses `light:` tags** into a per-cell `lightArr` (0/1 flag, from Phase 1). Accessor: **none yet** — `RcWorld` has no `lightAt(col,row)`; Task 5 adds it (mirror `wallTexAt`, return the `lightArr` entry, OOB → 0).
- **`RcCast.los(wld, ox, oy, dx, dy)`** → distance to first opaque wall, or `-1` if none within `RC_MAX_DIST`. This is the LOS primitive `RcLights` uses.
- **softBASIC footgun** — never name a param/local after a builtin module. `wld`/`w`, never `world`.
- **softBASIC facts:** `const` prefixed only. No `elseif`, no `%`/bitwise. `0 - x` negation. `and`/`or` in `if`. `dim`s hoisted. `math`: `sin cos tan pi abs floor sqrt min max clamp val`. `math.sqrt` exists. Scenes: `Constructor()`, `onenter()`, `onupdate(delta)` (`delta` = ms). Typed function-locals of user classes work (Phase 4). Typed `.field` reads on external instances do NOT — use method calls.
- **`drawing.js`** (`src/components/Runner/engine/drawing.js`, ~75 lines): `_drawObjs[]` tracks everything; `drawLine/drawRect/drawCircle` → `new PIXI.Graphics()` + geometry + `_track` (which `worldContainer.addChild` + push); `drawImageStrip` → `new PIXI.Texture({source, frame})` + `new PIXI.Sprite` + `_track`; `clearDrawing()` → loop `_drawObjs`, `removeChild` + `obj.destroy()`, `_drawObjs.length = 0`. `worldContainer.sortableChildren = true` (from `stage.js`).
- **`drawing.js` is a plain script** (bare `const _sbDrawing`), concatenated into the runtime iframe. Test harness: `new Function('PIXI','worldContainer', src + '; return _sbDrawing')` with a fake PIXI — see `tests/components/Runner/tilemap.test.ts` / `stage.test.ts` for the pattern. No existing `drawing` test file.
- **`stage.js` `clear()`** calls `this._cameraReset()`, `this._pathfindingReset()`, `this._tileCollisionReset()`, `this._frameLoopReset()`, `this._raycasterReset?`... (check current list). Task 2 adds `this._drawingReset()`.
- **Guards:** `raycasterDemoTranspile`, `raycasterDemoLibSync`, `raycasterDemoSmoke` (transpile + eval + drive `RcCast`/`RcRender`/`RcMover`; extend for `RcLights` in Task 6). Auto-discover `raycaster-p*/`.
- **Frame budget:** Phase 3 measured 16 ms / 127 cols flat-shaded. Phase 5 adds `RcLights.update()` (a few thousand `los` marches/frame) + a per-strip array lookup + a colour multiply. The `drawing` pooling fix (Tasks 1–2) must land first and be measured to have bought headroom before the lighting is added.

---

## Task 1: `drawing.js` — pool graphics/sprites + cache strip textures

**Files:** Modify `src/components/Runner/engine/drawing.js`; create `tests/components/Runner/drawing.test.ts`.

- [ ] **Step 1: Write the failing tests**

Create `tests/components/Runner/drawing.test.ts`. Harness (fake PIXI recording allocations):

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect, beforeEach } from 'vitest';

let gfxCreated = 0;
let spriteCreated = 0;
let textureCreated = 0;
let destroyed = 0;

class FakeGraphics {
  visible = true; position = { set() {} }; pivot = { set() {} };
  constructor() { gfxCreated++; }
  clear() { return this; }
  rect() { return this; } circle() { return this; } moveTo() { return this; } lineTo() { return this; }
  fill() { return this; } stroke() { return this; }
  destroy() { destroyed++; }
}
class FakeSprite {
  visible = true; width = 0; height = 0; anchor = { set() {} }; position = { set() {} };
  texture: unknown;
  constructor(t: unknown) { spriteCreated++; this.texture = t; }
  destroy() { destroyed++; }
}
class FakeTexture { constructor() { textureCreated++; } }
class FakeRectangle { constructor(public x: number, public y: number, public w: number, public h: number) {} }
class FakeContainer {
  children: unknown[] = [];
  addChild(c: unknown) { this.children.push(c); }
  removeChild(c: unknown) { this.children = this.children.filter((x) => x !== c); }
  removeChildren() { this.children = []; }
}

function loadDrawing() {
  gfxCreated = spriteCreated = textureCreated = destroyed = 0;
  const src = readFileSync('src/components/Runner/engine/drawing.js', 'utf-8');
  const PIXI = { Graphics: FakeGraphics, Sprite: FakeSprite, Texture: FakeTexture, Rectangle: FakeRectangle };
  const worldContainer = new FakeContainer();
  const _sbAssets = { get: () => ({ source: {}, width: 16, height: 64 }) };
  const factory = new Function(
    'PIXI', 'worldContainer', '_sbAssets',
    `${src}\n; return _sbDrawing;`,
  );
  return { d: factory(PIXI, worldContainer, _sbAssets), worldContainer };
}

describe('drawing — object pooling', () => {
  test('drawRect after clear reuses the Graphics, does not allocate a new one', () => {
    const { d } = loadDrawing();
    d.drawRect(0, 0, 10, 10);
    d.drawRect(0, 0, 10, 10);
    expect(gfxCreated).toBe(2);
    d.clearDrawing();
    d.drawRect(0, 0, 10, 10);
    d.drawRect(0, 0, 10, 10);
    expect(gfxCreated).toBe(2); // reused from the pool, no new allocations
  });

  test('clearDrawing does not destroy pooled objects', () => {
    const { d } = loadDrawing();
    d.drawRect(0, 0, 10, 10);
    d.clearDrawing();
    expect(destroyed).toBe(0);
  });

  test('drawImageStrip caches the texture per (image, srcX)', () => {
    const { d } = loadDrawing();
    d.drawImageStrip('wall.png', 3, 0, 0, 4, 40);
    d.drawImageStrip('wall.png', 3, 8, 0, 4, 40); // same srcX -> cached texture
    expect(textureCreated).toBe(1);
    d.drawImageStrip('wall.png', 5, 0, 0, 4, 40); // new srcX -> new texture
    expect(textureCreated).toBe(2);
  });

  test('drawImageStrip after clear reuses the Sprite', () => {
    const { d } = loadDrawing();
    d.drawImageStrip('wall.png', 3, 0, 0, 4, 40);
    d.clearDrawing();
    d.drawImageStrip('wall.png', 3, 0, 0, 4, 40);
    expect(spriteCreated).toBe(1);
  });

  test('_drawingReset destroys everything (pooled + live) and clears caches', () => {
    const { d } = loadDrawing();
    d.drawRect(0, 0, 10, 10);
    d.drawImageStrip('wall.png', 3, 0, 0, 4, 40);
    d.clearDrawing();          // -> pool
    d.drawRect(0, 0, 10, 10);  // -> live
    d._drawingReset();
    expect(destroyed).toBeGreaterThanOrEqual(3); // 1 gfx pooled + 1 sprite pooled + 1 gfx live
    // after reset, a fresh draw allocates anew
    d.drawRect(0, 0, 10, 10);
    const before = gfxCreated;
    d.clearDrawing();
    d.drawRect(0, 0, 10, 10);
    expect(gfxCreated).toBe(before); // pool still works post-reset
  });

  test('a shrinking frame returns excess objects to the pool, not leaked as visible', () => {
    const { d, worldContainer } = loadDrawing();
    d.drawRect(0, 0, 1, 1); d.drawRect(0, 0, 1, 1); d.drawRect(0, 0, 1, 1);
    d.clearDrawing();
    d.drawRect(0, 0, 1, 1); // only 1 this frame
    const visible = worldContainer.children.filter((c: any) => c.visible).length;
    expect(visible).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect fail**

`npx vitest run tests/components/Runner/drawing.test.ts` → FAIL (`_drawingReset` undefined; `gfxCreated`/`textureCreated` assertions fail because nothing is pooled/cached).

If the harness itself throws (fake PIXI missing a method `drawing.js` calls, or `_sbAssets` shape wrong), fix the fakes first — read the real `drawImageStrip` / `drawRect` bodies and stub exactly what they touch.

- [ ] **Step 3: Implement pooling in `drawing.js`**

Rewrite the module internals (keep every public method name + signature):

```js
const _sbDrawing = (() => {
  const _styles = { fillColor: 0xffffff, lineColor: 0xffffff, lineWidth: 2 };
  const _live = [];                 // drawn this frame
  const _poolG = [];                // free Graphics
  const _poolS = [];                // free Sprites
  const _texCache = new Map();      // `${imageName}:${srcX}` -> PIXI.Texture

  function _componentToHex(c) { const h = Math.floor(c).toString(16); return h.length === 1 ? '0' + h : h; }

  function _acquireG() {
    let g = _poolG.pop();
    if (g) { g.clear(); g.visible = true; }
    else { g = new PIXI.Graphics(); g._sbKind = 'g'; worldContainer.addChild(g); }
    _live.push(g);
    return g;
  }
  function _acquireS() {
    let s = _poolS.pop();
    if (s) { s.visible = true; }
    else { s = new PIXI.Sprite(PIXI.Texture.EMPTY ?? undefined); s._sbKind = 's'; worldContainer.addChild(s); }
    _live.push(s);
    return s;
  }
  function _texFor(imageName, srcX) {
    const key = imageName + ':' + srcX;
    let t = _texCache.get(key);
    if (!t) {
      const base = _sbAssets.get(imageName);
      t = new PIXI.Texture({ source: base.source, frame: new PIXI.Rectangle(srcX, 0, 1, base.height) });
      _texCache.set(key, t);
    }
    return t;
  }

  return {
    setFillColor(r, g, b) { _styles.fillColor = parseInt(_componentToHex(r) + _componentToHex(g) + _componentToHex(b), 16); },
    setLineColor(r, g, b) { _styles.lineColor = parseInt(_componentToHex(r) + _componentToHex(g) + _componentToHex(b), 16); },
    setLineWidth(n) { _styles.lineWidth = n; },

    drawLine(x, y, x2, y2) {
      const o = _acquireG();
      o.moveTo(0, 0).lineTo(x2, y2).stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      o.position.set(x, y);
      return o;
    },
    drawRect(x, y, width, height) {
      const o = _acquireG();
      o.rect(0, 0, width, height).fill(_styles.fillColor);
      if (_styles.lineWidth > 0) o.stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      o.pivot.set(width / 2, height / 2);
      o.position.set(x, y);
      return o;
    },
    drawCircle(x, y, radius) {
      const o = _acquireG();
      o.circle(0, 0, radius).fill(_styles.fillColor);
      if (_styles.lineWidth > 0) o.stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      o.pivot.set(radius / 2, radius / 2);
      o.position.set(x, y);
      return o;
    },
    drawImageStrip(imageName, srcX, destX, destY, destWidth, destHeight) {
      const o = _acquireS();
      o.texture = _texFor(imageName, srcX);
      o.width = destWidth;
      o.height = destHeight;
      o.anchor.set(0.5, 0.5);
      o.position.set(destX, destY);
      return o;
    },

    clearDrawing() {
      for (const o of _live) {
        o.visible = false;
        (o._sbKind === 's' ? _poolS : _poolG).push(o);
      }
      _live.length = 0;
    },

    // Full teardown — pooled + live objects destroyed, caches cleared. Called by
    // stage.clear() on scene switch (also fixes the old cross-scene leak where
    // _drawObjs kept references after worldContainer.removeChildren()).
    _drawingReset() {
      for (const o of _live) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      for (const o of _poolG) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      for (const o of _poolS) { if (o.parent) o.parent.removeChild(o); o.destroy(); }
      _live.length = 0; _poolG.length = 0; _poolS.length = 0;
      for (const t of _texCache.values()) { if (t.destroy) t.destroy(); }
      _texCache.clear();
    },
  };
})();
```

Notes:
- `PIXI.Texture.EMPTY` may not exist in the fake — the `?? undefined` guard covers it; in the real PIXI it does. If the fake `Sprite` ctor rejects `undefined`, pass `new PIXI.Texture(...)` of a 1×1 — simplest is to make the fake tolerate `undefined` (adjust the test fake, not the module).
- Check whether `_sbAssets` is in scope in `drawing.js` today — the current `drawImageStrip` references `_sbAssets.get`. It is a runtime global (from `assets.js`). Keep using it.

- [ ] **Step 4: Run — expect pass**

`npx vitest run tests/components/Runner/drawing.test.ts` → PASS (all 6).

- [ ] **Step 5: Full suite + build**

`npx vitest run` — watch for existing tests that assumed `clearDrawing` destroys objects or that count `worldContainer.children`. Fix expectations (the behaviour genuinely changed: objects now persist hidden). `npx vite build` clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/engine/drawing.js tests/components/Runner/drawing.test.ts
git commit -m "perf(drawing): pool Graphics/Sprite objects + cache strip textures instead of per-frame alloc/destroy"
```

---

## Task 2: Wire `_drawingReset` into scene teardown

**Files:** Modify `src/components/Runner/engine/stage.js`; possibly `src/components/Runner/softBasicEngine.js`.

**Note (post Task-1 fix `4d3733c`+):** `_acquireG`/`_acquireS` now `addChild` unconditionally, so pooled objects survive `worldContainer.removeChildren()` (scene switch *and* `world.clearWorld()`) without a reset — drawing keeps working. `_drawingReset` is now **pure memory hygiene** (free the pool + texture cache on scene switch so a demo-heavy → game switch doesn't retain a huge hidden pool). Still worth wiring into `stage.clear()`; no longer a correctness dependency, so `stage.clearWorld()` does NOT need it.

- [ ] **Step 1:** Confirm `_sbDrawing._drawingReset` reaches `_sb`. `softBasicEngine.js` spreads `..._sbDrawing` — so `_sb._drawingReset` exists. Check.

- [ ] **Step 2:** In `stage.js` `clear()`, add `this._drawingReset();` alongside the other `*Reset()` calls.

- [ ] **Step 3:** Check `tests/components/Runner/bootstrapper.test.ts` / any test asserting the `stage.clear()` reset sequence — update if it pins the exact call list.

- [ ] **Step 4:** `npx vitest run` green, `npx vite build` clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/stage.js
git commit -m "fix(stage): tear down pooled drawing objects on scene switch"
```

---

## Task 3: Frame-time re-measure (spec §5.3 checkpoint)

**Files:** none (measurement) — updates the Phase 3 plan's frame-time record.

- [ ] **Step 1:** Run `raycaster-p3-roomview` in a browser, read the `frame avg N ms over 30 (M cols)` HUD line (the demo already prints it). Compare to the Phase 3 baseline (16 ms / 127 cols).
- [ ] **Step 2:** Record the new number in `docs/superpowers/plans/2026-09-01-raycaster-engine-phase-3.md` "Frame-time result" section (append a "Post-pooling-fix" line) and in the Phase 5 close-out summary.
- [ ] **Step 3: Decision.**
  - Improved to ≤ ~10 ms: good headroom for lighting. Proceed.
  - Still 12–16 ms: proceed with lighting but keep `RcLights.update()` cost tight (small `RC_LIGHT_RANGE`, cap dynamic lights low) and re-measure at Phase 5 close.
  - No improvement / worse: STOP — the pooling fix didn't help; investigate (is the cost elsewhere — the `sortableChildren` per-frame sort? `drawRect` geometry rebuild?). Report before continuing.

---

## Task 4: `RcConfig` + `RcWorld.lightAt`

**Files:** Modify `demo-src/raycaster/lib/RcConfig.bas` and `RcWorld.bas`; re-sync all demo copies.

- [ ] **Step 1: `RcConfig`** — add to the `const` block:

```basic
  RC_LIGHT_RANGE = 6
  RC_LIGHT_CAP = 4
  RC_AMBIENT = 0.12
  RC_LIGHT_FALLOFF = 1.0
```

`RC_LIGHT_RANGE` — cells a light reaches. `RC_LIGHT_CAP` — max dynamic lights. `RC_AMBIENT` — base light level everywhere (0..1). `RC_LIGHT_FALLOFF` — spare tuning knob.

- [ ] **Step 2: `RcWorld.lightAt(col, row)`** — add after `wallTexAt`, mirroring it: `if inBounds = 0 then return 0`; `return self.lightArr(row * self.cols + col)`. (The `lightArr` is already populated by `applyKv` from `light:` tags in Phase 1.)

- [ ] **Step 3: Re-sync** — `cp demo-src/raycaster/lib/RcConfig.bas` and `RcWorld.bas` to every `demo-src/raycaster-p*/` dir that has them (`ls demo-src/raycaster-p*/RcConfig.bas` / `...RcWorld.bas`).

- [ ] **Step 4:** `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo` green.

- [ ] **Step 5: Commit** `feat(raycaster): RcConfig light constants + RcWorld.lightAt`.

---

## Task 5: `RcLights.bas` — the light grid

**Files:** Create `demo-src/raycaster/lib/RcLights.bas`; extend the smoke test.

- [ ] **Step 1: Create the module**

```basic
Class
' RcLights -- a per-cell light grid for a raycaster scene (spec §6).
' Ambient + baked static lights (from `light:` tags) + up to RC_LIGHT_CAP dynamic
' point lights, each wall-occluded via RcCast.los. RcRender samples sampleCell()
' per strip and multiplies its base shade.
'
' The RcWorld field is `wld`, NEVER `world`.
'
' Deferred (spec): coloured light (only a scalar 0..1 per cell here), spot cones,
' per-(cell,light) static caching (§6.4).
dim wld as RcWorld
dim rc as RcCast
dim cols
dim rows
dim ambient
dim staticArr(0)   ' baked once, per cell
dim dynArr(0)       ' re-accumulated each update(), per cell
dim lxArr(0)        ' dynamic light params, parallel
dim lyArr(0)
dim lzArr(0)
dim liArr(0)        ' intensity
dim lrArr(0)        ' radius (cells)
dim lActive(0)      ' 1 = live, 0 = removed slot

Constructor(w as RcWorld)
    self.wld = w
    self.rc = new RcCast()
    self.cols = w.widthCells()
    self.rows = w.heightCells()
    self.ambient = RcConfig.RC_AMBIENT
    dim n
    dim i
    n = self.cols * self.rows
    for i = 0 to n - 1
        array.push(self.staticArr, 0)
        array.push(self.dynArr, 0)
    next i
    self.bakeStatic()
EndConstructor

function setAmbient(level)
    self.ambient = level
endfunction

' Bake every `light:` cell as a static point into staticArr, wall-occluded.
function bakeStatic()
    dim col
    dim row
    dim lc
    dim lr
    for lr = 0 to self.rows - 1
        for lc = 0 to self.cols - 1
            if self.wld.lightAt(lc, lr) > 0 then
                self.splat(self.staticArr, lc + 0.5, lr + 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
            endif
        next lc
    next lr
endfunction

' Add a dynamic point light. Returns its handle (slot index).
function addPoint(x, y, z, intensity, radiusCells)
    array.push(self.lxArr, x)
    array.push(self.lyArr, y)
    array.push(self.lzArr, z)
    array.push(self.liArr, intensity)
    array.push(self.lrArr, radiusCells)
    array.push(self.lActive, 1)
    return array.arrLength(self.lActive) - 1
endfunction

function moveLight(handle, x, y)
    self.lxArr(handle) = x
    self.lyArr(handle) = y
endfunction

function setLightIntensity(handle, intensity)
    self.liArr(handle) = intensity
endfunction

function removeLight(handle)
    self.lActive(handle) = 0
endfunction

' Splat one light's contribution into a grid, LOS-occluded by walls.
function splat(grid, wx, wy, intensity, radiusCells)
    dim col
    dim row
    dim c0
    dim c1
    dim r0
    dim r1
    dim cx
    dim cy
    dim dx
    dim dy
    dim dist
    dim losD
    dim add
    c0 = math.floor(wx - radiusCells)
    c1 = math.floor(wx + radiusCells)
    r0 = math.floor(wy - radiusCells)
    r1 = math.floor(wy + radiusCells)
    for row = r0 to r1
        for col = c0 to c1
            if col >= 0 and row >= 0 and col < self.cols and row < self.rows then
                cx = col + 0.5
                cy = row + 0.5
                dx = cx - wx
                dy = cy - wy
                dist = math.sqrt(dx * dx + dy * dy)
                if dist > 0.001 and dist < radiusCells then
                    ' normalise the direction so los() returns a euclidean
                    ' distance comparable to dist
                    losD = self.rc.los(self.wld, wx, wy, dx / dist, dy / dist)
                    if losD < 0 or losD >= dist - 0.05 then
                        add = intensity * (1.0 - dist / radiusCells)
                        self.setGrid(grid, col, row, self.getGrid(grid, col, row) + add)
                    endif
                endif
            endif
        next col
    next row
endfunction

function getGrid(grid, col, row)
    return grid(row * self.cols + col)
endfunction

function setGrid(grid, col, row, v)
    grid(row * self.cols + col) = v
endfunction

' Recompute the dynamic grid. Call once per frame before RcRender.renderFrame().
function update()
    dim i
    dim n
    dim k
    n = self.cols * self.rows
    for i = 0 to n - 1
        self.dynArr(i) = 0
    next i
    dim count
    count = 0
    for i = 0 to array.arrLength(self.lActive) - 1
        if self.lActive(i) = 1 then
            if count < RcConfig.RC_LIGHT_CAP then
                self.splat(self.dynArr, self.lxArr(i), self.lyArr(i), self.liArr(i), self.lrArr(i))
                count = count + 1
            endif
        endif
    next i
endfunction

' Total light at a cell, clamped 0..1.
function sampleCell(col, row)
    dim idx
    if col < 0 or row < 0 or col >= self.cols or row >= self.rows then
        return self.ambient
    endif
    idx = row * self.cols + col
    return math.clamp(self.ambient + self.staticArr(idx) + self.dynArr(idx), 0, 1)
endfunction

EndClass
```

- [ ] **Step 2: Check calls** — `math.sqrt/floor/clamp` (`math.bas`), `array.push/arrLength` (`array.bas`), `self.wld.lightAt/widthCells/heightCells`, `self.rc.los`. `grid` passed as a param and indexed `grid(i)` / assigned `grid(i) = v` — **verify softBASIC allows passing an array as a parameter and mutating it** (Phase 2 `RcCast` reset used member arrays directly, not passed). If passing arrays doesn't work, refactor `splat`/`getGrid`/`setGrid` to take a `which` flag (0 = static, 1 = dyn) and branch on `self.staticArr` vs `self.dynArr` internally. Report which form you used.

- [ ] **Step 3: Smoke test** — add `RcLights` to `evalDemo`'s return + a `test.each` case: `if (!mod.RcLights) return; const L = new mod.RcLights(stubWorld); const h = L.addpoint(2, 2, 0.5, 1, 5); L.movelight(h, 3, 3); L.update(); expect(typeof L.samplecell(2, 2)).toBe('number');` (`stubWorld` needs a `lightat` method returning 0 — add it).

- [ ] **Step 4: Transpile probe** — full lib set + `RcLights`. Iterate. Delete when green.

- [ ] **Step 5: Verify + commit** — guards + suite + build. `feat(raycaster): RcLights.bas light grid (Phase 5)`.

---

## Task 6: `RcRender` — sample lights per strip

**Files:** Modify `demo-src/raycaster/lib/RcRender.bas`; re-sync p3/p4 copies; smoke test.

- [ ] **Step 1:** Add `dim boundLights` + `self.boundLights = 0` in the ctor + `function bindLights(lights) self.boundLights = lights endfunction`.

- [ ] **Step 2:** In `drawStrip`, add a `lightLevel` param (0..1, default via caller). Change the fill from `pen.setFillColor(g, g, g + 25)` to modulate: `pen.setFillColor(g * lightLevel, g * lightLevel, (g + 25) * lightLevel)`. Clamp each to 0..255 (`math.clamp(g * lightLevel, 0, 255)`).

- [ ] **Step 3:** In `renderFrame`, per span, before `drawStrip`: `dim lite; lite = 1.0; if self.boundLights <> 0 then lite = self.boundLights.sampleCell(self.rc.spanCol(i), self.rc.spanRow(i)) endif` — pass `lite` to `drawStrip`.

- [ ] **Step 4:** Phase 3/4 demos have no bound lights → `lite` stays `1.0` → strips render exactly as before. Confirm the Phase 3 projection probes and Phase 4 movement probes are unaffected (they don't touch rendering output). Re-sync p3/p4 `RcRender.bas` copies.

- [ ] **Step 5:** Smoke — the existing `RcRender` case with no bound lights still works; add `if (mod.RcLights) { r.bindlights(new mod.RcLights(stubWorld)); expect(() => r.renderframe()).not.toThrow(); }`.

- [ ] **Step 6:** Transpile probe, guards, suite, build. Commit `feat(raycaster): RcRender samples RcLights per strip`.

---

## Task 7: Phase 5 dark room

**Files:** Create `demo-src/raycaster-p5/assets/p5room.stm` + tilesheet copy.

- [ ] A 12×8 room. A short wall stub jutting into the middle of row 4 (a wall cell at (col6,row3) and (col6,row4) with open cells around) so a light on one side casts a hard shadow on the other. One `light:` marker on a wall-torch cell (e.g. (col2,row2)). Ceiling 1.0 throughout, floor 0. Validate JSON.

```json
{ "tileWidth": 16, "tileHeight": 16, "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,1,0,0,0,0,1],
      [1,0,0,0,0,0,1,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    "tags": { "type": "markers", "markers": [ { "row": 2, "col": 1, "tag": "light" } ] }
  } }
```

- [ ] Commit `test(raycaster): Phase 5 dark room with a shadow-casting wall stub`.

---

## Task 8: Phase 5 demo — dark room, flashlight, shadow probes

**Files:** Create `demo-src/raycaster-p5/Main.bas`, `LitScene.bas`, 6 lib copies; transient probe; `src/docs/demos/RaycasterP5Lit.b4wgl.json`.

### Probe expectations

`LitScene.onenter` builds `RcWorld` → `RcLights(wld)` → `RcRender(wld)`, `ren.bindLights(lights)`, `ren.bindCamera(me)`. A dynamic light `lights.addPoint(3.5, 3.5, 0.5, 0.9, RC_LIGHT_RANGE)` sits WEST of the wall stub at col 6. `lights.update()`.

- **ambient floor:** `lights.sampleCell(9, 6)` (a far corner, no light reaches) ≈ `RC_AMBIENT` (within 0.02).
- **lit near a dynamic light:** `lights.sampleCell(4, 3)` (one cell from the light at 3.5,3.5) is clearly `> RC_AMBIENT + 0.2`.
- **shadowed across the wall stub:** `lights.sampleCell(8, 3)` (EAST of the col-6 wall, in the light's line but occluded) is `< lights.sampleCell(4, 3)` — the wall blocks it. Ideally ≈ ambient.
- **static bake present:** `lights.sampleCell(2, 3)` (near the `light:` torch at col1,row2) is `> RC_AMBIENT + 0.05`.
- **shadow is darker than lit:** assert `sampleCell(8, 3) + 0.1 < sampleCell(4, 3)` explicitly (pins the occlusion, robust to exact falloff values).

5 probes total. All force ERR on failure. (Note: `splat` skips the light's own cell — `dist ≈ 0` — so don't probe the exact light cell; probe a neighbour.)

`onupdate(delta)`: standard WASD mover drive (copy from `demo-src/raycaster-p4/WalkScene.bas`), plus `self.lights.moveLight(self.torch, self.me.x(), self.me.y())` (a flashlight following the player), `self.lights.update()`, `self.ren.renderFrame()`.

- [ ] Build the scene, `Main.bas`, copy the 6 lib files (`RcConfig RcWorld RcCast RcRender RcMover RcLights`), transpile probe, smoke, `npm run build:demo -- demo-src/raycaster-p5 RaycasterP5Lit`, guards + suite + build. Commit `test(raycaster): Phase 5 lit-room demo + shadow probes`.

---

## Task 9: Wire the demo + Cypress

Mirror the P4 wiring: `devDemoRegistry.ts` entry `raycaster-p5-lit` → `RaycasterP5Lit`; `devDemoRegistry.test.ts` mirror test; `demos.cy.ts` `DEV_DEMOS` entry (`waitMs: 4000`). Verify + commit `test(raycaster): wire Phase 5 lit demo into dev registry + e2e`. If a browser is available, run Cypress + break-a-probe check + eyeball the shadow.

---

## Task 10: Docs + roadmap

- [ ] Guide: `## RcLights — light and shadow` after `RcMover`. Methods verified against `RcLights.bas`: `new RcLights(world)`, `setAmbient`, `addPoint(x,y,z,intensity,radiusCells)`, `moveLight(handle,x,y)`, `setLightIntensity`, `removeLight`, `update()`, `sampleCell(col,row)`; plus `RcRender.bindLights(lights)`. Phase 5 limits: single scalar (no colour), point lights only, no spot cones, static lights not cached.
- [ ] Roadmap (both files): Phase 5 (`drawing` pooling fix + `RcLights` light grid with LOS shadows) shipped; phases 6–10 remain. Include the post-pooling frame-time number.
- [ ] Also: the `drawing` pooling fix is a **general** engine improvement — mention it in `src/docs/release-notes.md`? NO — not pushing. But note it in the roadmap's "shipped" section as a standalone perf win, not just raycaster-scoped.
- [ ] Build + suite + commit `docs(raycaster): Phase 5 RcLights guide + roadmap + drawing perf note`.

---

## Task 11: Phase 5 close-out

- [ ] `npx vitest run` all green (incl. the new `drawing.test.ts`). `npx vite build` clean. Raycaster guards green covering `raycaster-p5/` + driving `RcLights`.
- [ ] `raycaster-p5-lit` unlisted.
- [ ] **Manual Cypress** — all 5 raycaster demos pass; break a P5 probe → ERR → restore. Eyeball: the room is dark; near the torch and near the player-flashlight it's lit; behind the wall stub there's a visible dark shadow that moves as you walk.
- [ ] **Spec check** — §5.3 rung 1 done + measured; §6 light grid + LOS occlusion + ambient + point + light cap done. Deferrals (colour, spot, §6.4 caching, texturing) noted in `RcLights.bas` / `RcRender.bas` headers.
- [ ] Record the post-pooling and post-lighting frame times.

---

## Notes for later phases (not this plan)

- **Phase 6 (`RcActors`)** — billboards + `raycast`/`hitscan`. Sprites sample `RcLights.sampleCell` at their feet (spec §6.3). Per-span depth for occlusion (spec §5.4) lands here.
- **Textured walls + `drawImageStrip(tint)`** (spec §5.3 rung 3) — the generic tint param + a texture atlas. Do before or during a "make it look good" pass; `RcLights` is already producing the per-strip multiplier it needs.
- **`RcLights` colour** — upgrade the scalar grid to r/g/b triples once the flat renderer proves the model. Firelight in "contested" areas (concept doc) wants this.
- **Spot lights** — `addSpot(x,y,z,dirAngle,coneRad,...)`; `splat` gains a cone test. The player flashlight should really be a spot, not a point.
- **`RcLights.update()` cost** — if the per-frame LOS marches dominate, add the §6.4 per-(cell,light) static cache and only re-splat lights that moved.
