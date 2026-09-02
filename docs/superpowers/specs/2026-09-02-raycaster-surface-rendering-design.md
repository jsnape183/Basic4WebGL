# Raycaster Phase 6b — Horizontal Surface Rendering — Design Spec

**Status:** approved (brainstorm 2026-09-02) — ready for implementation plan.

**Amends:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` §5.2 (completes what "Floor/ceiling step surfaces use a flat-shaded `drawing.drawRect`" was always meant to mean) and its §11 phasing (inserts 6b before Phase 7).

**Scope of change:** `demo-src/raycaster/lib/RcRender.bas` only (+ its byte-identical phase-dir copies), plus the `demo-src/raycaster-p6/` demo room + probes, plus test additions. **No `RcCast`, `RcWorld`, `RcConfig` behavioural change** beyond RcConfig gaining shade constants. **No engine (`drawing.js` / TypeScript) change.**

---

## 1. Problem

`RcRender.renderFrame()` walks each screen column's span list (near→far) and draws **vertical** strips:

- wall faces (`drawStrip` shadeKind 0/1) — full occlusion, stops the column;
- the **risers** of floor steps (shadeKind 2) and ceiling steps (shadeKind 3) — clamp the per-column window, continue.

It never fills the **horizontal** surface between a riser's near edge and the next span. Two full-screen flat rects (one dark "floor" for the bottom half, one for the sky) stand in for all floor and ceiling. Consequences, all visible in `raycaster-p6-actors` and the Phase 3/4 demos:

| Geometry | Today | Wanted |
|---|---|---|
| Floor **rises** (step up / ledge) | riser drawn; the top of the raised cell shows the z=0 background fill — anything standing there (the p6 ledge NPC) floats above a visible gap | the raised top face is drawn as a receding flat surface; the NPC is grounded |
| Floor **drops** (pit) | window left open, you see straight through to whatever is behind the pit | the pit floor is drawn below the rim |
| Ceiling **rises** (alcove / raised ceiling) | underside not drawn | drawn |
| Ceiling **drops** (soffit / low beam) | top face not drawn | drawn |

All four are in scope. Flat-shaded only — floor/ceiling **texturing** (`floorTex`/`ceilTex` per-scanline sampling) is a separate, later pass that rides with wall texturing.

---

## 2. Approach — per-column flat surface strips

RcRender is a per-column renderer and `drawing` offers no polygon fill, so a horizontal surface is drawn the same way everything else is: **one flat `drawing.drawRect` per surface segment per column.**

### 2.1 The projection

For a column whose ray sees a horizontal surface at world height `h` over the depth interval `[dNear, dFar]`, the surface occupies the vertical screen span

```
yBottom = projectY(h, dNear)     ' the near edge sits lower on screen
yTop    = projectY(h, dFar)      ' the far edge climbs toward the horizon
```

`projectY` already clamps `d` to `0.05` and folds in `camZ`, `camPitch`, `RC_EYE_Z`. As `d → ∞`, `projectY(h, d) → scy + camPitch` (the horizon), so a surface that runs to `RC_MAX_DIST` fills up to the horizon line — correct.

Draw it with the existing `drawStrip(destX, yTop, yBottom, winTop, winBot, shadeKind, lite)` — it already clips to the window, flat-shades by `shadeKind`, multiplies by `lite`, and emits `drawing.drawRect(destX, mid, RC_STRIP_W, height)`.

**Screen ordering is not the same for a floor and a ceiling.** A floor below eye level has its *far* edge higher on screen (`projectY(h, dFar) < projectY(h, dNear)`); a ceiling above eye level has its *far* edge lower. `drawStrip` requires `yTop < yBottom` and silently no-ops otherwise. A `drawSurface(destX, hh, dNear, dFar, winTop, winBot, kind, lite)` helper projects both edges and passes the smaller as `yTop` — one place to get the sign right, called from all six sites (WALL ×2, FLOORSTEP, CEILSTEP, tail ×2). It also fixes the same-inversion case of a floor step that rises *above* eye level. `drawStrip` returns `1`/`0` (drew / clipped) so `surfaceCount()` counts only real strips.

### 2.2 The mechanism — stash-and-defer

The surface between floor step *N* and the next floor event is at the height established *at* step *N*, over depths `[dN, dNext]`. `dNext` isn't known until the loop reaches the next span, so the surface draw is **deferred one iteration**.

Per column, alongside the existing `runFloorH` / `runCeilH`:

```
' floor surface pending-draw state
dim surfFloorH        ' height of the floor surface currently "open"
dim surfFloorD        ' depth at which it started
dim surfFloorKind     ' RC_SHADE_FLOOR_TOP or RC_SHADE_PIT_FLOOR, fixed at stash time
dim surfCeilH
dim surfCeilD
dim surfCeilKind
```

- **Initialise** at the top of each column: `surfFloorH = runFloorH` (the camera cell's floor), `surfFloorD = 0`, `surfFloorKind = RcConfig.RC_SHADE_FLOOR_TOP`; mirror for ceiling with `RC_SHADE_CEIL_UNDER`. (This makes the near floor/ceiling of the camera's own cell a *drawn* surface — see §2.4.)
- **On a FLOORSTEP span** at depth `d`, with `newH = self.wld.floorHeightAt(spanCol, spanRow)`:
  1. **draw the pending floor surface**: `drawStrip(destX, projectY(surfFloorH, d), projectY(surfFloorH, surfFloorD), winTop, winBot, surfFloorKind, liteFloorSurf)` — the segment from where it opened out to *this* step;
  2. draw the riser (unchanged: `drawStrip(..., 2, lite)`);
  3. clamp `winBot` on a rise (unchanged: `if newH > runFloorH ...`);
  4. **stash the next segment**: `surfFloorH = newH`, `surfFloorD = d`, and **`surfFloorKind = RC_SHADE_PIT_FLOOR` if `newH < runFloorH` else `RC_SHADE_FLOOR_TOP`** (decided here, where both the old and new height are in hand — do NOT recompute at draw time, `runFloorH` will have moved on); then `runFloorH = newH`.
- **On a CEILSTEP span** — the exact mirror, with `winTop`, and `surfCeilKind = RC_SHADE_SOFFIT if newH > runCeilH else RC_SHADE_CEIL_UNDER` (a ceiling that *drops* — larger height number is lower, per `projectY`'s sign — gives a soffit underside you look up at from below... confirm the sign against `projectY` during implementation and pick whichever reads right; the constant names are the intent, the `<`/`>` is an implementation detail to verify visually).
- **On the WALL span** (column terminates): draw both pending surfaces out to the wall depth `d` first, then the wall strip, then `depthArr(col) = d`, stop.
- **On column end without a wall** (ray reached `RC_MAX_DIST` / `spanCount` exhausted): draw both pending surfaces out to `RC_MAX_DIST`.

Ordering within a column stays near→far, so `drawStrip`'s window clip does the occlusion — a nearer riser/surface that already shrank the window hides farther surface pixels.

### 2.3 Shading

`drawStrip` picks a base grey `g` from `shadeKind`. Add four kinds to the switch (keep 0–3):

| Kind | Const | `g` | Rationale |
|---|---|---|---|
| 4 | `RC_SHADE_FLOOR_TOP` | 105 | a lit horizontal surface — brighter than the 90 floor-step riser |
| 5 | `RC_SHADE_PIT_FLOOR` | 60 | in shadow at the bottom of a hole |
| 6 | `RC_SHADE_CEIL_UNDER` | 80 | underside of an alcove ceiling |
| 7 | `RC_SHADE_SOFFIT` | 50 | dark underside of a dropped beam |

These are RcConfig constants (`RcConfig.RC_SHADE_*`), referenced in `drawStrip`. Distance falloff is **not** added here — `drawStrip` has none today for walls either; keep it uniform, the Phase 9 pass can add a global fog term to `drawStrip` for everything at once.

`lite` for a surface = `boundLights.sampleCell(spanCol(i), spanRow(i))` — the same call the loop already makes for non-wall spans (the surface belongs to the transition cell). No new lighting code.

### 2.4 Background fill reduction

The two full-screen fills become **void** fills — they only need to cover what no surface reaches:

- The near floor/ceiling of the **camera's own cell** is now a drawn surface (`surfFloorH`/`surfCeilH` seeded from `runFloorH`/`runCeilH` at `d=0`). This also fixes a latent bug: standing on a raised floor (`camZ > 0`) currently shows the z=0 fill under your feet.
- Keep drawing the two background rects **first** (cheap, and they backstop any column whose surface strips don't quite meet — e.g. a `b <= t` degenerate near the horizon). Just re-purpose them mentally as "the colour of infinitely-far nothing"; no code change to the fills themselves is required for correctness, only the new surface strips on top. **Decision: leave the two background rects exactly as they are** — one less thing to get wrong — and rely on the surface strips painting over them. Revisit only if banding at the horizon looks wrong in the demo.

### 2.5 Cost

Up to one extra `drawRect` per floor transition + one per ceiling transition, per column. A room with a 2-step stair + a pit is ~4 floor transitions → ~4 extra rects/column → ~640 extra `drawRect`/frame at 160 columns, on top of the wall strips. The Phase 5 `drawing.js` pooling absorbs the allocation. If the Phase 3 frame-time readout (or a new p6 one) shows this blows the budget, that is the spec §5.3 rung-4 "batched strip" trigger — measured, not pre-built.

### 2.6 Rejected alternative

A new generic `drawing` primitive — `drawing.drawFloorSpan(...)` / a quad fill — doing proper horizontal spans (DOOM visplane style, accumulate across columns then one mesh update). No 4px column banding, but: new engine JS, and it doesn't fit RcRender's strictly-per-column loop (you'd buffer spans and flush after the column loop). Flat per-column strips match the existing architecture and the "flat now, textured later" plan. If Phase 9 benchmarks demand it, the batched primitive is spec §5.3 rung 4 and helps every strip, not just surfaces.

---

## 3. `RcCast` — no change

The span list already carries everything: `spanKind`, `spanDist` (the depth), `spanCol`/`spanRow` (the transition cell → `floorHeightAt`/`ceilHeightAt` and the light sample). The "next span's depth" is obtained by deferring the draw one loop iteration, entirely inside RcRender.

Confirm during implementation: `RcCast` emits a FLOORSTEP/CEILSTEP span for **every** height change along the ray, including drops (it does — `cellFloor <> runFloor`, either direction). A pure drop currently produces a span whose riser `drawStrip` draws a downward face; that stays.

---

## 4. Demo — `demo-src/raycaster-p6/`

### 4.1 Room (`assets/p6room.stm`)

Rework the 14×10 walls layer's tags to add, alongside the existing ledge (cells col 10–11 / row 7–8 at `floor:0.4`) and wall stub (col 8 / rows 2–3) and light (row 1 col 1):

- **A 2-step stair** up to the ledge from the west: `floor:0.15` on cells (col 8 / rows 7–8), `floor:0.3` on (col 9 / rows 7–8). Gives a 0 → 0.15 → 0.3 → 0.4 climb the camera can walk.
- **A pit** in the open floor in front of the spawn: `floor:-0.25` on cells (col 5–6 / rows 4–5). Camera at (3,3) looking +x sees straight into it.

Verify `RcWorld.applyKv` handles `floor:-0.25` (`math.val("-0.25")` → `-0.25` — should; confirm in the transpile/smoke pass).

### 4.2 Scene (`ActorScene.bas`)

- The ledge NPC stays at `(10.5, 7.5, 0.4)` — it now stands on the drawn stair-top / ledge surface.
- Keep the other two NPCs; nudge the floor NPC clear of the pit if it overlaps.
- **Two new probes** in `runProbes()` (probe helper unchanged):
  1. **stepped geometry loaded** — `self.wld.floorHeightAt(9, 7)` ≈ `0.3` and `floorHeightAt(11, 7)` ≈ `0.4` (`math.abs(... - 0.3) < 0.01`).
  2. **pit geometry loaded** — `self.wld.floorHeightAt(5, 4)` ≈ `-0.25`.
- **One rendering probe** — after `self.ren.renderFrame()` (call it once at the top of `runProbes`, as Phase 6 already does for the projection probe), assert `self.ren.surfaceCount() > 0`. This needs a new tiny `RcRender` accessor (§5).

Probe count goes 6 → 9. Update `raycasterDemoProbes.test.ts`'s P6 `probeCount` and the `devDemoRegistry` description if it mentions the probe set.

---

## 5. New `RcRender` surface

- `drawActors` / `renderFrame` unchanged in signature.
- **`function surfaceCount()`** → returns `self.surfCountLast` — the number of surface strips drawn during the last `renderFrame`. `dim surfCountLast` (scalar; per §35's fix it's a per-instance own field once written), reset to `0` at the top of `renderFrame`, `+1` each time a surface `drawStrip` actually paints (i.e. not on the `b <= t` early return — increment where the pending-surface draw is issued; a small over-count from clipped strips is fine, the probe only checks `> 0`). Purely a debug/probe hook, documented as such in the header.
- Four `RcConfig.RC_SHADE_*` constants (§2.3).
- New `dim`s: `surfFloorH`, `surfFloorD`, `surfFloorKind`, `surfCeilH`, `surfCeilD`, `surfCeilKind`, `surfCountLast` (all scalars — the §35 fix concerns array/dict fields; scalars were always per-instance once the constructor writes them, and these are all written each `renderFrame`).
- The header comment's "the pit floor / under-ledge surface is not specially drawn" line is deleted / replaced.

---

## 6. Testing

- **`raycasterDemoSmoke.test.ts`** — extend the existing `drawImageStrip`-spy pattern (from the Phase 6 occlusion test) to also spy `drawRect`. New case: a stub world with a floor rise at a known column range and a pit at another; drive `renderFrame` with a real stage size; assert (a) a surface strip is drawn whose screen-Y band matches `projectY(h, d)` for the step height within a tolerance, and (b) `r.surfacecount()` is `> 0`. Also assert the **pit** case draws a strip *below* the rim (larger Y) — catches a sign error in the top/pit-floor kind selection.
- **`raycasterDemoProbes.test.ts`** — P6 `probeCount: 9`; the harness already runs `ActorScene.onenter()`/`runProbes` against the real `p6room.stm`, so the two geometry probes + the `surfaceCount` probe run there for free (the `_sb` stub already gives a real stage width, so `renderFrame`'s column loop executes).
- **`raycasterDemoLibSync` / `raycasterDemoTranspile`** — pick up the RcRender change + the 4 phase-dir copies automatically.
- **Cypress `demos.cy.ts`** — `raycaster-p6-actors` stays green (no `ERR`); manual eyeball: ledge is a solid platform reached by visible steps, the pit has a floor you can see, walking the stairs feels right, nothing floats.
- **Full `npx vitest run` + `npx vite build`** green.

---

## 7. Out of scope

- Floor / ceiling **texturing** (`floorTex`/`ceilTex`) — per-scanline floor-casting; rides with the wall-texturing pass.
- The **batched-strip `drawing` primitive** (spec §5.3 rung 4) — only if a measured frame-time failure demands it.
- **Sloped** surfaces — permanently out (spec §2.1).
- Distance **fog / falloff** in `drawStrip` — a Phase 9 global-polish item, applied to every kind at once, not just surfaces.
- **N-deep** stacked surfaces per cell — one floor + one ceiling per cell is rung C; the single optional upper region is Phase 8.

---

## 8. Phasing note

Inserts as **Phase 6b** in engine-spec §11, before Phase 7 (diagonal-wall tiles). Rationale: Phase 7 adds angled geometry to the same `RcCast` span list and `RcRender` column loop; completing the flat-surface render first keeps that change isolated. 6b is a corrective completion of Phase 3's "strip drawing", not new capability.
