# Wolfenstein-Style Raycaster

A pure softBASIC tech demo. No images needed — everything is drawn with rectangles. WASD to walk, A/D to turn.

---

## How it works

A raycaster fires one vertical ray per screen column and asks: *how far away did this ray hit a wall?* A nearby wall fills a tall slice of the screen; a distant one a short slice. That height difference creates the illusion of perspective depth.

The stepping algorithm is **DDA** (Digital Differential Analyser) — it moves through grid cells one at a time, always advancing along whichever axis brings the ray to the next grid line soonest.

Rotation is a 2×2 matrix multiply on the direction vector and the camera plane each frame. Movement checks the candidate new cell before committing to it, giving simple but solid wall collision.

---

## The map

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

## Code — paste into a single Main.bas

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

' ─── update ──────────────────────────────────────────────────────────────────

function onupdate(delta)
    dim ms
    dim rs
    dim nx
    dim ny
    dim oldDirX
    dim oldPlaneX
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

    ' ── input ────────────────────────────────────────────────────────────────

    ms = delta * 0.003
    rs = delta * 0.002

    ' W — walk forward
    if input.getKeyDown(87) then
        nx = posX + dirX * ms
        ny = posY + dirY * ms
        if worldMap(math.floor(ny) * MAPW + math.floor(posX)) = 0 then
            posY = ny
        endif
        if worldMap(math.floor(posY) * MAPW + math.floor(nx)) = 0 then
            posX = nx
        endif
    endif

    ' S — walk backward
    if input.getKeyDown(83) then
        nx = posX - dirX * ms
        ny = posY - dirY * ms
        if worldMap(math.floor(ny) * MAPW + math.floor(posX)) = 0 then
            posY = ny
        endif
        if worldMap(math.floor(posY) * MAPW + math.floor(nx)) = 0 then
            posX = nx
        endif
    endif

    ' D — turn right
    if input.getKeyDown(68) then
        oldDirX  = dirX
        dirX     = dirX * math.cos(rs) - dirY * math.sin(rs)
        dirY     = oldDirX * math.sin(rs) + dirY * math.cos(rs)
        oldPlaneX = planeX
        planeX   = planeX * math.cos(rs) - planeY * math.sin(rs)
        planeY   = oldPlaneX * math.sin(rs) + planeY * math.cos(rs)
    endif

    ' A — turn left
    if input.getKeyDown(65) then
        oldDirX  = dirX
        dirX     = dirX * math.cos(rs) + dirY * math.sin(rs)
        dirY     = -oldDirX * math.sin(rs) + dirY * math.cos(rs)
        oldPlaneX = planeX
        planeX   = planeX * math.cos(rs) + planeY * math.sin(rs)
        planeY   = -oldPlaneX * math.sin(rs) + planeY * math.cos(rs)
    endif

    ' ── render ───────────────────────────────────────────────────────────────

    drawing.clear()

    ' ceiling
    pen.setFillColor(30, 30, 60)
    drawing.drawRect(400, 150, 800, 300)

    ' floor
    pen.setFillColor(50, 40, 20)
    drawing.drawRect(400, 450, 800, 300)

    ' cast one ray per column
    for col = 0 to RAYS - 1

        camX = 2 * col / RAYS - 1
        rdx  = dirX + planeX * camX
        rdy  = dirY + planeY * camX

        mx = math.floor(posX)
        my = math.floor(posY)

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

        if rdx < 0 then
            stepx = -1
            sdx   = (posX - mx) * ddx
        else
            stepx = 1
            sdx   = (mx + 1 - posX) * ddx
        endif

        if rdy < 0 then
            stepy = -1
            sdy   = (posY - my) * ddy
        else
            stepy = 1
            sdy   = (my + 1 - posY) * ddy
        endif

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

        if side = 0 then
            pwd = sdx - ddx
        else
            pwd = sdy - ddy
        endif

        if pwd > 0.1 then
            lh = SH / pwd
        else
            lh = SH
        endif
        if lh > SH then
            lh = SH
        endif

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

## Controls

| Key | Action |
|-----|--------|
| W   | Walk forward |
| S   | Walk backward |
| A   | Turn left |
| D   | Turn right |

---

## How movement works

**Walking** adds a fraction of the direction vector to the player position each frame. The fraction is `delta * 0.003`, so movement scales with frame time regardless of frame rate. Before committing the move, the new X and Y positions are checked independently — this lets the player slide along walls instead of stopping dead on contact.

**Turning** rotates the direction vector and the camera plane together using a 2×2 rotation matrix. The plane must rotate with the direction or the field of view distorts. The rotation angle each frame is `delta * 0.002` radians (~115°/sec).

**Side shading** halves the colour on faces hit by an east-west travelling ray, giving instant depth with no extra geometry.
