# Raycaster light-pool POC — baked lightmap floor/ceiling render

## Context

The light-pool POC (`demo-src/raycaster-lightpool-poc/`,
`docs/superpowers/specs/2026-09-05-raycaster-lightpool-poc-design.md`) validated
the *look* of warm circular light pools and a unified wall-lighting model the
user calls "near perfect". One thing is still wrong: `RcRenderPool.drawLightPools()`
draws the floor/ceiling pools as screen-space radial-gradient ellipses positioned
with billboard math. A billboard is the right model for an enemy (a card standing
at a point) and the wrong model for a patch lying on a receding plane — so the
pools slide and bob as the camera rotates and strafes, because billboard depth is
perpendicular distance, which changes under rotation.

This is the Approach-A → Option-C transition the previous spec explicitly planned
for. The lighting *model* is done and stays. Only the floor/ceiling *render*
changes: from a billboard overlay to a baked static lightmap projected onto the
floor and ceiling planes by the engine's existing perspective-correct mesh path.

Per-column floorcasting is not "the old broken method". The old failures all came
from *live per-frame sampling logic* — fixed sample distances, points landing
behind walls or in the wrong room, the `dNear=0` collapse, 2-stop gradients
missing the pool's centre. Baking removes that whole category: the pool shape,
the falloff and the wall occlusion are all computed once and stored in a texture;
render time is pure projection with nothing to get wrong per frame.

## Scope

**Untouched:** the wall lighting path (`lightAtPoint` per column), the light
model, the warm-over-cool palette, the POC scene, every `Rc*` library copy in
`demo-src/raycaster-lightpool-poc/`, and the `drawRadialGradientCircle` /
`drawRadialGradientEllipse` primitives (left in place, just no longer used by the
POC).

**Changed:** two small engine additions, and `RcRenderPool.bas`'s floor/ceiling
render only.

## Engine additions

Both go through the `drawing` descriptor + generator pipeline
(`src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts` →
`npm run generate:library`) and are implemented in
`src/components/Runner/engine/drawing.js`.

### `drawing.registerLightmap(id, w, h, worldCols, worldRows, bytes)`

Builds one `PIXI.Texture` from a raw RGBA byte array (`bytes` is a softBASIC
array of length `w*h*4`, values 0..255, row-major). `worldCols` / `worldRows`
are the map's cell dimensions, stored alongside the texture so
`drawLightmapStrip` can turn a world point into a UV. Backed by a
`PIXI.Texture` over a `PIXI.BufferImageSource` (or equivalent) with
`addressMode: 'clamp-to-edge'` and nearest/linear sampling (linear, for smooth
interpolation). Cached in a `Map` keyed by `id`; a second call with the same `id`
replaces the previous texture (destroy old, build new). All lightmap textures are
destroyed on `_drawingReset()` (scene switch), same lifecycle as the other
drawing caches.

### `drawing.drawLightmapStrip(id, destX, yNear, yFar, wNearX, wNearY, wFarX, wFarY, stripW)`

Draws one column-wide perspective-correct strip of a horizontal surface,
identical projection to the existing `drawFloorStrip` (a `PIXI.PerspectiveMesh`
with the four screen corners `[destX ± stripW/2] × [yFar, yNear]`), but the
texture is the registered lightmap sampled by **absolute world position**:

- The lightmap texture spans the whole map: texel `(col, row)` holds the light
  at surface cell `(col, row)`. UV for a world point `(wx, wy)` is
  `(wx / mapCols, wy / mapRows)`.
- The strip's near/far world points `(wNearX, wNearY)` / `(wFarX, wFarY)` map to
  those UVs; the mesh interpolates between them. `addressMode: 'clamp-to-edge'`
  means a strip that runs slightly past the map edge just holds the edge colour.
- `mapCols` / `mapRows` are the `worldCols` / `worldRows` stored with the
  texture at `registerLightmap` time — independent of the texture's pixel
  resolution `w` / `h`.

One draw call per column per surface. No tiling, no `tint` — the colour is
entirely in the texture.

## `RcRenderPool.bas` changes

### Bake (once, after lights are bound)

New `bakeLightmaps()`, called at the end of `bindLights()` (so it runs once the
lights exist). For a lightmap resolution multiplier `RC_LM_RES` (start at 1; a
field `lmRes` settable via `setLightmapRes(n)` for tuning):

```
w = self.wld.widthCells() * self.lmRes
h = self.wld.heightCells() * self.lmRes
```

Build two RGBA byte arrays, `floorBytes` and `ceilBytes`, each `w*h*4`. For each
texel `(tx, ty)`:

- World point: `wx = (tx + 0.5) / self.lmRes`, `wy = (ty + 0.5) / self.lmRes`.
- `fl = self.lightAtPoint(wx, wy, 0)` for the floor,
  `cl = self.lightAtPoint(wx, wy, RcConfig.RC_STD_CEIL)` for the ceiling.
- Colour: cool dark ambient base + warm light contribution, the same constants
  the wall path already uses:
  `r = clamp(ambientBase*0.5 + fl*255, 0, 255)`,
  `g = clamp(ambientBase*0.5 + fl*214, 0, 255)`,
  `b = clamp(ambientBase*0.72 + fl*170, 0, 255)`, alpha `255`.
- Write `r,g,b,255` into `floorBytes` at `(ty*w + tx)*4`; same for ceiling.

Then:

```
drawing.registerLightmap("rcpool_floor", w, h, self.wld.widthCells(), self.wld.heightCells(), floorBytes)
drawing.registerLightmap("rcpool_ceil",  w, h, self.wld.widthCells(), self.wld.heightCells(), ceilBytes)
```

`ambientBase` is `math.clamp(255 * ambient, 8, 30)` (unchanged from the current
`baseCh`).

### Render (in the existing per-column wall loop)

After the wall strip is drawn for a column (and also when there is no wall hit —
then the surface runs to the far clip), draw the floor and ceiling strips:

- **Floor:** visible from `yFar = wallBot` (the wall base, or the horizon if no
  wall) down to `yNear = self.viewH` (bottom of screen). Convert those screen Ys
  back to perpendicular distances by inverting `projectY(0, d)`:
  `d = (self.camZ + RcConfig.RC_EYE_Z) * self.viewH / (y - self.scy - self.camPitch)`
  (guard `y - self.scy - self.camPitch > 0.5`; clamp `d` to `RC_MAX_DIST`).
  World points `wNear = cam + ray*dNear`, `wFar = cam + ray*dFar`. Call
  `drawing.drawLightmapStrip("rcpool_floor", destX, yNear, yFar, wNearX, wNearY, wFarX, wFarY, RcConfig.RC_STRIP_W)`.
- **Ceiling:** visible from `yNear = wallTop` up to `yFar = 0` (top of screen),
  inverting `projectY(RcConfig.RC_STD_CEIL, d)` the same way. Call
  `drawLightmapStrip("rcpool_ceil", ...)`.

### Remove

`drawLightPools()` and its local `dim`s. The `poolSpread` field and
`setPoolSpread()` go too (unused). The `drawRadialGradientEllipse` calls are the
only thing removed from the render path.

## Testing

Kept small, matching the POC.

- **Transpiler-emit:** `registerLightmap` and `drawLightmapStrip` each compile
  with zero diagnostics and emit the matching `_sb.*` call — added to
  `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts` alongside the existing
  `drawRadialGradient*` tests.
- **`drawing.js` unit** (`tests/components/Runner/drawing.test.ts`):
  `registerLightmap` builds a texture from the byte array and is idempotent by
  id; a second call with the same id destroys the first; `_drawingReset`
  destroys all lightmap textures. `drawLightmapStrip` acquires a PerspectiveMesh
  with the four expected screen corners and UVs derived from `world / mapSize`.
- **Ground-lock guard**
  (`tests/lib/Basic4WebGL/integration/raycasterLightpoolPocGroundLock.test.ts`,
  rewritten): render two frames from **different camera angles** at the same
  position; capture the `drawLightmapStrip` calls with their world coordinates;
  for a fixed world point visible in both frames, assert the lightmap UV (hence
  the sampled colour) is identical between frames. This directly tests "the pool
  stays locked to the ground under rotation" — the exact failure this redesign
  fixes.
- **Smoke test**
  (`tests/lib/Basic4WebGL/integration/raycasterLightpoolPocSmoke.test.ts`):
  unchanged — still asserts the demo transpiles and `renderFrame()` runs with
  zero runtime errors.
- Full `npx vitest run` + `npx vite build` + `generatedDefsInSync` green.
- Manual: user loads the demo and confirms the pools stay put while walking,
  turning and strafing, and that perf is fine.

## Non-goals

- No change to the shared `RcRender.bas` or any other demo — the lightmap
  primitives are general engine additions but only the POC uses them for now.
- No sub-cell lighting detail beyond the `lmRes` multiplier (a flat upscale of
  the same `lightAtPoint` samples, not a smarter bake).
- No perspective-correct *ceiling* subtleties beyond mirroring the floor math.
- No docs / roadmap entries for the new primitives yet — deferred until (if) the
  lightmap approach graduates into the shared renderer, at which point it goes
  through the full six-step process.
- No dynamic lights — the lightmap is baked once and never updated.
