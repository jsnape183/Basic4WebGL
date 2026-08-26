# Wolfenstein-Style Raycaster

A single-file softBASIC tech demo: textured walls, a chasing enemy with hit detection, a HUD weapon with a particle muzzle flash, hit sparks, a death burst, player health, and a game-over screen. WASD to move, spacebar to fire.

---

## How it works

A raycaster fires one ray per screen column from the player's position outward into the map. For each column it asks: *how far away did this ray hit a wall?* A nearby wall fills a tall strip; a distant wall fills a short one. That height difference creates the illusion of depth.

The stepping algorithm is **DDA** (Digital Differential Analyser) — it steps from grid cell to grid cell without wasting time on empty space. Wall textures are sampled one pixel column at a time using `drawing.drawImageStrip`.

The enemy is a **billboard sprite**: its position in world space is projected onto the screen using a camera-plane transform. A **z-buffer** records each wall's distance per column, so the enemy is only drawn where it is closer to the camera than the wall behind it.

Firing, landing a hit, and killing the enemy all trigger an `Emitter` burst — the same particle module used by Coins Platformer, Bullet Hell Shooter, and Dungeon Explorer, but wired up differently here: this demo has no `world`/`camera` at all, so every emitter is added via `hud.add()` instead of `world.add()`, and positioned using the same projected screen coordinates the enemy billboard itself already computes rather than world-space map coordinates. See [HUD layering](#hud-layering) below for why.

---

## Required assets

Upload six PNG files to your project's asset library before running:

| Filename | What it is |
|---|---|
| `wall.png` | 64×64 tileable wall texture |
| `enemy.png` | 64×64 enemy idle/walk sprite |
| `enemy_hit.png` | 64×64 enemy hit-flash frame |
| `enemy_dead.png` | 64×64 enemy death frame |
| `gun.png` | Weapon sprite for the HUD |
| `particle.png` | Small square sprite used by every `Emitter` — muzzle flash, enemy hit spark, enemy death burst |

---

## Project setup

Create a single file called `Main.bas` and paste the code below.

---

## Controls

| Key | Action |
|---|---|
| W | Walk forward |
| S | Walk backward |
| A | Turn left |
| D | Turn right |
| Space | Fire |

---

## Main.bas

```bas
' === Wolfenstein-Style Raycaster ===

' Screen
dim STRIP = 4
dim RAYS = 200
dim SW = 800
dim SH = 600
dim SCY = 300

' Texture sizes
dim TEXW = 64
dim ENIW = 64

' Weapon
dim weaponSprite as Sprite
dim flashTimer = 4

' weaponSprite is a plain Sprite, not an animatedsprite -- its transform
' is its top-left corner, not its centre (confirmed live: a centre-relative
' offset here put the flash up in the ceiling, nowhere near the gun). The
' muzzle opening sits at roughly (122, 36) in the underlying 256x256
' gun.png, found by locating the dark pixel cluster at the tip of the
' barrel -- these are that point's offset from the sprite's own top-left,
' so muzzleFlashEmitter can be positioned relative to weaponSprite's own
' transform rather than a second, independent hardcoded screen coordinate
' that has to be kept in sync with it by hand.
dim muzzleOffsetX = 122
dim muzzleOffsetY = 36

' Particles -- added to the HUD layer, not the world. castRays() calls
' drawing.clear() and redraws the ceiling/floor/walls into the world
' container fresh every single frame, so anything world.add()'d would get
' painted over the instant the next frame's walls go up. HUD is a
' separate container that always renders on top of the world, which is
' also why the gun sprite and health text below stay visible -- placing
' the emitters there sidesteps the redraw entirely. There's no camera in
' this demo, so HUD/world/screen coordinates are all the same thing.
dim muzzleFlashEmitter as Emitter
dim enemyHitEmitter as Emitter
dim enemyDeathEmitter as Emitter

' Player state
dim posX = 1.5
dim posY = 4.5
dim dirX = 1.0
dim dirY = 0.0
dim planeX = 0.0
dim planeY = 0.66
dim playerHealth = 100
dim damageCooldown = 0

' Hud
dim mapW = 8
dim cells(64)
dim healthText as Text
dim gameOverText as Text

' Enemy
dim enemyX = 5.5
dim enemyY = 3.5
dim enemyScreenX = -999
dim enemyTransformY = 0
dim enemyAlive = true
dim enemyHealth = 10
dim enemyHit = false
dim enemyHitTimer = 0
dim enemySpeed = 0.02

' Z-buffer
dim zbuffer(200)

' Movement speeds
dim moveSpeed = 0.05
dim rotSpeed = 0.04

function buildMap()
    dim i
    for i = 0 to 63
        cells(i) = 0
    next i
    dim x
    for x = 0 to 7
        cells(x) = 1
        cells(56 + x) = 1
        cells(x * 8) = 1
        cells(x * 8 + 7) = 1
    next x
    ' Interior pillars
    cells(18) = 1
    cells(45) = 1
endfunction

function getCell(mx, my)
    return cells(my * mapW + mx)
endfunction

function checkHit()
    dim aimCol = RAYS / 2
    dim hitX
    if enemyAlive = 1 and enemyTransformY > 0 then
        if math.abs(enemyScreenX - aimCol) < 15 then
            if zbuffer(aimCol) > enemyTransformY then
                enemyHit = true
                enemyHitTimer = 10
                enemyHealth = enemyHealth - 1

                ' enemyScreenX is a ray/column index (0..RAYS), not a pixel --
                ' converting it the same way castRays()/renderEnemy() convert
                ' a column to its actual destX puts the burst exactly where
                ' the enemy sprite is drawn. SCY is the fixed vertical anchor
                ' every wall/enemy strip is centred on (no look up/down in
                ' this demo), so it's also the correct burst height.
                hitX = enemyScreenX * STRIP + STRIP / 2

                if enemyHealth < 1
                    enemyAlive = false
                    enemyDeathEmitter.transform.setPosition(hitX, SCY)
                    enemyDeathEmitter.burst(24)
                else
                    enemyHitEmitter.transform.setPosition(hitX, SCY)
                    enemyHitEmitter.burst(8)
                endif
            endif
        endif
    endif
endfunction

function handleInput()
    dim nx
    dim ny
    dim oldDirX
    dim oldPlaneX
    dim negRot

    if input.getKeyDown(87) then
        nx = posX + dirX * moveSpeed
        ny = posY + dirY * moveSpeed
        if getCell(math.floor(nx), math.floor(posY)) = 0 then
            posX = nx
        endif
        if getCell(math.floor(posX), math.floor(ny)) = 0 then
            posY = ny
        endif
    endif

    if input.getKeyDown(83) then
        nx = posX - dirX * moveSpeed
        ny = posY - dirY * moveSpeed
        if getCell(math.floor(nx), math.floor(posY)) = 0 then
            posX = nx
        endif
        if getCell(math.floor(posX), math.floor(ny)) = 0 then
            posY = ny
        endif
    endif

    if input.getKeyDown(68) then
        oldDirX = dirX
        dirX = dirX * math.cos(rotSpeed) - dirY * math.sin(rotSpeed)
        dirY = oldDirX * math.sin(rotSpeed) + dirY * math.cos(rotSpeed)
        oldPlaneX = planeX
        planeX = planeX * math.cos(rotSpeed) - planeY * math.sin(rotSpeed)
        planeY = oldPlaneX * math.sin(rotSpeed) + planeY * math.cos(rotSpeed)
    endif

    if input.getKeyDown(65) then
        negRot = 0 - rotSpeed
        oldDirX = dirX
        dirX = dirX * math.cos(negRot) - dirY * math.sin(negRot)
        dirY = oldDirX * math.sin(negRot) + dirY * math.cos(negRot)
        oldPlaneX = planeX
        planeX = planeX * math.cos(negRot) - planeY * math.sin(negRot)
        planeY = oldPlaneX * math.sin(negRot) + planeY * math.cos(negRot)
    endif

    if input.getKeyDown(32) then
        if flashTimer = 0 then
            flashTimer = 4
            muzzleFlashEmitter.transform.setPosition(weaponSprite.transform.x() + muzzleOffsetX, weaponSprite.transform.y() + muzzleOffsetY)
            muzzleFlashEmitter.burst(18)
            checkHit()
        endif
    endif
endfunction

function castRays()
    dim col
    dim cameraX
    dim rayDirX
    dim rayDirY
    dim mapX
    dim mapY
    dim deltaDistX
    dim deltaDistY
    dim stepX
    dim stepY
    dim sideDistX
    dim sideDistY
    dim hit
    dim side
    dim perpWallDist
    dim lineHeight
    dim wallX
    dim texX
    dim destX

    drawing.clear()

    ' Ceiling
    pen.setFillColor(60, 60, 80)
    pen.setLineWidth(0)
    drawing.drawRect(400, 150, 800, 300)

    ' Floor
    pen.setFillColor(80, 70, 55)
    drawing.drawRect(400, 450, 800, 300)

    for col = 0 to RAYS - 1
        cameraX = (2.0 * col / RAYS) - 1.0
        rayDirX = dirX + planeX * cameraX
        rayDirY = dirY + planeY * cameraX

        mapX = math.floor(posX)
        mapY = math.floor(posY)

        if math.abs(rayDirX) < 0.0001 then
            deltaDistX = 1000000
        else
            deltaDistX = math.abs(1.0 / rayDirX)
        endif
        if math.abs(rayDirY) < 0.0001 then
            deltaDistY = 1000000
        else
            deltaDistY = math.abs(1.0 / rayDirY)
        endif

        if rayDirX < 0 then
            stepX = -1
            sideDistX = (posX - mapX) * deltaDistX
        else
            stepX = 1
            sideDistX = (mapX + 1.0 - posX) * deltaDistX
        endif

        if rayDirY < 0 then
            stepY = -1
            sideDistY = (posY - mapY) * deltaDistY
        else
            stepY = 1
            sideDistY = (mapY + 1.0 - posY) * deltaDistY
        endif

        hit = 0
        side = 0
        while hit = 0
            if sideDistX < sideDistY then
                sideDistX = sideDistX + deltaDistX
                mapX = mapX + stepX
                side = 0
            else
                sideDistY = sideDistY + deltaDistY
                mapY = mapY + stepY
                side = 1
            endif
            if getCell(mapX, mapY) > 0 then
                hit = 1
            endif
        endwhile

        if side = 0 then
            perpWallDist = sideDistX - deltaDistX
        else
            perpWallDist = sideDistY - deltaDistY
        endif

        if perpWallDist < 0.1 then
            perpWallDist = 0.1
        endif

        lineHeight = math.floor(SH / perpWallDist)

        if side = 0 then
            wallX = posY + perpWallDist * rayDirY
        else
            wallX = posX + perpWallDist * rayDirX
        endif
        wallX = wallX - math.floor(wallX)

        texX = math.floor(wallX * TEXW)
        if side = 0 and rayDirX > 0 then
            texX = TEXW - texX - 1
        endif
        if side = 1 and rayDirY < 0 then
            texX = TEXW - texX - 1
        endif

        zbuffer(col) = perpWallDist

        destX = col * STRIP + STRIP / 2
        drawing.drawImageStrip("wall.png", texX, destX, SCY, STRIP, lineHeight)
    next col
endfunction

function moveEnemy()
    if enemyAlive = 0 then
        return
    endif
    dim dx = posX - enemyX
    dim dy = posY - enemyY
    dim dist = math.distance(0, 0, dx, dy)
    if dist < 0.6 then
        return
    endif
    dim nx = enemyX + (dx / dist) * enemySpeed
    dim ny = enemyY + (dy / dist) * enemySpeed
    if getCell(math.floor(nx), math.floor(enemyY)) = 0 then
        enemyX = nx
    endif
    if getCell(math.floor(enemyX), math.floor(ny)) = 0 then
        enemyY = ny
    endif

    if damageCooldown > 0 then
        damageCooldown = damageCooldown - 1
    endif
    if dist < 0.8 and damageCooldown = 0 then
        playerHealth = playerHealth - 10
        damageCooldown = 60
    endif
endfunction

function renderEnemy()
    dim spriteX
    dim spriteY
    dim invDet
    dim transformX
    dim transformY
    dim spriteScreenX
    dim spriteH
    dim spriteW
    dim drawLeft
    dim drawRight
    dim sc
    dim texCol
    dim destX

    spriteX = enemyX - posX
    spriteY = enemyY - posY

    invDet = 1.0 / (planeX * dirY - dirX * planeY)
    transformX = invDet * (dirY * spriteX - dirX * spriteY)
    transformY = invDet * ((0 - planeY) * spriteX + planeX * spriteY)

    if transformY <= 0 then
        return
    endif

    spriteScreenX = math.floor((RAYS / 2) * (1.0 + transformX / transformY))
    spriteH = math.floor(SH / transformY)
    spriteW = spriteH

    drawLeft = math.floor(spriteScreenX - spriteW / 2)
    drawRight = math.floor(spriteScreenX + spriteW / 2)

    if transformY <= 0 then
        return
    endif
    spriteScreenX = math.floor((RAYS / 2) * (1.0 + transformX / transformY))
    enemyScreenX = spriteScreenX        ' store for hit detection
    enemyTransformY = transformY

    for sc = drawLeft to drawRight - 1
        if sc >= 0 and sc < RAYS then
            if zbuffer(sc) > transformY then
                texCol = math.floor((sc - drawLeft) * ENIW / spriteW)
                destX = sc * STRIP + STRIP / 2

                if enemyAlive = true 
                    if enemyHitTimer > 0
                        drawing.drawImageStrip("enemy_hit.png", texCol, destX, SCY, STRIP, spriteH)
                    else
                        drawing.drawImageStrip("enemy.png", texCol, destX, SCY, STRIP, spriteH)
                    endif
                else
                    drawing.drawImageStrip("enemy_dead.png", texCol, destX, SCY, STRIP, spriteH)
                endif
            endif
        endif
    next sc

    if enemyHitTimer > 0
        enemyHitTimer = enemyHitTimer - 1
    endif
endfunction

function updateFlashCooldown()
    ' flashTimer now only gates fire rate (see handleInput) -- the visible
    ' flash itself is muzzleFlashEmitter's burst, fired once at the moment
    ' of the shot rather than redrawn every frame the cooldown is active.
    if flashTimer > 0 then
        flashTimer = flashTimer - 1
    endif
endfunction

function onenter()
    buildMap()
    weaponSprite = new Sprite("gun.png")
    hud.add(weaponSprite)
    'weaponSprite.setScale(4, 4)
    weaponSprite.transform.setPosition(stage.width() / 2, stage.height() - 200)
    healthText = new Text("Health: 100",10,10)
    hud.add(healthText)
    gameOverText = new Text("GAME OVER!",stage.width() / 2, stage.height() / 2)

    muzzleFlashEmitter = new Emitter("particle.png")
    muzzleFlashEmitter.setLifetime(0.1, 0.15)
    muzzleFlashEmitter.setSpeed(80, 160)
    muzzleFlashEmitter.setDirection(0, 360)
    muzzleFlashEmitter.setScaleOverLife(0.6, 0.08)
    muzzleFlashEmitter.setAlphaOverLife(1, 0)
    muzzleFlashEmitter.setColorOverLife(16777120, 16744448)
    muzzleFlashEmitter.setMaxParticles(30)
    hud.add(muzzleFlashEmitter)

    enemyHitEmitter = new Emitter("particle.png")
    enemyHitEmitter.setLifetime(0.15, 0.25)
    enemyHitEmitter.setSpeed(60, 140)
    enemyHitEmitter.setDirection(0, 360)
    enemyHitEmitter.setScaleOverLife(0.5, 0.05)
    enemyHitEmitter.setAlphaOverLife(1, 0)
    enemyHitEmitter.setColorOverLife(16777215, 16711680)
    enemyHitEmitter.setMaxParticles(40)
    hud.add(enemyHitEmitter)

    enemyDeathEmitter = new Emitter("particle.png")
    enemyDeathEmitter.setLifetime(0.4, 0.6)
    enemyDeathEmitter.setSpeed(80, 200)
    enemyDeathEmitter.setDirection(0, 360)
    enemyDeathEmitter.setScaleOverLife(0.7, 0.1)
    enemyDeathEmitter.setAlphaOverLife(1, 0)
    enemyDeathEmitter.setColorOverLife(16711680, 4473924)
    enemyDeathEmitter.setMaxParticles(80)
    hud.add(enemyDeathEmitter)
endfunction

function onupdate()
    if playerHealth < 1
        hud.add(gameOverText)
        return
    endif

    handleInput()
    castRays()
    moveEnemy()
    renderEnemy()
    healthText.setText("Health: " + string.str(playerHealth))
    updateFlashCooldown()
endfunction
```

---

## Key techniques

### The map

The map is a flat array of 64 numbers representing an 8×8 grid. `buildMap` fills the outer border with `1` (wall) and leaves the interior as `0` (open floor), plus two interior pillars. `getCell(mx, my)` converts a 2D grid coordinate into an array index.

### DDA raycasting

`castRays` loops over 200 ray columns. For each column it:

1. Calculates a ray direction by blending the player's facing direction with the camera plane.
2. Steps through the map grid using DDA until it hits a wall.
3. Computes the **perpendicular wall distance** — not the straight-line distance — to avoid the fisheye effect.
4. Derives how tall to draw that wall strip (`lineHeight = SH / distance`).
5. Picks the correct texture column from `wall.png` using `drawing.drawImageStrip`.
6. Stores the distance in `zbuffer(col)` for use by the enemy renderer.

### Enemy billboard

`renderEnemy` projects the enemy's world position onto the screen using a camera-space transform. It draws the enemy column by column, but only for columns where the z-buffer says the wall is *farther* than the enemy — this is what stops the enemy from appearing through walls.

`enemyScreenX` and `enemyTransformY` are saved each frame so `checkHit` can use them on the frame the player fires.

### Hit detection

Firing (spacebar) calls `checkHit`. A shot registers if:
- The enemy is alive and facing the camera (`enemyTransformY > 0`).
- The centre ray column is within 15 columns of `enemyScreenX`.
- The z-buffer at the centre column is deeper than the enemy (enemy is not hidden behind a wall).

### Enemy AI

`moveEnemy` normalises the direction vector from enemy to player, steps along it by `enemySpeed`, and checks each axis separately for wall collisions — the same wall-sliding trick used for player movement. When the enemy closes to within 0.8 world units it deals 10 damage, with a 60-frame cooldown between hits.

### HUD layering

The weapon sprite, health text, and all three particle emitters are added to `hud`, not `world`. This keeps them always on top of the 3D view, which is drawn each frame via `drawing.drawImageStrip` into the world layer.

For the emitters specifically, this isn't just a visual preference — it's required. `castRays` calls `drawing.clear()` and redraws the ceiling, floor, and every wall strip into the world container from scratch every single frame. Anything added to `world` (the normal place an `Emitter` goes in the other particle-enabled demos) would get painted over the instant the next frame's walls went up, since the freshly-redrawn strips are added after it every time. `hud` is a separate container that always renders on top of `world` regardless of what's redrawn there, which is also why the gun sprite and health text stay visible — routing the emitters through it sidesteps the redraw entirely. There's no `camera` anywhere in this demo, so `hud`, `world`, and screen coordinates are all the same thing here, unlike in a scrolling demo where they'd diverge.

### Muzzle flash and hit particles

Three `Emitter`s are set up once in `onenter()`: `muzzleFlashEmitter`, `enemyHitEmitter`, and `enemyDeathEmitter`. The old muzzle flash was a `pen`/`drawing.drawCircle` circle redrawn every frame `flashTimer` was active; it's now a single `muzzleFlashEmitter.burst(18)` fired once, at the moment of the shot. `flashTimer` still exists, but only as a fire-rate cooldown now (renamed `updateFlashCooldown`, called from `onupdate`) — it no longer drives any drawing itself.

The flash is positioned relative to `weaponSprite.transform`, not an independent hardcoded screen coordinate — `muzzleOffsetX`/`muzzleOffsetY` (122, 36) are the muzzle opening's pixel position in the underlying 256×256 `gun.png`, found by locating the dark pixel cluster at the tip of the barrel. A first attempt treated those as an offset from the sprite's *centre*, which put the flash up in the ceiling — `Sprite` (what `weaponSprite` is) has no centred anchor, unlike `animatedsprite`; its transform is its top-left corner, confirmed live once the centre-relative version visibly missed. Tying the flash to the gun's own transform (rather than a second, independent screen coordinate) also means the two can't drift out of sync if the gun's position ever changes.

`checkHit`'s hit and death bursts need a screen position, not a world one, since this demo has no camera to convert one into the other. `enemyScreenX` is a ray/column index (0 to `RAYS`), not a pixel — converting it with the same `enemyScreenX * STRIP + STRIP / 2` expression `castRays`/`renderEnemy` already use for their own `destX` puts the burst exactly where the enemy sprite is actually drawn. `SCY`, the fixed vertical anchor every wall and enemy strip is centred on (there's no vertical look in this demo), is the correct burst height for the same reason.
