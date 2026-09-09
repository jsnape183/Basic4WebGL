# Raycaster library — internal API reference

**Internal doc.** Not under `src/docs/`, not in `src/docs/manifest.ts`, not served
at `/docs`. It exists for agents and maintainers building games/demos on the
softBASIC raycaster library. The player-facing how-to is
`src/docs/guides/raycaster-library.md`.

**Source of truth:** `demo-src/raycaster/lib/*.bas`. Every `demo-src/raycaster-p*/`
directory ships a byte-identical copy (buildDemo is non-recursive) — the copies
are enforced by `tests/lib/Basic4WebGL/integration/raycasterDemoLibSync.test.ts`.
Edit the canonical files, then
`for d in $(find demo-src -maxdepth 2 -name '<file>.bas' -not -path '*/raycaster/lib/*'); do cp demo-src/raycaster/lib/<file>.bas "$d"; done`.
Regenerate this doc by re-reading the `.bas` files.

Classes are used with `self.x = new RcFoo(...)` and `self.x.method(...)` (softBASIC
`self.` is mandatory inside classes). Module functions keep their prefix
(`math.floor`, `string.len`, `array.arrLength`). Arrays are `dim a(N)`, indexed
`a(i)`.

---

## `.stm` marker vocabulary

Markers live in the tilemap's `tags` layer as `{ "row": R, "col": C, "tag": "..." }`.
A tag string is space-separated tokens; `key:value` tokens are settings, bare
tokens are flags. `RcWorld` parses them in its constructor.

### Flags (bare token)

| Flag | Effect |
|---|---|
| `light` | this cell is a static light (baked once at load). Pair with `light:<height>` to set its Z. |
| `door` / `lift` / `water` / `sky` | recorded in the cell's flag bitset (`RcWorld.flagsAt`, bits 1/2/4/8). The library does **not** act on these — read them in game code. |

### Settings (`key:value`)

| Setting | Value | Effect |
|---|---|---|
| `tex:<image>` | asset filename | wall texture for this cell (overrides `RcRender.setWallTexture`) |
| `ftex:<image>` | asset filename | floor texture for this cell (floor-field only; overrides `setFloorTexture`) |
| `ctex:<image>` | asset filename | ceiling texture for this cell (floor-field only; overrides `setCeilTexture`) |
| `fcol:RRGGBB` | 6 hex digits | flat floor colour for this cell |
| `ccol:RRGGBB` | 6 hex digits | flat ceiling colour for this cell |
| `floor:<n>` | world units | floor height of this cell (0 = standard; >0 a step/dais; <0 a pit) |
| `ceil:<n>` | world units | ceiling height of this cell (`RC_STD_CEIL` = 1.0 standard; lower = soffit/tunnel) |
| `light:<n>` | world units | marks the cell a static light **and** sets its height (bare `light` uses `RC_LIGHT_DEFAULT_Z` = 0.85) |
| `diag:<nw\|ne\|se\|sw>` | corner | 45° diagonal wall — named corner solid, opposite half walkable. Leave the `walls` tile at 0. |

Textures must tile seamlessly and are authored at `RC_TEX_SIZE` (64×64); they
repeat once per world unit. `fcol:`/`ccol:` and `ftex:`/`ctex:` render through
the per-column strip path by default, and through the floor field when
`RcRender.setFloorField(1)` is set (texture beats colour beats scene default
beats the procedural checker, per cell).

---

## RcConfig

Constants, referenced fully-qualified: `RcConfig.RC_MOVE_SPEED`.

| Constant | Value | Meaning |
|---|---|---|
| `RC_MAX_DIST` | 32 | ray cutoff distance (cells) |
| `RC_MAX_MARCH_ITERS` | 512 | DDA safety cap |
| `RC_STRIP_W` | 4 | screen column width (px) |
| `RC_EYE_Z` | 0.5 | camera eye height above the body's feet |
| `RC_STD_CEIL` | 1.0 | standard ceiling height |
| `RC_MAX_PITCH` | 220 | look up/down clamp (px) |
| `RC_STEP_UP` | 0.35 | max auto-step-up height |
| `RC_GRAVITY` / `RC_JUMP_VEL` | 14.0 / 5.0 | mover physics |
| `RC_MOVE_SPEED` / `RC_TURN_SPEED` / `RC_LOOK_SPEED` | 2.6 / 2.4 / 400.0 | suggested input scaling |
| `RC_MAX_STEP_DT` | 0.1 | mover sub-steps longer frames |
| `RC_AMBIENT` | 0.12 | default ambient light |
| `RC_LIGHT_RANGE` | 6 | suggested light reach (cells) |
| `RC_LIGHT_CAP` | 4 | max dynamic lights contributing at once |
| `RC_STATIC_INTENSITY` | 0.9 | baked static-light brightness |
| `RC_LIGHT_DEFAULT_Z` | 0.85 | height of a bare `light` marker |
| `RC_FALLOFF_LINEAR` / `RC_FALLOFF_QUADRATIC` | 0 / 1 | `setLightFalloff` kinds |
| `RC_ACTOR_POOL` | 32 | billboard pool size |
| `RC_ACTOR_HEIGHT` | 1.0 | billboard world height |
| `RC_HITSCAN_RANGE` | 24.0 | default hitscan reach |
| `RC_HIT_NONE` / `RC_HIT_WALL` / `RC_HIT_ACTOR` | 0 / 1 / 2 | `RcActors.hitKind()` values |
| `RC_SPAN_WALL` / `RC_SPAN_FLOORSTEP` / `RC_SPAN_CEILSTEP` | 0 / 1 / 2 | `RcCast.spanKind()` values |
| `RC_SPAN_SIDE_DIAG` | 2 | `RcCast.spanSide()` value for a diagonal face |
| `RC_DIAG_NW/NE/SE/SW` | 1/2/3/4 | `RcWorld.diagAt()` values |
| `RC_TEX_SIZE` | 64 | authored texture size |
| `RC_FLAT_FILL` | 1 | default for `RcRender.setFlatFill` |
| `RC_SURF_LIGHT_STEP` / `RC_SURF_SEG_MAX` | 0.12 / 6 | floor/ceiling light-band subdivision |
| `RC_SHADE_*` | 4–7 | internal surface-kind shade indices |

---

## RcWorld — the parsed map

`new RcWorld(tilemapset, wallsLayerName)` — reads the tilemap's wall layer plus
every marker into flat per-cell arrays. All accessors are `(col, row)` and
return a safe default out of bounds.

| Method | Returns |
|---|---|
| `inBounds(col, row)` | 1 / 0 |
| `wallAt(col, row)` | wall tile id (0 = open) |
| `floorHeightAt(col, row)` / `ceilHeightAt(col, row)` | world units |
| `diagAt(col, row)` | `RC_DIAG_*` or 0 |
| `flagsAt(col, row)` | flag bitset (door=1, lift=2, water=4, sky=8) |
| `wallTexAt` / `floorTexAt` / `ceilTexAt` `(col, row)` | image name or `""` |
| `floorColAt(col, row)` / `ceilColAt(col, row)` | packed `r*65536+g*256+b`, or -1 |
| `hasSurfaceColor()` | 1 if any cell carries `fcol:`/`ccol:` (fast-path flag) |
| `hasHeightVariation()` | 1 if any cell carries a non-standard `floor:`/`ceil:` height. RcRender skips its flat floor/ceiling fill when set (a step would otherwise read as self-lit against the flat fill). |
| `lightAt(col, row)` | 1 if a static-light cell |
| `lightHeightAt(col, row)` | that light's Z |
| `widthCells()` / `heightCells()` | grid dimensions |

Internal: `build`, `applyTag`, `applyFlag`, `applyKv`, `setFlag`, `parseHex`.

---

## RcCast — ray marching

`new RcCast()` — reusable; one instance per renderer/query owner.

| Method | Does |
|---|---|
| `cast(world, ox, oy, dx, dy)` | march a ray from `(ox,oy)` along `(dx,dy)`; fills an ordered near→far span list. `(dx,dy)` is the camera-plane ray vector (its forward component is 1, so a span's `dist` is perpendicular distance and the hit point is `origin + dir*dist`). |
| `los(world, ox, oy, dx, dy)` | distance to the first opaque wall along a **unit** direction, or -1 if none within `RC_MAX_DIST` |

Span readers (`i` = 0..`spanCount()-1`, near→far):

| Reader | Value |
|---|---|
| `spanCount()` | number of spans from the last `cast()` |
| `spanKind(i)` | `RC_SPAN_WALL` / `RC_SPAN_FLOORSTEP` / `RC_SPAN_CEILSTEP` |
| `spanDist(i)` | perpendicular distance |
| `spanLo(i)` / `spanHi(i)` | world height range of the span's face |
| `spanCol(i)` / `spanRow(i)` | the cell the span belongs to |
| `spanSide(i)` | 0 = x-face, 1 = y-face, `RC_SPAN_SIDE_DIAG` = diagonal |
| `spanU(i)` | texture U (0–1) across the face |
| `spanTex(i)` | resolved texture name or `""` |

A `WALL` span is the last one (opaque). `FLOORSTEP`/`CEILSTEP` spans are the
riser faces of height changes the ray crossed before the wall.

---

## RcMover — the player body

`new RcMover(world, x, y, radius, bodyHeight)` — circle-vs-wall body with
step-up, gravity and jump. Set intent each frame, then `step(dt)`.

| Method | Does |
|---|---|
| `move(fwd, strafe)` | set this frame's move intent (world units/sec); replaced each frame |
| `turn(dAngle)` / `look(dPitch)` | apply immediately, accumulate (radians / pixels) |
| `jump()` | jump if on the ground |
| `warpTo(x, y, angle)` | teleport + re-ground |
| `step(dt)` | integrate one frame (`dt` = `onupdate`'s `delta`, ms); sub-steps at `RC_MAX_STEP_DT` |
| `x()` / `y()` / `z()` | position + feet height |
| `angle()` / `pitch()` | facing (radians) / look offset (px) |
| `onGround()` | 1 / 0 |

`RcRender.bindCamera(mover)` makes the renderer read the camera from the mover
each frame (instead of `setCamera`).

---

## RcLights — the light grid

`new RcLights(world)` — per-cell light: ambient + baked static lights + up to
`RC_LIGHT_CAP` wall-occluded dynamic point lights. `RcRender.bindLights(lights)`
to shade the view.

| Method | Does |
|---|---|
| `setAmbient(level)` / `ambientLevel()` | base light everywhere (0–1) |
| `addPoint(x, y, z, intensity, radiusCells)` | add a dynamic light; returns a handle. Linear falloff by default. |
| `moveLight(h, x, y)` / `setLightIntensity(h, i)` / `setLightRadius(h, r)` / `removeLight(h)` | mutate a dynamic light |
| `setLightFalloff(h, kind)` | `RC_FALLOFF_LINEAR` (even ramp) or `RC_FALLOFF_QUADRATIC` (bright core, fast drop) |
| `setHeightAware(v)` | 1 = sample lights by true 3D distance (`sampleAtZ` becomes active; floor vs ceiling at the same x,y differ). Off = 2D. |
| `update()` | recompute dynamic lights — call every frame, before `renderFrame()` |
| `sampleCell(col, row)` | total light at a cell centre (0–1); wall cells return their brightest open neighbour |
| `sampleAt(worldX, worldY)` | bilinear light at a world point |
| `sampleAtZ(worldX, worldY, worldZ)` | 3D light at a world point; == `sampleAt` when `setHeightAware(0)` |
| `peakLevel()` | brightest cell in the grid (used to size shading detail) |
| `addGrid(col, row, v)` | add a manual light value to one cell |

Static lights come from `light` / `light:<h>` markers, baked in the constructor.

Internal: `bakeStatic`, `splat`, `splatCell`, `contribAtZ`, `refreshPeak`,
`brightestOpenNeighbor`.

---

## RcRender — the first-person view

`new RcRender(world)` — owns the camera (the `camera` module is inert in a
raycast scene). Call `renderFrame()` every `onupdate`.

### Setup

| Method | Does |
|---|---|
| `bindCamera(mover)` | read the camera from an `RcMover` each frame |
| `setCamera(x, y, angle, pitch)` | set the camera directly (alternative to `bindCamera`) |
| `setFov(degrees)` | horizontal FOV (default ~66°) |
| `bindLights(lights)` | shade the view by an `RcLights` grid |
| `bindActors(actors)` | draw an `RcActors` billboard pool, depth-clipped |
| `renderFrame()` | draw one frame |

### Walls

| Method | Does |
|---|---|
| `setWallTexture(name)` | default wall texture for the level; `tex:` markers override per cell |

### Floor & ceiling

| Method | Does |
|---|---|
| `setFlatFill(v)` | 1 (default) = paint the standard floor/ceiling once at the camera cell's brightness; 0 = force the accurate per-column path (needed under short-radius lights). Auto-disabled when `RcWorld.hasHeightVariation()` is set — a step would otherwise glow against the flat fill. |
| `setGradientShading(v)` | 1 = one gradient shape per floor/ceiling colour run (near→far light), instead of stepped bands |
| `setFloorField(v)` | 1 = draw **every** horizontal floor/ceiling surface — standard planes *and* every `floor:`/`ceil:` height — with the per-pixel floorcaster: one textured pass per distinct height, masked to the cells at that height (near-over-far), world-space texture × baked static lightmap. Only the risers (thin vertical faces between heights) and walls stay on the per-column strip path. Lightmap is 2D-baked once on frame 1 and shared across all passes. Default 0. |
| `setFloorTexture(name)` / `setCeilTexture(name)` | world-tiled texture (one tile per world unit) for the floor field; `""` = procedural checker. `ftex:`/`ctex:` markers override per cell. |
| `setFloorFieldColors(fr,fg,fb, cr,cg,cb)` | base tint for the floor-field checker (floor / ceiling), when no texture |

### Queries

| Method | Returns |
|---|---|
| `columnCount()` | screen columns (view width / `RC_STRIP_W`) |
| `depthAt(col)` | perpendicular wall distance for a column (0 out of range) |
| `worldToScreenX(wx, wy)` | screen X of a world point on the current basis, or -1 behind the camera |
| `projectY(height, distance)` | screen Y of a world height at a distance |
| `surfaceCount()` / `primitiveCount()` | draw counts from the last frame (profiling) |

Internal: `bakeFloorField`, `bakeFieldTiles`, `emitFloorField`, `drawActors`,
`drawStrip`, `drawFill`, `drawSurface`, `drawFlatSeg`, `drawWallStrip`,
`drawGradientBand`, `emitFlatBand`, `shadeToPacked`, `floorBandClean`,
`ceilBandClean`, `surfaceRunEnd`, `depthAtScreenY`, `wallTexFor`, `packTint`.

---

## RcActors / RcActor — billboards + ray queries

`new RcActors(world)` — fixed pool of `RC_ACTOR_POOL` billboards + a shared
`RcCast` for ray queries. `add`/`remove` flip a visible flag, never allocate.

| RcActors method | Does |
|---|---|
| `add(imageName, x, y, z, frameW, frameH)` | show a billboard; returns an `RcActor` (or 0 if the pool is full). `frameW`×`frameH` = one horizontal frame of the sprite strip. |
| `remove(actor)` | hide it, return it to the pool |
| `activeCount()` / `poolSize()` / `actorAt(i)` | pool introspection |
| `near(x, y, r)` | nearest visible actor within `r`, or 0 |
| `los(x, y, dx, dy)` | distance to the first wall along a unit dir, or -1 |
| `hitscan(x, y, dx, dy, rng)` | nearest actor or wall the ray hits within `rng`; fills the hit fields below |
| `hitKind()` / `hitDist()` / `hitX()` / `hitY()` / `hitActor()` | last hitscan result (`hitKind` = `RC_HIT_NONE`/`WALL`/`ACTOR`) |

| RcActor method | Does |
|---|---|
| `setPosition(x, y)` / `setHeight(z)` | move it |
| `setFrame(i)` | select a strip frame |
| `setVisible(v)` | show/hide |
| `setTint(r, g, b)` | stored but **not applied** — `RcRender.drawActors` tints every billboard from the light grid at its cell automatically |
| `x()` / `y()` / `z()` / `frame()` / `image()` / `frameW()` / `frameH()` / `visible()` | readers |
| `distanceTo(px, py)` | 2D distance |

Billboards are gated on depth only (column-by-column against the wall-depth
buffer). No per-actor collision, no vertical framing.

---

## Engine primitives the library uses

These are standard softBASIC library calls (documented in
`src/docs/api-reference/`), listed here for the ones the raycaster leans on
directly:

- `drawing.drawRect` / `drawImageStrip` / `drawPlaneField` / `registerLightmap` /
  `registerFieldTiles` / `drawVGradientRect` / `clear` — the renderer's output.
  `drawPlaneField` is the per-pixel floorcaster; `registerLightmap` /
  `registerFieldTiles` feed it a baked light grid and a per-cell texture/colour
  grid. See `src/docs/api-reference/drawing.md`.
- `pen.setFillColor` / `setLineWidth` — style for `drawing.*`.
- `stage.width()` / `stage.height()` — the view size the renderer reads once.
- `time.now()` — ms since game start. `world.fps()` — current frame rate.
  (Used by the bench demo's HUD.)
- `input.bind` / `input.axis` / `input.pressed` — scenes wire movement/look.
- `tilemapset` — `new tilemapset("map.stm")`, passed to `RcWorld`.

---

## Adding a feature

Follow the six-step process in `CLAUDE.md` ("Adding a new language feature or
library module"). For the raycaster specifically: edit the canonical
`demo-src/raycaster/lib/*.bas`, sync to all `raycaster-p*` copies, add/extend a
test under `tests/lib/Basic4WebGL/integration/raycaster*.test.ts`, rebuild the
affected demo exports (`npm run build:demo -- demo-src/<dir> <Slug>`), update
`src/docs/guides/raycaster-library.md` and this file, and run
`npx vitest run` + `npx vite build`. New engine primitives also need their
`drawing.descriptor.ts` entry + `npm run generate:library`.
