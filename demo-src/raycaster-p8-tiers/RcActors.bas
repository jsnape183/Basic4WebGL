Class
' RcActors -- billboard pool + ray queries for a raycast scene (spec §8).
'
' A fixed pool of RcActor (RC_ACTOR_POOL) created once in the Constructor;
' add()/remove() flip a visible flag, never allocate. RcRender.bindActors(this)
' + RcRender's drawActors() pass projects the visible ones against the per-column
' wall-depth buffer (spec §5.4) so a billboard behind a wall or a ledge is
' correctly clipped, column by column.
'
' Ray queries share the DDA in an owned RcCast:
'   los(x, y, dx, dy)         -> distance to the first opaque WALL, or -1
'   hitscan(x, y, dx, dy, rng) -> the nearest thing the ray hits within rng:
'                                 an RcActor (actor hit) or 0 (wall hit / miss);
'                                 hitKind()/hitDist()/hitX()/hitY() give detail.
'   near(x, y, r)             -> the nearest visible actor within r, or 0
'
' Tint is stored on RcActor but NOT applied -- drawImageStrip has no tint param
' (spec §5.3 rung 3, deferred). Actors are gated on depth only for now; the light
' grid still shades the surrounding walls. Revisit with textured walls.
'
' The RcWorld field is `wld`, NEVER `world`.
dim wld as RcWorld
dim rc as RcCast
dim pool(0)
dim count
dim hKind
dim hDist
dim hX
dim hY
dim hActor

Constructor(w as RcWorld)
    self.wld = w
    self.rc = new RcCast()
    self.count = 0
    self.hKind = RcConfig.RC_HIT_NONE
    self.hDist = -1
    self.hX = 0
    self.hY = 0
    self.hActor = 0
    dim i
    dim a as RcActor
    for i = 0 to RcConfig.RC_ACTOR_POOL - 1
        a = new RcActor()
        array.push(self.pool, a)
    next i
EndConstructor

' Claim a pooled slot. frameW/frameH are the sprite's source frame size in
' pixels (one horizontal frame). Returns the RcActor, or 0 if the pool is full.
function add(imageName, x, y, z, frameW, frameH)
    dim i
    dim a as RcActor
    for i = 0 to RcConfig.RC_ACTOR_POOL - 1
        a = self.pool(i)
        if a.visible() = 0 then
            a.reset(imageName, x, y, z, frameW, frameH)
            self.count = self.count + 1
            return a
        endif
    next i
    return 0
endfunction

function remove(act as RcActor)
    if act.visible() = 1 then
        act.setVisible(0)
        self.count = self.count - 1
    endif
endfunction

function activeCount()
    return self.count
endfunction

function poolSize()
    return RcConfig.RC_ACTOR_POOL
endfunction

' Direct pool access for RcRender.drawActors() -- iterate 0..poolSize()-1 and
' skip actors whose visible() = 0.
function actorAt(i)
    return self.pool(i)
endfunction

' Nearest visible actor within radius r of (x, y), or 0.
function near(x, y, r)
    dim i
    dim a as RcActor
    dim best
    dim bestD
    dim d
    best = 0
    bestD = r
    for i = 0 to RcConfig.RC_ACTOR_POOL - 1
        a = self.pool(i)
        if a.visible() = 1 then
            d = a.distanceTo(x, y)
            if d <= bestD then
                bestD = d
                best = a
            endif
        endif
    next i
    return best
endfunction

' Distance to the first opaque wall along (dx, dy). Thin pass-through to RcCast
' so callers do not need their own RcCast; (dx, dy) need not be normalized (world
' units out regardless -- see RcCast.los).
function los(x, y, dx, dy)
    return self.rc.los(self.wld, x, y, dx, dy)
endfunction

' Nearest hit along the ray (x,y)+(dx,dy) within range rng. (dx, dy) is
' normalized internally -- actor hits are found by projecting each actor onto the
' ray in euclidean space, which only matches the wall distance if |dir| = 1.
' Returns the hit RcActor, or 0 for a wall hit or a miss. Populates
' hKind/hDist/hX/hY.
function hitscan(x, y, dx, dy, rng)
    dim wallD
    dim i
    dim a as RcActor
    dim relX
    dim relY
    dim along
    dim perp
    dim closest
    dim closestD
    dim limit
    dim dlen

    self.hKind = RcConfig.RC_HIT_NONE
    self.hDist = -1
    self.hX = 0
    self.hY = 0
    self.hActor = 0

    dlen = math.sqrt(dx * dx + dy * dy)
    if dlen > 0 then
        dx = dx / dlen
        dy = dy / dlen
    endif

    wallD = self.rc.los(self.wld, x, y, dx, dy)
    limit = rng
    if wallD >= 0 and wallD < limit then
        limit = wallD
    endif

    closest = 0
    closestD = limit
    for i = 0 to RcConfig.RC_ACTOR_POOL - 1
        a = self.pool(i)
        if a.visible() = 1 then
            relX = a.x() - x
            relY = a.y() - y
            along = relX * dx + relY * dy
            if along > 0 and along <= closestD then
                perp = math.abs(relX * dy - relY * dx)
                if perp < 0.4 then
                    closestD = along
                    closest = a
                endif
            endif
        endif
    next i

    if closest <> 0 then
        self.hKind = RcConfig.RC_HIT_ACTOR
        self.hDist = closestD
        self.hX = x + dx * closestD
        self.hY = y + dy * closestD
        self.hActor = closest
        return closest
    endif

    if wallD >= 0 and wallD <= rng then
        self.hKind = RcConfig.RC_HIT_WALL
        self.hDist = wallD
        self.hX = x + dx * wallD
        self.hY = y + dy * wallD
    endif
    return 0
endfunction

function hitKind()
    return self.hKind
endfunction

function hitDist()
    return self.hDist
endfunction

function hitX()
    return self.hX
endfunction

function hitY()
    return self.hY
endfunction

function hitActor()
    return self.hActor
endfunction

EndClass
