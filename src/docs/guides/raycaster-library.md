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
  - `tex:concrete`, `ftex:grating`, `ctex:pipes` set surface textures
  - `door`, `lift`, `water`, `sky` mark special cells
  - `upper:vent` gives the cell a second space above it
  - `light:` marks a cell as lit (Phase 1 records this as a simple on/off flag; proper light levels come with the lighting phase)

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
| `wld.hasUpperAt(col, row)` | `1` if the cell has a space above it, otherwise `0` |
| `wld.wallTexAt(col, row)` | the cell's `tex:` texture name, or `""` |

Any cell outside the map counts as a solid wall, so `wallAt` returns `1` there.
The other accessors still return a sensible standard value for out-of-bounds
cells, but you would normally check `wallAt` first.

### Phase 1 limits

`light:` currently just marks a cell (a proper light *level* comes with the
lighting phase). Upper regions get a fixed height and no textures yet. Keep
`ceil:` and `upper:` tags on the same marker.

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

The ray stops at the first wall (no "see-through" windows yet), ignores rooms
stacked above a cell, and treats diagonal-wall tiles as empty. The direction
`(dx, dy)` doesn't need to be a unit vector — distances come out in world units
regardless.

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

### Phase 3 limits

Everything is flat-shaded — no wall textures yet. You can see across a pit to the
wall beyond, but the inside of the pit isn't drawn specially. Rooms stacked above
a cell and angled walls come in later phases.

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

Movers don't collide with each other yet, lifts don't move, and rooms stacked
above a cell aren't handled. Tune movement with `RcConfig.RC_MOVE_SPEED`,
`RC_STEP_UP`, `RC_GRAVITY`, `RC_JUMP_VEL`.
