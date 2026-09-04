# Raycaster Phase 9 — benchmark report

_Reference machine: the reference dev machine — a macOS dev box (Darwin 25.x, Apple
silicon). Headless numbers from `npx vitest run raycasterBench`
(`tests/lib/Basic4WebGL/integration/raycasterBench.test.ts`): a 160-column
viewport, ~798 frames over the fixed camera path (`stressPath.json`). Browser
numbers from the `raycaster-p9-bench` demo autopilot (press `P`), reading the
rolling frame-average from the HUD._

_Headless `ms` is **transpiled-JS renderer logic only** — one cast + span walk +
draw-call issue per column at 160 columns. It does **not** include PIXI/GPU cost
(the engine pools one `PIXI.Graphics`/`Sprite` per drawn primitive), so the
**primitive count per frame** is the meaningful headless metric and `ms` is a
secondary, noisy signal. `ms.worst` is GC/JIT-dependent and swings between runs;
mean / p50 / p95 are the stable columns._

## 1. Before optimisation (single-window renderer, per-column surfaces)

| size | ms.mean | ms.p50 | ms.p95 | ms.worst | prim.mean | prim.max | browser fps |
|------|---------|--------|--------|----------|-----------|----------|-------------|
| stress16 (16×16) | 0.335 | 0.339 | 0.533 | 1.001 | 909 | 1620 | _pending user measurement_ |
| stress32 (32×32, 21 enemies) | 0.423 | 0.454 | 0.633 | 0.818 | 1230 | 2030 | _pending user measurement_ |
| stress48 (48×48, 48 enemies) | 0.546 | 0.575 | 0.808 | 1.065 | 1319 | 2159 | _pending user measurement_ |

`spans/frame`, `sampleCell/f`, `sampleAt/f`: not emitted by the harness table
(it prints `ms` and `prim` only). Rung 1 is a draw-call optimisation, not a
cast- or light-path one, so span and light-sample counts are unchanged by it
— see §2.

## 2. After rung 1 (painter's background floor/ceiling fill, `RcConfig.RC_FLAT_FILL`)

| size | ms.mean | ms.p50 | ms.p95 | ms.worst | prim.mean | prim.max | Δ prim.mean | Δ ms.mean | browser fps |
|------|---------|--------|--------|----------|-----------|----------|-------------|-----------|-------------|
| stress16 | 0.313 | 0.301 | 0.513 | 0.895 | 764 | 1478 | −16.0% | −6.6% | _pending user measurement_ |
| stress32 | 0.401 | 0.422 | 0.614 | 0.804 | 1104 | 1888 | −10.2% | −5.2% | _pending user measurement_ |
| stress48 | 0.532 | 0.559 | 0.797 | 1.216 | 1188 | 1974 | −9.9% | −2.6% (noisy) | _pending user measurement_ |

**What dropped.** Rung 1 replaces the per-column floor and ceiling *surface*
rects with a single painter's-order background pair (one ceiling fill + one
floor fill for the whole viewport, drawn before the walls) wherever a column
crosses no floor/ceiling step and no coloured (`fcol:`/`ccol:`) cell. On the
stress scenes that removes 145 / 126 / 131 primitives per frame at
stress16 / 32 / 48 — a −16.0% / −10.2% / −9.9% cut in mean primitive count.
The `ms` mean moves with it (−6.6% / −5.2%), within noise at stress48 where
`ms` actually ticked *up* between runs (0.546 → 0.532 mean is down, but p95 is
flat and worst rose) purely as timing jitter while the primitive count still
fell.

**Why the stress scene caps the win.** The stress-scene generator's 4×4 motif
sprinkles features uniformly: a `floor:`/`ceil:` step or a `diag:` lands in 3 of
every 16 cells, and an `fcol:`/`ccol:` colour marker in 2 more. A column is only
fill-covered if it crosses *neither* a step *nor* a coloured cell along its whole
length, so most columns still fall back to per-column surface rects. Stripping
just the colour markers from the same scene (leaving the geometry) moves the win
to **−18.7%**.

**Flat room → zero surface rects.** On a flat, uncoloured room the per-column
floor and ceiling surface rects go from ~1 per column to **0** — the entire
floor and ceiling are the two background fills. The
`raycasterWindowOcclusion` tests added in Task 5 assert exactly this. A
hand-authored level concentrates its features (a plain corridor here, a room
with a single raised dais there) instead of spreading them evenly, so the stress
scene **understates** rung 1's real-world benefit. Expect the fill to cover the
large majority of columns in a typical playable level.

## 3. Size budget

> A single fully-featured area up to roughly **N×N cells** with **~M idle
> billboard enemies** sustains 60fps with headroom; up to **~P×P** is playable;
> beyond that, split into separate scenes at a doorway or stair.

**N / M / P: _pending user measurement_.** They are read off where stress32 and
stress48 land in the browser after rung 1. Measurement inputs:

- **stress32** = 32×32 grid + 21 enemies authored (all live — under the
  `RcConfig.RC_ACTOR_POOL` cap of 32).
- **stress48** = 48×48 grid + 48 enemies authored, of which `RC_ACTOR_POOL`
  caps **32** live at once.

So the budget is expressed against those two points: if stress32 holds 60fps
with headroom it sets `N`/`M`; if stress48 is merely playable it sets `P`.

## 4. Further optimisation & risk

| # | rung | still worth it? | est. extra headroom | risk |
|---|------|-----------------|---------------------|------|
| 2 | batched wall-strip `drawing.drawStrips(tex, count, uArr, xArr, wArr, yArr, hArr, tintArr)` — one `PIXI.Mesh` update for all same-texture wall columns | **Yes, clearly.** After rung 1 the dominant remaining per-frame primitive is the per-column wall strip (~160 at 160 headless columns, ~360 at browser resolution). Collapsing them to one mesh per texture is the biggest remaining lever. | large — collapses ~360 sprites → 1 mesh/texture | engine change touching every `drawing`-using game; per-quad mesh UV / tint correctness; needs its own JS unit tests |
| 3 | light-grid dirty-cell caching — `RcLights.update()` recomputes only cells within a moved light's radius | Medium. `sampleCell` / `sampleAt` counts are unchanged by rung 1. Worth doing **only if** the browser profile shows `RcLights.update()` as hot; defer otherwise. | medium | staleness on fast lights / teleports; a dropped light must fully clear its contribution |
| 4 | `RC_STRIP_W` 4→6, or decouple ray count from strip width (cast K rays, interpolate spans to W columns) | Keep as a **fallback lever**. Blunt but reliable −33% on everything (casts, spans, strips, samples all scale with column count). Pull it only if rungs 2–3 don't get stress32 to 60fps. | blunt −33% across the board | blockier walls / aliasing on thin geometry; interpolation adds its own cost |
| 5 | hoist the 9 `self.rc.*Arr` span arrays into `renderFrame` locals (skip `spanKind(i)` + `_sbCheckedArrayGet` per access) | **Last resort.** Fiddly, and the transpiler route has a broad blast radius. Only if profiling points squarely at bounds-checked array access after rungs 2–4. | medium | transpiler route is compiler work with broad blast radius; local-hoist route needs `RcCast` to expose the arrays |

**Recommendation:** the call is the user's, driven by the browser fps for
stress32:

- **stress32 below 60fps in the browser** → proceed to **rung 2** (batched wall
  strips) — the largest remaining lever, and the measurement will confirm the
  per-column wall strip is the bottleneck.
- **stress32 comfortably at 60fps** → **close Phase 9** and proceed to Phase 10
  (docs consolidation). Rungs 3–5 stay in the backlog, to be specced only if a
  future scene re-motivates them.

_Rungs 2–5 remain unspecced pending this decision._
