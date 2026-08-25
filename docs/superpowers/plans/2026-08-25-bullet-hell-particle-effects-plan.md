# Bullet Hell Shooter — Particle Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add particle effects (mob death, spawn point destruction, bullet impact, player hit) to the Bullet Hell Shooter demo using the already-shipped `Emitter` class, as both a genuine gameplay polish pass and an honest real-world performance check of the particle system under real combat load.

**Architecture:** A new plain module `Particles.bas` owns four persistent, reused `Emitter` instances (one per effect type), built once per level via `particles.setup()` called from each level scene's `onenter()`. The four game-object classes (`Mob`, `SpawnPoint`, `Bullet`, `Player`) each gain a single trigger call at their existing hit/death/damage branch.

**Design doc:** `docs/superpowers/specs/2026-08-25-bullet-hell-particle-effects-design.md` — read this first if anything below seems under-motivated.

**Tech Stack:** softBASIC (existing demo source at `demo-src/bullet-hell-shooter/`), the `Emitter` class (already shipped, part of the `softgfx` package which every project includes by default), `scripts/buildDemo.ts` (the existing demo-assembler script), Python 3 + Pillow (for procedural asset generation — already available in this environment).

---

### Task 1: Generate the particle sprite asset

**Files:**
- Create: `demo-src/bullet-hell-shooter/assets/particle.png`

- [ ] **Step 1: Generate the asset**

Run this exact script (writes directly to the target path):

```bash
python3 -c "
from PIL import Image
import math

size = 16
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
cx, cy = size / 2, size / 2
radius = size / 2 - 0.5

for y in range(size):
    for x in range(size):
        dx, dy = x + 0.5 - cx, y + 0.5 - cy
        dist = math.sqrt(dx * dx + dy * dy)
        if dist <= radius:
            alpha = 255
            edge = radius - dist
            if edge < 2.0:
                alpha = int(255 * (edge / 2.0))
            img.putpixel((x, y), (255, 255, 255, max(0, alpha)))

img.save('demo-src/bullet-hell-shooter/assets/particle.png')
print('saved')
"
```

This produces a 16×16 soft-edged white circle with alpha falloff at the rim — verified by hand during design (renders as a clean round dot against a dark background). White + soft alpha edge means every effect's `setColorOverLife` tints it cleanly via the `Emitter`'s `tint` multiply.

- [ ] **Step 2: Verify it's a valid image**

Run: `file demo-src/bullet-hell-shooter/assets/particle.png`
Expected: `PNG image data, 16 x 16, 8-bit/color RGBA, non-interlaced` (or equivalent — must NOT say "data" / fail to identify as PNG, which would mean a malformed file).

- [ ] **Step 3: Commit**

```bash
git add demo-src/bullet-hell-shooter/assets/particle.png
git commit -m "feat: add particle sprite asset for Bullet Hell Shooter effects"
```

---

### Task 2: Create `Particles.bas`

**Files:**
- Create: `demo-src/bullet-hell-shooter/Particles.bas`

- [ ] **Step 1: Write the file**

Colors below are decimal `red*65536 + green*256 + blue` values (softBASIC has no `0x` hex literal syntax — confirmed and fixed at the source in `src/docs/api-reference/emitter.md` during the particle system's own live smoke test). Computed here, not guessed:

| Name | RGB | Decimal |
|---|---|---|
| red | (255, 68, 68) | 16729156 |
| dark red | (139, 0, 0) | 9109504 |
| yellow | (255, 230, 90) | 16770650 |
| orange-red | (230, 80, 20) | 15093780 |
| white | (255, 255, 255) | 16777215 |
| gray | (150, 150, 150) | 9868950 |

```bas
' demo-src/bullet-hell-shooter/Particles.bas
dim mobDeathEmitter as Emitter
dim spawnDestroyedEmitter as Emitter
dim bulletImpactEmitter as Emitter
dim playerHitEmitter as Emitter

function setup()
  mobDeathEmitter = new Emitter("particle.png")
  mobDeathEmitter.setLifetime(0.4, 0.4)
  mobDeathEmitter.setSpeed(40, 90)
  mobDeathEmitter.setDirection(0, 360)
  mobDeathEmitter.setGravity(0, 120)
  mobDeathEmitter.setScaleOverLife(1, 0.2)
  mobDeathEmitter.setAlphaOverLife(1, 0)
  mobDeathEmitter.setColorOverLife(16729156, 9109504)
  mobDeathEmitter.setMaxParticles(80)
  world.add(mobDeathEmitter)

  spawnDestroyedEmitter = new Emitter("particle.png")
  spawnDestroyedEmitter.setLifetime(0.6, 0.6)
  spawnDestroyedEmitter.setSpeed(60, 140)
  spawnDestroyedEmitter.setDirection(0, 360)
  spawnDestroyedEmitter.setGravity(0, 100)
  spawnDestroyedEmitter.setScaleOverLife(1.4, 0.2)
  spawnDestroyedEmitter.setAlphaOverLife(1, 0)
  spawnDestroyedEmitter.setColorOverLife(16770650, 15093780)
  spawnDestroyedEmitter.setMaxParticles(60)
  world.add(spawnDestroyedEmitter)

  bulletImpactEmitter = new Emitter("particle.png")
  bulletImpactEmitter.setLifetime(0.2, 0.2)
  bulletImpactEmitter.setSpeed(20, 50)
  bulletImpactEmitter.setDirection(0, 360)
  bulletImpactEmitter.setScaleOverLife(0.8, 0.1)
  bulletImpactEmitter.setAlphaOverLife(1, 0)
  bulletImpactEmitter.setColorOverLife(16777215, 9868950)
  bulletImpactEmitter.setMaxParticles(150)
  world.add(bulletImpactEmitter)

  playerHitEmitter = new Emitter("particle.png")
  playerHitEmitter.setLifetime(0.3, 0.3)
  playerHitEmitter.setSpeed(30, 70)
  playerHitEmitter.setDirection(0, 360)
  playerHitEmitter.setScaleOverLife(1, 0.2)
  playerHitEmitter.setAlphaOverLife(1, 0)
  playerHitEmitter.setColorOverLife(16729156, 16729156)
  playerHitEmitter.setMaxParticles(50)
  world.add(playerHitEmitter)
endfunction

function burstMobDeath(x, y)
  mobDeathEmitter.transform.setPosition(x, y)
  mobDeathEmitter.burst(8)
endfunction

function burstSpawnDestroyed(x, y)
  spawnDestroyedEmitter.transform.setPosition(x, y)
  spawnDestroyedEmitter.burst(18)
endfunction

function burstBulletImpact(x, y)
  bulletImpactEmitter.transform.setPosition(x, y)
  bulletImpactEmitter.burst(4)
endfunction

function burstPlayerHit(x, y)
  playerHitEmitter.transform.setPosition(x, y)
  playerHitEmitter.burst(6)
endfunction
```

- [ ] **Step 2: Commit**

```bash
git add demo-src/bullet-hell-shooter/Particles.bas
git commit -m "feat: add Particles.bas — shared, reused emitters for Bullet Hell Shooter effects"
```

---

### Task 3: Wire the mob-death trigger

**Files:**
- Modify: `demo-src/bullet-hell-shooter/Mob.bas`

- [ ] **Step 1: Edit `hit(damage)`**

Current:

```bas
function hit(damage)
  if not self.dead then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.dead = true
      world.remove(self)
    endif
  endif
endfunction
```

Change to:

```bas
function hit(damage)
  if not self.dead then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.dead = true
      particles.burstMobDeath(self.transform.x(), self.transform.y())
      world.remove(self)
    endif
  endif
endfunction
```

(Burst before `world.remove(self)` so the position read is still valid — `world.remove` doesn't change `self.transform`'s stored values, but reading position before removal keeps the intent obvious and matches the order used elsewhere in this plan.)

- [ ] **Step 2: Commit**

```bash
git add demo-src/bullet-hell-shooter/Mob.bas
git commit -m "feat: burst particles on mob death"
```

---

### Task 4: Wire the spawn-point-destroyed trigger

**Files:**
- Modify: `demo-src/bullet-hell-shooter/SpawnPoint.bas`

- [ ] **Step 1: Edit `hit(damage)`**

Current:

```bas
function hit(damage)
  if not self.destroyed and self.hp > 0 then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.destroyed = true
      self.setTexture("spawnpoint_destroyed.png")
    endif
  endif
endfunction
```

Change to:

```bas
function hit(damage)
  if not self.destroyed and self.hp > 0 then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.destroyed = true
      self.setTexture("spawnpoint_destroyed.png")
      particles.burstSpawnDestroyed(self.transform.x(), self.transform.y())
    endif
  endif
endfunction
```

- [ ] **Step 2: Commit**

```bash
git add demo-src/bullet-hell-shooter/SpawnPoint.bas
git commit -m "feat: burst particles when a spawn point is destroyed"
```

---

### Task 5: Wire the bullet-impact triggers

**Files:**
- Modify: `demo-src/bullet-hell-shooter/Bullet.bas`

- [ ] **Step 1: Edit `onupdate(delta)`**

Current (the relevant tail of the function, after position update):

```bas
  self.elapsed = self.elapsed + dt
  if self.elapsed >= self.lifetime then
    world.remove(self)
    return
  endif

  if self.level.tileAt("walls", x, y) <> 0 then
    world.remove(self)
    return
  endif

  for i = 0 to array.arrLength(self.spawnPoints) - 1
    if not self.spawnPoints(i).destroyed then
      if collision.spriteCollide(self, self.spawnPoints(i)) then
        self.spawnPoints(i).hit(self.damage)
        world.remove(self)
        return
      endif
    endif
  next i

  for i = 0 to array.arrLength(self.mobs) - 1
    if not self.mobs(i).dead then
      if collision.spriteCollide(self, self.mobs(i)) then
        self.mobs(i).hit(self.damage)
        world.remove(self)
        return
      endif
    endif
  next i
endfunction
```

Change to (adds a `particles.burstBulletImpact(x, y)` call at each of the three *collision* despawns only — **not** the lifetime-timeout despawn above it, which stays untouched):

```bas
  self.elapsed = self.elapsed + dt
  if self.elapsed >= self.lifetime then
    world.remove(self)
    return
  endif

  if self.level.tileAt("walls", x, y) <> 0 then
    particles.burstBulletImpact(x, y)
    world.remove(self)
    return
  endif

  for i = 0 to array.arrLength(self.spawnPoints) - 1
    if not self.spawnPoints(i).destroyed then
      if collision.spriteCollide(self, self.spawnPoints(i)) then
        self.spawnPoints(i).hit(self.damage)
        particles.burstBulletImpact(x, y)
        world.remove(self)
        return
      endif
    endif
  next i

  for i = 0 to array.arrLength(self.mobs) - 1
    if not self.mobs(i).dead then
      if collision.spriteCollide(self, self.mobs(i)) then
        self.mobs(i).hit(self.damage)
        particles.burstBulletImpact(x, y)
        world.remove(self)
        return
      endif
    endif
  next i
endfunction
```

- [ ] **Step 2: Commit**

```bash
git add demo-src/bullet-hell-shooter/Bullet.bas
git commit -m "feat: burst particles on bullet impact (wall/spawn point/mob, not timeout)"
```

---

### Task 6: Wire the player-hit trigger

**Files:**
- Modify: `demo-src/bullet-hell-shooter/Player.bas`

- [ ] **Step 1: Edit `takeDamage(amount)`**

Current:

```bas
function takeDamage(amount)
  if self.invincibleTime <= 0 then
    self.hp = self.hp - amount
    self.invincibleTime = 0.5
  endif
endfunction
```

Change to:

```bas
function takeDamage(amount)
  if self.invincibleTime <= 0 then
    self.hp = self.hp - amount
    self.invincibleTime = 0.5
    particles.burstPlayerHit(self.transform.x(), self.transform.y())
  endif
endfunction
```

- [ ] **Step 2: Commit**

```bash
git add demo-src/bullet-hell-shooter/Player.bas
git commit -m "feat: burst particles when the player takes damage"
```

---

### Task 7: Wire `particles.setup()` into all three levels

**Files:**
- Modify: `demo-src/bullet-hell-shooter/Level1Scene.bas`
- Modify: `demo-src/bullet-hell-shooter/Level2Scene.bas`
- Modify: `demo-src/bullet-hell-shooter/Level3Scene.bas`

Switching scenes clears the world, so each level's emitters must be rebuilt fresh in its own `onenter()` — exactly like the tilemap/player/spawn points are already rebuilt fresh every time a level is entered.

- [ ] **Step 1: `Level1Scene.bas`**

Current start of `onenter()`:

```bas
function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(0, 0)

  dim tm as tilemapset
```

Change to:

```bas
function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(0, 0)
  particles.setup()

  dim tm as tilemapset
```

- [ ] **Step 2: `Level2Scene.bas`**

Current start of `onenter()`:

```bas
function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(1, 0)

  dim tm as tilemapset
```

Change to:

```bas
function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(1, 0)
  particles.setup()

  dim tm as tilemapset
```

- [ ] **Step 3: `Level3Scene.bas`**

Current start of `onenter()`:

```bas
function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(2, 0)

  dim tm as tilemapset
```

Change to:

```bas
function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(2, 0)
  particles.setup()

  dim tm as tilemapset
```

- [ ] **Step 4: Commit**

```bash
git add demo-src/bullet-hell-shooter/Level1Scene.bas demo-src/bullet-hell-shooter/Level2Scene.bas demo-src/bullet-hell-shooter/Level3Scene.bas
git commit -m "feat: build particle emitters fresh on entering each level"
```

---

### Task 8: Rebuild the demo export and live-verify (including the honest performance check)

**Files:**
- Modify (regenerated, not hand-edited): `src/docs/demos/BulletHellShooter.b4wgl.json`

- [ ] **Step 1: Rebuild the export**

Run: `npm run build:demo -- demo-src/bullet-hell-shooter BulletHellShooter`
Expected: succeeds, overwrites `src/docs/demos/BulletHellShooter.b4wgl.json`.

- [ ] **Step 2: Load it in the running app and verify zero console `ERR` entries**

Start the dev server, open the Demos page, load Bullet Hell Shooter (or import `src/docs/demos/BulletHellShooter.b4wgl.json` directly into a scratch project), click Run, and confirm the bottom console panel shows zero `ERR` entries. This is the mandatory "did it actually compile and run" check from `docs/demo-authoring-guide.md` — the build script only assembles the file, it doesn't prove the code is correct.

If there's an error, fix the relevant `demo-src/bullet-hell-shooter/*.bas` file, re-run Step 1, and re-check here before proceeding — do not move on with a known-broken build.

- [ ] **Step 3: Play through real combat and visually confirm all four effects fire correctly**

With the demo running: fire at a mob until it dies (confirm a red/dark-red burst appears at the mob's position and disappears within well under a second), fire at a wall (confirm a small white/gray burst at the impact point), damage a spawn point down to destruction (confirm the bigger yellow/orange burst), and let a mob hit the player (confirm the red flash burst at the player, alongside the existing invincibility flicker).

- [ ] **Step 4: The honest performance check**

This is the actual point of this exercise, not a formality — report what you actually observe, not what you'd hope to see. With a level busy enough to have several mobs alive, bullets flying, and particles firing from multiple effects simultaneously (e.g. stand near a spawn point and fight through a few waves), observe and report:

- Does the game visibly stutter or drop frames when several bursts overlap?
- Do particles ever visibly fail to clear (a leak/backlog building up over a few minutes of continuous play), or does everything clean up correctly as expected?
- Any other honest performance observation worth recording — good or bad.

Write this finding down (a few sentences is enough) — it feeds directly into whatever comes next for this project's particle-system roadmap tracking, and per this plan's own non-goals, a genuine "it's rough under X condition" is exactly as valid an outcome as "it holds up fine."

- [ ] **Step 5: Commit the rebuilt export**

```bash
git add src/docs/demos/BulletHellShooter.b4wgl.json
git commit -m "feat: rebuild Bullet Hell Shooter demo export with particle effects"
```

---

### Task 9: Update the demo write-up doc

**Files:**
- Modify: `src/docs/demos/bullet-hell-shooter.md`

**Before starting this task, re-read the current, real content of every file touched in Tasks 2–7.** The full file contents given below in Steps 4–5 are computed directly from this plan's own Task 2–7 diffs against the files as they were read while writing this plan — they should match exactly. If Task 8's live-verification step required any bugfix to a `.bas` file, the real file will have diverged from what's shown below; in that case use the REAL current file content instead of this plan's text, so the doc can never drift from the real source. This mirrors the exact convention every other `.bas` file's source block already follows in this same doc.

- [ ] **Step 1: Add one sentence to the "How it works" narrative**

After the existing paragraph that ends "...and despawns on hitting a wall, a spawn point, a mob, or timing out." (the weapons/bullets paragraph), add a new paragraph:

```markdown
Particle effects (built on the `Emitter` class) fire at four moments — a mob dying, a spawn point being destroyed, a bullet hitting something, and the player taking damage — via a small shared-emitter module, **`Particles.bas`**, called from each level's `onenter()` and from the relevant hit/death/damage branch in `Mob`, `SpawnPoint`, `Bullet`, and `Player`. Each effect reuses one persistent `Emitter` per type rather than creating a new one per event, since `Emitter` has no destroy method and mob deaths happen constantly over a play session.
```

- [ ] **Step 2: Add a row to "Required assets"**

After the `bullet.png` row, add:

```markdown
| `particle.png` | 16×16 soft-edged white dot, tinted per-effect via `setColorOverLife` |
```

- [ ] **Step 3: Update "Key techniques"**

Current:

```markdown
**Key techniques:** `pathfinding.navigateTo` for obstacle-avoiding enemy movement, `tileMapSet.markersByTag` for visually-authored spawn/pickup placement, per-weapon `Bullet` parameterization, HUD built from `sprite`/`text` instances added via `hud.add()`.
```

Change to:

```markdown
**Key techniques:** `pathfinding.navigateTo` for obstacle-avoiding enemy movement, `tileMapSet.markersByTag` for visually-authored spawn/pickup placement, per-weapon `Bullet` parameterization, HUD built from `sprite`/`text` instances added via `hud.add()`, shared/reused `Emitter` instances for hit/death particle effects.
```

- [ ] **Step 4: Add a new `## Particles.bas` source section**

Insert it right after the `## LevelHelpers.bas` section's closing code fence and before `## TitleScene.bas` (both are plain-module helper files used by the level scenes, so this keeps related sections adjacent):

````markdown
## Particles.bas

```bas
' demo-src/bullet-hell-shooter/Particles.bas
dim mobDeathEmitter as Emitter
dim spawnDestroyedEmitter as Emitter
dim bulletImpactEmitter as Emitter
dim playerHitEmitter as Emitter

function setup()
  mobDeathEmitter = new Emitter("particle.png")
  mobDeathEmitter.setLifetime(0.4, 0.4)
  mobDeathEmitter.setSpeed(40, 90)
  mobDeathEmitter.setDirection(0, 360)
  mobDeathEmitter.setGravity(0, 120)
  mobDeathEmitter.setScaleOverLife(1, 0.2)
  mobDeathEmitter.setAlphaOverLife(1, 0)
  mobDeathEmitter.setColorOverLife(16729156, 9109504)
  mobDeathEmitter.setMaxParticles(80)
  world.add(mobDeathEmitter)

  spawnDestroyedEmitter = new Emitter("particle.png")
  spawnDestroyedEmitter.setLifetime(0.6, 0.6)
  spawnDestroyedEmitter.setSpeed(60, 140)
  spawnDestroyedEmitter.setDirection(0, 360)
  spawnDestroyedEmitter.setGravity(0, 100)
  spawnDestroyedEmitter.setScaleOverLife(1.4, 0.2)
  spawnDestroyedEmitter.setAlphaOverLife(1, 0)
  spawnDestroyedEmitter.setColorOverLife(16770650, 15093780)
  spawnDestroyedEmitter.setMaxParticles(60)
  world.add(spawnDestroyedEmitter)

  bulletImpactEmitter = new Emitter("particle.png")
  bulletImpactEmitter.setLifetime(0.2, 0.2)
  bulletImpactEmitter.setSpeed(20, 50)
  bulletImpactEmitter.setDirection(0, 360)
  bulletImpactEmitter.setScaleOverLife(0.8, 0.1)
  bulletImpactEmitter.setAlphaOverLife(1, 0)
  bulletImpactEmitter.setColorOverLife(16777215, 9868950)
  bulletImpactEmitter.setMaxParticles(150)
  world.add(bulletImpactEmitter)

  playerHitEmitter = new Emitter("particle.png")
  playerHitEmitter.setLifetime(0.3, 0.3)
  playerHitEmitter.setSpeed(30, 70)
  playerHitEmitter.setDirection(0, 360)
  playerHitEmitter.setScaleOverLife(1, 0.2)
  playerHitEmitter.setAlphaOverLife(1, 0)
  playerHitEmitter.setColorOverLife(16729156, 16729156)
  playerHitEmitter.setMaxParticles(50)
  world.add(playerHitEmitter)
endfunction

function burstMobDeath(x, y)
  mobDeathEmitter.transform.setPosition(x, y)
  mobDeathEmitter.burst(8)
endfunction

function burstSpawnDestroyed(x, y)
  spawnDestroyedEmitter.transform.setPosition(x, y)
  spawnDestroyedEmitter.burst(18)
endfunction

function burstBulletImpact(x, y)
  bulletImpactEmitter.transform.setPosition(x, y)
  bulletImpactEmitter.burst(4)
endfunction

function burstPlayerHit(x, y)
  playerHitEmitter.transform.setPosition(x, y)
  playerHitEmitter.burst(6)
endfunction
```
````

- [ ] **Step 5: Update the source blocks for every modified file**

For each file below, find its existing `## <Filename>.bas` section in the doc and replace its code block with the full content shown here (pre-existing content plus this plan's addition, applied).

**`Player.bas`** — only `takeDamage` changes; replace the whole file's code block with:

````markdown
```bas
' demo-src/bullet-hell-shooter/Player.bas
Class
Extends animatedsprite

dim hp
dim level
dim spawnPoints
dim mobs
dim currentWeapon
dim fireCooldown
dim invincibleTime
dim flickerTimer
dim visibleFlag

Constructor(x, y)
  super("player.png", 16, 16)
  self.transform.setPosition(x, y)
  self.addAnim("stand", 0, 0, 1, true)
  self.addAnim("pistol", 1, 1, 1, true)
  self.addAnim("machinegun", 2, 2, 1, true)
  self.addAnim("shotgun", 3, 3, 1, true)
  self.play("stand")
  self.hp = 100
  self.currentWeapon = "pistol"
  self.fireCooldown = 0
  self.invincibleTime = 0
  self.flickerTimer = 0
  self.visibleFlag = true
EndConstructor

function setLevel(levelRef as tilemapset, spawnPointsRef, mobsRef)
  self.level = levelRef
  self.spawnPoints = spawnPointsRef
  self.mobs = mobsRef
endfunction

function getHp()
  return self.hp
endfunction

function getCurrentWeapon()
  return self.currentWeapon
endfunction

function takeDamage(amount)
  if self.invincibleTime <= 0 then
    self.hp = self.hp - amount
    self.invincibleTime = 0.5
    particles.burstPlayerHit(self.transform.x(), self.transform.y())
  endif
endfunction

function fireCooldownFor(weaponType)
  if weaponType = "shotgun" then
    return 0.8
  elseif weaponType = "smg" then
    return 0.1
  else
    return 0.3
  endif
endfunction

function spawnBullet(angle)
  dim b as bullet
  b = new Bullet(self.transform.x(), self.transform.y(), angle, self.currentWeapon, self.level, self.spawnPoints, self.mobs)
  world.add(b)
endfunction

function doFire(angle)
  dim i
  dim spreadAngle
  dim count
  dim step
  dim start
  if self.currentWeapon = "shotgun" then
    count = 5
    step = (30 * math.pi() / 180) / (count - 1)
    start = angle - (15 * math.pi() / 180)
    for i = 0 to count - 1
      spreadAngle = start + step * i
      self.spawnBullet(spreadAngle)
    next i
  else
    self.spawnBullet(angle)
  endif
endfunction

function onupdate(delta)
  dim dt
  dim x
  dim y
  dim moveX
  dim moveY
  dim nx
  dim ny
  dim mouseWorldX
  dim mouseWorldY
  dim aimAngle
  dim firing
  dim moving
  dim animName

  dt = delta / 1000
  x = self.transform.x()
  y = self.transform.y()

  moveX = 0
  moveY = 0
  if input.getKeyDown(87) then
    moveY = -1
  endif
  if input.getKeyDown(83) then
    moveY = 1
  endif
  if input.getKeyDown(65) then
    moveX = -1
  endif
  if input.getKeyDown(68) then
    moveX = 1
  endif

  nx = math.normalizeX(moveX, moveY)
  ny = math.normalizeY(moveX, moveY)
  self.setVelocity(nx * 150, ny * 150)

  mouseWorldX = input.mouseX() / camera.zoom() + camera.x()
  mouseWorldY = input.mouseY() / camera.zoom() + camera.y()
  aimAngle = math.atan2(mouseWorldY - y, mouseWorldX - x)
  self.setAngle(aimAngle * 180 / math.pi())

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

  if self.fireCooldown > 0 then
    self.fireCooldown = self.fireCooldown - dt
  endif

  firing = input.getKeyDown(32) or input.mouseDown()
  if firing and self.fireCooldown <= 0 then
    self.doFire(aimAngle)
    self.fireCooldown = self.fireCooldownFor(self.currentWeapon)
  endif

  moving = (moveX <> 0) or (moveY <> 0)

  if moving or firing then
    if self.currentWeapon = "shotgun" then
      animName = "shotgun"
    elseif self.currentWeapon = "smg" then
      animName = "machinegun"
    else
      animName = "pistol"
    endif
  else
    animName = "stand"
  endif

  if not self.isPlaying(animName) then
    self.play(animName)
  endif
endfunction

EndClass
```
````

**`Mob.bas`** — only `hit` changes; replace the whole file's code block with:

````markdown
```bas
' demo-src/bullet-hell-shooter/Mob.bas
Class
Extends sprite

dim hp
dim dead
dim chaseTarget as sprite
dim damageCooldown
dim speed

Constructor(x, y, targetRef as sprite)
  super("mob.png")
  self.transform.setPosition(x, y)
  self.hp = 20
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.speed = 60
EndConstructor

function onupdate(delta)
  if not self.dead then
    dim dt
    dt = delta / 1000
    pathfinding.navigateTo(self, self.chaseTarget.transform.x(), self.chaseTarget.transform.y(), self.speed)

    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - dt
    endif

    if collision.spriteCollide(self, self.chaseTarget) then
      if self.damageCooldown <= 0 then
        self.chaseTarget.takeDamage(10)
        self.damageCooldown = 0.5
      endif
    endif
  endif
endfunction

function hit(damage)
  if not self.dead then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.dead = true
      particles.burstMobDeath(self.transform.x(), self.transform.y())
      world.remove(self)
    endif
  endif
endfunction

EndClass
```
````

**`SpawnPoint.bas`** — only `hit` changes; replace the whole file's code block with:

````markdown
```bas
' demo-src/bullet-hell-shooter/SpawnPoint.bas
Class
Extends sprite

dim hp
dim destroyed
dim spawnInterval
dim elapsed
dim mobs
dim chaseTarget

Constructor(x, y, interval, mobsArray, targetRef)
  super("spawnpoint.png")
  self.transform.setPosition(x, y)
  self.hp = 20
  self.destroyed = false
  self.spawnInterval = interval
  self.elapsed = 0
  self.mobs = mobsArray
  self.chaseTarget = targetRef
EndConstructor

function onupdate(delta)
  dim dt
  dim m as mob
  if not self.destroyed then
    dt = delta / 1000
    self.elapsed = self.elapsed + dt
    if self.elapsed >= self.spawnInterval then
      self.elapsed = 0
      m = new Mob(self.transform.x(), self.transform.y(), self.chaseTarget)
      world.add(m)
      array.push(self.mobs, m)
    endif
  endif
endfunction

function hit(damage)
  if not self.destroyed and self.hp > 0 then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.destroyed = true
      self.setTexture("spawnpoint_destroyed.png")
      particles.burstSpawnDestroyed(self.transform.x(), self.transform.y())
    endif
  endif
endfunction

EndClass
```
````

**`Bullet.bas`** — only `onupdate`'s three collision despawns change; replace the whole file's code block with:

````markdown
```bas
' demo-src/bullet-hell-shooter/Bullet.bas
Class
Extends sprite

dim vx
dim vy
dim damage
dim lifetime
dim elapsed
dim level as tilemapset
dim spawnPoints() as spawnpoint
dim mobs() as mob

Constructor(x, y, angle, weaponType, levelRef as tilemapset, spawnPointsRef() as spawnpoint, mobsRef() as mob)
  dim speed
  super("bullet.png")
  self.transform.setPosition(x, y)
  self.setAngle(angle * 180 / math.pi())
  self.level = levelRef
  self.spawnPoints = spawnPointsRef
  self.mobs = mobsRef
  self.elapsed = 0

  if weaponType = "shotgun" then
    self.damage = 8
    self.lifetime = 0.6
    speed = 220
  elseif weaponType = "smg" then
    self.damage = 5
    self.lifetime = 0.8
    speed = 320
  else
    self.damage = 10
    self.lifetime = 1
    speed = 260
  endif

  self.vx = math.cos(angle) * speed
  self.vy = math.sin(angle) * speed
EndConstructor

function onupdate(delta)
  dim dt
  dim x
  dim y
  dim i

  dt = delta / 1000
  x = self.transform.x() + self.vx * dt
  y = self.transform.y() + self.vy * dt
  self.transform.setPosition(x, y)

  self.elapsed = self.elapsed + dt
  if self.elapsed >= self.lifetime then
    world.remove(self)
    return
  endif

  if self.level.tileAt("walls", x, y) <> 0 then
    particles.burstBulletImpact(x, y)
    world.remove(self)
    return
  endif

  for i = 0 to array.arrLength(self.spawnPoints) - 1
    if not self.spawnPoints(i).destroyed then
      if collision.spriteCollide(self, self.spawnPoints(i)) then
        self.spawnPoints(i).hit(self.damage)
        particles.burstBulletImpact(x, y)
        world.remove(self)
        return
      endif
    endif
  next i

  for i = 0 to array.arrLength(self.mobs) - 1
    if not self.mobs(i).dead then
      if collision.spriteCollide(self, self.mobs(i)) then
        self.mobs(i).hit(self.damage)
        particles.burstBulletImpact(x, y)
        world.remove(self)
        return
      endif
    endif
  next i
endfunction

EndClass
```
````

**`Level1Scene.bas`** — only `onenter`'s first lines change (adds `particles.setup()`); replace the whole file's code block with:

````markdown
```bas
' demo-src/bullet-hell-shooter/Level1Scene.bas
Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim spawnPoints
dim mobs
dim pickups
dim cleared
dim clearTimer
dim hpLabel as text
dim hpBg as sprite
dim hpFill as sprite
dim weaponLabel as text
dim spawnLabel as text
dim timerLabel as text

Constructor()
EndConstructor

function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(0, 0)
  particles.setup()

  dim tm as tilemapset
  tm = new tilemapset("map1.stm")
  world.add(tm)
  self.tilemapset = tm

  collision.setupTileCollision(tm)

  pathfinding.setup(tm, self.wallLayers())

  dim p as player
  p = new Player(64, 64)
  world.add(p)
  self.player = p

  dim empty(0)
  self.mobs = empty

  self.spawnPoints = levelhelpers.spawnPointsFromMarkers(tm, "spawn", 6, self.mobs, p)
  self.pickups = levelhelpers.pickupsFromMarkers(tm, "pickup")

  p.setLevel(tm, self.spawnPoints, self.mobs)

  camera.setZoom(2)
  camera.follow(p, 0.1)

  self.setupHud()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction

function setupHud()
  dim bg as sprite
  bg = new sprite("healthbar_bg.png")
  bg.transform.setPosition(20, 20)
  bg.setScale(100, 14)
  hud.add(bg)
  self.hpBg = bg

  dim fill as sprite
  fill = new sprite("healthbar_fill.png")
  fill.transform.setPosition(20, 20)
  fill.setScale(100, 14)
  hud.add(fill)
  self.hpFill = fill

  dim hpl as text
  hpl = new text("HP", 20, 36)
  hpl.setStyle(12, 255, 255, 255)
  hud.add(hpl)
  self.hpLabel = hpl

  dim wl as text
  wl = new text("Pistol", 600, 20)
  wl.setStyle(14, 255, 255, 255)
  hud.add(wl)
  self.weaponLabel = wl

  dim sl as text
  sl = new text("Spawns: 0", 600, 40)
  sl.setStyle(14, 255, 255, 255)
  hud.add(sl)
  self.spawnLabel = sl

  dim tl as text
  tl = new text("00:00", 360, 20)
  tl.setStyle(16, 255, 255, 0)
  hud.add(tl)
  self.timerLabel = tl
endfunction

function onupdate(delta)
  dim dt
  dim t
  dt = delta / 1000
  t = gamedata.getLevelTime(0) + dt
  gamedata.setLevelTime(0, t)

  self.hpFill.setScale(100 * (self.player.getHp() / 100), 14)
  self.weaponLabel.setText(self.player.getCurrentWeapon())
  self.spawnLabel.setText("Spawns: " + string.str(levelhelpers.spawnPointsRemaining(self.spawnPoints)))
  self.timerLabel.setText(levelhelpers.formatTime(t))

  levelhelpers.checkPickupCollisions(self.player, self.pickups)

  if not self.cleared then
    if levelhelpers.allSpawnPointsDestroyed(self.spawnPoints) then
      self.cleared = true
    endif
  else
    self.clearTimer = self.clearTimer + dt
    if self.clearTimer >= 2 then
      scenemanager.switch("level2")
    endif
  endif

  if self.player.getHp() <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
```
````

**`Level2Scene.bas`** — same single-line addition; replace the whole file's code block with:

````markdown
```bas
' demo-src/bullet-hell-shooter/Level2Scene.bas
Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim spawnPoints
dim mobs
dim pickups
dim cleared
dim clearTimer
dim hpLabel as text
dim hpBg as sprite
dim hpFill as sprite
dim weaponLabel as text
dim spawnLabel as text
dim timerLabel as text

Constructor()
EndConstructor

function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(1, 0)
  particles.setup()

  dim tm as tilemapset
  tm = new tilemapset("map2.stm")
  world.add(tm)
  self.tilemapset = tm

  collision.setupTileCollision(tm)

  pathfinding.setup(tm, self.wallLayers())

  dim p as player
  p = new Player(64, 64)
  world.add(p)
  self.player = p

  dim empty(0)
  self.mobs = empty

  self.spawnPoints = levelhelpers.spawnPointsFromMarkers(tm, "spawn", 4.5, self.mobs, p)
  self.pickups = levelhelpers.pickupsFromMarkers(tm, "pickup")

  p.setLevel(tm, self.spawnPoints, self.mobs)

  camera.setZoom(2)
  camera.follow(p, 0.1)

  self.setupHud()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction

function setupHud()
  dim bg as sprite
  bg = new sprite("healthbar_bg.png")
  bg.transform.setPosition(20, 20)
  bg.setScale(100, 14)
  hud.add(bg)
  self.hpBg = bg

  dim fill as sprite
  fill = new sprite("healthbar_fill.png")
  fill.transform.setPosition(20, 20)
  fill.setScale(100, 14)
  hud.add(fill)
  self.hpFill = fill

  dim hpl as text
  hpl = new text("HP", 20, 36)
  hpl.setStyle(12, 255, 255, 255)
  hud.add(hpl)
  self.hpLabel = hpl

  dim wl as text
  wl = new text("Pistol", 600, 20)
  wl.setStyle(14, 255, 255, 255)
  hud.add(wl)
  self.weaponLabel = wl

  dim sl as text
  sl = new text("Spawns: 0", 600, 40)
  sl.setStyle(14, 255, 255, 255)
  hud.add(sl)
  self.spawnLabel = sl

  dim tl as text
  tl = new text("00:00", 360, 20)
  tl.setStyle(16, 255, 255, 0)
  hud.add(tl)
  self.timerLabel = tl
endfunction

function onupdate(delta)
  dim dt
  dim t
  dt = delta / 1000
  t = gamedata.getLevelTime(1) + dt
  gamedata.setLevelTime(1, t)

  self.hpFill.setScale(100 * (self.player.getHp() / 100), 14)
  self.weaponLabel.setText(self.player.getCurrentWeapon())
  self.spawnLabel.setText("Spawns: " + string.str(levelhelpers.spawnPointsRemaining(self.spawnPoints)))
  self.timerLabel.setText(levelhelpers.formatTime(t))

  levelhelpers.checkPickupCollisions(self.player, self.pickups)

  if not self.cleared then
    if levelhelpers.allSpawnPointsDestroyed(self.spawnPoints) then
      self.cleared = true
    endif
  else
    self.clearTimer = self.clearTimer + dt
    if self.clearTimer >= 2 then
      scenemanager.switch("level3")
    endif
  endif

  if self.player.getHp() <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
```
````

**`Level3Scene.bas`** — same single-line addition; replace the whole file's code block with:

````markdown
```bas
' demo-src/bullet-hell-shooter/Level3Scene.bas
Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim spawnPoints
dim mobs
dim pickups
dim cleared
dim clearTimer
dim hpLabel as text
dim hpBg as sprite
dim hpFill as sprite
dim weaponLabel as text
dim spawnLabel as text
dim timerLabel as text

Constructor()
EndConstructor

function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(2, 0)
  particles.setup()

  dim tm as tilemapset
  tm = new tilemapset("map3.stm")
  world.add(tm)
  self.tilemapset = tm

  collision.setupTileCollision(tm)

  pathfinding.setup(tm, self.wallLayers())

  dim p as player
  p = new Player(64, 64)
  world.add(p)
  self.player = p

  dim empty(0)
  self.mobs = empty

  self.spawnPoints = levelhelpers.spawnPointsFromMarkers(tm, "spawn", 3, self.mobs, p)
  self.pickups = levelhelpers.pickupsFromMarkers(tm, "pickup")

  p.setLevel(tm, self.spawnPoints, self.mobs)

  camera.setZoom(2)
  camera.follow(p, 0.1)

  self.setupHud()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction

function setupHud()
  dim bg as sprite
  bg = new sprite("healthbar_bg.png")
  bg.transform.setPosition(20, 20)
  bg.setScale(100, 14)
  hud.add(bg)
  self.hpBg = bg

  dim fill as sprite
  fill = new sprite("healthbar_fill.png")
  fill.transform.setPosition(20, 20)
  fill.setScale(100, 14)
  hud.add(fill)
  self.hpFill = fill

  dim hpl as text
  hpl = new text("HP", 20, 36)
  hpl.setStyle(12, 255, 255, 255)
  hud.add(hpl)
  self.hpLabel = hpl

  dim wl as text
  wl = new text("Pistol", 600, 20)
  wl.setStyle(14, 255, 255, 255)
  hud.add(wl)
  self.weaponLabel = wl

  dim sl as text
  sl = new text("Spawns: 0", 600, 40)
  sl.setStyle(14, 255, 255, 255)
  hud.add(sl)
  self.spawnLabel = sl

  dim tl as text
  tl = new text("00:00", 360, 20)
  tl.setStyle(16, 255, 255, 0)
  hud.add(tl)
  self.timerLabel = tl
endfunction

function onupdate(delta)
  dim dt
  dim t
  dt = delta / 1000
  t = gamedata.getLevelTime(2) + dt
  gamedata.setLevelTime(2, t)

  self.hpFill.setScale(100 * (self.player.getHp() / 100), 14)
  self.weaponLabel.setText(self.player.getCurrentWeapon())
  self.spawnLabel.setText("Spawns: " + string.str(levelhelpers.spawnPointsRemaining(self.spawnPoints)))
  self.timerLabel.setText(levelhelpers.formatTime(t))

  levelhelpers.checkPickupCollisions(self.player, self.pickups)

  if not self.cleared then
    if levelhelpers.allSpawnPointsDestroyed(self.spawnPoints) then
      self.cleared = true
    endif
  else
    self.clearTimer = self.clearTimer + dt
    if self.clearTimer >= 2 then
      scenemanager.switch("winscene")
    endif
  endif

  if self.player.getHp() <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
```
````


- [ ] **Step 6: Commit**

```bash
git add src/docs/demos/bullet-hell-shooter.md
git commit -m "docs: document particle effects in the Bullet Hell Shooter write-up"
```

---

### Task 10: Re-verify the Cypress e2e demo spec

**Files:** none (verification only — `cypress/e2e/demos.cy.ts`'s existing `bullet-hell-shooter` block reads the real `.b4wgl.json` generically, so it needs no code change; it just needs to be re-run against the rebuilt export)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (leave running)

- [ ] **Step 2: Run the demos e2e spec**

In a second terminal: `npm run cypress:run` (or `npm run cypress:open` and run the `demos.cy.ts` spec interactively)
Expected: the `Demo: Bullet Hell Shooter` test passes — no `ERR` entries detected in the console panel after Run.

If it fails, treat this the same as Task 8 Step 2 — fix the relevant `.bas` file, rebuild (Task 8 Step 1), and re-verify both the live app and this spec before proceeding.

- [ ] **Step 3: Report the result**

No commit needed for this task — it's a verification-only gate. Report pass/fail plainly in the task summary.

---

### Task 11: Final full-suite check

- [ ] **Step 1: Full unit/transpiler test suite**

Run: `npx vitest run`
Expected: same pass count as before this plan started, zero regressions (this plan touches no engine code, only demo content and docs, so nothing here should be able to change).

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: succeeds, no new warnings beyond the pre-existing chunk-size one.

No commit needed unless Step 1 or 2 surfaces something to fix — this task is a final safety net, not expected to produce changes.
