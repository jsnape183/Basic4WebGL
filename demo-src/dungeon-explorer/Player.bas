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
dim swingId

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
  self.swingId = 0
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
  if self.attackCooldown <= 0 then
    self.attackCooldown = 0.4
    self.swingId = self.swingId + 1
    self.play("attack")
    self.sword.swing(self, self.facingX, self.facingY, 0.4)
  endif
endfunction

function checkSwingHits()
  ' Checked every frame the swing is active (see onupdate, gated on
  ' attackCooldown > 0), not once at the instant the attack button was
  ' pressed. An instant-only check requires the target to already be in
  ' exactly the right place at exactly that one frame -- every hit-detection
  ' complaint in this attack's history traces back to some version of that:
  ' a facing-offset box that missed anything close, a hitbox that was fine
  ' but a frozen player that couldn't get back into range after a knockback,
  ' an animation that looked cancelled because the lock and the pose ended
  ' together. Checking continuously for the whole swing means a target that
  ' wanders into the box at ANY point during the 0.4s swing gets hit, not
  ' just one that happened to already be there the instant the button was
  ' pressed -- closer to how a swinging sword actually works, and removes
  ' the whole class of "was it in range on the right frame" bugs at once.
  ' self.swingId (bumped once per swing in tryAttack) stops this from
  ' hitting the same target more than once while it sits in the box for
  ' several consecutive frames -- see Enemy.hit/Boss.hit.
  '
  ' Hitbox is centered on the player, not offset in the facing direction --
  ' matches the spin-attack visual (a full 360 turn has no single "front").
  ' e.transform.x()/y() and self.boss.transform.x()/y() are each target's
  ' top-left corner, not its center -- Enemy and Boss extend `sprite`,
  ' which (unlike the player's `animatedsprite`) has no centered anchor.
  ' Feeding that raw top-left position into boxCollide as if it were a
  ' center silently shifts the effective hit-check away from where the
  ' enemy actually renders. Correcting by half each target's own size.
  dim hitX
  dim hitY
  dim i
  dim e as enemy

  hitX = self.transform.x()
  hitY = self.transform.y()

  for i = 0 to array.arrLength(self.enemies) - 1
    e = self.enemies(i)
    if not e.dead then
      if collision.boxCollide(hitX, hitY, 44, 44, e.transform.x() + 8, e.transform.y() + 8, 16, 16) then
        e.hit(15, self.swingId)
      endif
    endif
  next i

  if not self.boss.dead then
    if collision.boxCollide(hitX, hitY, 44, 44, self.boss.transform.x() + 16, self.boss.transform.y() + 16, 32, 32) then
      self.boss.hit(15, self.swingId)
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

  ' Rotation is driven directly by setAngle here, not by tween.play -- tween
  ' writes every channel (including position) unconditionally each frame,
  ' so a tween spin controlling rotation would also have to control position
  ' every frame, freezing the player solid for the swing's whole duration.
  ' That's exactly what caused the boss to feel un-hittable: chaining attacks
  ' the instant cooldown allowed left the player unable to chase a boss that
  ' had just been knocked back out of range, confirmed live. Setting the
  ' angle by hand here means attacking costs no mobility at all: setVelocity
  ' above already runs unconditionally, so the player can move and spin at
  ' the same time. The 360 turn now spans the whole attackCooldown window
  ' (0.4s) rather than a shortened slice of it, since there's no longer a
  ' tradeoff between "long enough to read as a real spin" and "short enough
  ' the player isn't stuck standing still" -- a shorter, tween-locked version
  ' of this spin (0.15s) shipped briefly and read as the attack getting cut
  ' off/cancelled by movement input, because pose and lock ended together
  ' well before the cooldown did.
  if self.attackCooldown > 0 then
    self.setAngle((0.4 - self.attackCooldown) / 0.4 * 360)
    self.checkSwingHits()
  else
    self.setAngle(0)
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

  if self.attackCooldown > 0 then
    ' still flashing the attack pose for the whole spin -- let it finish
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
