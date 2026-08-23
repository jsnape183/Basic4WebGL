Class
Extends animatedsprite

dim hearts
dim maxHearts
dim facingX
dim facingY
dim hasKey
dim attackCooldown
dim invincibleTime
dim flickerTimer
dim visibleFlag
dim enemies() as enemy
dim boss as boss
dim sword as sword

Constructor(x, y)
  super("player.png", 16, 16)
  self.transform.setPosition(x, y)
  self.addAnim("idle", 0, 0, 1, true)
  self.addAnim("walk", 1, 2, 6, true)
  self.addAnim("attack", 3, 3, 1, false)
  self.play("idle")
  self.maxHearts = 3
  self.hearts = 3
  self.facingX = 0
  self.facingY = 1
  self.hasKey = false
  self.attackCooldown = 0
  self.invincibleTime = 0
  self.flickerTimer = 0
  self.visibleFlag = true
EndConstructor

function setEnemies(enemiesRef)
  self.enemies = enemiesRef
endfunction

function setBoss(bossRef as boss)
  self.boss = bossRef
endfunction

function setSword(swordRef as sword)
  self.sword = swordRef
endfunction

function setHasKey(value)
  self.hasKey = value
endfunction

function getHearts()
  return self.hearts
endfunction

function takeDamage()
  if self.invincibleTime <= 0 then
    self.hearts = self.hearts - 1
    self.invincibleTime = 1
  endif
endfunction

function tryAttack()
  dim hitX
  dim hitY
  dim i
  dim e as enemy

  if self.attackCooldown <= 0 then
    self.attackCooldown = 0.4
    self.play("attack")
    self.sword.swing(self, self.facingX, self.facingY)

    dim s1 as Keyframe
    s1 = new Keyframe()
    s1.setTime(0)
    s1.setAngle(0)
    s1.setPosition(self.transform.x(), self.transform.y())

    dim s2 as Keyframe
    s2 = new Keyframe()
    s2.setTime(0.4)
    s2.setAngle(360)
    s2.setPosition(self.transform.x(), self.transform.y())

    dim spinFrames(0)
    array.push(spinFrames, s1)
    array.push(spinFrames, s2)

    tween.play(self, spinFrames, false)

    ' Hitbox is centered on the player, not offset in the facing direction --
    ' matches the spin-attack visual (a full 360 turn has no single "front"),
    ' and sidesteps a real dead zone the old offset-box had: a facing-offset
    ' box only covered roughly 20px +/- 8px along the facing axis, so an
    ' enemy standing right next to the player (well within the contact range
    ' where it can already hit back) frequently fell outside that band and
    ' took zero hits no matter how many times tryAttack() ran. Confirmed by
    ' sweeping actual distances 0-20px against a real chasing enemy: every
    ' attack in the 0-10px range missed.
    '
    ' e.transform.x()/y() and self.boss.transform.x()/y() are each target's
    ' top-left corner, not its center -- Enemy and Boss extend `sprite`,
    ' which (unlike the player's `animatedsprite`) has no centered anchor.
    ' Feeding that raw top-left position into boxCollide as if it were a
    ' center silently shifts the effective hit-check away from where the
    ' enemy actually renders. Correcting by half each target's own size.
    hitX = self.transform.x()
    hitY = self.transform.y()

    for i = 0 to array.arrLength(self.enemies) - 1
      e = self.enemies(i)
      if not e.dead then
        if collision.boxCollide(hitX, hitY, 44, 44, e.transform.x() + 8, e.transform.y() + 8, 16, 16) then
          e.hit(15)
        endif
      endif
    next i

    if not self.boss.dead then
      if collision.boxCollide(hitX, hitY, 44, 44, self.boss.transform.x() + 16, self.boss.transform.y() + 16, 32, 32) then
        self.boss.hit(15)
      endif
    endif
  endif
endfunction

function onupdate(delta)
  dim dt
  dim moveX
  dim moveY
  dim nx
  dim ny

  dt = delta / 1000

  moveX = 0
  moveY = 0
  if input.getKeyDown(87) then : moveY = -1 : endif
  if input.getKeyDown(83) then : moveY = 1 : endif
  if input.getKeyDown(65) then : moveX = -1 : endif
  if input.getKeyDown(68) then : moveX = 1 : endif

  nx = math.normalizeX(moveX, moveY)
  ny = math.normalizeY(moveX, moveY)
  self.setVelocity(nx * 100, ny * 100)

  if moveX <> 0 or moveY <> 0 then
    self.facingX = nx
    self.facingY = ny
  endif

  if input.keyPressed(74) then
    self.tryAttack()
  endif

  if self.attackCooldown > 0 then
    self.attackCooldown = self.attackCooldown - dt
  endif

  if self.hasKey then
    collision.setTileSolid(488, 264, false)
    collision.setTileSolid(488, 280, false)
  endif

  if self.invincibleTime > 0 then
    self.invincibleTime = self.invincibleTime - dt
    self.flickerTimer = self.flickerTimer - dt
    if self.flickerTimer <= 0 then
      self.flickerTimer = 0.08
      if self.visibleFlag then
        self.visibleFlag = false
        self.setAlpha(0.2)
      else
        self.visibleFlag = true
        self.setAlpha(1)
      endif
    endif
  else
    self.setAlpha(1)
  endif

  if self.attackCooldown > 0.25 then
    ' still flashing the attack pose from a recent swing -- let it finish
    ' showing before switching back to walk/idle, rather than depending on
    ' the animation engine's own "is it done playing" state
  elseif moveX <> 0 or moveY <> 0 then
    if not self.isPlaying("walk") then
      self.play("walk")
    endif
  else
    if not self.isPlaying("idle") then
      self.play("idle")
    endif
  endif

  if self.hearts <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
