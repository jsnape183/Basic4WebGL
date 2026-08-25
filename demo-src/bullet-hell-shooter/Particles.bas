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
