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
