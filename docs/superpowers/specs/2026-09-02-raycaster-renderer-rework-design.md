# Raycaster Renderer Rework — Per-Column Interval Occlusion + Bilinear Light — Design Spec

**Status:** approved (brainstorm 2026-09-02) — ready for implementation plan.

**Why:** the `raycaster-p8` upper-regions demo surfaced two rendering defects that are *the model*, not patchable bugs:
1. The single per-column occlusion window (`[winTop, winBot]`) cannot represent an opaque band in the *middle* of a column (a walkway plank underside, a railing seen from below), so the walkway underside and the ceiling hole render as blocky garbage — it clips to one window edge and wrongly hides either the room below or the ceiling above.
2. `RcLights.sampleCell` is pure per-cell nearest-neighbour, so a torch gradient across a floor renders as hard ~1-unit brightness steps that read as shadows of walls that aren't there.

The brainstorm chose to fix both properly rather than simplify the demo. This is a rework of `RcRender.renderFrame`'s occlusion core (the codebase's most complex function) plus a small `RcLights` addition. It supersedes the "render-fidelity A / single window" approximation the engine spec (`2026-08-31-raycaster-engine-design.md` §5.1) deferred.

**Amends:** `2026-08-31-raycaster-engine-design.md` §5.1 (the occlusion window becomes an interval list), §5.2, §6.1/§6.3 (bilinear light for surfaces). `2026-09-02-raycaster-phase-8-upper-regions-design.md` §4 (render-fidelity A → interval list; the single-window limitation notes are removed).

**Scope:** `demo-src/raycaster/lib/` — `RcRender` (the rework), `RcLights` (`sampleAt`), `RcConfig` (`RC_MAX_INTERVALS`). No `RcCast` / `RcWorld` / `RcMover` change (they already emit the right spans). Re-verify `raycaster-p8`; adjust its torch / light markers if the fixed renderer shows they're wrong. Rewrite the render smoke assertions. No generic engine (`src/`) change.

**Brainstorm answers:** interval cap → drop the thinnest; region-1 step heights → fix properly as part of this; p8 demo → adjust as needed; smoke tests → rewrite to check interval-list behaviour, not pixel greys.

---

## 1. The interval list

Per screen column, replace `winTop` / `winBot` with a list of still-visible screen-Y intervals:

- Fields on `RcRender`: `intvTop(0)`, `intvBot(0)` (parallel arrays, screen Y, `top < bot`), `intvN` (count).
- `RcConfig.RC_MAX_INTERVALS` — cap (default **6**). When `occlude` would produce more, the **thinnest** interval is dropped (its pixels stay whatever was last drawn there — a sub-pixel sliver, invisible).
- Reset per column: `intvN = 1`, `intvTop(0) = 0`, `intvBot(0) = self.viewH`.

### 1.1 `resetIntervals()`
Clears to the single full-height interval `[0, viewH]`.

### 1.2 `drawInto(sTop, sBot, shadeKind, lite)`
For each of the `intvN` visible intervals, call the existing `drawStrip(destX, sTop, sBot, intvTop(k), intvBot(k), shadeKind, lite)` — `drawStrip` already clips `[sTop,sBot]` to `[intvTop,intvBot]` and no-ops on an empty result. Returns the total strips actually painted (for `surfaceCount()` and tests).

### 1.3 `occlude(oTop, oBot)`
Subtract the screen band `[oTop, oBot]` from every visible interval, rebuilding the list:
- interval entirely outside the band → kept whole
- band covers the interval's top only → interval shrinks from the top (`intvTop = oBot`)
- band covers the bottom only → shrinks from the bottom (`intvBot = oTop`)
- band lands in the interval's middle → **split into two** (`[t, oTop]` and `[oBot, b]`)
- band covers the whole interval → dropped
Then if `count > RC_MAX_INTERVALS`, repeatedly drop the interval with the smallest `(bot - top)` until within the cap. Write the result back into `intvTop` / `intvBot` / `intvN`.

Implementation: build into scratch arrays (`occTop(0)` / `occBot(0)`, cleared each call — reused, no per-frame alloc), then copy back. softBASIC: `array.clear` + `array.push`.

### 1.4 `intervalCount()` accessor
Returns `intvN` — a probe/test hook (like the existing `surfaceCount()`).

---

## 2. `renderFrame` — the rewritten span walk

Per column, after `self.rc.cast(...)`:

1. `resetIntervals()`. Seed `runFloorH` / `runCeilH` region-aware (as now).
2. Seed the pending horizontal-surface trackers (`sfH/sfD/sfKind/sfLite` for the floor, `scH/scD/scKind/scLite` for the ceiling) — as now.
3. Walk spans `i = 0 … n`, **stopping early when `intvN = 0`**:

   **`RC_SPAN_WALL`** (full opaque blocker — the DDA stopped here):
   - flush both pending horizontal surfaces to distance `d` (`drawSurfaceInto(...)` — §2.1)
   - `drawInto(sTop, sBot, wshade, lite)` — the wall face (`wshade` = the existing spanSide→shade map, incl. the `RC_SPAN_SIDE_DIAG`→1 and the diagonal light-sample special cases, unchanged)
   - `self.depthArr(col) = d`
   - `intvN = 0` (nothing is visible behind a full wall) — the walk ends.

   **`RC_SPAN_FLOORSTEP` / `RC_SPAN_CEILSTEP`:**
   - `newH` = the span endpoint that isn't the current running height (`if spanLo(i) = runFloorH then newH = spanHi(i) else newH = spanLo(i)` — and the ceiling equivalent; this is the Phase-8 fix, already landed, kept).
   - flush the matching pending surface to `d`, draw the riser via `drawInto(sTop, sBot, riserShade, lite)`, then `occlude(projectY(hi, d), projectY(lo, d))` — the riser's own band.
   - update the pending surface: `sfD = d`, `sfH = newH`, `sfKind` = PIT_FLOOR vs FLOOR_TOP (or SOFFIT vs CEIL_UNDER) by `newH < runH`, `sfLite` = this segment's light. `runFloorH`/`runCeilH = newH`.

   **`RC_SPAN_PORTAL_WALL`:** `drawInto(sTop, sBot, 1, lite)` then `occlude(sTop, sBot)` — an opaque mid-air band; does *not* end the walk (`intvN` stays whatever it is).

   **`RC_SPAN_PORTAL_CEIL`** (upper ceiling seen up through a hole; RcCast emits it with `lo == hi == upperCeilAt` at one distance): `yLine = projectY(spanHi(i), d)`. `drawInto(0, yLine, 3, lite)` (fills the ceiling area — `drawInto` clips to the visible intervals) then `occlude(0, yLine)`. It is a flat fill, not a receding surface — an accepted approximation, far better than today.

   **`RC_SPAN_PORTAL_FLOOR`** (`lo == hi`): `yLine = projectY(spanHi(i), d)`.
   - camera in the **lower** region (a plank underside seen from below, at `upperFloorAt`): overhead plane → `drawInto(0, yLine, RC_SHADE_UPPER_FLOOR, lite)` + `occlude(0, yLine)`.
   - camera in the **upper** region (the lower room floor seen down through a hole, at `floorHeightAt`): floor plane below → `drawInto(yLine, viewH, RC_SHADE_UPPER_FLOOR, lite)` + `occlude(yLine, viewH)`.

4. Post-loop (no wall hit): flush both pending surfaces to `RC_MAX_DIST`.

### 2.1 `drawSurfaceInto(hh, dNear, dFar, kind, lite)`
Replaces the current `drawSurface`. `yA = projectY(hh, dNear)`, `yB = projectY(hh, dFar)`, order so `yTop ≤ yBot`. `self.surfCountLast += self.drawInto(yTop, yBot, kind, lite)`. Then `occlude(yTop, yBot)` — the surface is opaque; nothing on its far side within this band is visible. (A floor surface's far edge meets the next riser/wall base at the same screen Y, so "occlude the band" is equivalent to the old "clamp winBot to the floor line" but composes correctly with a ceiling and a mid-band plank in the same column.)

### 2.2 What is unchanged
`projectY`, `drawStrip` (still the low-level clipped-strip primitive), the camera sync, `camRegion` derivation, the background/floor/ceiling tint fill at frame top (leftover intervals show it), `depthArr` semantics for billboard clipping, `drawActors`, `worldToScreenX`, `bindCamera/bindLights/bindActors`.

---

## 3. Bilinear light for surfaces

### 3.1 `RcLights.sampleAt(worldX, worldY)`
Cell centres sit at `(col + 0.5, row + 0.5)`. Bilinear-blend the four cells around `(worldX, worldY)`:

```
fx = worldX - 0.5 ; fy = worldY - 0.5
c0 = floor(fx) ; r0 = floor(fy)
tx = fx - c0 ; ty = fy - r0
a = sampleCell(c0,   r0)     ; b = sampleCell(c0+1, r0)
c = sampleCell(c0,   r0+1)   ; d = sampleCell(c0+1, r0+1)
return a*(1-tx)*(1-ty) + b*tx*(1-ty) + c*(1-tx)*ty + d*tx*ty
```

`sampleCell` already clamps OOB to `self.ambient`, so edges degrade gracefully. No occlusion change — `sampleAt` is a pure read over the baked grid.

### 3.2 `RcRender` uses it for surfaces, not walls
- **Horizontal surfaces** (floor tops, pit floors, ceiling undersides, soffits, portal ceil/floor) and **step risers**: light at the ray's world hit point. For a span at distance `d`, that point is `(self.camX + rayX * d, self.camY + rayY * d)` (the DDA's `d` is the perpendicular ray parameter, so `cam + rayDir*d` is the world position — no normalisation needed). For a surface spanning `dNear…dFar`, sample at the midpoint `d = (dNear + dFar) / 2`.
- **Walls** keep `sampleCell` at the span's cell (a wall face belongs to one cell; the existing x/y step-back and diagonal special-cases stay).
- **Portal spans** keep `sampleCell` (region-blind, already a documented limit) — or `sampleAt` if it's a clean swap; the plan decides. Not the point of this rework.

---

## 4. Region-1 floor/ceiling step correctness (folded in)

The Phase-8 renderer seeds region-1 columns from `upperFloorAt` / `upperCeilAt` and the `newH`-from-span-endpoint fix (already landed) makes the running heights correct. Remaining rough edge: the pending-surface `sfKind` / `scKind` (PIT_FLOOR vs FLOOR_TOP etc.) and the riser shade selection must use the region-correct comparison, and the hole-cell discontinuity (`cellCeil`→`upperCeilAt` region 0, `cellFloor`→lower floor region 1, already in `RcCast`) must flow through the interval `occlude` calls without a stray full-column clear. The rewrite in §2 is written region-agnostic — it consumes whatever spans `RcCast` emits and the region-aware seed — so this "fix" is mostly *not regressing* it during the rewrite. The plan includes an explicit region-1 walkway smoke test (flat floor, a hole, a step) asserting the interval list stays sane.

---

## 5. Tests

- **`raycasterDemoSmoke.test.ts`** — the strip-count / exact-grey assertions are rewritten to check **interval-list behaviour**:
  - `occlude` splits a middle band → `intervalCount()` goes 1 → 2.
  - a full wall → `intervalCount()` → 0 and the walk stops (`surfaceCount` / draw calls cease).
  - a plank-underside band through a hole → the room-below strip AND an above-the-plank strip both draw (two distinct `drawRect` w=4 calls at different midY, not one).
  - region-0 ray through a hole to a far wall still emits the wall strip (kept from the Phase-8 fix).
  - region-1 ray across a hole shows the gap (a strip at the lower-floor height appears).
- **New focused test** `raycasterIntervals.test.ts` (or a block in the smoke file) — drives `resetIntervals` / `occlude` / `drawInto` directly against a transpiled `RcRender`: split, shrink-top, shrink-bottom, full-cover-drop, cap-exceeded-drops-thinnest.
- **`RcLights.sampleAt`** — a focused test (real `RcLights` built from an inline stm, or the duck-world smoke harness): a point midway between a bright cell and a dark cell returns ~the average; exact cell centre returns ~`sampleCell`; OOB returns `ambient`.
- **`raycasterDemoProbes` P8** — the 6 probes are span/region checks, not render — should stay green untouched. Confirm.
- **`raycasterDemoTranspile` / `raycasterDemoLibSync`** — auto-pickup; sync `RcRender` p3–p8, `RcLights` p5–p8, `RcConfig` p2–p8.
- Full `npx vitest run` + `npx vite build` + Cypress `demos.cy.ts` (p1–p8 ERR-free).

---

## 6. p8 demo re-verification

After the rework: seed `raycaster-p8-upper`, walk it (the user drives — the preview harness can't). Check the three reported spots: the floor lighting cascade (should be a smooth gradient now), the walkway underside (should read as a solid platform with the room visible under it), the ceiling hole (should show the upper ceiling above / room-through cleanly). If the torch (`addPoint(7.5, 6.5, 0.5, 0.9, RC_LIGHT_RANGE)`) or the `light` markers still produce a harsh look with correct interpolation, adjust their intensity / range / position in `PortalScene.bas` + `p8room.stm` and rebuild the export. The demo's geometry (walkway, railings, hole, staircase) stays — the brainstorm's decision is to make the renderer handle it, not shrink the demo.

---

## 7. Out of scope

- Per-region lighting (an upper strip still samples the lower light grid) — separate deferred item, unchanged.
- Light / LOS / hitscan through the portal — unchanged.
- Floor/ceiling/wall textures — still flat-shaded.
- Sub-column (per-pixel) occlusion or true depth-sorted transparency — the interval list is per whole strip column, same as today.
- Smoothing the light grid's *temporal* recompute (moving torch rebuilds every frame) — a Phase 9 perf concern.

---

## 8. Risk / rollback

`renderFrame` is the highest-complexity function in the library. The rewrite is contained to it plus three new small helpers and one `RcLights` method. If the interval walk proves too fiddly in softBASIC, the fallback is the single window for everything *except* portal/plank bands (a two-interval special case) — but the brainstorm chose the full fix, so the plan attempts that first. Every step is TDD; the `raycasterIntervals` test locks `occlude`'s split logic before it's wired into `renderFrame`.
