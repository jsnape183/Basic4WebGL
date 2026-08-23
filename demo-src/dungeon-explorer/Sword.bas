Class
Extends sprite

dim active

Constructor()
  super("sword.png")
  self.setVisible(false)
  self.active = false
EndConstructor

function swing(playerRef)
  ' Attaches to the player for the duration of the swing, so the tween below
  ' only needs to animate this sword's own local angle -- PIXI's transform
  ' stack takes care of making that angle relative to the player, which is
  ' what makes the sword sweep around the player as it also spins.
  dim s1 as Keyframe
  dim s2 as Keyframe
  dim frames(0)

  self.attachTo(playerRef)
  self.setVisible(true)
  self.active = true

  s1 = new Keyframe()
  s1.setTime(0)
  s1.setAngle(0)

  s2 = new Keyframe()
  s2.setTime(0.4)
  s2.setAngle(360)

  array.push(frames, s1)
  array.push(frames, s2)

  tween.play(self, frames, false)
endfunction

function onupdate(delta)
  if self.active then
    if not tween.isPlaying(self) then
      self.active = false
      self.setVisible(false)
      self.detach()
    endif
  endif
endfunction

EndClass
