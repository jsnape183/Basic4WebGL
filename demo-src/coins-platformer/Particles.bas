' demo-src/coins-platformer/Particles.bas
dim jumpPuffEmitter as Emitter
dim landPuffEmitter as Emitter
dim levelCompleteEmitter as Emitter

function setup()
  jumpPuffEmitter = new Emitter("particle.png")
  jumpPuffEmitter.setLifetime(0.25, 0.35)
  jumpPuffEmitter.setSpeed(20, 40)
  jumpPuffEmitter.setDirection(0, 360)
  jumpPuffEmitter.setGravity(0, 40)
  jumpPuffEmitter.setScaleOverLife(0.6, 0.1)
  jumpPuffEmitter.setAlphaOverLife(0.8, 0)
  jumpPuffEmitter.setColorOverLife(13811350, 9205850)
  jumpPuffEmitter.setMaxParticles(40)
  world.add(jumpPuffEmitter)

  landPuffEmitter = new Emitter("particle.png")
  landPuffEmitter.setLifetime(0.3, 0.45)
  landPuffEmitter.setSpeed(30, 70)
  landPuffEmitter.setDirection(0, 360)
  landPuffEmitter.setGravity(0, 60)
  landPuffEmitter.setScaleOverLife(0.9, 0.1)
  landPuffEmitter.setAlphaOverLife(0.9, 0)
  landPuffEmitter.setColorOverLife(13811350, 9205850)
  landPuffEmitter.setMaxParticles(60)
  world.add(landPuffEmitter)

  levelCompleteEmitter = new Emitter("particle.png")
  levelCompleteEmitter.setLifetime(0.6, 1)
  levelCompleteEmitter.setSpeed(60, 160)
  levelCompleteEmitter.setDirection(0, 360)
  levelCompleteEmitter.setGravity(0, 150)
  levelCompleteEmitter.setScaleOverLife(1.2, 0.1)
  levelCompleteEmitter.setAlphaOverLife(1, 0)
  levelCompleteEmitter.setColorOverLife(16766720, 16747520)
  levelCompleteEmitter.setMaxParticles(100)
  world.add(levelCompleteEmitter)
endfunction

function burstJumpPuff(x, y)
  jumpPuffEmitter.transform.setPosition(x, y)
  jumpPuffEmitter.burst(4)
endfunction

function burstLandPuff(x, y)
  landPuffEmitter.transform.setPosition(x, y)
  landPuffEmitter.burst(10)
endfunction

function burstLevelComplete(x, y)
  levelCompleteEmitter.transform.setPosition(x, y)
  levelCompleteEmitter.burst(20)
endfunction
