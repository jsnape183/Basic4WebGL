Class
Extends sprite

dim active

Constructor()
  super("sword.png")
  self.setVisible(false)
  self.active = false
EndConstructor

function swing(px, py, facingX, facingY)
  dim k1 as Keyframe
  k1 = new Keyframe()
  k1.setTime(0)
  k1.setAngle(-60)
  k1.setPosition(px + facingX * 10, py + facingY * 10)

  dim k2 as Keyframe
  k2 = new Keyframe()
  k2.setTime(0.4)
  k2.setAngle(60)
  k2.setPosition(px + facingX * 18, py + facingY * 18)

  dim frames(0)
  array.push(frames, k1)
  array.push(frames, k2)

  self.setVisible(true)
  self.active = true
  tween.play(self, frames, false)
endfunction

function onupdate(delta)
  if self.active then
    if not tween.isPlaying(self) then
      self.active = false
      self.setVisible(false)
    endif
  endif
endfunction

EndClass
