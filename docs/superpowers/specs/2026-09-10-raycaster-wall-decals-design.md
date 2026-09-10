# Raycaster Wall Decals — Design (v1)

**Date:** 2026-09-10
**Status:** Approved for planning
**Package:** softRaycaster (`src/lib/Basic4WebGL/defs/Rc*.bas`)

## Problem

A raycaster wall is always drawn floor→ceiling with its wall texture stretched or
tiled (`setWallTexScale`) over the whole span. There is no way to put a
*fixed-size* image on part of a wall face — a door, a wall light, a painting, a
sign, a switch. `setWallTexScale` helped tall-wall tiling but a door on a `ceil:3`
wall is still either a 3-units-tall door or a tiled one.

A **decal** is a fixed-size textured insert (with alpha) sitting flat against a
wall face. It decorates the wall; it does not replace the wall texture and it does
not carry any behaviour of its own — an interactable door still gets its logic
from a separate `door:` marker on the same cell, read by game code.

## Authoring

New `.stm` marker tag on a **wall** cell:

```
decal:<image>
```

`<image>` is a loaded asset name (same names `setWallTexture` / `tex:` accept),
e.g. `decal:door_wood.png`. The image's alpha channel is respected — transparent
pixels show the wall behind.

- **One decal per cell.** A second `decal:` token on the same cell overwrites the
  first (last-wins, consistent with `tex:`).
- The decal shows on **whichever wall face the ray hits** — all four faces of a
  pillar cell get the same decal. Per-face decals are deferred (see below).
- `decal:` on a non-wall cell is parsed and stored but never drawn (nothing to
  draw it against). No error.
- A `decal:` cell may also carry `tex:`, `door`, `light`, etc. They are
  independent.

## Geometry & texture mapping

The decal is a quad **co-planar with the wall face** — it is exactly the
"billboard that doesn't rotate with the camera". Because the raycaster already
draws walls as per-column vertical strips with a known per-column distance `d` and
horizontal face parameter `u` (0→1 across the cell face), the decal is the same
loop run once more, right after the wall strip for that column.

**Size (world units):**

- Width: **1 unit** — the decal spans the full cell face.
- Height: **`imageHeightPx / imageWidthPx`** — the image's own pixel aspect ratio.
  A 128×128 image → 1.0 units tall; a 64×128 → 2.0; a 96×64 → ~0.67.
- Anchored at the **floor**: the decal occupies world-Z `[0, decalH]`.

**Per screen column** that the ray reports as hitting a decal-carrying wall cell:

1. `d`   = `RcCast.spanDist(i)` (perpendicular distance, already computed).
2. `u`   = `RcCast.spanU(i)` (0→1 across the face, already computed).
3. `screenTop = projectY(decalH, d)`, `screenBot = projectY(0, d)`.
   `projectY` is affine in world height at fixed `d`, so screen-Y maps linearly
   onto world-Z between those two endpoints.
4. Clip the screen span to the wall's own visible span **and** the column
   occlusion window: `dTop = max(screenTop, sTop, winTop)`,
   `dBot = min(screenBot, sBot, winBot)`. If `dBot <= dTop`, draw nothing.
5. Source V window, linear in the clip:
   `vTop = (dTop - screenTop) / (screenBot - screenTop)`,
   `vBot = (dBot - screenTop) / (screenBot - screenTop)`.
   (Whole image over `[0,1]`; no vertical distortion because `decalH` came from
   the aspect ratio.)
6. Source X column: `srcX = clamp(floor(u * imageWidthPx), 0, imageWidthPx - 1)`.
   One copy of the image spans the face (no horizontal repeat).
7. `drawing.drawImageStrip(image, srcX, destX, (dTop + dBot) / 2,
   RC_STRIP_W, dBot - dTop, tint, vTop, vBot)`.
   `tint` = the same per-column light `lite` the wall strip used (decals are lit
   like the wall they sit on), packed grey via `packTint`.

Perspective is automatically correct at any viewing angle because every column
carries its own `d` and `u` — unlike a camera-facing billboard.

Draw order: wall strip first, decal strip immediately after → the decal's alpha
composites over the wall for that column. Decal cells with a diagonal wall
(`diag:`) are out of scope for v1 — treat a `diag:` + `decal:` cell as
decal-less (parse, store, skip drawing) and note it as a deferred item.

## Engine dependency

softBASIC currently has **no way to read a raw image's pixel dimensions** by name
(`sprite.width()`/`height()` read a sprite *handle*, not an image). The decal
height needs the aspect ratio, so add two general-purpose accessors to the
`assetmanager` module:

- `assetmanager.imageWidth(name)` → number (pixels)
- `assetmanager.imageHeight(name)` → number (pixels)

`assetmanager` is descriptor-generated (`src/lib/Basic4WebGL/library/descriptors/assetmanager.descriptor.ts`),
so the `.bas` is regenerated, not hand-edited. Engine side: `_sbAssets` already
holds `{ source, width, height }` per loaded image; add `imageWidth`/`imageHeight`
methods to the object returned in `src/components/Runner/engine/assets.js` that
call `this.get(name).width` / `.height`. No bootstrapper change needed
(`_sbAssets` is spread into `_sb`).

These are useful beyond the raycaster (region maths, HUD layout) so they ship as a
plain `assetmanager` feature with their own API-reference entries.

## Data model — RcWorld

Mirror the existing `wallTexArr` / `wallTexAt` pattern exactly:

- `dim decalArr(0)` — one string per cell, `""` default. Pushed in `build()`'s
  cell loop alongside `wallTexArr`.
- `applyKv` gains a `decal:` branch: `self.decalArr(idx) = v`.
- `function decalAt(col, row)` — returns `""` when out of bounds, else
  `self.decalArr(row * self.cols + col)`.
- `dim decalSeen` fast-path flag, set to 1 in the `decal:` branch, `0` in
  `build()`. `function hasDecals()` returns it. RcRender uses it to skip the
  decal check entirely on levels with no decals.

## Render — RcRender

In `renderFrame`, `RC_SPAN_WALL` branch, **after** the existing wall draw
(textured `drawWallStrip` or flat `drawStrip`):

```
if self.wld.hasDecals() = 1 then
    dtex = self.wld.decalAt(self.rc.spanCol(i), self.rc.spanRow(i))
    if string.len(dtex) > 0 and self.rc.spanSide(i) <> RcConfig.RC_SPAN_SIDE_DIAG then
        self.drawDecalStrip(destX, sTop, sBot, winTop, winBot, dtex, self.rc.spanU(i), d, lite)
    endif
endif
```

New method `drawDecalStrip(destX, wTop, wBot, winTop, winBot, image, u, d, lite)`:

- `dw = assetmanager.imageWidth(image)`, `dh = assetmanager.imageHeight(image)`.
- Guard `dw <= 0 or dh <= 0` → return 0.
- `decalH = dh / dw`.
- `screenTop = self.projectY(decalH, d)`, `screenBot = self.projectY(0, d)`.
- Clip / V-window / srcX / `drawImageStrip` per the mapping section above.
- Returns 1 if a strip was drawn (feed `self.primCount` / `surfCountLast` like
  `drawWallStrip` does).

No per-frame caching of image dimensions in v1 — `imageWidth`/`imageHeight` are
Map lookups and a decal cell spans only a few dozen columns. Caching is a listed
deferred optimisation.

## Testing

Integration test `tests/lib/Basic4WebGL/integration/raycasterWallDecals.test.ts`
(same `packageModules` + transpile + `_sb` proxy harness as
`raycasterWallTexScale.test.ts`):

1. **`decal:` parsed** — `world.decalat(col,row)` returns the image name; a cell
   without one returns `""`; `world.hasdecals()` is `1` when any cell has a
   decal, `0` otherwise.
2. **Decal strip drawn** — stub `_sb.imageWidth`/`imageHeight` to return a known
   size (e.g. 64×128 → `decalH` 2.0). Warp the camera to face a decal wall
   head-on at a known distance; assert `drawImageStrip` was called with the decal
   image, and that the strip's world span (recovered from the projected Y pair)
   is `≈ 2.0` units, floor-anchored (`screenBot` == `projectY(0, d)`).
3. **Aspect drives height** — same setup, image 128×64 → span `≈ 0.5`.
4. **No decals → no extra draws** — a level with zero `decal:` markers issues the
   same `drawImageStrip` count as before (regression guard on `hasDecals()`
   skip).
5. **Occlusion clip** — a floor step (`floor:`) in front of the decal wall raises
   `winBot`; assert the decal strip's bottom is clamped and its `srcVBot` moved
   in proportion (not left at 1.0).

Engine test in `tests/components/Runner/` (or wherever `assets` is covered):
`imageWidth`/`imageHeight` return `_sbAssets.get(name).width`/`.height`; unknown
name throws the existing "Asset not found" error.

## Deferred (own designs later — not in v1)

- **`:z` bottom-edge offset** — `decal:pic.png:1.2` to hang a picture at eye
  height instead of on the floor.
- **Width from pixels + horizontal centering** — decal narrower than the cell
  face, centred, rather than always 1 unit wide.
- **Per-face decals** — different decal on each face of a pillar cell.
- **Diagonal-wall decals** — decals on `diag:` cells.
- **`RcDecals` mutable list** — runtime add / remove / move / retexture /
  animate decals from game code (v1 is static, marker-driven only).
- **Per-frame image-dimension cache** in RcRender.

## Six-step checklist (for the plan)

1. `.bas` — `assetmanager.descriptor.ts` (+ regen), `RcWorld.bas` decal parse +
   accessor + `hasDecals`, `RcRender.bas` `drawDecalStrip` + call site.
2. Engine — `assets.js` `imageWidth`/`imageHeight`.
3. Bootstrapper — none needed.
4. Tests — `raycasterWallDecals.test.ts`, `assets` engine test,
   `generatedDefsInSync` stays green after regen.
5. Docs — `src/docs/guides/raycaster-library.md` (decals section),
   `docs/raycaster/api-reference.md` (`decal:` tag; `RcWorld.decalAt`),
   `src/docs/api-reference/assetmanager.md` + `docs/` equivalent
   (`imageWidth`/`imageHeight`).
6. Roadmap — `docs/language/library-roadmap.md` + `docs/roadmap.md`: mark wall
   decals shipped, record the five deferred items as tracked follow-ups.
