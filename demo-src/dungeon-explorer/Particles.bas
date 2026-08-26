' demo-src/dungeon-explorer/Particles.bas
dim hitSparkEmitter as Emitter
dim enemyDeathEmitter as Emitter
dim bossDeathEmitter as Emitter
dim keySparkleEmitter as Emitter

function setup()
  hitSparkEmitter = new Emitter("particle.png")
  hitSparkEmitter.setLifetime(0.15, 0.25)
  hitSparkEmitter.setSpeed(40, 90)
  hitSparkEmitter.setDirection(0, 360)
  hitSparkEmitter.setScaleOverLife(0.35, 0.05)
  hitSparkEmitter.setAlphaOverLife(1, 0)
  hitSparkEmitter.setColorOverLife(16777215, 16755200)
  hitSparkEmitter.setMaxParticles(60)
  world.add(hitSparkEmitter)

  enemyDeathEmitter = new Emitter("particle.png")
  enemyDeathEmitter.setLifetime(0.35, 0.5)
  enemyDeathEmitter.setSpeed(30, 80)
  enemyDeathEmitter.setDirection(0, 360)
  enemyDeathEmitter.setGravity(0, 80)
  enemyDeathEmitter.setScaleOverLife(0.5, 0.1)
  enemyDeathEmitter.setAlphaOverLife(1, 0)
  enemyDeathEmitter.setColorOverLife(16729156, 9109504)
  enemyDeathEmitter.setMaxParticles(80)
  world.add(enemyDeathEmitter)

  bossDeathEmitter = new Emitter("particle.png")
  bossDeathEmitter.setLifetime(0.6, 1)
  bossDeathEmitter.setSpeed(60, 160)
  bossDeathEmitter.setDirection(0, 360)
  bossDeathEmitter.setGravity(0, 100)
  bossDeathEmitter.setScaleOverLife(0.7, 0.1)
  bossDeathEmitter.setAlphaOverLife(1, 0)
  bossDeathEmitter.setColorOverLife(16766720, 16747520)
  bossDeathEmitter.setMaxParticles(120)
  world.add(bossDeathEmitter)

  keySparkleEmitter = new Emitter("particle.png")
  keySparkleEmitter.setLifetime(0.3, 0.45)
  keySparkleEmitter.setSpeed(15, 40)
  keySparkleEmitter.setDirection(0, 360)
  keySparkleEmitter.setScaleOverLife(0.3, 0.05)
  keySparkleEmitter.setAlphaOverLife(1, 0)
  keySparkleEmitter.setColorOverLife(16766720, 16777215)
  keySparkleEmitter.setMaxParticles(40)
  world.add(keySparkleEmitter)
endfunction

function burstHitSpark(x, y)
  hitSparkEmitter.transform.setPosition(x, y)
  hitSparkEmitter.burst(6)
endfunction

function burstEnemyDeath(x, y)
  enemyDeathEmitter.transform.setPosition(x, y)
  enemyDeathEmitter.burst(12)
endfunction

function burstBossDeath(x, y)
  bossDeathEmitter.transform.setPosition(x, y)
  bossDeathEmitter.burst(30)
endfunction

function burstKeySparkle(x, y)
  keySparkleEmitter.transform.setPosition(x, y)
  keySparkleEmitter.burst(10)
endfunction
