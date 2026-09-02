# Raycaster Phase 7 — Fixed Diagonal-Wall Tiles — Design Spec

**Status:** approved (brainstorm 2026-09-02) — ready for implementation plan.

**Amends:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` §3.1 (adds a per-cell `diag` array), §4.2 (fills in the "single ray/segment intersection against the tile's 45° chord"), §11 (marks Phase 7 done).

**Scope:** `demo-src/raycaster/lib/` — `RcWorld` (parse + `diagAt`), `RcCast` (`cast` + `los` chord test), `RcMover` (circle-vs-45°-face). `RcRender` gets one tiny shading tweak. New `demo-src/raycaster-p7/` demo (octagonal room + a canted wall). **No engine (`.js` / TypeScript) change, no `.stm` format change, no `RcConfig` behavioural change beyond new constants.**

---

## 1. The model — corner-solid cell (option A)

A diagonal-wall cell is a unit grid cell split **corner-to-corner** by a 45° chord: one triangle is solid wall, the other is open floor. Four rotations, named by the corner the **solid** triangle fills: `nw`, `ne`, `se`, `sw`.

- **Octagonal room** = a rectangular room with a corner-solid tile in each of its 4 corner cells, solid triangle pointing into the corner.
- **Canted wall / corridor** = a diagonal run of corner-solid tiles, each solid triangle on the same side, forming a continuous 45° face.

Cell-local coordinates: `u = worldX - col ∈ [0,1]` (east), `v = worldY - row ∈ [0,1]` (south). The 4 tiles:

| Tag | Solid corner | Chord line | Solid half-plane |
|---|---|---|---|
| `diag:nw` | NW `(0,0)` | `u + v = 1` (anti-diagonal, NE↔SW) | `u + v ≤ 1` |
| `diag:se` | SE `(1,1)` | `u + v = 1` | `u + v ≥ 1` |
| `diag:ne` | NE `(1,0)` | `v = u` (main diagonal, NW↔SE) | `v ≤ u` |
| `diag:sw` | SW `(0,1)` | `v = u` | `v ≥ u` |

`nw`/`se` share the anti-diagonal; `ne`/`sw` share the main diagonal.

**Not in scope (v1):** a diag cell has flat floor (`0`) and standard ceiling — no `diag:` combined with `floor:` / `ceil:` / `upper:` in the same cell (RcWorld may parse both but the cast/mover only honour the diag). Slopes stay permanently cut (engine-spec §2.1). Diag cells are not doors/lifts.

---

## 2. `RcWorld`

### 2.1 Storage

New parallel array `diagArr(0)` (same pattern as `wallArr`, `floorHArr`, …), one entry per cell, `0` = not a diagonal, else `RcConfig.RC_DIAG_NW` / `_NE` / `_SE` / `_SW` (values `1`–`4`).

### 2.2 Parse

In `applyKv` (which already handles `tex:`, `floor:`, `ceil:`, `light:`, `upper:`), add a `diag` key:

```basic
if key = "diag" then
    if v = "nw" then self.diagArr(idx) = RcConfig.RC_DIAG_NW endif
    if v = "ne" then self.diagArr(idx) = RcConfig.RC_DIAG_NE endif
    if v = "se" then self.diagArr(idx) = RcConfig.RC_DIAG_SE endif
    if v = "sw" then self.diagArr(idx) = RcConfig.RC_DIAG_SW endif
endif
```

The cell's `wallArr` entry stays whatever it is in the `.stm` walls layer — author the diag cells as **open** (`0`) in the walls grid and place a `diag:` marker on them. If a cell has both `wall > 0` and `diag`, `wall` wins (full block) — a diag on a solid cell is a no-op, note it.

### 2.3 Accessor

```basic
function diagAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.diagArr(row * self.cols + col)
endfunction
```

Constructor: `array.push(self.diagArr, 0)` in the per-cell init loop, alongside the existing pushes.

---

## 3. `RcCast` — the chord test

### 3.1 Where it plugs in

`cast()`'s DDA loop already does, per step: `stepMarch()` (advances `mMapX/mMapY`, sets `mEntryDist` = perpendicular distance to the cell's near edge, `mSide`), then `wallHere = wld.wallAt(...)`. Add the diag test **immediately after** the existing `wallHere > 0` block — so a full wall in the same cell wins (§2.2), and the diag test only runs when the cell's walls-layer value is `0`:

```
' right after the existing wallHere > 0 block that emits a full wall span + returns:
dim dg
dg = wld.diagAt(self.mMapX, self.mMapY)
if dg > 0 then
    <chord test — §3.2>
endif
```

### 3.2 The test

The ray traverses this cell from `mEntryDist` (near edge) to `exitDist` (far edge). `exitDist` = `math.min(self.mSideX, self.mSideY)` **after** `stepMarch` advanced past the near edge — i.e. the *next* boundary distance. Compute the cell-local ray position at both:

```basic
' entry / exit points in world coords, then cell-local
dim exitDist
exitDist = self.mSideX
if self.mSideY < exitDist then
    exitDist = self.mSideY
endif

dim u0
dim v0
dim u1
dim v1
' NOTE: ox/oy/dx/dy are cast()'s ray origin+dir params. Distance here is in the
' same "perpendicular" units mEntryDist uses; the point is
'   world = (ox,oy) + dist * (dx,dy) / |(dx,dy)|
' but rather than normalise, lerp cell-local coords between the two known
' boundary points (entry at mEntryDist, exit at exitDist) — same trick RcRender
' uses for surfaces. Compute entry/exit world points from the DDA state:
```

Simplest, normalisation-free formulation — build the entry and exit **world points** directly:

```basic
dim invLen
invLen = 1.0 / math.sqrt(dx * dx + dy * dy)
dim ex0
dim ey0
dim ex1
dim ey1
ex0 = ox + dx * invLen * self.mEntryDist
ey0 = oy + dy * invLen * self.mEntryDist
ex1 = ox + dx * invLen * exitDist
ey1 = oy + dy * invLen * exitDist
u0 = ex0 - self.mMapX
v0 = ey0 - self.mMapY
u1 = ex1 - self.mMapX
v1 = ey1 - self.mMapY
```

(RcCast's `beginMarch` does not normalise `dx,dy`; `mEntryDist`/`mSideX`/`mSideY` are perpendicular distances = euclidean distances along the *normalised* ray. So multiply the normalised dir by them. Compute `invLen` once — acceptable; `los()` will do the same. If profiling later shows the `sqrt` matters, `beginMarch` can stash `invLen`.)

Then the signed chord function `f`:

```basic
dim f0
dim f1
if dg = RcConfig.RC_DIAG_NW or dg = RcConfig.RC_DIAG_SE then
    f0 = u0 + v0 - 1.0
    f1 = u1 + v1 - 1.0
else
    f0 = v0 - u0
    f1 = v1 - u1
endif
```

**Solid-side sign:** for `NW` / `SW` the solid half is `f ≤ 0`; for `SE` / `NE` it's `f ≥ 0`. Let `solidNeg = 1` for NW/SW, else `0`.

Cases:

1. **Entry already on the solid side** (`solidNeg` and `f0 <= 0`, or `!solidNeg` and `f0 >= 0`): the ray started inside the wall triangle (grazing / started-in-cell). Emit a wall span at `mEntryDist`, `return`.
2. **Ray crosses the chord** (`f0` and `f1` have opposite signs): crossing param `s = f0 / (f0 - f1)`, hit distance `hitDist = self.mEntryDist + s * (exitDist - self.mEntryDist)`. Verify the crossing point is within the cell (`0 <= u <= 1 and 0 <= v <= 1` at `s` — it will be if `f` genuinely flipped inside a convex cell, but clamp defensively). Emit a wall span at `hitDist`. `return`.
3. **Ray stays on the open side** (no sign flip, entry open): not a wall in this cell — **do not emit a wall span, do not return**; fall through and let the loop `stepMarch` into the next cell. (A diag cell has flat floor/ceiling in v1, so nothing else to emit.)

The wall span: `addSpan(RC_SPAN_WALL, hitDist, runFloor, runCeil, mMapX, mMapY, RcConfig.RC_SPAN_SIDE_DIAG, u_at_hit, wallTexAt(mMapX,mMapY))`. `RC_SPAN_SIDE_DIAG = 2` (new). The `u` (wall texture coord along the chord) = distance along the chord from its start corner, `0..1` — for v1 (flat-shaded, no textures) pass `0`; wire the real value when wall texturing lands.

### 3.3 `los()`

`los()` runs the same bare DDA. Add the identical `diagAt` check: if the marched cell is a diag and the ray **crosses into the solid side** (case 1 or 2 above), `return` the hit distance; if it stays open (case 3), keep marching. This keeps light-occlusion and hitscan consistent with the visible geometry — a 45° wall blocks light and bullets exactly where it blocks the eye. Factor the chord math into a shared `function diagHit(wld, ox, oy, dx, dy, mapX, mapY, entryDist, exitDist)` → hit distance or `-1`, called from both `cast` and `los`.

### 3.4 What RcCast does NOT change

The DDA march itself (`beginMarch` / `stepMarch`), the `RC_MAX_DIST` / `RC_MAX_MARCH_ITERS` termination, floor/ceiling step spans, the span array layout (only a new `side` *value*, not a new column).

---

## 4. `RcMover` — circle vs. the 45° face

`step()` does a per-axis slide: for each axis, compute the candidate coordinate, find the leading `edgeCell`, and if `blocked(cx, cy) = 0` accept the move.

Extend the block test to honour a diag cell **by sub-cell position**, not just cell kind. `blocked(cx, cy)` currently takes only cell indices; add a position-aware check. Cleanest: after the two per-axis moves in `step()`, one corrective pass:

```basic
' Diagonal push-out: if the body centre ended up overlapping a diag cell's
' solid triangle, push it back out along the chord normal. One cell — the one
' the centre is in. (v1: only the centre cell; a body straddling a diag edge
' into a neighbour diag is a corner case, same class as the mover's documented
' single-cell-slide limit.)
dim dcx
dim dcy
dim dg
dcx = math.floor(self.px)
dcy = math.floor(self.py)
dg = self.wld.diagAt(dcx, dcy)
if dg > 0 then
    <compute signed distance `sd` from (px,py) to the chord line of cell (dcx,dcy),
     positive on the OPEN side; if `sd < self.rad`, push the centre out:
       push = self.rad - sd
       self.px = self.px + nX * push
       self.py = self.py + nY * push
     where (nX, nY) is the unit chord normal pointing to the open side:
       anti-diagonal (nw/se): (-1/√2, -1/√2) for nw solid, (+,+) for se solid
       main diagonal  (ne/sw): (+1/√2, -1/√2) for ne solid, (-1/√2, +1/√2) for sw solid >
endif
```

Signed distance to a line `a·u + b·v = c` (cell-local, `(a,b)` unit): `sd = c - (a*(px-dcx) + b*(py-dcy))`, signed so open side is positive.
- anti-diagonal `u+v=1`: normalise `(1,1)/√2`; `sd = (1 - localU - localV) / √2` for `nw` (open = `u+v>1`), negate for `se`.
- main diagonal `v-u=0`: `sd = (localU - localV) / √2` for `ne` (open = `v<u`... wait `ne` solid is `v ≤ u` so open is `v > u`, `sd = (localV - localU)/√2`); mirror for `sw`.

(Get the signs right against §1's table during implementation — the constant is the intent, the `+`/`-` is a detail to verify by walking the demo.)

The push-out gives a **smooth slide** along the 45° face (unlike a per-axis `blocked` reject, which staircases). It also naturally handles walking *along* the open side. Also keep the existing full-cell `blocked` for the case where a diag cell's `wallArr > 0` (shouldn't happen per authoring, but wall-wins).

**Limitation (documented):** the push-out is a single-cell resolve run once per frame after the axis moves — a body moving fast enough to tunnel through the thin part of a solid triangle in one frame isn't caught (same class as the mover's existing `max_speed * RC_MAX_STEP_DT < rad` invariant). Fine at demo speeds.

---

## 5. `RcRender` — one shading line

`renderFrame`'s wall branch passes `self.rc.spanSide(i)` straight to `drawStrip` as `shadeKind`. A diag wall now reports `spanSide = 2` (`RC_SPAN_SIDE_DIAG`), which collides with `drawStrip`'s `shadeKind = 2` (floor-step riser, g=90). Map it before the call:

```basic
dim wshade
wshade = self.rc.spanSide(i)
if wshade = RcConfig.RC_SPAN_SIDE_DIAG then
    wshade = 1
endif
self.drawStrip(destX, sTop, sBot, winTop, winBot, wshade, lite)
```

A diag wall borrows the y-face shade (`g = 115`) for v1 — a mid-tone that reads distinctly from the bright x-face (150). A dedicated diagonal wall shade is a polish item, not worth a `drawStrip` table row now.

**Lighting step-back:** the Phase-6 wall lighting samples `sampleCell(spanCol - sign(rayX), spanRow)` for `spanSide = 0` and `sampleCell(spanCol, spanRow - sign(rayY))` for `spanSide = 1`. For `spanSide = 2` (diag), sample one step back along the ray: `sampleCell(math.floor(camX + rayX * d * 0.9), math.floor(camY + rayY * d * 0.9))` — `d` is the span distance. Add this as a third branch in the lighting block.

`depthArr` (Phase 6b): a diag wall still `self.depthArr(col) = d` and terminates the column, same as a full wall — the diag hit distance is the nearest opaque thing in that column.

---

## 6. `RcConfig` — new constants

```basic
    RC_DIAG_NW = 1
    RC_DIAG_NE = 2
    RC_DIAG_SE = 3
    RC_DIAG_SW = 4
    RC_SPAN_SIDE_DIAG = 2
```

---

## 7. Demo — `demo-src/raycaster-p7/`

`DiagScene.bas` (`Class` / `Extends scene`), `Main.bas`, byte-identical copies of the 8 lib files (`RcConfig RcWorld RcCast RcRender RcMover RcLights` + — actually only those 6; `RcActor`/`RcActors` aren't needed unless the demo has billboards, keep it lean: **6 lib files**). Wait — `RcRender.bas` has `dim a as RcActor` in `drawActors`, so a standalone transpile of `raycaster-p7/` needs `RcActor.bas` present too (the Phase-6 lesson). **So: 8 lib files** (`RcConfig RcWorld RcCast RcRender RcMover RcLights RcActor RcActors`), even though the p7 scene never `new`s an actor. `raycasterDemoLibSync` enforces byte-identity.

### 7.1 Room — `assets/p7room.stm`

A ~12×10 room. Core: an **octagonal chamber** — a 6×6 open area whose 4 corner cells carry `diag:nw` / `diag:ne` / `diag:se` / `diag:sw` (solid triangle into each corner). Off one flat wall, a short **canted passage**: 3–4 cells stepping diagonally, each boundary cell `diag:` on the same side, so the passage wall is a continuous 45°. Border walls elsewhere. One `light` marker. Camera spawns in the octagon centre.

Concretely (14 wide × 10 tall grid; octagon in rows 1–6, cols 1–6; canted passage exiting east around row 4):

```
walls: border 1s; interior 0.
markers:
  { row:1, col:1, tag:"diag:nw" }   { row:1, col:6, tag:"diag:ne" }
  { row:6, col:1, tag:"diag:sw" }   { row:6, col:6, tag:"diag:se" }
  ' canted passage, north wall stepping SE:
  { row:3, col:8,  tag:"diag:se" }
  { row:4, col:9,  tag:"diag:se" }
  { row:5, col:10, tag:"diag:se" }
  ' canted passage, south wall stepping SE (parallel):
  { row:5, col:8,  tag:"diag:ne" }
  { row:6, col:9,  tag:"diag:ne" }
  { row:7, col:10, tag:"diag:ne" }
  { row:2, col:2, tag:"light" }
```

Refine the exact passage cells during implementation so it reads as a corridor and the walls layer keeps it open where the diag markers sit. Verify `RcWorld.diagAt` returns the right value at each marked cell.

### 7.2 Scene

`Constructor()` — `input.bind` WASD/QE (copy from `raycaster-p6/ActorScene.bas`).

`onenter()`: `new tilemapset("p7room.stm")` → `RcWorld` → `RcRender` → `RcMover(wld, <octagon centre>, 0.3, 0.6)` → `RcLights` → `ren.bindCamera(me)` / `bindLights(lights)`. Torch light follows the player. HUD title + hint. `runProbes()`.

`runProbes()` — copy the `probe(label, passed, y)` helper verbatim. Probes:

1. **diag tags loaded** — `self.wld.diagAt(1, 1) = RcConfig.RC_DIAG_NW` and `diagAt(6, 6) = RcConfig.RC_DIAG_SE`.
2. **`los` blocked by a diagonal face** — set the camera at the octagon centre; a ray fired at ~45° toward a corner tile hits the diagonal at less than the distance to the cell's far edge. `dw = self.actors...` — no actors; use `self.cast` directly? `RcCast` isn't exposed on the scene. Give `DiagScene` its own `dim rc as RcCast` (or reach through `self.ren`). Cleanest: `dim probeCast as RcCast` / `probeCast = new RcCast()` in `runProbes`, then `d = probeCast.los(self.wld, cx, cy, dnx, dny)` where `(dnx,dny)` is a normalised 45° vector toward a `diag` corner. Assert `d > 0` and `d` is *shorter* than the same ray would travel to the border wall behind that corner (compute both — a ray toward the `nw` corner from centre hits the chord at roughly `√2 · (dist-to-corner-cell − 0.5)`).
3. **`los` passes through the open half** — a ray from the octagon centre straight along `+x` (axis-aligned, through the flat middle of the room) reaches the border wall at the expected distance, NOT stopped early by any diag (the corner tiles aren't on that ray).
4. **mover slides on the 45° face** — `dim m as RcMover` / `m = new RcMover(self.wld, <a point just inside the octagon, near a corner tile>, 0.3, 0.6)`; drive it *into* the corner (`m.move(RcConfig.RC_MOVE_SPEED, 0)` toward the diag, `m.step(16)` ×20); assert it did **not** pass through — `m.x()` / `m.y()` stayed on the open side of that chord (signed-distance check) — and that it *did* move (slid along, not stuck at the spawn point).
5. **mover walks freely down the open middle** — a second `RcMover` driven straight across the octagon's flat axis ends up near the far wall (no phantom diag blocking).
6. **render frame is ERR-free with diagonals present** — `self.ren.renderFrame()`; `self.ren.surfaceCount() >= 0` (a smoke check that the frame with diag walls in view didn't throw).

Adjust coordinates/expected values against the real `p7room.stm` during implementation; fix the probe numbers, don't loosen tolerances to nothing.

`onupdate(delta)`: WASD drive → `me.step(delta)`, torch follow, `lights.update()`, `ren.renderFrame()`.

### 7.3 Build + wire

- `npm run build:demo -- demo-src/raycaster-p7 RaycasterP7Diagonals`.
- `devDemoRegistry.ts` entry `raycaster-p7-diagonals` → `RaycasterP7Diagonals`; mirror test in `devDemoRegistry.test.ts`; `demos.cy.ts` `DEV_DEMOS` entry (`waitMs: 4000`).
- `raycasterDemoProbes.test.ts` — add a P7 case to the parameterised helper (`_sb_diagscene`, `probeCount: 6`).

---

## 8. Testing

- **`raycasterDemoSmoke.test.ts`** — extend the `RcCast ... cast/los` case: a `stubWorld` variant with `diagat(c,r)` returning a diag value for one cell; assert `los` through the solid side returns a shorter distance than through the open side, and `cast` still produces spans without throwing. Extend the `RcRenderLike` interface only if a new method is exposed (none planned — `diagAt` is on RcWorld, tested via the probe harness).
- **`raycasterDemoProbes.test.ts`** — the P7 scene's 6 probes run against the real `p7room.stm` (harness already feeds tilemap data + a real stage). Add `diagat` to the `_sb` tilemap stub path if `RcWorld` needs it (it reads markers via `allMarkers` — a `diag:` marker is just another `{row,col,tag}`, no stub change; `diagAt` reads `RcWorld`'s own array).
- **`raycasterDemoTranspile` / `raycasterDemoLibSync`** — auto-pick-up the new `RcWorld`/`RcCast`/`RcMover`/`RcRender`/`RcConfig` edits + the 8 `raycaster-p7/` copies.
- **Cypress `demos.cy.ts`** — `raycaster-p7-diagonals` runs `ERR`-free; manual eyeball: the octagon reads as an octagon (angled corners, not square), you can walk to a corner and **slide along** the 45° face rather than stopping dead or passing through, the canted passage looks canted, light/shadow falls correctly on a diagonal face. Also re-check p1–p6 unaffected (diag code is gated on `diagAt > 0`, which is `0` everywhere in those demos).
- **Full `npx vitest run` + `npx vite build`** green.

---

## 9. Out of scope / deferred

- **Wall-U / texturing on the diagonal face** — `spanU` is passed as `0`; the real along-chord coordinate wires in with the general wall-texturing pass.
- **A dedicated diagonal-wall shade** in `drawStrip` — borrows the y-face grey for now.
- **`diag:` + `floor:` / `ceil:` / `upper:` in one cell** — the cast/mover honour only the diag; combining them is a later refinement (and largely pointless — a sloped-floor diagonal is a slope, which is cut).
- **Two diag cells sharing an edge, body straddling both** — single-cell mover resolve, same limit class as the existing slide invariant.
- **Non-45° / arbitrary-angle walls** — permanently cut (engine-spec §2.1).
- **Diagonal doors / lifts** — a diag cell isn't a door.

---

## 10. Phasing

Phase 7 per engine-spec §11 ("Diagonal-wall tiles — `RcWorld` + `RcCast` + `RcMover`"). Comes after Phase 6b (surface rendering) — 6b's per-column surface strips and the diag wall span coexist without interaction (a diag cell is flat-floored). Phase 8 (one upper region per cell) is next.
