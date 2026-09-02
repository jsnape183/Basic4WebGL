# Raycaster Phase 8 — Upper Regions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the softBASIC raycaster library one optional "upper region" per cell — a stacked space entered through a hole, authored as a second `.stm` tile layer — with `RcCast` / `RcRender` / `RcMover` support and a `raycaster-p8` demo.

**Architecture:** A new `.stm` tile layer `upper` (ids 1=floor, 2=wall, 3=hole) is read by `RcWorld` into `upKindArr` / `upCeilHArr`. `RcCast.setRegion(r)` tells it which region the camera is in; `cast()` emits that region's spans as primary geometry and the *other* region's geometry as `RC_SPAN_PORTAL_*` spans once a ray crosses a hole. `RcRender` reads the camera's region from the bound mover, seeds each column from that region's heights, and draws portal spans eating the screen window from the top (camera in lower region) or bottom (camera in upper). `RcMover` carries a `region` field and swaps it with one boundary-crossing rule. One small generic engine addition: `tilemapset.hasLayer(name)`.

**Tech Stack:** softBASIC (`.bas` → JS/PIXI), Vitest integration tests (`tests/lib/Basic4WebGL/integration/raycasterDemo*.test.ts`), Cypress e2e (`cypress/e2e/demos.cy.ts`), `scripts/buildDemo.ts`.

**Spec:** `docs/superpowers/specs/2026-09-02-raycaster-phase-8-upper-regions-design.md`

---

## Design decision locked here (spec left it to the plan)

**No per-span occlusion-side flag.** The direction a portal span eats the screen window is derived from the camera's region, not stored per span:
- camera in the **lower** region → the portal shows the **upper** region (physically above) → `RC_SPAN_PORTAL_*` spans eat the window from the **top**.
- camera in the **upper** region → the portal shows the **lower** region (below) → they eat from the **bottom**.

So `RcCast` emits the same `RC_SPAN_PORTAL_WALL/CEIL/FLOOR` kinds regardless of direction, and `RcRender` branches on `camRegion`.

**`cast()` keeps its 5-arg signature.** Region is set out-of-band via `RcCast.setRegion(r)` before the render column loop (region is constant within a frame). This keeps p2–p7's `self.rc.cast(self.wld, cx, cy, rx, ry)` call working unchanged at every step of this plan.

---

## File Structure

**Engine (generic, `src/`):**
- `src/components/Runner/engine/tilemap.js` — `hasLayer(setHandle, name)` on `_sbTilemaps`.
- `src/lib/Basic4WebGL/defs/tilemapset.bas` — `function hasLayer(name)` (hand-written def — `tilemapset` is not in `src/lib/Basic4WebGL/library/registry.ts`, confirmed).

**Library (canonical `demo-src/raycaster/lib/`, byte-copied to phase dirs):**
- `RcConfig.bas` — `RC_STD_CEIL`, `RC_SPAN_PORTAL_WALL/CEIL/FLOOR`, `RC_SHADE_UPPER_FLOOR`. Copied p2–p8.
- `RcWorld.bas` — `upKindArr`, repurposed `upCeilHArr`, `upper` layer read, `uceil:` parse, `upperKindAt`/`upperFloorAt`/`upperCeilAt`, `hasUpperAt` reworked, `upper:`/`upNames`/`upperRegion`/`upperArr`/`upFloorHArr` removed. Copied p1–p8.
- `RcCast.bas` — `castRegion` field + `setRegion(r)` + `regionOf()`; portal-span emission in `cast()`. Copied p2–p8.
- `RcRender.bas` — `camRegion`, `self.rc.setRegion(...)`, region-seeded columns, portal-span walk, `RC_SHADE_UPPER_FLOOR`. Copied p3–p8.
- `RcMover.bas` — `region` field, `enterRegion(r)`, `regionId()`, region-aware `blocked()`/`step()` + transition rule. Copied p3–p8.
- `RcLights.bas`, `RcActor.bas`, `RcActors.bas` — unchanged; copied into p8 for a clean standalone transpile.

**Demo (`demo-src/raycaster-p8/`, new):**
- `assets/p8room.stm` — `walls` + `upper` layers + `floor:` / `ceil:` / `uceil:` / `light:` markers.
- `assets/rc_placeholder_tiles.png` — copied from p6.
- `PortalScene.bas` — scene, 6 probes.
- `Main.bas` — bootstrap.
- 8 lib copies.

**`raycaster-p1` migration:**
- `demo-src/raycaster-p1/assets/p1testmap.stm` — add `upper` layer, drop `upper:vent` marker.
- `demo-src/raycaster-p1/MapProbeScene.bas` — probe line unchanged behaviour (optionally tighten).

**Build output:** `src/docs/demos/RaycasterP8Upper.b4wgl.json`.

**Wiring:** `src/features/demos/devDemoRegistry.ts`, `tests/ui/features/demos/devDemoRegistry.test.ts`, `cypress/e2e/demos.cy.ts`.

**Tests:**
- `tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts` — `hasLayer`.
- `tests/components/Runner/tilemap.test.ts` — engine `hasLayer`.
- `tests/lib/Basic4WebGL/integration/raycasterUpperWorld.test.ts` — NEW, focused `RcWorld` two-layer read.
- `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts` — `upperkindat`/`upperfloorat`/`upperceilat` on the existing stubs + new `stubWorldUpper` blocks for RcCast/RcRender/RcMover.
- `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts` — P8 case; `makeSbStub` gains `hasLayer` + per-layer `tileAt`.
- `raycasterDemoTranspile` / `raycasterDemoLibSync` — auto-pick-up.

**Docs (Task 9):** engine spec, `docs/roadmap.md`, `docs/language/library-roadmap.md`, `src/docs/guides/raycaster-library.md`, `src/docs/` tilemapset reference.

---

## Task 1: RcConfig — new constants

**Files:** `demo-src/raycaster/lib/RcConfig.bas`; then `cp` to `raycaster-p2`…`raycaster-p7`.

- [ ] **Step 1: Add constants** — before `endconst`:

```basic
    RC_STD_CEIL = 1.0
    RC_SPAN_PORTAL_WALL = 3
    RC_SPAN_PORTAL_CEIL = 4
    RC_SPAN_PORTAL_FLOOR = 5
    RC_SHADE_UPPER_FLOOR = 8
```

(`RC_SPAN_WALL/FLOORSTEP/CEILSTEP` are 0/1/2; portal kinds continue 3/4/5. `drawStrip` shade kinds 0–7 are used; `RC_SHADE_UPPER_FLOOR = 8` is the next. `RC_SPAN_SIDE_DIAG = 2` is a *side* value, unrelated.)

- [ ] **Step 2: Sync** — `for d in raycaster-p2 raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6 raycaster-p7; do cp demo-src/raycaster/lib/RcConfig.bas demo-src/$d/RcConfig.bas; done`

- [ ] **Step 3: Verify** — `npx vitest run raycasterDemoTranspile raycasterDemoLibSync` → PASS.

- [ ] **Step 4: Commit** — `feat: RcConfig upper-region constants (phase 8)`

---

## Task 2: `tilemapset.hasLayer(name)` — generic engine method

**Files:** `src/components/Runner/engine/tilemap.js`, `src/lib/Basic4WebGL/defs/tilemapset.bas`, `tests/components/Runner/tilemap.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`, `src/docs/` tilemapset API reference.

- [ ] **Step 1: Write the failing engine test**

In `tests/components/Runner/tilemap.test.ts`, add a case: build a TileMapSet handle with two layers (`walls`, `upper`), assert `_sbTilemaps.hasLayer(handle, "walls") === true`, `hasLayer(handle, "upper") === true`, `hasLayer(handle, "nope") === false`. Match the file's existing handle-construction pattern (look at how `getTileMapSetLayer` / `createTileMapSet` are tested there).

- [ ] **Step 2: Run → FAIL** (`hasLayer` undefined).

- [ ] **Step 3: Implement engine method** — in `src/components/Runner/engine/tilemap.js`, in the `_sbTilemaps` object next to `getTileMapSetLayer` (~line 202):

```js
  // True if the set has a tile layer with this name. Lets callers probe for an
  // optional layer without getTileMapSetLayer's throw.
  hasLayer(setHandle, name) {
    return Boolean(setHandle._layerContainers && setHandle._layerContainers[name]);
  },
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Write the failing transpiler test**

In `tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`, add a `describe('TileMapSet — hasLayer')` block mirroring the `tileWidth` block: transpile `dim tm as TileMapSet("l.stm")` + `has = tm.hasLayer("upper")`, assert zero diagnostics and `result.code` contains `_sb.hasLayer(`.

- [ ] **Step 6: Run → FAIL.**

- [ ] **Step 7: Implement the def** — in `src/lib/Basic4WebGL/defs/tilemapset.bas`, after `function tileHeight()`:

```basic
function hasLayer(name)
    return call("_sb.hasLayer(this._handle, haslayer_name)")
endfunction
```

- [ ] **Step 8: Run → PASS.** Also `npx vitest run tilemapset tilemap` → all green.

- [ ] **Step 9: Docs** — add `hasLayer(name) → true / false` to the `tilemapset` API reference in `src/docs/` (find it: `grep -rl "markersByTag\|allMarkers" src/docs/`). One row + a one-line "check for an optional layer before reading it" note.

- [ ] **Step 10: Commit** — `feat(tilemapset): hasLayer(name) — probe for an optional tile layer`

---

## Task 3: RcWorld — upper-region storage, layer read, accessors

**Files:** `demo-src/raycaster/lib/RcWorld.bas`; `tests/lib/Basic4WebGL/integration/raycasterUpperWorld.test.ts` (create); `demo-src/raycaster-p1/assets/p1testmap.stm`; `demo-src/raycaster-p1/MapProbeScene.bas`; then `cp` RcWorld to `raycaster-p1`…`raycaster-p7`.

### Step 1: Write the failing focused test

Create `tests/lib/Basic4WebGL/integration/raycasterUpperWorld.test.ts` — model it on `raycasterDiagWorld.test.ts` (transpile `[RcConfig.bas, RcWorld.bas]`, build a real `RcWorld` via an inline-stm `_sb` stub, drive accessors). The stub's `hasLayer` returns `true` for `"walls"` and `"upper"`; `getTileMapSetLayer` returns a per-name handle; `tileAt` dispatches on the layer handle to the right grid. Two grids:

```
walls:  [[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,1,1,1]]
upper:  [[0,0,0,0],[0,1,3,0],[0,2,1,0],[0,0,0,0]]
markers: [{row:1,col:1,tag:"ceil:1.5"}, {row:1,col:2,tag:"uceil:2.6"}]
```

Assertions:
- `w.upperkindat(1,1) === 1` (floor), `w.upperkindat(2,1) === 3` (hole), `w.upperkindat(1,2) === 2` (wall), `w.upperkindat(2,2) === 1`, `w.upperkindat(0,0) === 0`, `w.upperkindat(9,9) === 0` (OOB).
- `w.hasupperat(1,1) === 1`, `w.hasupperat(0,0) === 0`.
- `w.upperfloorat(1,1)` === `w.ceilheightat(1,1)` === `1.5` (host cell's `ceil:` marker).
- `w.upperceilat(2,1)` === `2.6` (the `uceil:` marker); `w.upperceilat(1,1)` === `w.ceilheightat(1,1) + 1.0` (default = host ceil + `RC_STD_CEIL`).

Run → FAIL (`upperkindat` not a function).

### Step 2: Implement in `demo-src/raycaster/lib/RcWorld.bas`

**(a) Header comment** — replace the "Phase 1 scope — Upper regions" paragraph with:

```basic
' Upper regions (Phase 8): an optional second stacked space per cell, read from a
' `.stm` tile layer named "upper" (id 1 = solid upper floor, 2 = upper wall,
' 3 = hole). upKindArr(i) holds 0..3. The upper floor sits at the cell's own
' ceilH; the upper ceiling defaults to ceilH + RC_STD_CEIL, overridable per cell
' by a `uceil:N` marker. No upper region unless the .stm has an "upper" layer.
```

**(b) Fields** — replace `dim upperArr(0)` / `dim upNames(0)` / `dim upFloorHArr(0)` / `dim upCeilHArr(0)` with:

```basic
dim upKindArr(0)
dim upCeilHArr(0)
```

(Keep `upCeilHArr` — its meaning changes from name-indexed to per-cell.)

**(c) Per-cell init loop** — replace `array.push(self.upperArr, -1)` with `array.push(self.upKindArr, 0)`; add `array.push(self.upCeilHArr, 0 - 1)` (sentinel `-1` = "resolve from ceilH + RC_STD_CEIL in the accessor"; a real `uceil:` marker overwrites it with a positive value).

**(d) Read the `upper` layer** — in `build()`, after the `walls` tile loop (the `for row … for col … tileAt … wallArr` block), add:

```basic
    dim upLayer as tilemaplayer
    if tm.hasLayer("upper") then
        upLayer = tm.layer("upper")
        for row = 0 to self.rows - 1
            for col = 0 to self.cols - 1
                id = upLayer.tileAt(col * tw + tw / 2, row * th + th / 2)
                if id > 0 then
                    self.upKindArr(row * self.cols + col) = id
                endif
            next col
        next row
    endif
```

(`row` / `col` / `id` are already declared in `build()` for the walls loop — reuse; don't re-`dim`. Add `dim upLayer as tilemaplayer` to the function-top dims.)

**(e) `uceil:` marker** — in `applyKv`, before the (now-removed) upper block, add:

```basic
    if key = "uceil" then
        self.upCeilHArr(idx) = math.val(v)
    endif
```

**(f) Remove the old upper machinery:**
- `applyTag`: remove the `dim isUpper`, the `if k = "upper" then isUpper = 1 endif`, and collapse the two-pass `if isUpper = 0 / else` back to a single `self.applyKv(...)` call. **Re-check** — the two-pass exists so `ceil:` resolves before `upper:` read `ceilHArr`. With `upper:` gone, is the two-pass still needed by anything? `uceil:` doesn't read `ceilHArr` at parse time (the accessor resolves the default lazily). So the `for pass = 0 to 1` loop can become a single pass. Do that simplification; if any other key turns out order-sensitive, keep the loop and just drop the `isUpper` special-case.
- `applyKv`: remove `if key = "upper" then … self.upperRegion(…) … endif`.
- Delete `function upperRegion(name, baseCeil)` entirely.

**(g) Accessors** — replace `function hasUpperAt` and add the new ones:

```basic
function upperKindAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.upKindArr(row * self.cols + col)
endfunction

function hasUpperAt(col, row)
    if self.upperKindAt(col, row) > 0 then
        return 1
    endif
    return 0
endfunction

function upperFloorAt(col, row)
    return self.ceilHeightAt(col, row)
endfunction

function upperCeilAt(col, row)
    dim raw
    if self.inBounds(col, row) = 0 then
        return 1.0 + RcConfig.RC_STD_CEIL
    endif
    raw = self.upCeilHArr(row * self.cols + col)
    if raw < 0 then
        return self.ceilHeightAt(col, row) + RcConfig.RC_STD_CEIL
    endif
    return raw
endfunction
```

**(h) `RC_STD_CEIL`** — replace the two `array.push(self.ceilHArr, 1.0)` / `return 1.0` literals for the standard ceiling with `RcConfig.RC_STD_CEIL`. **Careful:** `RcWorld` is bundled in `raycaster-p1`, which **does not include `RcConfig.bas`**. Check: does p1 bundle RcConfig? (`ls demo-src/raycaster-p1/`). If not — either add `RcConfig.bas` to p1 (it's tiny, and p1 will now also reference `RcConfig.RC_STD_CEIL`), or keep the `1.0` literals in RcWorld and only use `RC_STD_CEIL` where p1 won't reach. **Given the accessors above already reference `RcConfig.RC_STD_CEIL`, p1 must bundle `RcConfig.bas`.** Add it: `cp demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p1/RcConfig.bas` and confirm `raycaster-p1` still transpiles (MapProbeScene doesn't need to change for that). Update this plan's sync lists to include p1 for RcConfig from here on.

### Step 3: Run the focused test → PASS.

### Step 4: Migrate `raycaster-p1`

**(a) `demo-src/raycaster-p1/assets/p1testmap.stm`** — add an `upper` layer (same dimensions as `walls`, a tile id 1 at row 1 / col 2) and remove `{ "row": 1, "col": 2, "tag": "upper:vent" }`:

```json
    "walls": [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1]
    ],
    "upper": [
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 1, "col": 1, "tag": "floor:2 ftex:grating" },
        { "row": 2, "col": 2, "tag": "floor:-3 ceil:4 ctex:pipes" },
        { "row": 2, "col": 3, "tag": "door" },
        { "row": 1, "col": 3, "tag": "tex:concrete sky" }
      ]
    }
```

(`.stm` layer order: `walls`, `upper`, then `tags` — match the tilemap format; verify the engine's `.stm` loader accepts a second tile layer alongside the marker layer. If the loader is strict about layer names/count, check `src/components/Runner/engine/tilemap.js` `createTileMapSet` — it builds `_layerContainers` from the layers object, so any named tile layer works.)

**(b) `demo-src/raycaster-p1/MapProbeScene.bas`** line ~45 — `self.wld.hasUpperAt(2, 1) = 1` still passes (id 1 at row 1 col 2 → `hasUpperAt(col=2, row=1) = 1`). Optionally tighten: `... and self.wld.upperKindAt(2, 1) = 1 ...`.

### Step 5: Sync + verify

```bash
for d in raycaster-p1 raycaster-p2 raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6 raycaster-p7; do
  cp demo-src/raycaster/lib/RcWorld.bas demo-src/$d/RcWorld.bas
done
```

Run: `npx vitest run raycasterUpperWorld raycasterDemoTranspile raycasterDemoLibSync raycasterDemoProbes raycasterDemoSmoke`
Expected: PASS. (p1 transpiles with the new `upper` layer + bundled RcConfig; p2–p7 unaffected — no `upper` layer in their `.stm`, `upperKindAt` returns 0.)

### Step 6: Commit — `feat: RcWorld upper-region layer read + accessors (phase 8)`

---

## Task 4: RcCast — region awareness + portal spans

**Files:** `demo-src/raycaster/lib/RcCast.bas`; `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`; then `cp` to `raycaster-p2`…`raycaster-p7`.

### Step 1: Write the failing test

In `raycasterDemoSmoke.test.ts`:

**(a)** Add `upperkindat: () => 0, upperfloorat: () => 1, upperceilat: () => 2,` to `stubWorld`, `stubWorld2`, `stubWorldDiag`, and the `makeDiagStub` return (so the region-blind path stays green everywhere).

**(b)** After `stubWorldDiag`, add:

```ts
// 8x8 bordered room. A walkway (upper floor, id 1) spans row 3, cols 2..5,
// with a hole (id 3) at col 4. Upper ceiling 2.0, upper floor 1.0 (= ceilH).
const stubWorldUpper = {
  floorheightat: () => 0,
  ceilheightat: () => 1,
  wallat: (c: number, r: number) => (c <= 0 || c >= 7 || r <= 0 || r >= 7 ? 1 : 0),
  diagat: () => 0,
  upperkindat: (c: number, r: number) => {
    if (r !== 3 || c < 2 || c > 5) return 0;
    return c === 4 ? 3 : 1; // hole at col 4, plank elsewhere on the strip
  },
  upperfloorat: () => 1,
  upperceilat: () => 2,
  walltexat: () => '',
  floortexat: () => '',
  ceiltexat: () => '',
  widthcells: () => 8,
  heightcells: () => 8,
  lightat: () => 0,
};
```

**(c)** Extend the `RcCastLike` interface: `setregion(r: number): void;` and (if not already present) `spankind(i: number): number;`.

**(d)** Inside the main `describe`:

```ts
test.each(phaseDirs)('%s: RcCast emits a portal span through an upper-region hole', (dirName) => {
  const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
  if (!mod.RcCast) return;
  const rc = new mod.RcCast() as RcCastLike & { spankind(i: number): number; setregion(r: number): void };

  // region 0 (camera in the lower room). Ray from (1.5,3.5) heading +x passes
  // through the hole cell (4,3): a PORTAL span (kind 3/4/5) must appear.
  rc.setregion(0);
  rc.cast(stubWorldUpper, 1.5, 3.5, 1, 0);
  let sawPortal = false;
  for (let i = 0; i < rc.spancount(); i++) {
    const k = rc.spankind(i);
    if (k === 3 || k === 4 || k === 5) sawPortal = true;
  }
  expect(sawPortal).toBe(true);

  // Control: a ray one row over (row 4) never meets the walkway → no portal span.
  rc.cast(stubWorldUpper, 1.5, 4.5, 1, 0);
  let sawPortal2 = false;
  for (let i = 0; i < rc.spancount(); i++) {
    const k = rc.spankind(i);
    if (k === 3 || k === 4 || k === 5) sawPortal2 = true;
  }
  expect(sawPortal2).toBe(false);

  // setregion default (never called) behaves as region 0 for the existing suites.
  const rc2 = new mod.RcCast() as RcCastLike;
  expect(() => rc2.cast(stubWorld, 1.5, 1.5, 1, 0)).not.toThrow();
});
```

Run → FAIL (`setregion` undefined / no portal span).

### Step 2: Implement in `demo-src/raycaster/lib/RcCast.bas`

**(a) Header** — replace the "no diagonal tiles" scope note's neighbour "no upper regions (Phase 8)" with `upper regions: Phase 8 (setRegion + RC_SPAN_PORTAL_* spans).`

**(b) Field + accessors** — add `dim castRegion` to the class fields; init `self.castRegion = 0` in `Constructor()`. Add:

```basic
function setRegion(r)
    self.castRegion = r
endfunction

function regionOf()
    return self.castRegion
endfunction
```

**(c) `cast()` primary region** — the primary spans read the camera's region. Introduce two locals `pFloor` / `pCeil` reads via helpers. Minimal approach: add to the `dim` block `dim primFloor` / `dim primCeil` / `dim seeOther` / `dim upH` and, where `cast()` currently seeds and reads floor/ceiling, branch on `self.castRegion`:

```basic
' seed (replaces runFloor/runCeil seeding):
if self.castRegion = 1 then
    runFloor = wld.upperFloorAt(self.mMapX, self.mMapY)
    runCeil = wld.upperCeilAt(self.mMapX, self.mMapY)
else
    runFloor = wld.floorHeightAt(self.mMapX, self.mMapY)
    runCeil = wld.ceilHeightAt(self.mMapX, self.mMapY)
endif
```

Inside the march loop, replace the `wallHere = wld.wallAt(...)` and `cellFloor = wld.floorHeightAt(...)` / `cellCeil = wld.ceilHeightAt(...)` reads with region-aware equivalents:
- region 1 → `wallHere = 0` unless `wld.upperKindAt(mMapX,mMapY) = 2` (then `wallHere = 1`); `cellFloor = wld.upperFloorAt(...)`; `cellCeil = wld.upperCeilAt(...)`.
- region 0 → today's reads (plus the diagonal test stays region-0 only — guard `if self.castRegion = 0 then` around the existing `dg = wld.diagAt(...)` block).

**(d) Portal spans** — add a `dim seeOther` flag, `seeOther = 0` before the loop. In the march loop, after the region-aware wall check but before the floor/ceiling-step logic:

```basic
' Portal: once the ray crosses a hole, emit the OTHER region's geometry.
if seeOther = 0 then
    if wld.upperKindAt(self.mMapX, self.mMapY) = 3 then
        seeOther = 1
    endif
endif
if seeOther = 1 then
    if self.castRegion = 0 then
        ' camera in the lower room, looking up through the hole into the upper region
        if wld.upperKindAt(self.mMapX, self.mMapY) = 2 then
            self.addSpan(RcConfig.RC_SPAN_PORTAL_WALL, self.mEntryDist, wld.upperFloorAt(self.mMapX, self.mMapY), wld.upperCeilAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
        endif
        if wld.upperKindAt(self.mMapX, self.mMapY) = 1 then
            ' a solid plank beyond the hole: its underside caps the upward view
            self.addSpan(RcConfig.RC_SPAN_PORTAL_FLOOR, self.mEntryDist, wld.upperFloorAt(self.mMapX, self.mMapY), wld.upperFloorAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
            self.addSpan(RcConfig.RC_SPAN_PORTAL_CEIL, self.mEntryDist, wld.upperCeilAt(self.mMapX, self.mMapY), wld.upperCeilAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
            return
        endif
        if wld.upperKindAt(self.mMapX, self.mMapY) = 3 then
            self.addSpan(RcConfig.RC_SPAN_PORTAL_CEIL, self.mEntryDist, wld.upperCeilAt(self.mMapX, self.mMapY), wld.upperCeilAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
        endif
    else
        ' camera in the upper region, looking down through the hole into the lower room
        self.addSpan(RcConfig.RC_SPAN_PORTAL_FLOOR, self.mEntryDist, wld.floorHeightAt(self.mMapX, self.mMapY), wld.floorHeightAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
        if wld.wallAt(self.mMapX, self.mMapY) > 0 then
            self.addSpan(RcConfig.RC_SPAN_PORTAL_WALL, self.mEntryDist, wld.floorHeightAt(self.mMapX, self.mMapY), wld.ceilHeightAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
            return
        endif
    endif
endif
```

`addSpan`'s signature is `addSpan(kind, dist, lo, hi, col, row, side, u, tex)` — pass `side = 0`, `u = 0`, `tex = ""` for portal spans (the renderer branches on `kind` + `camRegion`, not `side`). Add every new local (`seeOther`, etc.) to the `dim` block at the top of `cast()`.

**(e) `los()`** — unchanged. Region-blind. Confirm it does **not** read `castRegion`.

### Step 3: Run → PASS.

### Step 4: Sync + full smoke

```bash
for d in raycaster-p2 raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6 raycaster-p7; do
  cp demo-src/raycaster/lib/RcCast.bas demo-src/$d/RcCast.bas
done
```

Run: `npx vitest run raycasterDemoSmoke raycasterDemoTranspile raycasterDemoLibSync raycasterDemoProbes` → PASS (existing RcCast tests unaffected — `castRegion` defaults 0, stubs return `upperkindat: 0`).

### Step 5: Commit — `feat: RcCast region-aware casting + portal spans (phase 8)`

---

## Task 5: RcRender — camera region + portal-span walk

**Files:** `demo-src/raycaster/lib/RcRender.bas`; `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`; then `cp` to `raycaster-p3`…`raycaster-p7`.

### Step 1: Write the failing test

In `raycasterDemoSmoke.test.ts`, add:

```ts
test.each(phaseDirs)('%s: renderFrame draws portal strips through an upper-region hole', (dirName) => {
  const fills: number[][] = [];
  const rects: unknown[][] = [];
  const overrides = {
    getStageWidth: () => 320,
    getStageHeight: () => 200,
    setFillColor: (...a: unknown[]) => { fills.push(a as number[]); return undefined; },
    drawRect: (...a: unknown[]) => { rects.push([...(a as unknown[]), fills[fills.length - 1]]); return undefined; },
  };
  const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`), overrides);
  if (!mod.RcRender) return;

  const r = new mod.RcRender(stubWorldUpper);
  r.setcamera(1.5, 3.5, 0, 0); // lower room, looking down the walkway row toward the hole
  expect(() => r.renderframe()).not.toThrow();

  // The upper ceiling (kind PORTAL_CEIL, height 2.0) projects ABOVE the horizon.
  // Assert at least one w===4 strip was drawn with midY < 100 (upper half) that
  // isn't a normal ceiling grey — i.e. the portal pass ran.
  const strips = rects.filter((a) => a[2] === 4).map((a) => ({ midY: a[1] as number }));
  expect(strips.some((s) => s.midY < 100)).toBe(true);
});
```

(Refine the exact assertion once you can run it — the robust invariant is "renderFrame with a hole in view emits extra high strips and doesn't throw"; don't weaken it to just `not.toThrow`.)

Run → FAIL or throw (portal kinds unhandled → `drawStrip` gets kind 3/4/5 which map to existing shades, or the walk mishandles them).

### Step 2: Implement in `demo-src/raycaster/lib/RcRender.bas`

**(a) Header** — add a Phase 8 note (portal spans, region-blind lighting limit).

**(b) `dim camRegion`** in `renderFrame()`'s dim block.

**(c) Compute region + tell RcCast** — after the `if self.boundMover <> 0 then … camZ …` block and before the column loop:

```basic
    camRegion = 0
    if self.boundMover <> 0 then
        camRegion = self.boundMover.regionId()
    else
        if self.wld.upperKindAt(camCol, camRow) > 0 then
            if self.camZ >= self.wld.upperFloorAt(camCol, camRow) then
                camRegion = 1
            endif
        endif
    endif
    self.rc.setRegion(camRegion)
```

(`camCol` / `camRow` are computed at line ~406-407 — move that computation above this block, or read `math.floor(self.camX)` inline here.)

**(d) Region-seed the column** — replace lines ~418-419:

```basic
        if camRegion = 1 then
            runFloorH = self.wld.upperFloorAt(camCol, camRow)
            runCeilH = self.wld.upperCeilAt(camCol, camRow)
        else
            runFloorH = self.wld.floorHeightAt(camCol, camRow)
            runCeilH = self.wld.ceilHeightAt(camCol, camRow)
        endif
```

**(e) Portal spans in the walk** — in the `while i < n` span loop, add a branch for the portal kinds alongside the existing `if kind = RC_SPAN_WALL … else (steps)`:

```basic
            if kind = RcConfig.RC_SPAN_PORTAL_WALL or kind = RcConfig.RC_SPAN_PORTAL_CEIL or kind = RcConfig.RC_SPAN_PORTAL_FLOOR then
                dim pShade
                pShade = 1
                if kind = RcConfig.RC_SPAN_PORTAL_CEIL then
                    pShade = 3
                endif
                if kind = RcConfig.RC_SPAN_PORTAL_FLOOR then
                    pShade = RcConfig.RC_SHADE_UPPER_FLOOR
                endif
                self.drawStrip(destX, sTop, sBot, winTop, winBot, pShade, lite)
                if camRegion = 0 then
                    ' upper region is above → eat the window from the top
                    if sBot > winTop then
                        winTop = sBot
                    endif
                else
                    ' lower region is below → eat from the bottom
                    if sTop < winBot then
                        winBot = sTop
                    endif
                endif
                i = i + 1
            else
                ' ... existing RC_SPAN_WALL / step handling ...
            endif
```

Restructure the existing `if kind = RC_SPAN_WALL … else …` so the portal branch sits at the same level (softBASIC has no `elseif` — nest carefully, or check the portal kinds first and `i = i + 1` / `continue`-equivalent). Add `dim pShade` to the function-top dims (not inline — hoisting).

**Note on `sTop`/`sBot` for zero-thickness portal spans:** `RC_SPAN_PORTAL_CEIL` / `_FLOOR` are emitted with `lo == hi`, so `sTop == sBot` and `drawStrip` draws nothing (its `b <= t` guard returns 0) — but the window clamp still fires, which is what matters (the ceiling plane caps the view). `RC_SPAN_PORTAL_WALL` has real `lo`/`hi` and draws a band. Confirm this reads right; if a visible line is wanted for the ceiling plane, give it ~0.02 thickness in RcCast instead.

**(f) `RC_SHADE_UPPER_FLOOR` in `drawStrip`** — add `if shadeKind = 8 then g = 70 endif` (between `RC_SHADE_SOFFIT = 50` at kind 7 and the diag stuff). Pick 70 so a plank underside from below reads distinct from `RC_SHADE_CEIL_UNDER = 80`.

**(g) Lighting** — portal-span `lite`: the existing `else` branch (`sampleCell(spanCol(i), spanRow(i))`) already covers non-wall kinds, so portal spans get region-blind lighting for free. Leave it. (Documented limit.)

### Step 3: Run → PASS. Then `npx vitest run raycasterDemoSmoke` full → PASS (existing renderFrame tests unaffected — stubs return `upperkindat: 0`, `camRegion` 0, no portal spans).

### Step 4: Sync + verify

```bash
for d in raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6 raycaster-p7; do
  cp demo-src/raycaster/lib/RcRender.bas demo-src/$d/RcRender.bas
done
```

Run: `npx vitest run raycasterDemoSmoke raycasterDemoTranspile raycasterDemoLibSync raycasterDemoProbes` → PASS.

### Step 5: Commit — `feat: RcRender portal-span rendering + camera region (phase 8)`

---

## Task 6: RcMover — region field + transition

**Files:** `demo-src/raycaster/lib/RcMover.bas`; `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`; then `cp` to `raycaster-p3`…`raycaster-p7`.

### Step 1: Write the failing test

In `raycasterDemoSmoke.test.ts`:

```ts
test.each(phaseDirs)('%s: RcMover swaps region crossing onto a level upper floor', (dirName) => {
  const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
  if (!mod.RcMover) return;

  // stubWorldUpper: walkway on row 3, cols 2..5, upperFloorAt = 1.0.
  // A body at room-floor height (z=0) can't be on the walkway; but make a
  // variant where the walkway floor is level (0) with the room so the
  // transition rule fires on the boundary.
  const level = {
    ...stubWorldUpper,
    ceilheightat: () => 1,          // room ceiling
    upperfloorat: () => 0,          // walkway level with the room floor
    upperceilat: () => 1,
  };
  const m = new mod.RcMover(level as unknown, 1.5, 3.5, 0.3, 0.6) as unknown as RcMoverLike & { regionid(): number; enterregion(r: number): void };
  expect(m.regionid()).toBe(0);
  m.turn(0); // +x
  for (let i = 0; i < 30; i++) { m.move(2.6, 0); m.step(50); }
  // walked from col 1 (no upper) onto the walkway strip (cols 2..5) at equal height
  expect(m.regionid()).toBe(1);

  // enterRegion + drive into the hole (col 4) → fall back to region 0
  const m2 = new mod.RcMover(stubWorldUpper as unknown, 2.5, 3.5, 0.3, 0.6) as unknown as RcMoverLike & { regionid(): number; enterregion(r: number): void };
  m2.enterregion(1);
  expect(m2.regionid()).toBe(1);
  m2.turn(0);
  for (let i = 0; i < 30; i++) { m2.move(2.6, 0); m2.step(50); }
  expect(m2.regionid()).toBe(0);
  expect(m2.z()).toBeCloseTo(0, 1); // landed on the room floor
});
```

Also add `regionid(): number;` / `enterregion(r: number): void;` to `RcMoverLike`.

Run → FAIL (`regionid` undefined).

### Step 2: Implement in `demo-src/raycaster/lib/RcMover.bas`

**(a) Header** — Phase 8 note: one `region` field, one boundary-crossing swap rule, no half-in-both-rooms.

**(b) Field** — `dim region` in the class body; `Constructor`: after `self.pz = w.floorHeightAt(...)`, set:

```basic
    self.region = 0
    if w.upperKindAt(math.floor(x), math.floor(y)) > 0 then
        if self.pz >= w.upperFloorAt(math.floor(x), math.floor(y)) then
            self.region = 1
        endif
    endif
```

**(c) `enterRegion` / `regionId`:**

```basic
function enterRegion(r)
    self.region = r
    if r = 1 then
        self.pz = self.wld.upperFloorAt(math.floor(self.px), math.floor(self.py))
    else
        self.pz = self.wld.floorHeightAt(math.floor(self.px), math.floor(self.py))
    endif
    self.vz = 0
    self.grounded = 1
endfunction

function regionId()
    return self.region
endfunction
```

**(d) Region-aware `blocked(cx, cy)`** — at the top:

```basic
    if self.region = 1 then
        if self.wld.upperKindAt(cx, cy) = 2 then
            return 1
        endif
        if self.wld.upperKindAt(cx, cy) < 1 then
            ' off the upper floor (hole or void) — not "blocked", but no floor;
            ' let step()'s vertical resolver handle the fall
            return 0
        endif
        if self.wld.upperFloorAt(cx, cy) - self.pz > RcConfig.RC_STEP_UP then
            return 1
        endif
        if self.wld.upperCeilAt(cx, cy) - self.pz < self.ht then
            return 1
        endif
        return 0
    endif
    ' ... existing region-0 body (wall / floor-too-high / ceiling-too-low / diagonal) ...
```

**(e) Transition rule in `step()`** — after the per-axis horizontal moves and the diagonal push-out, before the jump/gravity block, add:

```basic
    dim fcx
    dim fcy
    dim myFloor
    dim otherFloor
    fcx = math.floor(self.px)
    fcy = math.floor(self.py)
    if self.region = 1 then
        myFloor = self.wld.upperFloorAt(fcx, fcy)
        otherFloor = self.wld.floorHeightAt(fcx, fcy)
        ' left the upper floor (now over a hole/void) and the lower floor is within reach?
        if self.wld.upperKindAt(fcx, fcy) < 1 then
            if math.abs(self.pz - otherFloor) <= RcConfig.RC_STEP_UP then
                self.region = 0
                self.pz = otherFloor
            endif
            ' else: still falling — region stays 1 until pz drops near otherFloor
            ' (handled next frames by the same check as gravity lowers pz)
        endif
    else
        myFloor = self.wld.floorHeightAt(fcx, fcy)
        otherFloor = self.wld.upperFloorAt(fcx, fcy)
        ' standing where the lower floor isn't walkable but a level upper floor is
        if self.wld.upperKindAt(fcx, fcy) = 1 then
            if math.abs(self.pz - otherFloor) <= RcConfig.RC_STEP_UP then
                self.region = 1
                self.pz = otherFloor
            endif
        endif
    endif
```

Add every new local to `step()`'s function-top `dim` block.

**(f) Vertical resolver + head clearance** — the existing `groundH = self.wld.floorHeightAt(...)` in `step()`'s vertical section becomes region-aware:

```basic
    if self.region = 1 then
        groundH = self.wld.upperFloorAt(math.floor(self.px), math.floor(self.py))
        if self.wld.upperKindAt(math.floor(self.px), math.floor(self.py)) < 1 then
            ' no upper floor here — fall toward the lower floor
            groundH = self.wld.floorHeightAt(math.floor(self.px), math.floor(self.py))
        endif
    else
        groundH = self.wld.floorHeightAt(math.floor(self.px), math.floor(self.py))
    endif
```

When `region = 1` and `upperKindAt < 1`, gravity pulls `pz` toward the lower floor; once `pz <= groundH` (the lower floor), the landing block sets `grounded = 1` — and the transition rule in (e) flips `region` to 0 on that same or the next frame. Verify the ordering lands cleanly (region flip should happen before or with the landing, not leave you "grounded in region 1 on the lower floor"). Adjust (e)/(f) ordering if the test shows a stuck state.

### Step 3: Run → PASS (both the level-crossing and the fall-through cases).

### Step 4: Sync + verify

```bash
for d in raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6 raycaster-p7; do
  cp demo-src/raycaster/lib/RcMover.bas demo-src/$d/RcMover.bas
done
```

Run: `npx vitest run raycasterDemoSmoke raycasterDemoTranspile raycasterDemoLibSync raycasterDemoProbes` → PASS (existing RcMover tests unaffected — stubs `upperkindat: 0`, region stays 0).

### Step 5: Commit — `feat: RcMover region field + portal transition (phase 8)`

---

## Task 7: The `raycaster-p8` demo

**Files:** `demo-src/raycaster-p8/**` (new); `src/docs/demos/RaycasterP8Upper.b4wgl.json`; `src/features/demos/devDemoRegistry.ts`; `tests/ui/features/demos/devDemoRegistry.test.ts`; `cypress/e2e/demos.cy.ts`; `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`.

### Step 1: `assets/p8room.stm`

A ~12×14 grid. `walls`: outer ring, open interior. `upper`: a walkway strip. `floor:` staircase. Draft (tune during Step 8):

```json
{
  "tileWidth": 16,
  "tileHeight": 16,
  "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [ ... 12 rows x 14, border 1s, interior 0 ... ],
    "upper": [ ... 12 rows x 14: id-1 planks on rows 2-3 cols 3-10, id-2 on the row-1 and row-4 edges of that strip (railing), id-3 hole at rows 2-3 col 7 ... ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 5, "col": 2, "tag": "floor:0.4" }, { "row": 6, "col": 2, "tag": "floor:0.4" },
        { "row": 5, "col": 3, "tag": "floor:0.8" }, { "row": 6, "col": 3, "tag": "floor:0.8" },
        { "row": 5, "col": 4, "tag": "floor:1.2" }, { "row": 6, "col": 4, "tag": "floor:1.2" },
        { "row": 2, "col": 5, "tag": "ceil:1.4" }, { "row": 2, "col": 6, "tag": "ceil:1.4" }, ... (ceil:1.4 on all walkway-host cells so the walkway floor sits at 1.4) ...
        { "row": 2, "col": 5, "tag": "uceil:3.0" }, ... (uceil on the walkway cells) ...
        { "row": 8, "col": 8, "tag": "light" }
      ]
    }
  }
}
```

**Key authoring facts** to get right (verify with `RcWorld` probes in Step 2):
- The walkway host cells need `ceil:1.4` (or whatever) so `upperFloorAt` (= `ceilHeightAt`) puts the plank at a walkable height reachable from the top stair step (`floor:1.2` + `RC_STEP_UP` 0.35 ≥ 1.4 ✓).
- Combine `ceil:` and `uceil:` on the **same marker** per cell (`"ceil:1.4 uceil:3.0"`) — matches the existing "keep ceil: and upper: on one marker" rule.
- The stair top cell must be 4-adjacent to a plank cell at a height within `RC_STEP_UP`.

### Step 2: `PortalScene.bas`

`Class` / `Extends scene`. `Constructor()` binds WASD/QE (copy p7). `onenter()`: `new tilemapset("p8room.stm")` → `RcWorld` (auto-reads `upper`) → `RcRender` → `RcMover` at the room centre (lower region) → `RcLights` + torch follows → `bindCamera` / `bindLights`. HUD title + hint. `runProbes()`. `onupdate(delta)`: WASD drive → `me.step` → torch follow → `lights.update` → `ren.renderFrame`.

**`runProbes()` — 6 probes** (copy the `probe(label, passed, y)` helper verbatim):

1. **layer read** — `self.wld.upperKindAt(<plank col>, <plank row>) = 1` and `upperKindAt(7, 2) = 3` (hole) and `upperKindAt(<room cell>) = 0`.
2. **heights** — `math.abs(self.wld.upperFloorAt(<plank>, <plank>) - 1.4) < 0.01` and `math.abs(self.wld.upperCeilAt(<plank>, <plank>) - 3.0) < 0.01`.
3. **portal hop** — `dim pc as RcCast` / `pc = new RcCast()` / `pc.setRegion(0)` / `pc.cast(self.wld, <spawn x>, <spawn y>, <dir toward the hole>)` → scan `pc.spanCount()` for a `spanKind` of `RC_SPAN_PORTAL_WALL` / `_CEIL` / `_FLOOR`; `ok = 1` if found.
4. **plank caps it (control)** — same `pc.cast` aimed at a solid-plank column (not the hole) → **no** portal-kind span.
5. **climb → upper** — `dim mv as RcMover` / spawn at the room floor near the stairs / `mv.turn(<toward stairs>)` / loop `mv.move(RC_MOVE_SPEED,0)` + `mv.step(50)` ×~40 / assert `mv.regionId() = 1` and `math.abs(mv.z() - 1.4) < 0.2`.
6. **fall → lower** — `mv = new RcMover(self.wld, <plank x>, <plank y>, 0.3, 0.6)` / `mv.enterRegion(1)` / drive toward the hole / assert `mv.regionId() = 0` and `math.abs(mv.z()) < 0.2` (room floor).

Numeric thresholds derived from `p8room.stm` as authored — re-derive from the grid if one fails; don't loosen.

### Step 3: `Main.bas` + lib copies

```basic
function oninit()
  world.setPixelPerfect(true)
endfunction
dim scn = new PortalScene()
scenemanager.register("portal", scn)
scenemanager.switch("portal")
```

```bash
mkdir -p demo-src/raycaster-p8/assets
cp demo-src/raycaster-p6/assets/rc_placeholder_tiles.png demo-src/raycaster-p8/assets/
for f in RcConfig RcWorld RcCast RcRender RcMover RcLights RcActor RcActors; do
  cp demo-src/raycaster/lib/$f.bas demo-src/raycaster-p8/$f.bas
done
```

### Step 4: Build + wire

- `npm run build:demo -- demo-src/raycaster-p8 RaycasterP8Upper` → `Wrote src/docs/demos/RaycasterP8Upper.b4wgl.json (10 file(s), 2 asset(s))`
- `devDemoRegistry.ts`: append `{ slug: 'raycaster-p8-upper', name: 'Raycaster P8 — Upper Regions', tags: ['Raycaster', 'Engine Phase'], description: 'Phase 8 probe: one optional upper region per cell — a walkway you see under, climb onto, and drop through a hole. Authored as a second `upper` .stm tile layer.', docsSlug: '', file: 'RaycasterP8Upper' }`
- `devDemoRegistry.test.ts`: `test('includes the Phase 8 upper-regions demo', () => { const p8 = devDemoRegistry.find(d => d.slug === 'raycaster-p8-upper'); expect(p8?.file).toBe('RaycasterP8Upper'); });`
- `demos.cy.ts` `DEV_DEMOS`: `{ slug: 'raycaster-p8-upper', title: 'Raycaster P8 — Upper Regions', waitMs: 4000 }`

### Step 5: Probes-test P8 case + `makeSbStub` two-layer support

In `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`:
- `makeSbStub` currently serves one `walls` grid via `tileAt`. Extend: `runPhaseProbes` reads `stmJson.layers.upper` when present; `makeSbStub` takes both grids and its `getTileMapSetLayer` returns a tagged handle (`"LAYER:walls"` / `"LAYER:upper"`); `tileAt(handle, px, py)` dispatches on the handle string to the right grid. Add `stub.hasLayer = (_h, name) => name === 'walls' || (name === 'upper' && !!stm.upper)`.
- Add the P8 case: `runPhaseProbes({ dir: 'demo-src/raycaster-p8', stm: 'p8room.stm', sceneGlobal: '_sb_portalscene', probeCount: 6 })`.

### Step 6: Verify

`npx vitest run raycasterDemo raycasterUpperWorld devDemoRegistry tilemapset` → all PASS. `npx vite build` → clean.

### Step 7: Commit — `feat: raycaster-p8-upper dev demo (phase 8)`

---

## Task 8: Full verification + manual eyeball

- [ ] `npx vitest run` → no new failures vs `main`.
- [ ] `npx vite build` → clean.
- [ ] `npm run dev` + `npx cypress run --spec cypress/e2e/demos.cy.ts` → `Dev demo: Raycaster P8 — Upper Regions` passes (no `ERR`); p1–p7 still green.
- [ ] Manual: seed `raycaster-p8-upper`, Run. Confirm: you see the walkway underside + railing overhead from the room; the hole shows something different above it (open / upper ceiling) vs the solid planks; climbing the stairs puts you on the walkway (view rises); walking into the hole drops you back to the room floor. Note any artifact but don't block on grazing-angle over-occlusion (render-fidelity A, accepted).
- [ ] Commit any `p8room.stm` tuning (rebuild the JSON, re-check probe thresholds).

---

## Task 9: Docs

**Files:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`, `docs/roadmap.md`, `docs/language/library-roadmap.md`, `src/docs/guides/raycaster-library.md`.

- [ ] **Engine spec** — §3.2: replace the marker-name upper-region description with "As built (Phase 8): a second tile layer `upper` (id 1 floor / 2 wall / 3 hole); `RcWorld.upKindArr` + `upperKindAt` / `upperFloorAt` (= `ceilHeightAt`) / `upperCeilAt` (default `ceilH + RC_STD_CEIL`, `uceil:N` override)." §4: portal-span emission (`setRegion`, `RC_SPAN_PORTAL_*`, `seeOther`). §5: `camRegion`, single-window portal walk eating top/bottom by region, `RC_SHADE_UPPER_FLOOR`, region-blind lighting limit. §7: the `region` field + one boundary-crossing swap rule. §11: mark Phase 8 `[DONE 2026-09-02]` with the demo name.
- [ ] **`docs/roadmap.md`** item 28 — "Phase 8 shipped:" clause (layer-based upper regions, the p8 demo, the deferred list: per-region lighting *flagged for revisit*, los/hitscan through portals, climb-back-up, mid-band occlusion).
- [ ] **`docs/language/library-roadmap.md`** — "Last updated" line, a Phase 8 paragraph, the Phase 8 plan path, and update the "Known limits" (`RcCast` … "ignores upper regions" → "renders one upper region per cell, region-blind lighting").
- [ ] **`src/docs/guides/raycaster-library.md`** — new "## Upper regions" section: the `upper` layer + 3 tile ids, the lower/upper two-box model, `uceil:`, how you climb up (stairs) and come down (holes), and the v1 limits (region-blind lighting, no light/shots through the hole, no auto climb-back). Plus `hasLayer` mention if the guide covers `tilemapset`.
- [ ] `npx vitest run` (doc/manifest tests) → PASS.
- [ ] Commit — `docs: raycaster phase 8 shipped — upper regions`

---

## Self-Review

**Spec coverage:**
- §2 authoring (`upper` layer, ids 1/2/3) → Task 3 Step 2(d). ✓
- §2.2 `tilemapset.hasLayer` → Task 2. ✓
- §2.3 RcWorld arrays/accessors/`uceil:`/removals → Task 3. ✓
- §2.4 p1 migration → Task 3 Step 4. ✓
- §3 RcCast `setRegion` + portal spans + `los()` untouched → Task 4. ✓
- §4 RcRender `camRegion` + portal walk + `RC_SHADE_UPPER_FLOOR` + region-blind lighting → Task 5. ✓
- §5 RcMover `region` / `enterRegion` / `regionId` / transition → Task 6. ✓
- §6 demo + 6 probes + wiring → Task 7. ✓
- §7 deferred → Task 9 (recorded in roadmaps). ✓
- §8 six-step → Tasks 2 (defs/engine), 3–7 (tests), 9 (docs/roadmap). ✓

**Placeholder scan:** `p8room.stm` in Task 7 Step 1 is a sketch with `...` — the implementer authors the real grid from the stated constraints (stair heights, `ceil:`/`uceil:` on host cells, adjacency). Probe thresholds carry "re-derive, don't loosen." No `TODO`/`TBD`. Task 5 Step 1 and Task 6 Step 2(f) flag "refine the assertion / verify ordering once you can run it" — acceptable TDD-loop guidance, not vague requirements.

**Type/name consistency:** `castRegion` field, `setRegion(r)` / `regionOf()` (RcCast); `region` field, `enterRegion(r)` / `regionId()` (RcMover); `camRegion` local (RcRender). `upperKindAt` / `upperFloorAt` / `upperCeilAt` / `hasUpperAt` (RcWorld) — used identically across RcCast, RcRender, RcMover, the tests, and the probes. `RC_SPAN_PORTAL_WALL/CEIL/FLOOR = 3/4/5`, `RC_SHADE_UPPER_FLOOR = 8`, `RC_STD_CEIL = 1.0` — consistent. softBASIC lowercasing: `upperKindAt` → `upperkindat` in TS stubs (matches the `diagAt`→`diagat` precedent).

**Sync coverage:** every `.bas` edit is followed by an explicit `cp` loop + `raycasterDemoLibSync` in the verify step. RcConfig/RcWorld now sync to **p1** too (p1 gains `RcConfig.bas` in Task 3 Step 2(h)); RcCast p2–p7; RcRender/RcMover p3–p7; all eight into p8 in Task 7.

**Ordering (Phase 7 lesson):** RcConfig → hasLayer → RcWorld (declares `upperKindAt` etc.) → RcCast (calls them) → RcRender (calls `setRegion`) → RcMover. No file references a symbol before the task that declares it. `cast()` keeps 5 args so no call-site breaks mid-plan.
