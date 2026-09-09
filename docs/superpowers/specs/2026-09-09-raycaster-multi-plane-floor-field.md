# Raycaster multi-plane floor field — spec + plan

**Status:** approved (user: "lets go for it then").

**Problem.** `RcRender.setFloorField(1)` textures only the standard floor (h=0)
and standard ceiling (h=`RC_STD_CEIL`). Any surface raised/lowered by a
`floor:` / `ceil:` marker still renders through the flat-shaded strip path
(`drawSurface` → solid `drawRect`). On a map where a large area is raised — a
survival-slice platform — the untextured region dominates and reads as broken.

**Fix.** The field renders one textured pass per **distinct** floor height and
per distinct ceiling height in the map, each pass masked to the cells actually
at that height, drawn so a nearer (higher floor / lower ceiling) plane paints
over a farther one. The strip path keeps only the **risers** (the thin vertical
faces between heights). Lighting stays 2D-baked (one shared floor lightmap, one
ceiling) — a per-plane height offset on the light is not worth the complexity
and would risk re-introducing the "step glows" behaviour.

## Engine — `src/components/Runner/engine/drawing.js`

### `registerFieldTiles(atlasId, cols, rows, cellNames, cellColors, cellHeights)`

New 6th arg `cellHeights` — flat `cols*rows` number array, the floor (or
ceiling) height of each cell. Stored on the cache entry as
`cellH: Float32Array`. Back-compatible: omitted → `cellH` all `0`.

### `drawPlaneField(...)` — per-cell height mask

When the resolved tiles entry has a `cellH` grid, a pixel is painted only if
`Math.abs(cellH[idx] - planeZ) < 0.02`; otherwise it is written transparent
(`a = 0`) and skipped. No `cellH` (or no tiles) → paint every pixel (unchanged).
`planeZ` is already a parameter — the caller passes the target height.

`_drawingReset` teardown unchanged (already clears `_fieldTilesCache`,
`_planeFields`).

## Library — `demo-src/raycaster/lib/RcRender.bas` (+ sync to all `Rc*` copies)

### `bakeFieldTiles()`

- Also build `fheights` / `cheights` flat arrays from `floorHeightAt` /
  `ceilHeightAt`, pass as the new 6th arg to `registerFieldTiles`.
- Register **both** atlases unconditionally when the field is on (they now
  always carry the `cellH` grid the passes need) — drop the `anyF`/`anyC`
  gate.
- Collect the **distinct** floor heights into `self.ffFloorHeights` (ascending)
  and distinct ceiling heights into `self.ffCeilHeights` (descending). Small
  bubble sort; arrays are 1–6 entries.

New fields: `dim ffFloorHeights(0)`, `dim ffCeilHeights(0)`.

### `renderFrame()` field-emit block

Replace the two fixed `emitFloorField(0, …)` / `emitFloorField(RC_STD_CEIL, …)`
calls with:

```
for hi = 0 to array.arrLength(self.ffFloorHeights) - 1
    self.emitFloorField(self.ffFloorHeights(hi), self.defFloorTex, self.ffFloorTilesId, "rc_ff_floor" + string.str(hi), self.ffFloorR, self.ffFloorG, self.ffFloorB)
next hi
for ci = 0 to array.arrLength(self.ffCeilHeights) - 1
    self.emitFloorField(self.ffCeilHeights(ci), self.defCeilTex, self.ffCeilTilesId, "rc_ff_ceil" + string.str(ci), self.ffCeilR, self.ffCeilG, self.ffCeilB)
next ci
```

Ascending floor emit order → the highest (nearest) floor plane's sprite gets
the highest draw-order zIndex → paints on top. Descending ceiling order → the
lowest (nearest) ceiling on top. All field sprites still precede the wall loop,
so walls overdraw.

`emitFloorField` keeps one **shared** lightmap id per surface
(`"rc_ff_floor"` / `"rc_ff_ceil"`) — only the `fieldId` (persistent buffer key)
and `planeZ` differ per pass.

### `drawSurface()` — early-out

```
function drawSurface(destX, hh, dNear, dFar, winTop, winBot, kind, lite, rayX, rayY)
    if self.floorFieldOn = 1 then
        return
    endif
    ' ...unchanged...
```

`drawSurface` only ever draws horizontal floor/ceiling runs; the field now owns
all of them at every height. Risers (`drawStrip`, kind 2/3) and walls are
untouched. The 6 `stdCovered` guard sites can stay as-is — they just call a
now-inert `drawSurface`.

## Tests

- `tests/components/Runner/drawing.test.ts`: `registerFieldTiles` accepts
  `cellHeights`; `drawPlaneField` with a `cellH` grid paints only the matching
  height's cells (a 2-height grid → h=0 pass fills the h=0 half, transparent
  over the raised half; h=0.2 pass the reverse).
- `tests/lib/Basic4WebGL/integration/raycasterFloorField.test.ts`: a world with
  a `floor:0.2` region emits a `drawPlaneField` pass at planeZ 0 **and** at
  planeZ 0.2; `drawSurface`-path flat floor `drawRect`s do not appear for the
  raised region (capture `drawRect` greys, assert no `FLOOR_TOP` strip for the
  stepped columns).
- New guard `raycasterMultiPlaneFloorField.test.ts` (or fold into the above):
  the distinct-height collection is correct and sorted; a flat map still emits
  exactly one floor pass.
- Existing raycaster suite + `raycasterDemoSmoke` (stub worlds gain
  `floorheightat`/`ceilheightat` already present) stays green.
- Rebuild all raycaster + survival-slice demo exports.

## Out of scope

- Per-plane height-aware lightmaps (stays 2D).
- Textured risers (stay flat — they are thin vertical slivers).
- Multi-level occlusion beyond the single `winTop/winBot` window (unchanged).
