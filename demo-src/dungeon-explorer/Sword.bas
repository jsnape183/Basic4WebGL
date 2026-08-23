Class
Extends sprite

dim active
dim playerRef as sprite
dim swingTimer

Constructor()
  super("sword.png")
  self.setVisible(false)
  self.active = false
  self.swingTimer = 0
EndConstructor

function swing(p, facingX, facingY, duration)
  ' Attaching alone already makes the sword sweep around the player: the
  ' sword's own anchor sits at its top-left corner (the sprite default),
  ' not its centre, so once its local position is (0,0) -- i.e. its pivot
  ' is glued to the player's own position -- the player's own spin (driven
  ' by setAngle in Player.onupdate) carries that off-centre pivot around in
  ' a circle all by itself. The sword does NOT need its own angle animation
  ' on top of that: an earlier version gave it one, which composed
  ' additively with the player's rotation (PIXI sums a child's rotation with
  ' its parent's) and made the sword complete two full orbits for every one
  ' player spin -- confirmed by sampling world-space position, not assumed.
  ' Leaving the sword's own angle fixed makes it track the player's spin
  ' exactly once.
  '
  ' Position/angle are derived from the player's current facing, not
  ' hardcoded -- an earlier version fixed them at a single (18, -5) /
  ' 90 degree pose tuned by eye for facing right, which visually pointed
  ' the sword somewhere unrelated to the real hitbox (Player.tryAttack's
  ' facingX/Y * 20) for every other facing direction. Confirmed live: the
  ' actual hit detection was fine the whole time, only the sword's visual
  ' position was wrong, which read exactly like "attacks don't land".
  ' alongDist/perpDist reproduce that same tuned (18, -5) pose, just
  ' expressed relative to facing instead of the world x-axis, so it looks
  ' the same when facing right and rotates correctly for every other
  ' direction.
  dim alongDist
  dim perpDist
  dim perpX
  dim perpY

  alongDist = 18
  perpDist = -5
  perpX = -facingY
  perpY = facingX

  self.playerRef = p
  self.attachTo(p)
  self.transform.setPosition(facingX * alongDist + perpX * perpDist, facingY * alongDist + perpY * perpDist)
  self.setAngle(90 + math.atan2(facingY, facingX) * 180 / math.pi())
  self.setVisible(true)
  self.active = true
  self.swingTimer = duration
endfunction

function onupdate(delta)
  ' Tracks its own timer rather than polling tween.isPlaying(playerRef) --
  ' the player no longer uses tween for its spin at all (see Player.bas), so
  ' there's no longer any tween state to poll. duration is passed in from
  ' the caller (Player.tryAttack) so the sword's visible lifetime always
  ' matches however long the player's own spin actually takes, without the
  ' two having to agree on a hardcoded number independently.
  if self.active then
    self.swingTimer = self.swingTimer - delta / 1000
    if self.swingTimer <= 0 then
      self.active = false
      self.setVisible(false)
      self.detach()
    endif
  endif
endfunction

EndClass
