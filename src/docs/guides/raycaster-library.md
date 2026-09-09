# Building a Raycaster (softBASIC library)

A first-person raycaster you can drop into a project as a set of `.bas` modules.
This guide is built up phase by phase alongside the library itself.

## RcWorld — the map

`RcWorld` turns a tagged tilemap into a world you can query for wall positions and
floor/ceiling heights.

Draw your level in the Tilemap Editor:

- A **`walls` tile layer** — paint any non-zero tile where a wall should be.
- A **marker layer** — drop markers and give each a text tag to add detail:
  - `floor:2` raises the cell's floor; `floor:-3` makes a pit
  - `ceil:4` lowers the ceiling; `ceil:8` makes an atrium
  - `tex:rc_brick.png` sets the wall texture for that cell (full asset name; see "Wall textures" below)
  - `fcol:7a4f2a` / `ccol:2a3550` set that cell's flat floor / ceiling colour (six hex digits; see "Floor and ceiling colour")
  - `door`, `lift`, `water`, `sky` mark special cells
  - `light:` marks a cell as lit (Phase 1 records this as a simple on/off flag; proper light levels come with the lighting phase)
  - `diag:nw` / `diag:ne` / `diag:se` / `diag:sw` makes the cell a 45° diagonal wall — the named corner is solid, the opposite half is open floor. Leave the `walls` tile at `0` for that cell (the diagonal *is* the wall). Line several up along one direction for a canted wall; put one in each corner of a square room for an octagon.

Build the world once, then read from it:

```bas
dim level as tilemapset
dim wld as RcWorld

function onenter()
  self.level = new tilemapset("level1.stm")
  self.wld = new RcWorld(self.level, "walls")

  if self.wld.wallAt(3, 4) > 0 then
    print "wall at 3,4"
  endif
  print "floor height at 5,5 = " + string.str(self.wld.floorHeightAt(5, 5))
endfunction
```

The second argument to `RcWorld` is the name of your wall tile layer, exactly as
you named it in the Tilemap Editor.

### RcWorld accessors

Every accessor takes a cell column and row as whole numbers, starting at `0`.

| Call | Returns |
|---|---|
| `wld.widthCells()` / `wld.heightCells()` | map size in cells |
| `wld.wallAt(col, row)` | `0` open, `>0` the wall tile's id (out of bounds = `1`) |
| `wld.floorHeightAt(col, row)` | floor height (`0` standard, negative = pit; out of bounds = `0`) |
| `wld.ceilHeightAt(col, row)` | ceiling height (`1` standard; out of bounds = `1`) |
| `wld.flagsAt(col, row)` | bitset: `1` door, `2` lift, `4` water, `8` sky (out of bounds = `0`) |
| `wld.wallTexAt(col, row)` | the cell's `tex:` texture name, or `""` |
| `wld.floorColAt(col, row)` / `wld.ceilColAt(col, row)` | the cell's `fcol:` / `ccol:` colour as a packed `r*65536 + g*256 + b`, or `-1` if unset (out of bounds = `-1`) |
| `wld.diagAt(col, row)` | `0` not diagonal, or `RcConfig.RC_DIAG_NW` / `_NE` / `_SE` / `_SW` (`1`–`4`) — the solid corner of a 45° diagonal cell (out of bounds = `0`) |

Any cell outside the map counts as a solid wall, so `wallAt` returns `1` there.
The other accessors still return a sensible standard value for out-of-bounds
cells, but you would normally check `wallAt` first.

### Phase 1 limits

`light:` currently just marks a cell (a proper light *level* comes with the
lighting phase). Keep related tags for one cell — `ceil:` and `fcol:`, say — on
the same marker.

### Diagonal walls

A cell tagged `diag:nw`, `diag:ne`, `diag:se`, or `diag:sw` is a 45° wall: the
named corner is a solid triangle, the opposite triangle is open floor you can
walk on. The `walls` tile for that cell stays `0` — the marker *is* the wall.

To cut a square room into an octagon, tag one corner cell each way:

```
' markers on the four corner cells of a room:
'   diag:nw   top-left        diag:ne   top-right
'   diag:sw   bottom-left     diag:se   bottom-right
```

Line several same-direction tags up along a diagonal for a continuous canted
wall. `RcCast` and `RcMover` both understand the 45° face — rays and line-of-sight
stop at it, and a mover slides along it. A diagonal face takes the wall texture
(a real slice of it, along the 45° chord). A diagonal cell can't also carry a
`floor:` / `ceil:` step.

### Multi-tier levels

Stairs, raised platforms, sunken arenas and raised walkways are all built from
`floor:` / `ceil:` height variation on ordinary cells — no special layer. Chain
`floor:` steps no taller than `RcConfig.RC_STEP_UP` apart and `RcMover` climbs
them; raise `ceil:` over a platform so the walker keeps headroom. The dev demo
`raycaster-p8-tiers` is a worked example. Genuine room-over-room (a walkable
surface with open walkable space beneath the *same* cell) is not supported.

For a level that climbs into a *large* separate area — a staircase up to a whole
second floor, say — switch scenes at the top of the stairs rather than modelling
both floors in one `.stm`. Each scene stays a single flat space the renderer
handles cheaply, and the transition is a normal `scenemanager.switch`.

How large can one area get before you must split it? See the Phase 9 benchmark
report (`docs/raycaster-benchmark-report.md` in the repository) for the measured
area-size limits, and the `raycaster-p9-bench` demo to profile your own map
(`T` toggles the floor field against the on-screen frame time).

## RcCast — casting rays

`RcCast` walks a straight line across the map from a point and collects every
surface it crosses — walls, and the steps where a floor rises/falls or a ceiling
rises/falls. Unlike a classic raycaster it does **not** stop at the first wall,
so a later phase can draw what's visible past a low wall or across a pit.

```bas
dim rc as RcCast

function onenter()
  self.rc = new RcCast()
  ' cast east from the middle of cell (1,1)
  self.rc.cast(self.wld, 1.5, 1.5, 1, 0)

  dim i
  for i = 0 to self.rc.spanCount() - 1
    print "span " + string.str(i) + " kind " + string.str(self.rc.spanKind(i)) + " at " + string.str(self.rc.spanDist(i))
  next i
endfunction
```

### Span kinds (from `RcConfig`, referenced prefixed)

| Constant | Meaning |
|---|---|
| `RcConfig.RC_SPAN_WALL` | a full-height wall — the ray stops here |
| `RcConfig.RC_SPAN_FLOORSTEP` | the floor height changed between two cells |
| `RcConfig.RC_SPAN_CEILSTEP` | the ceiling height changed between two cells |

### Reading a span

| Call | Returns |
|---|---|
| `rc.spanCount()` | how many spans the last `cast` produced |
| `rc.spanKind(i)` | one of the `RcConfig.RC_SPAN_*` constants |
| `rc.spanDist(i)` | distance from the ray origin (no fisheye distortion) |
| `rc.spanLo(i)` / `rc.spanHi(i)` | the low and high world heights the surface covers |
| `rc.spanCol(i)` / `rc.spanRow(i)` | the cell that produced the span |
| `rc.spanSide(i)` | `0` if the ray crossed an x-gridline into this cell, `1` for a y-gridline |
| `rc.spanU(i)` | horizontal texture position `0`–`1` across a wall (`0` for steps) |
| `rc.spanTex(i)` | the texture id for that surface, or `""` |

### Line of sight

`rc.los(world, x, y, dx, dy)` marches the same line and returns the distance to
the first wall, or `-1` if nothing is hit within range. Use it for "can this
enemy see the player" checks. It does not disturb the spans from the last `cast`.

### Phase 2 limits

The ray stops at the first wall (no "see-through" windows yet). Diagonal-wall
tiles *are* handled (see below): the ray tests the 45° chord, and `los` stops at
it too. A wall span from a diagonal has `spanSide(i)` equal to
`RcConfig.RC_SPAN_SIDE_DIAG` and a real `spanU(i)` measured along the 45° chord.
The direction `(dx, dy)` doesn't need to be a unit vector — distances come out in
world units regardless.

## RcRender — drawing the view

`RcRender` turns an `RcWorld` into a first-person picture. It owns the camera, so
you set the camera on it directly (the normal `camera` module does nothing in a
raycaster scene).

```bas
dim ren as RcRender

function onenter()
  self.ren = new RcRender(self.wld)
  self.ren.setCamera(2, 4, 0, 0)   ' x, y, angle (radians), pitch
endfunction

function onupdate(delta)
  self.ren.renderFrame()
endfunction
```

| Call | Does |
|---|---|
| `new RcRender(world)` | create a renderer for a loaded `RcWorld` |
| `ren.setCamera(x, y, angle, pitch)` | move/aim the camera; `angle` in radians, `pitch` is a small up/down look (pixels), clamped |
| `ren.setFov(degrees)` | horizontal field of view (default ~66°) |
| `ren.renderFrame()` | draw one frame — call every `onupdate` |
| `ren.projectY(height, distance)` | screen Y for a world height at a distance (mostly internal) |
| `ren.columnCount()` | how many vertical strips wide the view is |
| `ren.setWallTexture(name)` | default wall texture for the whole level (see Wall textures below) |
| `ren.setFloorField(1)` | draw the standard floor & ceiling with the per-pixel floorcaster — real textures and ground-locked light (see Floor and ceiling below) |
| `ren.setFloorTexture(name)` / `ren.setCeilTexture(name)` | world-tiled texture for the floor field |
| `ren.setGradientShading(1)` | smooth near→far light gradient on floor/ceiling colour runs, instead of stepped bands |
| `ren.setFlatFill(0)` | force the accurate per-column floor/ceiling path (needed under a short-radius light; already automatic once the map has any `floor:`/`ceil:` height variation) |

`RcRender` also fills the flat, horizontal surfaces you see wherever a floor or
ceiling changes height — the top of a step, the floor of a pit, the underside of
a raised ceiling, and the soffit under a dropped ceiling.

### Wall textures

Give the renderer a default wall texture and the whole level is textured:

```bas
function onenter()
  self.ren = new RcRender(self.wld)
  self.ren.setWallTexture("rc_brick.png")
endfunction
```

Override per cell with a `tex:` marker tag
(`{ "row": 2, "col": 5, "tag": "tex:rc_metal.png" }`). Texture names are the full
asset filename. Author them at **64×64** and make sure they tile (the pattern
wraps at the edges) — they repeat once per world unit. Walls are lit per column;
diagonal-wall tiles get a real slice of the wall texture. A wall with no texture
(no default, no tag) falls back to the flat grey shading.

### Floor and ceiling colour

By default floors and ceilings are flat-shaded (with `setFloorField(1)` they are
textured — see below). Colour an individual tile with an `fcol:RRGGBB` (floor) or
`ccol:RRGGBB` (ceiling) marker tag — six hex digits, like a web colour:

```json
{ "row": 3, "col": 4, "tag": "fcol:7a4f2a ccol:2a3550" }
```

The colour is scaled by the tile's light level, the same as the default grey.
A tile with no `fcol:`/`ccol:` keeps the default shading.

### Floor and ceiling textures — the floor field

Turn on the per-pixel floor renderer and the **standard** floor (height 0) and
ceiling (`RC_STD_CEIL`) are drawn by a true floorcaster — every screen pixel is
resolved to the exact world spot it looks at, then textured and lit:

```bas
function onenter()
  self.ren = new RcRender(self.wld)
  self.ren.bindLights(self.lights)
  self.ren.setFloorField(1)
  self.ren.setFloorTexture("rc_floor.png")   ' one tile per world unit
  self.ren.setCeilTexture("rc_ceil.png")     ' "" keeps a built-in checker
endfunction
```

Because the sample is by world position, the texture recedes in correct
perspective and pools of light stay painted on the ground as you turn. Override
the texture per cell with `ftex:<image>` / `ctex:<image>` markers; `fcol:`/`ccol:`
flat colours render through the same path, so a scene can mix textured, coloured
and plain floor with no seam. **Raised and lowered surfaces are textured too** —
a `floor:` step-top, a raised platform, a pit floor, a lowered soffit all get
the floorcaster. Only the thin riser faces between heights stay flat-shaded.

The floor field bakes its lighting **once**, from the scene's static lights, so
it is for static lighting — a moving torch won't light it. Default off; every
scene that doesn't call `setFloorField(1)` is unchanged.

### Phase 3 limits

You can see across a pit to the wall beyond; the pit floor and step surfaces are
filled in. Diagonal-wall tiles are textured with a real slice of the wall
texture. Occlusion is a single per-column window — a raised floor clamps it from
below, a dropped ceiling from above, and farther geometry shows through a pit or
a raised ceiling. Floor and ceiling light is smoothly blended between cells;
walls and sprites are lit per-cell. The standard floor and ceiling can be
textured with `setFloorField(1)` (above); stepped/pit surfaces stay flat-shaded.
No texture atlas, no animated/scrolling textures, and the sky is still a plain
gradient.

## RcMover — walking around

`RcMover` is one movable body. Feed it intent each frame, call `step`, and it
resolves the move against the world — sliding along walls, stepping up small
ledges, falling into pits, and jumping. Bind it to the renderer so the view
follows it.

```basic
dim me as RcMover

function onenter()
  self.me = new RcMover(self.wld, 2, 4, 0.3, 0.6)   ' world, x, y, radius, body height
  self.ren.bindCamera(self.me)
endfunction

function onupdate(delta)
  self.me.move(input.axis("back", "fwd") * 2.5, 0)
  self.me.turn(input.axis("tl", "tr") * 2.0 * (delta / 1000))
  if input.pressed("jump") then
    self.me.jump()
  endif
  self.me.step(delta)
  self.ren.renderFrame()
endfunction
```

| Call | Does |
|---|---|
| `new RcMover(world, x, y, radius, bodyHeight)` | a body standing on the floor at `(x, y)` |
| `me.move(forward, strafe)` | set this frame's move speed (units/sec); resolved by `step` |
| `me.turn(deltaAngle)` / `me.look(deltaPitch)` | rotate / tilt the view |
| `me.jump()` | jump if on the ground |
| `me.step(delta)` | resolve one frame of movement + gravity — call every `onupdate` |
| `me.x()` / `me.y()` / `me.z()` | current position (`z` is feet height) |
| `me.angle()` / `me.pitch()` / `me.onGround()` | facing, tilt, whether standing on solid ground |

### Phase 4 limits

Movers don't collide with each other yet and lifts don't move. A mover climbs
`floor:` steps up to `RC_STEP_UP` tall and falls into pits under gravity. A mover
slides smoothly along a 45° diagonal wall,
but at very high speeds (well past `RC_MOVE_SPEED`) it can clip through the thin
tip of the solid wedge. Tune movement with `RcConfig.RC_MOVE_SPEED`,
`RC_STEP_UP`, `RC_GRAVITY`, `RC_JUMP_VEL`.

## RcLights — light and shadow

`RcLights` gives a raycaster scene a light level per cell: a base ambient
everywhere, plus lights whose glow is blocked by walls. Bind it to the renderer
and every strip is shaded by the light where it stands.

```basic
dim lights as RcLights

function onenter()
  self.lights = new RcLights(self.wld)
  self.ren.bindLights(self.lights)
  self.torch = self.lights.addPoint(4, 4, 0.5, 0.9, 6)  ' x, y, z, brightness, reach (cells)
endfunction

function onupdate(delta)
  self.lights.moveLight(self.torch, self.me.x(), self.me.y())  ' flashlight follows the player
  self.lights.update()
  self.ren.renderFrame()
endfunction
```

Any cell you mark `light` in the Tilemap Editor becomes a **static** light, baked
once when the world loads. A game with static lights in every room and no
player-carried torch reads well: you walk dark corridors into fixed pools of
light. Give a marker a height with `light:1.8` (bare `light` sits at 0.85, just
under the ceiling).

| Call | Does |
|---|---|
| `new RcLights(world)` | a light grid for a loaded `RcWorld` (bakes the `light` cells) |
| `lights.setAmbient(level)` | base light everywhere, `0`–`1` |
| `lights.addPoint(x, y, z, brightness, reachCells)` | add a movable light; returns a handle. Falls off **linearly** by default (even ramp over the whole reach) |
| `lights.setLightFalloff(handle, kind)` | `RcConfig.RC_FALLOFF_LINEAR` (default) or `RC_FALLOFF_QUADRATIC` — quadratic concentrates brightness near the light and drops away faster, a small bright pool rather than a wide gradual gradient (closer to a real torch/lamp) |
| `lights.moveLight(handle, x, y)` / `setLightIntensity(handle, b)` / `setLightRadius(handle, reachCells)` / `removeLight(handle)` | change a light |
| `lights.update()` | recompute the moving lights — call every `onupdate`, before `renderFrame` |
| `lights.setHeightAware(1)` | sample lights by true 3D distance — a floor spot and a ceiling spot under the same fixture now differ (needed for tall rooms and the floor field) |
| `lights.sampleCell(col, row)` | the total light at a cell, `0`–`1` |
| `lights.sampleAt(x, y)` / `sampleAtZ(x, y, z)` | light at an arbitrary world point (2D / 3D) |
| `RcRender.bindLights(lights)` | shade the view by this grid |

### Phase 5 limits

Light is a single brightness value — no colour yet. Only point lights (no spot
cones). Moving lights are fully recomputed every frame (no caching). At most
`RcConfig.RC_LIGHT_CAP` moving lights contribute at once. Per light you can set
the falloff curve (`setLightFalloff`, linear or quadratic), intensity and radius.
The floor field (`RcRender.setFloorField`) bakes only the **static** lights.

## RcActors — billboards and ray hits

`RcActors` is a pool of flat, always-facing-you sprites — an enemy, a barrel, a
pickup — projected into the 3D view and clipped column by column against the
walls in front of them, so a billboard behind a pillar or below a ledge is hidden
correctly. The same object also answers ray questions: line of sight, "what's
nearest", and a hitscan for shooting.

Bind it to the renderer once, then add a billboard for each thing in the world:

```basic
dim actors as RcActors

function onenter()
  self.actors = new RcActors(self.wld)
  self.ren.bindActors(self.actors)

  ' an enemy sprite: image, x, y, feet height z, and the source frame size
  dim ghoul as RcActor
  self.ghoul = self.actors.add("ghoul.png", 8, 5, 0, 64, 64)
endfunction

function onupdate(delta)
  self.ren.renderFrame()   ' draws the world, then the billboards on top

  if input.pressed("fire") then
    dim aimX
    dim aimY
    aimX = math.cos(self.me.angle())
    aimY = math.sin(self.me.angle())
    dim hit as RcActor
    self.hit = self.actors.hitscan(self.me.x(), self.me.y(), aimX, aimY, 20)
    if self.hit <> 0 then
      self.hit.setTint(255, 60, 60)   ' flag the actor we shot
      self.score = self.score + 10
    endif
  endif
endfunction
```

`add` gives you back an `RcActor`, or `0` if the pool is already full.
`frameW` / `frameH` are the sprite's source size in pixels — one frame of a
horizontal strip.

| Call | Does |
|---|---|
| `new RcActors(world)` | a billboard pool for a loaded `RcWorld` |
| `actors.add(image, x, y, z, frameW, frameH)` | claim a billboard; returns an `RcActor`, or `0` if the pool is full |
| `actors.remove(actor)` | free a billboard back to the pool |
| `actors.activeCount()` | how many billboards are in use |
| `actors.poolSize()` | the fixed pool capacity (`RcConfig.RC_ACTOR_POOL`) |
| `actors.actorAt(i)` | the pooled `RcActor` at slot `i` (`0` to `poolSize() - 1`) |
| `actors.near(x, y, r)` | the nearest visible actor within radius `r` of `(x, y)`, or `0` |
| `actors.los(x, y, dx, dy)` | distance to the first wall along `(dx, dy)`, or `-1` if none in range |
| `actors.hitscan(x, y, dx, dy, range)` | fire a ray; returns the actor it hits, or `0` for a wall hit or a miss |

`(dx, dy)` is a direction — `hitscan` normalises it for you, so `math.cos` /
`math.sin` of an angle is fine.

### Reading a hitscan

`hitscan` returns the hit `RcActor` (or `0`), and leaves the full result on the
`RcActors` for the calling frame:

| Call | Returns |
|---|---|
| `actors.hitKind()` | `RcConfig.RC_HIT_NONE`, `RcConfig.RC_HIT_WALL`, or `RcConfig.RC_HIT_ACTOR` |
| `actors.hitDist()` | distance from the ray origin to the hit, or `-1` |
| `actors.hitX()` / `actors.hitY()` | world position of the hit |
| `actors.hitActor()` | the hit `RcActor`, same as the return value (`0` on a wall hit or miss) |

### One billboard (`RcActor`)

An `RcActor` is plain data — you never `new` one, `actors.add` hands them out.

| Call | Does |
|---|---|
| `actor.setPosition(x, y)` | move the billboard on the floor plane |
| `actor.setHeight(z)` | set its feet height (raise it onto a ledge) |
| `actor.setFrame(i)` | pick frame `i` of the source strip |
| `actor.setTint(r, g, b)` | set a per-actor RGB tint (`0`–`255` each) — reserved for future use, not drawn (billboards are already tinted automatically by the light grid; see limits) |
| `actor.setVisible(v)` | `1` to show, `0` to hide |
| `actor.image()` | its image name |
| `actor.frameW()` / `actor.frameH()` | its source frame size in pixels |
| `actor.x()` / `actor.y()` / `actor.z()` | its world position and feet height |
| `actor.frame()` | its current frame index |
| `actor.visible()` | `1` if shown, `0` if hidden |
| `actor.distanceTo(px, py)` | straight-line distance from the actor to `(px, py)` |

### Placing a reticle

`RcRender` can tell you where a world point lands on screen, so you can draw a
marker over the thing you're aiming at:

| Call | Returns |
|---|---|
| `RcRender.bindActors(actors)` | draw this pool's billboards each `renderFrame()` |
| `ren.worldToScreenX(x, y)` | the screen pixel X of world point `(x, y)`, or `-1` if it is behind the camera |

### Phase 6 limits

Every billboard is tinted automatically from the light grid at its cell —
there's no separate call to make that happen. `actor.setTint()` is a reserved
per-actor override that isn't drawn yet. A billboard is a single horizontal
frame strip — no vertical frames, and no 8-direction sprites that change with
your viewing angle. Actors don't collide with each other. The `hitscan` actor
test is a fixed 0.4-cell corridor either side of the ray, not a check against each
billboard's projected width.

## Performance — how big can one area be?

Room **size** is free — a bigger map costs nothing extra to store or query.
What costs frame time is how much geometry is **on screen at once**: wall
columns, floor/ceiling strips, and visible billboards. Two rooms of the same
footprint cost differently depending on how much of that footprint can be seen
from a single spot, so an open hall is more expensive than a maze of tight
corridors even at the same cell count.

`RcRender.primitiveCount()` returns how many drawable primitives the last
`renderFrame()` call produced — use it while building a level to see where the
cost is coming from. There's a hard cliff, not a gradual slope: frame cost
stays flat up to a few thousand primitives, then collapses abruptly past it
(the underlying cause was a display-list re-ordering cost in the generic
`drawing` engine module, fixed once for every game, not just the raycaster —
see `docs/raycaster-benchmark-report.md` for the numbers). Stay comfortably
under that ceiling rather than designing right up against it.

If a level needs a genuinely large continuous space — a second floor, an open
arena bigger than a single sightline should reasonably show — prefer **scene
switching** (a loading trigger at the top of a staircase, through a door) over
one enormous `RcWorld`. See "Multi-tier levels" above for the same guidance
applied to vertical space specifically.

### Phase 9 limits

The standard floor and ceiling are texture-mapped via `setFloorField(1)` (a
per-pixel floorcaster, drawn engine-side in two calls a frame); stepped and pit
surfaces are still flat-shaded colour (`fcol:` / `ccol:`). The per-column
occlusion window, light-grid recompute, and span walk all run in plain
softBASIC, so there's headroom left in principle, but no further optimisation
rung has shipped past the Phase 9 painter's-fill pass. A wall-batching approach
(rendering all wall columns as one mesh instead of one draw call per column) was
prototyped and rejected —
see `docs/raycaster-mesh-spike-findings.md` — it only ever covered walls, not
floors/ceilings/actors, and traded no geometry or lighting benefit for a
hand-maintained shader.
