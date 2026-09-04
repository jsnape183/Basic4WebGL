# Raycaster Phase 9 rung 2 — wall-mesh spike (parallel path)

**Status:** approved 2026-09-04
**Type:** prototype / spike — provisional until the user's play-test verdict. Nothing
here ships to the report or roadmap as "done" until then.
**Tracks:** `docs/superpowers/specs/2026-09-04-raycaster-phase-9-benchmark-design.md`
§7 rung 2, and the Option 1 (mesh-batched raycaster) vs Option 2 (drop raycasting,
real geometry engine) architecture decision.

---

## 1. Goal / what the spike proves

The raycaster's per-frame cost is dominated by issuing **one pooled PIXI object
per screen column**. The DDA cast itself is cheap (~0.9ms for 360 columns). The
O(n²) display-list churn was fixed separately (commit `381e5c4`), which pushed
the framerate cliff from ~3.6k to ~4.8k primitives/frame. Rung 2 asks: can the
whole wall pass become **one `PIXI.Mesh` per wall texture in view** — 1–4 draw
calls instead of ~360 — with the drawing correct and the cliff gone?

This spike builds that as a **second, runtime-selected wall-rendering path** in
`RcRender`, toggled live in `raycaster-p9-bench`, so the user can flip between the
current path and the mesh path on the same scene and **judge by feel** whether it
is the right direction.

**Success is subjective.** There is no pass/fail number. The spike's job is to
produce something playable and instrumented; the verdict is the user's.

### In scope

- `RC_SPAN_WALL` full-wall columns with a resolved wall texture → the mesh path.
- Per-column vertical source-V clip (wall behind a floor-step) and per-column
  light tint carried into the mesh (per-vertex colour).
- A live toggle + HUD instrumentation in `raycaster-p9-bench`.
- One JS unit test for the new engine primitive.

### Out of scope (parked until the spike validates)

- Floor / ceiling / stepped-surface / pit / soffit rendering — stays on the
  current path (the rung-1 painter's fill already covers the flat case).
- Diagonal walls, `fcol:` / `ccol:` colour, untextured (flat-shaded) walls —
  stay on the current path.
- Texture atlas — per-texture meshes (1–4) is fine for the spike.
- Actors / billboards — already batched sprites, not the question.
- Any `.bas` API surface a game author sees.
- A real GPU draw-call counter (`world.drawCalls()`) — `primitiveCount()`
  showing 1-per-mesh is enough signal.
- Performance *targets*, report updates, roadmap updates.

---

## 2. The engine primitive (`src/components/Runner/engine/drawing.js`)

Two new methods on the `drawing` module, both thin `_sb.*` calls like
`drawImageStrip`:

### `drawing.wallColumn(imageName, destX, topY, botY, srcU, srcVTop, srcVBot, tint)`

Appends one record `{ destX, topY, botY, srcU, srcVTop, srcVBot, tint }` to an
engine-side per-`imageName` buffer (a `Map<string, Array>` or parallel typed
arrays). **Draws nothing** — no PIXI object, no display-list touch. Called once
per visible textured wall column. `topY` / `botY` arrive already clipped to the
occlusion window by `RcRender`. `srcVTop` / `srcVBot` are the vertical source
clip (0..1) for a wall partly hidden by a floor-step; `srcU` is the horizontal
texture coord (0..1) along the wall face.

### `drawing.wallFlush()`

For each per-`imageName` buffer with entries:

1. Acquire a pooled `PIXI.Mesh` + `PIXI.MeshGeometry` keyed by `imageName`
   (same pool + high-water-mark model as `_poolM`; a `Map<string, {mesh, geom}>`).
2. Fill the geometry — **2 triangles per column**:
   - positions: quad corners `(destX ± RC_STRIP_W/2, topY)` and
     `(destX ± RC_STRIP_W/2, botY)`.
   - uvs: `(srcU, srcVTop)` for the top pair, `(srcU, srcVBot)` for the bottom
     pair — a thin vertical slice, matching today's 1px-frame sprite.
   - a **per-vertex colour** attribute (`aColor`, `vec4` or packed `float`) = the
     column's `tint`, so per-column light survives.
   - indices: `[base, base+1, base+2, base+1, base+3, base+2]` per column.
3. Grow the geometry buffers if `columnCount` exceeds current capacity (round up
   to the next 64); otherwise reuse and `getBuffer('aPosition').update()` (and
   `aUV`, `aColor`) — one upload per texture per frame. Set the geometry's draw
   range to `6 × columnCount` indices so a shrinking frame doesn't draw stale
   quads.
4. `mesh.texture = _texFor(imageName)` using the **full source** (frame = whole
   image, no 1px sub-rect — the UVs do the slicing).
5. `mesh.zIndex = _DRAW_Z_BASE + _drawSeq++` (same band as the other drawing
   objects, so it sorts after the floor/ceiling fills).
6. `worldContainer.addChild(mesh)` only if `mesh.parent !== worldContainer`
   (the fixed pattern from `381e5c4`).

Then clear the buffers for the next frame.

### Shader

PIXI v8 `Mesh` accepts a custom `PIXI.Shader`. Use a minimal one so the light
tint is per-vertex, not one uniform for the whole mesh:

- vertex: pass through `aPosition` (with the projection/`worldTransform` PIXI
  supplies), `vUV = aUV`, `vColor = aColor`.
- fragment: `finalColor = texture(uTexture, vUV) * vColor;`

If wiring a custom shader into PIXI v8's mesh pipeline proves fiddly in the time
box, the fallback is `PIXI.MeshSimple` / the default mesh material with
`mesh.tint` set to a **single per-mesh** tint (the average or nearest-column
light) — noted as a spike limitation, not the target. The plan picks based on
what actually compiles against v8.20.

### Lifecycle

- `clearDrawing()` — no change needed (buffers are consumed + cleared by
  `wallFlush`; a frame that calls `wallColumn` without a matching `wallFlush`
  would leak, so `RcRender` always pairs them).
- `_drawingReset()` (scene switch) — destroy the mesh/geometry pool, clear the
  buffers, same as `_poolM`.

---

## 3. `RcRender` integration (`demo-src/raycaster/lib/RcRender.bas`)

- New field `useWallMesh` (default `0`) + `function setWallMesh(v)`.
- Factor the existing per-column wall tint + source-V math out of `drawWallStrip`
  into a helper (e.g. `wallTintAndV(...)` returning via `self.*` scratch fields,
  softBASIC has no tuple return) so **both** paths compute identical values —
  the A/B must be apples-to-apples.
- In `renderFrame`, the `RC_SPAN_WALL` branch (around line 809): when
  `self.useWallMesh = 1` AND `string.len(wtex) > 0`:
  `drawing.wallColumn(wtex, destX, sTop, sBot, self.rc.spanU(i), svTop, svBot, tint)`
  instead of `self.drawWallStrip(...)`. Untextured walls (`wtex = ""`) and every
  non-wall span are unchanged.
- After the `for col` loop: `if self.useWallMesh = 1 then drawing.wallFlush()`.
- `primitiveCount()` — in the mesh path, bump `primCount` by the flushed mesh
  count (RcRender learns it from a `drawing.wallMeshCount()` accessor, or
  `wallFlush` returns it), not per column — so the HUD shows the collapse.
- New `function wallMeshMs()` — returns the last `wallFlush` wall-clock cost
  (RcRender wraps the `drawing.wallFlush()` call in `time.now()`).
- Sync `RcRender.bas` to every phase dir that carries it; rebuild those exports.
  All changes are additive (`useWallMesh` defaults `0`), so no behaviour change
  anywhere else.

---

## 4. `raycaster-p9-bench` toggle + HUD (`demo-src/raycaster-p9-bench/BenchScene.bas`)

- `Constructor`: `input.bind("meshtoggle", "key", keyboard.M)`.
- New field `meshOn` (default `0`).
- `onupdate`: `if input.pressed("meshtoggle") then self.meshOn = 1 - self.meshOn endif`
  then `self.ren.setWallMesh(self.meshOn)`.
- HUD line gains: `MESH <on|off>`, `<primitiveCount()> prim` (already there —
  now it collapses when mesh is on), `flush <wallMeshMs()>ms`, alongside the
  existing `avg <renderMs>ms  <fps> fps  <cols> cols  <foes> foes  stress<size>`.
- The autopilot / size-swap / everything else unchanged.

---

## 5. Testing

- **`tests/components/Runner/drawing.test.ts`** — add `FakeMesh` + `FakeMeshGeometry`
  (or extend `FakePerspectiveMesh`) to the fake-PIXI harness. New test:
  `wallColumn` × N (two distinct `imageName`s) then `wallFlush` →
  - one mesh per distinct image,
  - each mesh's geometry index count is `6 × (its column count)`,
  - positions/uvs/colors for a sampled column match the passed args,
  - buffers are empty after flush (a second `wallFlush` with no `wallColumn`
    calls draws nothing / produces a zero-length draw range).
- **`npx vitest run raycaster`** — green. `RcRender.bas` gains fields/methods but
  `useWallMesh` defaults `0`; `raycasterDemoTranspile` picks up
  `drawing.wallColumn` / `wallFlush` in `BenchScene`; `raycasterDemoLibSync`
  byte-identity holds after the sync; `raycasterDemoProbes` p9-bench 5/5
  unaffected (probes don't toggle mesh); `raycasterBench` unaffected.
- **`npx vitest run`** full suite + **`npx vite build`** clean.
- **Manual (the actual evaluation):** the user runs `raycaster-p9-bench`, flips
  `M` on the autopilot, cycles sizes, pushes it hard, and writes the verdict.

---

## 6. Deliverable

- The `M` toggle, working, in `raycaster-p9-bench`.
- `docs/raycaster-mesh-spike-findings.md` — a short skeleton committed with the
  code, filled in by the user after play-testing: *looks right?* / *cliff gone?* /
  *feels like the path?* / one-line recommendation (**pursue Option 1** /
  **revert** / **another spike iteration**).

---

## 7. Revert path

If the verdict is "revert": delete `wallColumn` / `wallFlush` / the mesh pool /
the shader from `drawing.js`; `useWallMesh` / `setWallMesh` / `wallMeshMs` / the
tint-and-V helper split from `RcRender.bas` (restore `drawWallStrip` as the sole
wall path); the `M` binding + `meshOn` + HUD additions from `BenchScene.bas`;
`FakeMesh` from the test harness; the findings doc. Re-sync `RcRender.bas`,
rebuild exports. No other file is touched, so the excision is clean.

---

## 8. Risks / open questions the spike will answer

- **Custom mesh shader vs `mesh.tint`** — per-vertex light colour needs a custom
  PIXI v8 `Shader`; if that fights the v8.20 pipeline in the time box, fall back
  to a single per-mesh tint (visible A/B regression, noted).
- **UV seams between adjacent column quads** — thin vertical slices sampled at
  `srcU`; PIXI's linear texture filtering may bleed at slice edges. If it shimmers,
  the full version wants `NEAREST` filtering on the wall source or a small `srcU`
  band per quad.
- **Buffer-grow churn** — a frame where the visible wall-column count jumps
  reallocates the geometry buffers; the round-up-to-64 + high-water-mark hold
  should make this rare after warm-up.
- **`spanU` fidelity** — the current sprite path samples a 1px source column; the
  mesh samples the same `srcU` — identical, so the A/B is fair. (A future version
  could sample a real 4px band for sharper near walls — out of scope.)
