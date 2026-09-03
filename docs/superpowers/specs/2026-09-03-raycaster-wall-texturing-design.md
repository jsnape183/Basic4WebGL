# Raycaster Texturing — Walls, Floors, Ceilings — Design Spec

**Status:** approved (brainstorm 2026-09-03) — ready for implementation plan.

**Why:** the raycaster renderer is 100% flat-shaded (`drawing.drawRect` grey strips). Walls were meant to be textured since the Phase-3 spec but shipped flat and never got it. Multiple deferred niggles (the lower↔upper camera transition, portal fidelity, per-region lighting) are explicitly parked "until a textured level exists to judge them," and Phase 9 (optimisation) is premature while there's nothing textured to profile. This is the missing piece.

**Amends:** `2026-08-31-raycaster-engine-design.md` §5.2 (`drawImageStrip` for walls — now with tint + V-clip; a new `drawFloorStrip` for horizontal surfaces), §5.3 rung 3 (`drawImageStrip(tint)` — built here), §6.3 (billboard tint — falls out for free), §11 (a "texturing" milestone slotted before Phase 9). Sits after the renderer rework (interval occlusion) — textured strips clip to the interval list the same way flat ones do.

**Scope:** generic engine — `drawing.drawImageStrip` gains `tint` + `srcVTop` / `srcVBot`; new `drawing.drawFloorStrip`. `demo-src/raycaster/lib/` — `RcRender` (textured strip + surface paths, texture defaults), `RcCast` (real diagonal wall-U). New `demo-src/raycaster-p8b/` demo (textured copy of `raycaster-p3`). `RcWorld` unchanged (`wallTexArr` / `floorTexArr` / `ceilTexArr` + `tex:` / `ftex:` / `ctex:` parsing already exist).

**Brainstorm answers:** all of walls + floors + ceilings + diagonals + a default texture; floors/ceilings via **perspective-mesh quad per surface band** (option A); demo tagged `p8b`, not `p9` (9 stays optimisation).

---

## 1. Engine changes (`drawing` — descriptor-generated)

`drawing` is in `src/lib/Basic4WebGL/library/registry.ts` — its `.bas` def is generated from `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`. **Edit the descriptor, run `npm run generate:library`, never hand-edit `drawing.bas`.** The `generatedDefsInSync` test enforces this.

### 1.1 `drawImageStrip` — add `tint`, `srcVTop`, `srcVBot`

Descriptor: `params: ['imageName', 'srcX', 'destX', 'destY', 'destWidth', 'destHeight', 'tint', 'srcVTop', 'srcVBot']`, body forwards all nine to `_sb.drawImageStrip(...)`.

**Backwards compatibility:** `drawImageStrip` today takes 6 args and is called in exactly one place (`RcRender.drawActors`). softBASIC has no default params — so either (a) all callers pass 9 args (update `drawActors` too — desirable, it wants the tint), or (b) the engine treats `undefined` trailing args as `tint = 0xFFFFFF`, `srcVTop = 0`, `srcVBot = 1`. **Use (b)** in the engine (`imageName, srcX, destX, destY, destWidth, destHeight, tint = 0xffffff, srcVTop = 0, srcVBot = 1`) so the descriptor can stay flexible, AND update `drawActors` to pass a real tint (billboard lighting — §6.3, deferred since Phase 6).

Engine (`src/components/Runner/engine/drawing.js`):
- `_texFor(imageName, srcX, srcVTop, srcVBot)` → frame `Rectangle(srcX, srcVTop * base.height, 1, (srcVBot - srcVTop) * base.height)`. Cache key `imageName + ':' + srcX + ':' + srcVTop + ':' + srcVBot` (quantise the V fractions to e.g. 3 decimals so the cache doesn't explode — a strip clipped at slightly different sub-pixel offsets each frame would otherwise never hit).
- `drawImageStrip(...)`: `o.tint = tint`; everything else as now.
- `_drawingReset` already clears `_texCache`.

**Cache-growth note:** the V-window in the key means a wall seen through a moving plank edge churns cache entries. Mitigate with the quantisation above + an LRU cap (e.g. 512 entries, evict oldest) on `_texCache`. Flag for Phase 9 if it bites.

### 1.2 `drawFloorStrip` — new primitive

Descriptor: `name: 'drawFloorStrip'`, `params: ['imageName', 'destX', 'yNear', 'yFar', 'wNearX', 'wNearY', 'wFarX', 'wFarY', 'stripW', 'tint']`, body `_sb.drawFloorStrip(${p.imageName}, ${p.destX}, ${p.yNear}, ${p.yFar}, ${p.wNearX}, ${p.wNearY}, ${p.wFarX}, ${p.wFarY}, ${p.stripW}, ${p.tint})`.

Engine: one column-wide, perspective-correct textured strip for a horizontal surface band. The screen quad is `[destX ± stripW/2] × [yFar, yNear]`; the texture tiles once per world unit, sampled along the world segment `(wNearX, wNearY) → (wFarX, wFarY)`.

Implementation — a **`PIXI.PerspectiveMesh`** per strip (pooled in a new `_poolM` / `_liveM`, cleared per frame, destroyed on `_drawingReset`):
- corners = the 4 screen points of the quad.
- UVs: `PerspectiveMesh` maps the texture 0–1 across the plane; to *tile* along the world segment, set the texture's `source.wrapMode = 'repeat'` and a UV scale via `mesh.texture` frame or a `TextureMatrix` so `v` runs `0 → segmentLengthInTiles` and `u` runs `worldNearU → worldNearU + (stripW-in-world)`. **If `PerspectiveMesh` can't express a tiling sub-region cleanly** (its geometry fixes UVs to 0–1), fall back to a plain `PIXI.MeshSimple` / `Mesh` with a hand-built `MeshGeometry` (4 verts, 2 tris) carrying explicit `aUV` + a per-vertex `w` for perspective-correct interpolation, or — simplest — a lightly subdivided (`verticesX/Y = 2..4`) plane. The plan picks whichever actually renders correctly against a checkerboard test texture; the requirement is "perspective-correct tiling, no per-CPU-pixel loop."
- `o.tint = tint`.
- `stripW` is `RC_STRIP_W` (4) — narrow, so even affine UV within one strip has negligible error; perspective correctness matters most *across* the strip's depth (yNear→yFar), which the mesh's vertical subdivision + `w` handles.

Tests: `tests/components/Runner/drawing.test.ts` — `drawImageStrip` tint + V-frame; `drawFloorStrip` builds a mesh with the right corner geometry and tint, pools/reuses it, `_drawingReset` destroys it. `tests/lib/Basic4WebGL/unit/transpiler/` — the two new/changed descriptor methods emit the right `_sb.*` calls; `generatedDefsInSync` stays green after `npm run generate:library`.

Docs: `src/docs/api-reference/drawing.md` — updated `drawImageStrip` signature (note the new optional params), new `drawFloorStrip` entry (beginner-facing: "draws one column of a floor or ceiling texture, perspective-corrected").

---

## 2. `RcRender`

### 2.1 Texture defaults

New fields + setters: `setWallTexture(name)`, `setFloorTexture(name)`, `setCeilTexture(name)` (store `""` = none by default). A scene calls these in `onenter`. Per-cell `tex:` / `ftex:` / `ctex:` markers (via `wld.wallTexAt` / `floorTexAt` / `ceilTexAt`) override; empty marker → the default.

Resolve helper: `wallTexFor(col, row)` → `wld.wallTexAt(col,row)` if non-empty, else `self.defWallTex`. Same for floor/ceil.

### 2.2 Wall spans — textured strip

In the span walk, when a `RC_SPAN_WALL` / `RC_SPAN_PORTAL_WALL` is drawn:
- `tex = wallTexFor(spanCol(i), spanRow(i))` (portal walls: the upper/lower cell's own tex, or the default).
- **Untextured** (`tex = ""`): the existing flat `drawInto` → `drawStrip` → `drawRect` path, unchanged.
- **Textured:** for each visible interval `k` the wall overlaps:
  - full wall screen extent `wTop = projectY(spanHi(i), d)`, `wBot = projectY(spanLo(i), d)`.
  - clipped `cTop = max(wTop, intvTop(k))`, `cBot = min(wBot, intvBot(k))`; skip if `cBot <= cTop`.
  - `srcVTop = (cTop - wTop) / (wBot - wTop)`, `srcVBot = (cBot - wTop) / (wBot - wTop)`.
  - `srcX = math.floor(spanU(i) * texWidth)` — `texWidth` from a new `assetmanager` size query, OR a fixed `RC_TEX_SIZE` config constant (**use the constant**, default 64 — avoids a new engine query; textures are authored at that size). Wrap `srcX` into `[0, RC_TEX_SIZE)`.
  - `tint` = `rgb(255·fade·lite·sideDim)` packed to `0xRRGGBB`, where `fade` = a mild distance darkening (`clamp(1 - d/RC_MAX_DIST·k, floor, 1)` — reuse whatever the flat path's implicit distance response is, or a new `RC_TEX_FADE` curve), `lite` = the light level (walls: `sampleCell` with the existing x/y step-back + diagonal special-case, **unchanged**), `sideDim` = `1.0` x-hit / `0.8` y-hit / `0.9` diagonal.
  - `drawing.drawImageStrip(tex, srcX, self.iDestX, (cTop+cBot)/2, RC_STRIP_W, cBot-cTop, tint, srcVTop, srcVBot)`.
  - bump `surfCountLast` / the strip tally as the flat path does.
- Then `occlude` / `intvN` handling exactly as now (a full wall still clears the list; a portal wall occludes its band).

A small helper `drawTexturedInto(tex, srcX, wTop, wBot, tint)` mirroring `drawInto` (iterate visible intervals, clip, derive srcV, blit) keeps the span walk readable.

### 2.3 Horizontal surfaces — textured via `drawFloorStrip`

`drawSurfaceInto(hh, dNear, dFar, kind, lite)` gains a texture branch:
- `tex` = `floorTexFor(...)` or `ceilTexFor(...)` by whether `kind` is a floor or ceiling shade (`RC_SHADE_FLOOR_TOP` / `_PIT_FLOOR` → floor; `_CEIL_UNDER` / `_SOFFIT` → ceiling; the portal ceil/floor planes take the appropriate default).
- Untextured → the existing flat `drawInto` + `occlude`.
- Textured, per visible interval:
  - screen `yNear = projectY(hh, dNear)`, `yFar = projectY(hh, dFar)` (ordered), clipped to `[intvTop(k), intvBot(k)]`.
  - world near/far points: `wNear = (camX + fRayX·dNear, camY + fRayY·dNear)`, `wFar = (camX + fRayX·dFar, camY + fRayY·dFar)` (`fRayX`/`fRayY` set per column by the rework).
  - `tint` = `rgb(255·fade·sampleAt(midpoint))` — bilinear light, as the rework's flat surface path already samples.
  - `drawing.drawFloorStrip(tex, iDestX, yNearClipped, yFarClipped, wNearX, wNearY, wFarX, wFarY, RC_STRIP_W, tint)`.
  - **When the clip cut the band**, the world near/far must be re-derived for the clipped screen range (inverse-project `yNearClipped` back to a distance, then `cam + rayDir·d`) so the texture doesn't shift. Inverse of `projectY`: `d = (camZ + RC_EYE_Z - hh) · viewH / (yClip - horizon)` (guard the divide). Helper `distAtScreenY(hh, y)`.
- Then `occlude(yTop, yBot)` its band, as now.

### 2.4 Diagonal wall-U

`RcCast.cast()` currently passes `u = 0` for a diagonal hit (line ~204). Compute the real along-chord U:
- World hit point: `hx = ox + dx·dh`, `hy = oy + dy·dh` (the DDA parameter `dh` *is* the perpendicular distance, and `world = origin + rayDir·param` — the same identity the rework's bilinear light sampling relies on).
- Canonical chord start corner: `nw` / `se` share the anti-diagonal chord NE↔SW → start at NE `(cx+1, cy)`. `ne` / `sw` share the main-diagonal chord NW↔SE → start at NW `(cx, cy)`.
- `u = math.clamp(math.sqrt((hx - startX)² + (hy - startY)²) / 1.41421356, 0, 1)` (√2 = unit-cell chord length).
- Pass `u` instead of `0` in the `addSpan(RC_SPAN_WALL, dh, …)` call. `RcCast` header comment updated.

### 2.5 `RC_TEX_SIZE`

New `RcConfig` constant, default `64`. `RC_TEX_FADE` optional (a distance-darkening scalar) — or fold the fade into the existing shade math. The plan decides whether the textured path needs its own fade curve or can reuse the flat path's `g * lightLevel` intuition with `g = 255`.

---

## 3. Assets & demo

### 3.1 Placeholder textures

Six 64×64 PNGs, checked into `demo-src/raycaster-p8b/assets/`: `rc_tex_brick.png`, `rc_tex_concrete.png`, `rc_tex_panel.png`, `rc_tex_rock.png` (walls), `rc_tex_floor.png`, `rc_tex_ceil.png`. Simple procedurally-generated patterns (brick courses, noise, panel seams) — a small `scripts/` node one-off or hand-drawn; they only need to read as "a texture" and tile cleanly (edges match).

### 3.2 `demo-src/raycaster-p8b/`

- Copy `raycaster-p3`'s scene (`RoomViewScene.bas` or whatever it's named) → `TextureScene.bas`, and the 8 lib files (byte-identical, `raycasterDemoLibSync` covers `raycaster-p\d+` — **confirm the regex matches `p8b`**; if `/^raycaster-p\d+$/` it won't — widen it to `/^raycaster-p\d+[a-z]?$/` in `raycasterDemoLibSync` / `raycasterDemoTranspile` / `raycasterDemoSmoke` / the phase-dir globs, or name the dir `raycaster-p9`-style… no, the user said `p8b`. Widen the regexes.).
- `assets/*.stm`: p3's room, retagged — `tex:rc_tex_brick.png` on some walls, `tex:rc_tex_panel.png` on others, `ftex:rc_tex_floor.png` / `ctex:rc_tex_ceil.png` on a few cells; the rest rely on the scene defaults.
- `TextureScene.onenter`: `self.ren.setWallTexture("rc_tex_concrete.png")`, `setFloorTexture(...)`, `setCeilTexture(...)`. `runProbes()`.
- `Main.bas` bootstrap.
- `devDemoRegistry.ts` entry `raycaster-p8b-textures` → `RaycasterP8bTextures`; presence test; `demos.cy.ts` `DEV_DEMOS` entry.
- `npm run build:demo -- demo-src/raycaster-p8b RaycasterP8bTextures`.

### 3.3 Probes / tests

- `raycasterDemoProbes` P8b case: a cast down a known wall carries the expected `spanTex` (the retagged texture name); a diagonal cast carries a `spanU` strictly between 0 and 1 (not the old hard-0).
- `raycasterDemoSmoke`: a new `test.each` — render a stub world with a wall texture set, spy on `drawImageStrip` vs `drawRect`, assert the wall column blits (`drawImageStrip` called with the right `srcX` band and a non-white tint) and the untextured control still uses `drawRect`. A `drawFloorStrip` smoke assertion for a textured floor.
- `raycasterIntervals` / `raycasterLights` / `raycasterUpperWorld` / `raycasterDiagWorld` — unaffected, stay green.

---

## 4. Out of scope

- **Performance tuning** — `PerspectiveMesh`-per-strip and the `_texCache` growth are Phase 9's to measure. This ships correct-but-unprofiled.
- Texture atlas (each texture is its own preloaded image — spec §5.2). Mip-maps / anisotropic filtering. Animated, scrolling, or emissive textures. Per-texel lighting / normal maps.
- Upper-region surface textures (`upFloorTex` / `upCeilTex` / `upWallTex`) — still flat; their own deferred item.
- Sky texture (`sky`-flagged cells) — still the gradient rect.

---

## 5. Risk

The `drawFloorStrip` mesh path is new ground in `drawing.js` (nothing else uses PIXI meshes). If `PerspectiveMesh` tiling proves intractable, the fallbacks in §1.2 (hand-built `Mesh` geometry, or a subdivided plane) are progressively simpler; worst case a per-strip 2-triangle affine quad, which for a 4px column is visually close enough and is what option C would have been — so there's a floor on the downside. Walls (§2.2) are low-risk — they reuse the proven `drawImageStrip` sprite path with two new sprite properties.
