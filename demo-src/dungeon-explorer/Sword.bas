Class
Extends sprite

dim active

Constructor()
  super("sword.png")
  self.setVisible(false)
  self.active = false
EndConstructor

function swing(px, py)
  ' Traces the sword through a full circle around (px, py), one keyframe
  ' every 45 degrees, timed to land on the same angle the player's own
  ' spin tween is at, at the same moment -- so the sword reads as rigidly
  ' swinging around the spinning player instead of drifting independently
  ' (there's no sprite-attachment/parenting feature to lean on instead;
  ' this is a deliberate stand-in for one).
  dim steps
  dim duration
  dim radius
  dim i
  dim angleDeg
  dim angleRad
  dim k as Keyframe
  dim frames(0)

  steps = 8
  duration = 0.4
  radius = 7

  for i = 0 to steps
    angleDeg = (360 / steps) * i
    angleRad = angleDeg * math.pi() / 180
    k = new Keyframe()
    k.setTime((duration / steps) * i)
    k.setAngle(angleDeg)
    k.setPosition(px + math.cos(angleRad) * radius, py + math.sin(angleRad) * radius)
    array.push(frames, k)
  next i

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
