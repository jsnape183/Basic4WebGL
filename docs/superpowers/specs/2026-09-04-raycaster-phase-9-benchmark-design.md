# Raycaster Phase 9 — Benchmark harness + first optimisation rung

**Status:** approved 2026-09-04
**Tracks:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` §5.3 (performance
contingency ladder) and phase-list item 9.

---

## 1. Why / scope

The raycaster library renders correctly (Phases 1–8) but the single-window
renderer still emits **one pooled draw primitive per screen column per surface
band** — roughly 700+ `PIXI.Graphics` for floor + ceiling in a mostly-flat room,
plus one `PIXI.Sprite` per textured wall column — where the hand-written
Wolfenstein demo draws its floor and ceiling as two rectangles total. Phase 9
measures this properly and takes the first structural bite out of it.

**Phase 9 = benchmark infrastructure + one optimisation rung, measured.** The
remaining backlog (§7) each becomes its own small spec/plan later, gated on the
numbers. Phase 10 (docs/roadmap consolidation) is separate and follows.

**Deliverables:**
1. A procedural stress-scene generator (§3) + a fully-featured `raycaster-p9-bench`
   dev demo (§5) — all Phase 8 features plus idle billboard enemies — sized
   16 / 32 / 48 cells.
2. A headless CPU harness in the Vitest suite (§4): fixed camera path through the
   stress scene, times `renderFrame`'s transpiled JS, records primitive / span /
   light-sample counts, hard-asserts the counts as a regression guard.
3. A browser frame-cost demo (§5) with an on-screen rolling frame-time +
   primitive-count readout, live-switchable between the three sizes.
4. **Rung 1 implemented** — screen-space floor/ceiling fill (§6) — re-measured on
   both harnesses.
5. The Phase 9 report (§8), committed as `docs/raycaster-benchmark-report.md`,
   and a one-sentence size budget copied into
   `src/docs/guides/raycaster-library.md`.

**Success:** the size budget is a real measured number; the medium (32-cell)
fully-featured case runs comfortably at 60fps in the browser demo; the headless
harness locks the primitive counts against regression.

**Not in this phase:** backlog rungs 2–5 (§7); Phase 10.

---

## 2. Success bar (concrete)

- **Primary:** on the reference machine's browser demo, `stress32` (32×32,
  fully featured, ~25 idle enemies) holds a rolling 30-frame average ≥ 58fps
  (≤ ~17ms) with the camera moving, after rung 1.
- **Regression guard:** the headless harness's per-frame primitive count for
  `stress32` drops by rung 1 to a checked-in ceiling and stays under it.
- **Reference output:** the §8 report's size-budget sentence is backed by the
  actual stress16/32/48 numbers, not a guess.

Absolute `renderFrame` ms is **printed, not asserted** (machine-dependent).
Primitive / span / sample counts **are** asserted (deterministic).

---

## 3. Stress-scene generator

**`scripts/genRaycasterStress.ts`** — deterministic (no RNG; all placement is a
function of cell coordinates). Writes three files into
`demo-src/raycaster-p9-bench/assets/`: `stress16.stm`, `stress32.stm`,
`stress48.stm`.

Each is an `N×N` open box (solid tile border, interior floor `0`) with a
repeating **4×4 motif** stamped across the interior so feature density is
constant across sizes. Per 4×4 block, at block-local coords:

| Cell | Tag / content |
|---|---|
| (0,0) | marker `floor:0.4` |
| (1,1) | marker `floor:-0.6` |
| (2,2) | marker `diag:se` (cell stays walls-`0`) |
| (0,2) | marker `fcol:RRGGBB` — colour rotates through 3 values by `(blockX+blockY) mod 3` |
| (2,0) | marker `ccol:RRGGBB` — same rotation, offset |
| (3,3) | walls tile `1` + marker `tex:NAME` — `NAME` rotates brick/panel/rock by block |
| others | plain floor |

Border walls also get `tex:` markers on ~1 in 3 cells (same rotation) so wall
texturing is exercised at the room edges.

**Headroom:** raised cells (`floor:0.4`) get a matching `ceil:2.0` marker on the
same tag so the walker (eye at `floor + RC_EYE_Z`) never clips the standard
ceiling. `diag:se` and a `floor:`/`ceil:` step never co-occur (the diag cell is
its own motif slot).

**Enemy spawn list:** the generator also writes
`demo-src/raycaster-p9-bench/assets/stressN.enemies.json` — an array of
`{ x, y }` spawn points, one per ~6×6 cell region of open interior floor (so
`stress16` ≈ 6 enemies, `stress32` ≈ 25, `stress48` ≈ 56). The bench scene reads
this and seeds `RcActors`. Enemies are **idle billboards** (frame-cycle in place,
no movement, no pathfinding) — the benchmark measures rendering, not AI.

**Camera path:** `demo-src/raycaster-p9-bench/assets/stressPath.json` — an array
of ~40 `{ x, y, angle }` waypoints forming a polyline that threads a `stress32`
room corner-to-corner past pits, diagonals, textured walls and an enemy cluster.
Shared verbatim by the headless harness and the browser demo's autopilot. (The
path is authored against `stress32`'s coordinate space; the harness scales
waypoint coordinates by `N/32` when running `stress16` / `stress48`.)

---

## 4. Headless CPU harness

**`tests/lib/Basic4WebGL/integration/raycasterBench.test.ts`** — a Vitest test
that prints a benchmark table and asserts the regression-guard counts.

**Setup:** transpile the `raycaster-p9-bench` lib `.bas` files against
`packageModules` (same `sortByDependencies` + `compiler.transpile` path as
`raycasterDemoSmoke`). Build a real `RcWorld` from `stressN.stm` via the inline
`_sb` tilemap stub used by `raycasterUpperWorld` / `raycasterSurfaceColor` (now
`raycasterWindowOcclusion`). Instantiate `RcRender` + `RcLights` + `RcActors`,
bind them, seed `RcActors` from the enemies JSON, add one camera-follow torch.

**Fake-PIXI recorder** as the `_sb` surface: `drawRect`, `drawImageStrip`,
`drawStrips` (future), `clear`, `pen.*`, mesh calls — each just bumps a typed
counter (`{ drawRect, drawImageStrip, drawStrips }`) and returns a stub. No PIXI,
no allocation of anything heavy. So the harness measures the **transpiled
softBASIC logic**: span walk, occlusion, colour march, light sampling, billboard
projection and depth-clip — not GPU cost.

**Instrument `RcLights`** the same way — count `sampleCell` / `sampleAt` calls
via a wrapper or a `_sb`-level counter (the light math itself runs for real).

**Run:** for each `size ∈ {16, 32, 48}`, for each of ~40 path waypoints: set the
camera (via a bound `RcMover` stub or `RcRender.setCamera`), call
`renderFrame()` then `drawActors()` (bound), snapshot `performance.now()` around
the pair. Repeat the full path **20×**; discard the first pass (warm-up); report
over the rest.

**Prints** (a `console.table`, always):

```
size  frames  ms.mean  ms.p50  ms.p95  ms.worst  drawRect/f  drawImageStrip/f  spans/f  sampleCell/f  sampleAt/f
16    ...
32    ...
48    ...
```

**Asserts** (regression guard — loose pre-rung-1, ratcheted after):
- `stress32` mean per-frame `drawRect + drawImageStrip` < `RC_BENCH_PRIM_CEIL_32`
  (a checked-in constant in the test; set from the baseline, then lowered after
  rung 1).
- `stress48` per-frame primitive count < `RC_BENCH_PRIM_CEIL_48`.
- Span count and `renderFrame` completes without throwing on all three sizes.
- **No ms assertion.**

The test tolerates the known `[vitest-worker]: Timeout calling "onTaskUpdate"`
flake (it is slow — mark it with a generous per-test timeout, e.g. 120s).

---

## 5. Browser frame-cost demo

**`demo-src/raycaster-p9-bench/`** — `Main.bas`, `BenchScene.bas`, the eight lib
`.bas` copies (byte-identical to `demo-src/raycaster/lib/`), `assets/` (three
`.stm`, the enemies + path JSON, the six generated textures, the tile image).

**`BenchScene.bas`:**
- `onenter`: load `stress32.stm` → `RcWorld` / `RcRender` / `RcMover` (spawn at a
  known-open interior cell) / `RcLights` / `RcActors`; seed enemies from
  `stress32.enemies.json`; camera-follow torch; `setWallTexture` default.
- `onupdate`: the `raycaster-p8-tiers` control rig — WASD move, A/D strafe, Q/E
  turn, R/F look (`RcMover.look`, clamped). Plus:
  - `1` / `2` / `3` — rebuild `RcWorld` + re-seed `RcActors` from `stress16` /
    `stress32` / `stress48` mid-scene.
  - `P` — toggle autopilot: drive the camera along `stressPath.json` on a loop.
- HUD (`hud.add` Text, updated every 30 frames): rolling 30-frame avg ms,
  session min / max ms, `RcRender.columnCount()`, `RcRender.primitiveCount()`
  (new — see below), span total for the last frame, active enemy count, current
  stress size.
- `runProbes` (Cypress-guarded, same `probe()` helper as every dev demo):
  (1) the generated `stress32` world parsed the expected raised / pit / diag /
  colour / textured counts; (2) `RcActors` seeded the expected enemy count;
  (3) `renderFrame()` + `drawActors()` run without throwing on `stress48`;
  (4) autopilot advances the camera; (5) switching to `stress16` rebuilds the
  world to the smaller cell count.

**New library-side accessor:** `RcRender.primitiveCount()` — returns a per-frame
counter the renderer bumps alongside `surfCountLast` (same pattern: reset at the
top of `renderFrame`, incremented in `drawStrip` / `drawWallStrip` / the fill
path / `drawActors`). The headless harness reads the same counter. **No
`drawing.js` change.**

**Wiring:** `raycaster-p9-bench` in `src/features/demos/devDemoRegistry.ts`;
`cypress/e2e/demos.cy.ts` row; `tests/ui/features/demos/devDemoRegistry.test.ts`
assertion; `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts` case
(`sceneGlobal: _sb_benchscene`, `probeCount: 5`); export
`src/docs/demos/RaycasterP9Bench.b4wgl.json`. The phase-dir regex already matches
(`/^raycaster-p\d+(-[a-z]+)?$/`).

---

## 6. Rung 1 — screen-space floor/ceiling fill

### 6.1 Problem

`renderFrame` calls `self.drawSurface(...)` per column for each pending
floor/ceiling band. `drawSurface` (no colour override) calls `drawFlatSeg` which
issues one `drawing.drawRect` — a pooled `PIXI.Graphics` — **per column**. For a
360-column view of a flat room that is ~360 floor + ~360 ceiling Graphics per
frame, versus Wolfenstein's 2.

### 6.2 Change (RcRender only)

Replace the per-column surface calls in `renderFrame` with a **pending
screen-space rectangle** per surface (floor, ceiling), accumulated across
columns and flushed as a single `drawing.drawRect`.

Maintain, per surface, a pending run: `{ active, xStart, xEnd, yTop, yBot,
runHeight, litLevel }`. For each column, after the span walk resolves that
column's floor band (`sfH`, near depth `sfD`, far depth, `winTop`/`winBot`):

- **Fill-eligible column** — the band has no step at this column; the band
  crosses no `fcol:`/`ccol:` cell (see "Colour coexistence"); and the projected
  `yTop`/`yBot` and quantised light match the pending run:
  → extend the pending run's `xEnd` to this column. Draw nothing.
- **Break** — height, projected Y, or quantised light differs, the column has a
  step or a colour cell, or end of screen:
  → flush the pending run as one `drawRect(xMid, yMid, xEnd-xStart+RC_STRIP_W,
  yBot-yTop)` at the run's `litLevel` shade; then either start a new run
  (fill-eligible column) or call the existing per-column `drawSurface(...)`
  (stepped / coloured column — it self-coalesces colour internally) and leave the
  pending run inactive.

Same logic mirrored for the ceiling. Both pending runs flushed at end of the
column loop.

**Colour coexistence.** The fill path must not be globally disabled by
`wld.hasSurfaceColor()` — real levels use `fcol:`/`ccol:` as sparse accents, and
falling back for the whole screen would make rung 1 near-worthless on any level
that uses colour at all (including the stress scene). Instead:

- `hasSurfaceColor()` is `0` (the common case — p3–p7, most levels): no colour
  check at all; the fill path runs pure.
- `hasSurfaceColor()` is `1`: each column's floor/ceiling band is walked cell by
  cell with `surfaceRunEnd` (the same cheap DDA `drawSurface` already uses — no
  draw calls) to test whether any crossed cell carries a colour. Clean → the
  column stays fill-eligible. Dirty → flush the pending run, hand that one column
  to `drawSurface` (which draws its coloured sub-bands correctly), resume the
  fill on the next clean column. The march cost is paid only on levels that use
  colour, and it is strictly cheaper than the current unconditional per-column
  `drawSurface` on those levels.

Same logic mirrored for the ceiling run. Both pending runs flushed at end of the
column loop.

### 6.3 The light trade-off

Per-column bilinear `sampleAt` would break the run at every column. For the
fast-fill path only:

- sample light **once per world cell** the run passes through (at the cell
  centre), via `sampleCell` (not bilinear `sampleAt`),
- **quantise** to `RC_FILL_LIGHT_STEPS` levels (default 16),
- a run breaks only when the quantised level changes.

Result: flat floor/ceiling lighting is banded per cell at 16 levels instead of
smoothly per-column. Stepped and `fcol:`/`ccol:` columns keep the current
full-fidelity per-column path (`drawSurface` unchanged). Wolfenstein is
flat-lit and reads fine; 16 levels over a cell is finer than that.

**Escape hatch:** `RcConfig.RC_FLAT_FILL = 1` (on by default). Set `0` and
`renderFrame` uses the old per-column `drawSurface` for every column — the
fallback path is not deleted, so this is a one-constant revert if the banding
looks wrong in the demo.

### 6.4 What stays

`drawStrip`, `drawSurface`, `drawFlatSeg`, `drawWallStrip`, `packTint` —
unchanged; they are the stepped/coloured fallback and the wall path.
`surfaceRunEnd` is reused unchanged by the fill path's colour scan. Walls are
**not** touched by rung 1 (that is backlog #2). No engine change. No `RcCast` /
`RcMover` change. `RcWorld` change is limited to the optional split
`hasFloorColor()` / `hasCeilColor()` accessors if the plan finds the single
`hasSurfaceColor()` too coarse — otherwise none.

### 6.5 Tests

- `tests/lib/Basic4WebGL/integration/raycasterWindowOcclusion.test.ts` — extend:
  a flat uncoloured room draws **≤ a small constant** floor/ceiling `drawRect`s
  (was ~2 per column); a room with a mid-view step still shows the step riser +
  the two flanking fills; a `fcol:` column still produces its own coloured strip
  (fallback path intact).
- `raycasterDemoSmoke` — the existing `renderFrame draws floor/pit surfaces` and
  `floor-rise occludes geometry` blocks must still pass across all phase dirs
  (the fallback path is what they exercise for stepped columns; add a flat-room
  assertion for the fill path).
- `RC_FLAT_FILL = 0` path covered by one test that asserts it matches the
  pre-rung-1 per-column count.

---

## 7. Backlog (rungs 2–5 — future specs)

| # | Optimisation | Where | Est. impact | Risk |
|---|---|---|---|---|
| 2 | Batched wall-strip call `drawing.drawStrips(tex, count, uArr, xArr, wArr, yArr, hArr, tintArr)` — one `PIXI.Mesh` update for all same-texture wall columns | `src/components/Runner/engine/drawing.js` (§5.3 rung 4) + descriptor + RcRender | large (collapses ~360 sprites → 1 mesh/texture) | engine change touching every `drawing`-using game; mesh UV / tint per-quad correctness; needs its own JS unit tests |
| 3 | Light-grid caching — `RcLights.update()` recomputes only cells within a moved light's radius; grid persists between frames | RcLights | medium | staleness on fast lights / teleports; a dropped light must fully clear |
| 4 | `RC_STRIP_W` 4→6 (or decouple ray count from strip width — cast K rays, interpolate spans to W columns) | RcConfig / RcRender | blunt −33% everything | blockier walls / aliasing on thin geometry; interpolation adds its own cost |
| 5 | Hoist the 9 `self.rc.*Arr` span arrays into `renderFrame` locals (skip the `spanKind(i)` method + `_sbCheckedArrayGet` per access), or a transpiler unchecked-array-get affordance | RcRender / transpiler | medium | transpiler route is compiler work with broad blast radius; local-hoist route needs RcCast to expose the arrays |

Each is written as its own spec **only if** the §8 report shows rung 1 did not
reach the §2 bar and the measurement points at that rung.

---

## 8. The Phase 9 report

Committed as **`docs/raycaster-benchmark-report.md`**, linked from
`docs/language/library-roadmap.md` and `src/docs/guides/raycaster-library.md`.

1. **Before optimisation** — the headless harness table (§4) for
   stress16 / 32 / 48, plus the browser demo's rolling frame-avg per size on the
   reference machine (name the machine). Captured at the baseline task, before
   rung 1.
2. **After rung 1** — the same table re-run, side by side with the baseline, with
   the deltas called out: primitive-count drop, ms drop, which sizes crossed
   60fps.
3. **Size budget** — the headline reference sentence, derived from where
   stress32 / stress48 land after rung 1:
   *"A single fully-featured area up to roughly N×N cells with ~M idle billboard
   enemies sustains 60fps with headroom; up to ~P×P is playable; beyond that,
   split into separate scenes at a doorway or stair."*
   The same sentence is copied into `src/docs/guides/raycaster-library.md`
   (the "Multi-tier levels" section).
4. **Further optimisation & risk** — the §7 backlog, each row annotated with:
   the measured evidence it is still worth doing (or "not needed — rung 1 was
   enough"), the expected additional headroom, and the risk. This is the decision
   input for whether Phase 9 continues into rung 2 or closes and hands off to
   Phase 10.

---

## 9. Testing strategy

- `npx vitest run` full suite green before every commit (tolerate the one
  `onTaskUpdate` flake).
- `npx vite build` clean.
- `npx vitest run raycasterBench` prints the table; its count assertions pass.
- `raycasterDemoLibSync` — the `raycaster-p9-bench` lib copies byte-identical to
  canonical.
- `raycasterDemoProbes` — the p9-bench 5 probes pass.
- `cypress/e2e/demos.cy.ts` — run manually after the demo lands; `raycaster-p9-bench`
  ERR-free.
- Manual: walk `raycaster-p9-bench` at each size; confirm the rung-1 flat-fill
  lighting banding is acceptable (toggle `RC_FLAT_FILL` to compare); confirm the
  frame-avg readout hits the §2 bar for `stress32`.

---

## 10. Out of scope

- Backlog rungs 2–5 (§7) — separate specs, measurement-gated.
- Phase 10 (docs/roadmap consolidation).
- Any GPU-side profiling beyond the browser demo's wall-clock frame average.
- Enemy AI / pathfinding in the stress scene (enemies are idle billboards).
- Texturing floors/ceilings (still deferred; `drawFloorStrip` stays unused).
