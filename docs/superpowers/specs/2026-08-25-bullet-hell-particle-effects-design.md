# Bullet Hell Shooter — Particle Effects Design

## Goal

Add particle effects (built on the `Emitter` class shipped in `docs/superpowers/specs/2026-08-25-particle-system-design.md`) to the Bullet Hell Shooter demo, at four moments: mob death, spawn point destruction, bullet impact, and the player taking damage. This is also a deliberate real-world performance check for the particle system — Bullet Hell is the most particle-hungry demo candidate in the project (constant bullets, frequent mob deaths, chaotic combat), so it's a fair test of whether the system holds up under genuine gameplay load, not a synthetic stress test.

## Non-goals

- No stress-test mode, debug lever, or artificially inflated spawn rates to find a breaking point. Effects are sized the way a real shipped game would size them; if that's not performant enough, that's the honest finding to report.
- No weapon-pickup sparkle or muzzle-flash effect — out of scope for this pass (four events only, per the approved scope).
- No changes to game balance, mob/bullet stats, or level design.

## Architecture

### Why persistent, reused emitters instead of one-per-event

`Emitter` has no destroy method — a `PIXI.ParticleContainer` created per event and never cleaned up would leak over a long play session (mob deaths happen constantly). Instead: **one `Emitter` per effect type, created once, repositioned and `burst()` at each event.**

### New module: `Particles.bas`

A plain module (no `Class`), following the same pattern as the existing `GameData.bas` (module-level state, reset/rebuilt per level) rather than `LevelHelpers.bas` (currently stateless). Lives at `demo-src/bullet-hell-shooter/Particles.bas`.

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
  mobDeathEmitter.setColorOverLife(16729156, 9109504) ' red -> dark red
  mobDeathEmitter.setMaxParticles(80)
  world.add(mobDeathEmitter)

  spawnDestroyedEmitter = new Emitter("particle.png")
  spawnDestroyedEmitter.setLifetime(0.6, 0.6)
  spawnDestroyedEmitter.setSpeed(60, 140)
  spawnDestroyedEmitter.setDirection(0, 360)
  spawnDestroyedEmitter.setGravity(0, 100)
  spawnDestroyedEmitter.setScaleOverLife(1.4, 0.2)
  spawnDestroyedEmitter.setAlphaOverLife(1, 0)
  spawnDestroyedEmitter.setColorOverLife(16777096, 16729156) ' yellow -> orange/red
  spawnDestroyedEmitter.setMaxParticles(60)
  world.add(spawnDestroyedEmitter)

  bulletImpactEmitter = new Emitter("particle.png")
  bulletImpactEmitter.setLifetime(0.2, 0.2)
  bulletImpactEmitter.setSpeed(20, 50)
  bulletImpactEmitter.setDirection(0, 360)
  bulletImpactEmitter.setScaleOverLife(0.8, 0.1)
  bulletImpactEmitter.setAlphaOverLife(1, 0)
  bulletImpactEmitter.setColorOverLife(16777215, 11184810) ' white -> gray
  bulletImpactEmitter.setMaxParticles(150)
  world.add(bulletImpactEmitter)

  playerHitEmitter = new Emitter("particle.png")
  playerHitEmitter.setLifetime(0.3, 0.3)
  playerHitEmitter.setSpeed(30, 70)
  playerHitEmitter.setDirection(0, 360)
  playerHitEmitter.setScaleOverLife(1, 0.2)
  playerHitEmitter.setAlphaOverLife(1, 0)
  playerHitEmitter.setColorOverLife(16729156, 16729156) ' red, flash-like
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

(Exact color-literal decimal values and tuning numbers above are illustrative starting points, not final — softBASIC has no `0x` hex literal syntax, per the fix already made to `src/docs/api-reference/emitter.md`, so any color must be written as a plain decimal `red*65536 + green*256 + blue`. The implementation plan will compute and verify each one, and tuning may change slightly once seen running in-game.)

### Per-level wiring

Each of `Level1Scene.bas`/`Level2Scene.bas`/`Level3Scene.bas`'s `onenter()` gains one line, `particles.setup()`, alongside the existing tilemap/player/spawn-point construction — because switching scenes clears the world (confirmed: each level's `onenter()` already reconstructs its tilemap/player/spawn points/pickups from scratch every time it's entered), any emitters from a previous level are gone and must be rebuilt fresh per level, exactly like everything else in `onenter()`.

### Trigger call sites (one line each, at an already-existing branch)

- `Mob.bas`, in `hit(damage)`: inside the `if self.hp <= 0 then` branch, before `world.remove(self)` — call `particles.burstMobDeath(self.transform.x(), self.transform.y())`.
- `SpawnPoint.bas`, in `hit(damage)`: inside the `if self.hp <= 0 then` branch, alongside `self.destroyed = true` — call `particles.burstSpawnDestroyed(self.transform.x(), self.transform.y())`.
- `Bullet.bas`, in `onupdate(delta)`: at each of the three *collision*-based `world.remove(self)` calls (wall tile hit, spawn point hit, mob hit) — call `particles.burstBulletImpact(x, y)` using the bullet's already-computed `x, y` locals. The lifetime-timeout despawn (`self.elapsed >= self.lifetime`) does **not** get a burst.
- `Player.bas`, in `takeDamage(amount)`: inside the `if self.invincibleTime <= 0 then` branch (i.e. only when damage actually lands, not while already invincible) — call `particles.burstPlayerHit(self.transform.x(), self.transform.y())`.

## New asset

One new sprite, `particle.png` — a small (~8×8) soft-edged white/grayscale round dot, generic enough that every effect's `setColorOverLife` tints it correctly. Generated procedurally (not hand-drawn), same approach used to produce placeholder art elsewhere in this project's tooling.

## Testing

- No new engine-level or transpiler-level unit tests are needed — `Emitter`/`particles.js` are already fully tested by the particle system's own test suite (`tests/components/Runner/particles.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/emitter.test.ts`). This work is pure consumption of an already-tested API, not new engine behavior.
- `cypress/e2e/demos.cy.ts`'s existing `bullet-hell-shooter` describe block must keep passing against the demo's real re-exported `.b4wgl.json` (per `docs/demo-authoring-guide.md`) — run it manually after the change, since it's not run automatically.
- **Live performance check** (the actual point of this exercise): play through a level in the real browser preview with combat busy enough to have multiple mobs, spawn points, and bullets active with particles firing, and report actual observed behavior honestly — frame rate impact, any visible stutter, particle counts in flight. If it's rough, say so plainly rather than downplaying it; a real finding here (in either direction) is the deliverable, not just "it compiles."

## Explicitly out of scope for this spec

- Muzzle flash / weapon-pickup sparkle (may be a natural follow-up, not requested now).
- Any change to the `Emitter`/`particles.js` engine itself — this consumes the existing API as-is.
- A stress-test/debug mode for artificially finding the particle system's breaking point.
