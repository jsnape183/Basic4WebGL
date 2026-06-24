# 16. Wolfenstein-Style Raycaster

This is a pure softBASIC tech demo. We are going to build a working 3D raycaster — the same technique that powered Wolfenstein 3D in 1992. No images are needed; everything is drawn with rectangles.

By the end you will have a first-person view of a small 8×8 map with two different wall types rendered at the correct perspective height.

> **Part 1 of 2.** This tutorial covers the static rendered view. Part 2 adds WASD movement and turning so you can walk around the map.

---

## How a raycaster works

A raycaster does not trace every pixel — it traces one vertical slice of the screen per column of pixels. For each column it fires a ray from the player's position into the map and asks: *how far away did this ray hit a wall?*

A nearby wall covers a tall slice of the screen. A distant wall covers a short slice. That height difference creates the illusion of perspective depth.

The algorithm used here is called **DDA** (Digital Differential Analyser). It steps through grid cells one at a time, always choosing the axis that takes the smallest step to the next grid line. This makes it fast and exact.

---

## What you will build

An 8×8 map with brick-red type-1 walls and deep-blue type-2 walls. Walls lit from the side are shown at half brightness, creating simple but effective shading.

```
# = red wall     @ = blue wall     . = open floor
 
# # # # # # # #
# . . . . . . #
# . # . . @ . #
# . # . . @ . #
# . . . . . . #   ← player starts here looking east
# . . . # . . #
# . . . # . . #
# # # # # # # #
```

---

## Create the project

Create a new project in softBASIC with a single file called `Main.bas`. Paste the code below.

---

## The code

```bas
' ─── globals ────────────────────────────────────────────────────────────────
dim worldMap(64)

dim posX
dim posY
dim dirX
dim dirY
dim planeX
dim planeY

dim MAPW
dim STRIP
dim RAYS
dim SH
dim SCY

' ─── map ─────────────────────────────────────────────────────────────────────

function buildMap()
    dim i

    ' border
    for i = 0 to 7
        worldMap(i) = 1
        worldMap(56 + i) = 1
        worldMap(i * 8) = 1
        worldMap(i * 8 + 7) = 1
    next i

    ' interior type-1 walls (red)
    worldMap(18) = 1
    worldMap(26) = 1
    worldMap(44) = 1
    worldMap(52) = 1

    ' interior type-2 walls (blue)
    worldMap(21) = 2
    worldMap(29) = 2
endfunction

' ─── setup ───────────────────────────────────────────────────────────────────

function onenter()
    MAPW  = 8
    STRIP = 4
    RAYS  = 200
    SH    = 600
    SCY   = 300

    posX   = 1.5
    posY   = 4.5
    dirX   = 1.0
    dirY   = 0.0
    planeX = 0.0
    planeY = 0.66

    pen.setLineWidth(0)
    world.setBackground(0, 0, 0)
    buildMap()
endfunction

' ─── render ──────────────────────────────────────────────────────────────────

function onupdate(delta)
    dim col
    dim camX
    dim rdx
    dim rdy
    dim mx
    dim my
    dim ddx
    dim ddy
    dim stepx
    dim stepy
    dim sdx
    dim sdy
    dim hit
    dim side
    dim ddaStep
    dim pwd
    dim lh
    dim wt
    dim r
    dim g
    dim b
    dim px

    drawing.clear()

    ' ceiling
    pen.setFillColor(30, 30, 60)
    drawing.drawRect(400, 150, 800, 300)

    ' floor
    pen.setFillColor(50, 40, 20)
    drawing.drawRect(400, 450, 800, 300)

    ' cast one ray per column
    for col = 0 to RAYS - 1

        ' camera-space x: -1 (left edge) to +1 (right edge)
        camX = 2 * col / RAYS - 1

        ' ray direction in world space
        rdx = dirX + planeX * camX
        rdy = dirY + planeY * camX

        ' map cell the player is standing in
        mx = math.floor(posX)
        my = math.floor(posY)

        ' distance the ray travels to cross one grid unit in each axis
        if math.abs(rdx) < 0.0001 then
            ddx = 1000000
        else
            ddx = math.abs(1 / rdx)
        endif
        if math.abs(rdy) < 0.0001 then
            ddy = 1000000
        else
            ddy = math.abs(1 / rdy)
        endif

        ' step direction and distance to first grid crossing
        if rdx < 0 then
            stepx = -1
            sdx = (posX - mx) * ddx
        else
            stepx = 1
            sdx = (mx + 1 - posX) * ddx
        endif

        if rdy < 0 then
            stepy = -1
            sdy = (posY - my) * ddy
        else
            stepy = 1
            sdy = (my + 1 - posY) * ddy
        endif

        ' DDA — step to next grid line until a wall is hit
        hit  = 0
        side = 0
        for ddaStep = 0 to 19
            if hit = 0 then
                if sdx < sdy then
                    sdx  = sdx + ddx
                    mx   = mx + stepx
                    side = 0
                else
                    sdy  = sdy + ddy
                    my   = my + stepy
                    side = 1
                endif
                if worldMap(my * MAPW + mx) > 0 then
                    hit = 1
                endif
            endif
        next ddaStep

        ' perpendicular distance to avoid fisheye distortion
        if side = 0 then
            pwd = sdx - ddx
        else
            pwd = sdy - ddy
        endif

        ' height of the wall strip on screen
        if pwd > 0.1 then
            lh = SH / pwd
        else
            lh = SH
        endif
        if lh > SH then
            lh = SH
        endif

        ' wall colour by type
        wt = worldMap(my * MAPW + mx)
        if wt = 1 then
            r = 180
            g = 50
            b = 50
        else
            r = 50
            g = 50
            b = 200
        endif

        ' side faces are darker — simple directional shading
        if side = 1 then
            r = math.floor(r / 2)
            g = math.floor(g / 2)
            b = math.floor(b / 2)
        endif

        pen.setFillColor(r, g, b)
        px = col * STRIP + STRIP / 2
        drawing.drawRect(px, SCY, STRIP, lh)

    next col
endfunction
```

---

## How the numbers map to the code

| Constant | Value | What it does |
|----------|-------|--------------|
| `STRIP`  | 4     | Width in pixels of each vertical wall strip |
| `RAYS`   | 200   | Number of rays cast (800 ÷ 4) |
| `SH`     | 600   | Screen height in pixels |
| `SCY`    | 300   | Vertical centre of the screen |
| `planeY` | 0.66  | Half-width of the camera plane — controls field of view (~66°) |

### Why `planeY = 0.66`?

The camera plane is a vector perpendicular to the ray direction. Its length controls how wide the field of view is. A value of 0.66 gives roughly 66 degrees — wide enough to feel natural, narrow enough to keep the perspective correct.

### Why perpendicular distance instead of Euclidean?

Using straight-line distance from the player to the wall creates a "fisheye" effect — walls curve at the edges. Perpendicular distance (measured along the viewing plane, not the ray) corrects this and gives straight walls.

### The shading

`side = 0` means the ray crossed a vertical grid line (hitting a wall face that points east or west). `side = 1` means it crossed a horizontal grid line (wall face pointing north or south). Halving the colour on `side = 1` makes perpendicular walls read as distinct from parallel ones, adding depth with no extra work.

---

## Map index formula

The map is a flat 1D array of 64 values. Row `r`, column `c` is at index `r * 8 + c`.

The interior wall indices used:

| Index | Row | Col | Type |
|-------|-----|-----|------|
| 18    | 2   | 2   | 1 (red)  |
| 26    | 3   | 2   | 1 (red)  |
| 44    | 5   | 4   | 1 (red)  |
| 52    | 6   | 4   | 1 (red)  |
| 21    | 2   | 5   | 2 (blue) |
| 29    | 3   | 5   | 2 (blue) |

---

## What to expect

Run the program and you will see:

- A dark blue ceiling and dark brown floor
- Red walls ahead (the east border) rendered at the correct receding height
- Blue wall pillars visible to the upper-right
- The corner walls creating a sense of a room

The view is static in Part 1. Part 2 will add WASD controls to walk and turn.
