# Wolfenstein-Style Raycaster

A pure softBASIC tech demo. No images needed — everything is drawn with rectangles. WASD to walk, A/D to turn.

Create a project with five files: `WorldMap.bas`, `Player.bas`, `Renderer.bas`, `Minimap.bas`, and `Main.bas`.

---

## How it works

A raycaster fires one vertical ray per screen column. For each column it asks: *how far away did this ray hit a wall?* A nearby wall fills a tall slice; a distant one a short slice. That height difference creates the illusion of depth.

The stepping algorithm is **DDA** (Digital Differential Analyser). Rotation is a 2×2 matrix multiply on the direction vector and camera plane each frame. Movement checks the candidate cell before committing, giving wall-sliding collision.

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

## WorldMap.bas

Owns the map data. All other classes access it through `getCell(row, col)`.

```bas
Class

dim data(64)
dim width

function build()
    self.width = 8
    dim i
    for i = 0 to 7
        self.data(i) = 1
        self.data(56 + i) = 1
        self.data(i * 8) = 1
        self.data(i * 8 + 7) = 1
    next i
    self.data(18) = 1
    self.data(26) = 1
    self.data(44) = 1
    self.data(52) = 1
    self.data(21) = 2
    self.data(29) = 2
endfunction

function getCell(r, c)
    return self.data(r * self.width + c)
endfunction

EndClass
```

---

## Player.bas

Owns position, direction, and camera plane. `handleInput` reads keys and updates the player each frame, using the map for collision.

```bas
Class

dim x
dim y
dim dirX
dim dirY
dim planeX
dim planeY
dim moveSpeed
dim rotSpeed

function init()
    self.x         = 1.5
    self.y         = 4.5
    self.dirX      = 1.0
    self.dirY      = 0.0
    self.planeX    = 0.0
    self.planeY    = 0.66
    self.moveSpeed = 0.1
    self.rotSpeed  = 0.07
endfunction

function handleInput(theMap)
    dim nx
    dim ny
    dim oldDirX
    dim oldPlaneX
    dim rs

    rs = self.rotSpeed

    ' W — walk forward
    if input.getKeyDown(87) then
        nx = self.x + self.dirX * self.moveSpeed
        ny = self.y + self.dirY * self.moveSpeed
        if theMap.getCell(math.floor(ny), math.floor(self.x)) = 0 then
            self.y = ny
        endif
        if theMap.getCell(math.floor(self.y), math.floor(nx)) = 0 then
            self.x = nx
        endif
    endif

    ' S — walk backward
    if input.getKeyDown(83) then
        nx = self.x - self.dirX * self.moveSpeed
        ny = self.y - self.dirY * self.moveSpeed
        if theMap.getCell(math.floor(ny), math.floor(self.x)) = 0 then
            self.y = ny
        endif
        if theMap.getCell(math.floor(self.y), math.floor(nx)) = 0 then
            self.x = nx
        endif
    endif

    ' D — turn right
    if input.getKeyDown(68) then
        oldDirX    = self.dirX
        self.dirX  = self.dirX * math.cos(rs) - self.dirY * math.sin(rs)
        self.dirY  = oldDirX * math.sin(rs) + self.dirY * math.cos(rs)
        oldPlaneX  = self.planeX
        self.planeX = self.planeX * math.cos(rs) - self.planeY * math.sin(rs)
        self.planeY = oldPlaneX * math.sin(rs) + self.planeY * math.cos(rs)
    endif

    ' A — turn left
    if input.getKeyDown(65) then
        oldDirX    = self.dirX
        self.dirX  = self.dirX * math.cos(rs) + self.dirY * math.sin(rs)
        self.dirY  = -oldDirX * math.sin(rs) + self.dirY * math.cos(rs)
        oldPlaneX  = self.planeX
        self.planeX = self.planeX * math.cos(rs) + self.planeY * math.sin(rs)
        self.planeY = -oldPlaneX * math.sin(rs) + self.planeY * math.cos(rs)
    endif
endfunction

EndClass
```

---

## Renderer.bas

All DDA raycasting logic. Takes a player and map each frame, draws ceiling, floor, and all 200 wall strips.

```bas
Class

dim rays
dim strip
dim screenH
dim screenCY

function init()
    self.rays    = 200
    self.strip   = 4
    self.screenH  = 600
    self.screenCY = 300
endfunction

function render(player, theMap)
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

    pen.setFillColor(30, 30, 60)
    drawing.drawRect(400, 150, 800, 300)

    pen.setFillColor(50, 40, 20)
    drawing.drawRect(400, 450, 800, 300)

    for col = 0 to self.rays - 1

        camX = 2 * col / self.rays - 1
        rdx  = player.dirX + player.planeX * camX
        rdy  = player.dirY + player.planeY * camX

        mx = math.floor(player.x)
        my = math.floor(player.y)

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
            sdx   = (player.x - mx) * ddx
        else
            stepx = 1
            sdx   = (mx + 1 - player.x) * ddx
        endif

        if rdy < 0 then
            stepy = -1
            sdy   = (player.y - my) * ddy
        else
            stepy = 1
            sdy   = (my + 1 - player.y) * ddy
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
                if theMap.getCell(my, mx) > 0 then
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
            lh = self.screenH / pwd
        else
            lh = self.screenH
        endif
        if lh > self.screenH then
            lh = self.screenH
        endif

        wt = theMap.getCell(my, mx)
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
        px = col * self.strip + self.strip / 2
        drawing.drawRect(px, self.screenCY, self.strip, lh)

    next col
endfunction

EndClass
```

---

## Minimap.bas

Draws the overhead view in the corner. Reads player position and direction, reads map cells via `getCell`.

```bas
Class

dim cellSize
dim offsetX
dim offsetY

function init()
    self.cellSize = 8
    self.offsetX  = 10
    self.offsetY  = 10
endfunction

function draw(player, theMap)
    dim mr
    dim mc
    dim cx
    dim cy
    dim wt
    dim px
    dim py
    dim cs
    dim mapPx

    cs    = self.cellSize
    mapPx = theMap.width * cs

    pen.setFillColor(10, 10, 10)
    drawing.drawRect(self.offsetX + mapPx / 2, self.offsetY + mapPx / 2, mapPx, mapPx)

    for mr = 0 to theMap.width - 1
        for mc = 0 to theMap.width - 1
            wt = theMap.getCell(mr, mc)
            if wt > 0 then
                cx = self.offsetX + mc * cs + cs / 2
                cy = self.offsetY + mr * cs + cs / 2
                if wt = 1 then
                    pen.setFillColor(160, 60, 60)
                else
                    pen.setFillColor(60, 60, 180)
                endif
                drawing.drawRect(cx, cy, cs - 1, cs - 1)
            endif
        next mc
    next mr

    px = self.offsetX + player.x * cs
    py = self.offsetY + player.y * cs
    pen.setFillColor(255, 220, 0)
    drawing.drawRect(px, py, 4, 4)

    pen.setLineColor(255, 220, 0)
    pen.setLineWidth(1)
    drawing.drawLine(px, py, player.dirX * 10, player.dirY * 10)
    pen.setLineWidth(0)
endfunction

EndClass
```

---

## Main.bas

Setup and lifecycle only — no rendering logic.

```bas
dim theMap
dim player
dim renderer
dim minimap

function onenter()
    pen.setLineWidth(0)
    world.setBackground(0, 0, 0)

    theMap = new WorldMap()
    theMap.build()

    player = new Player()
    player.init()

    renderer = new Renderer()
    renderer.init()

    minimap = new Minimap()
    minimap.init()
endfunction

function onupdate(delta)
    player.handleInput(theMap)
    drawing.clear()
    renderer.render(player, theMap)
    minimap.draw(player, theMap)
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
