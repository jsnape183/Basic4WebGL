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
  ' Attaching makes the sword sweep around the player: its local position
  ' (set below, relative to the player) is carried around in a circle by
  ' the player's own spin (driven by setAngle in Player.onupdate), since
  ' PIXI rotates a child's position along with its parent's. The sword does
  ' NOT need its own angle animation on top of that: an earlier version
  ' gave it one, which composed additively with the player's rotation and
  ' made the sword complete two full orbits for every one player spin --
  ' confirmed by sampling world-space position, not assumed. Leaving the
  ' sword's own angle fixed makes it track the player's spin exactly once.
  '
  ' Position/angle are derived from the player's current facing, not
  ' hardcoded. alongDist/perpDist place the sword's own CENTRE (`sprite`
  ' is centre-anchored) relative to the player, tuned by eye so the blade
  ' reads as an outstretched sword rather than overlapping the player.
  dim alongDist
  dim perpDist
  dim perpX
  dim perpY

  alongDist = 26
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
