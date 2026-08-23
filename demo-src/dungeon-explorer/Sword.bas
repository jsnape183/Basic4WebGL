Class
Extends sprite

dim active
dim playerRef as sprite

Constructor()
  super("sword.png")
  self.setVisible(false)
  self.active = false
EndConstructor

function swing(p)
  ' Attaching alone already makes the sword sweep around the player: the
  ' sword's own anchor sits at its top-left corner (the sprite default),
  ' not its centre, so once its local position is (0,0) -- i.e. its pivot
  ' is glued to the player's own position -- the player's own spin tween
  ' carries that off-centre pivot around in a circle all by itself. The
  ' sword does NOT need its own angle tween on top of that: an earlier
  ' version gave it one, which composed additively with the player's
  ' rotation (PIXI sums a child's rotation with its parent's) and made the
  ' sword complete two full orbits for every one player spin -- confirmed
  ' by sampling world-space position, not assumed. Leaving the sword's own
  ' angle fixed at 0 makes it track the player's spin exactly once.
  '
  ' Parameter deliberately named `p`, not `playerRef` -- matching this name
  ' to the `playerRef` field triggered a real transpiler bug where the
  ' compiler resolved the assignment against the class's own field default
  ' instead of the local parameter, silently assigning undefined.
  self.playerRef = p
  self.attachTo(p)
  self.transform.setPosition(0, 0)
  self.setAngle(0)
  self.setVisible(true)
  self.active = true
endfunction

function onupdate(delta)
  if self.active then
    if not tween.isPlaying(self.playerRef) then
      self.active = false
      self.setVisible(false)
      self.detach()
    endif
  endif
endfunction

EndClass
