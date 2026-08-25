# Emitter

An `Emitter` produces a stream of small, short-lived visual particles — sparks from a hit, smoke trailing behind something moving, dust drifting near a torch, a burst when something explodes. Each particle moves on its own, fades or changes color over its short life, and disappears automatically. An emitter spawns particles in one of two ways: continuously, at a steady rate (`start()` + `setSpawnRate()`), or all at once (`burst()`).

## Constructor

An `Emitter` must be added to the world with `world.add()` before it will spawn, render, or animate any particles — just like a `sprite`.

```bas
dim spark as Emitter("spark.png")
world.add(spark)
```

| Parameter   | Type   | Description |
|-------------|--------|-------------|
| texturePath | string | Filename of the image used for every particle this emitter produces |

## setLifetime(minSeconds, maxSeconds)

Sets how long (in seconds) a particle lives before disappearing. Each particle picks a random value between the two.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| minSeconds | number | Shortest possible lifetime |
| maxSeconds | number | Longest possible lifetime |

```bas
spark.setLifetime(0.3, 0.8)
```

## setSpawnRate(perSecond)

Sets how many particles per second this emitter produces while running (see `start()`). Has no effect on `burst()`, which always spawns immediately regardless of this setting.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| perSecond | number | Particles to spawn every second |

```bas
smokeTrail.setSpawnRate(30)
```

## setMaxParticles(n)

Caps how many particles this emitter can have alive at once. Once the cap is reached, spawning pauses (both continuous and `burst()`) until older particles die off.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Maximum particles alive at once |

```bas
spark.setMaxParticles(50)
```

## setSpeed(minSpeed, maxSpeed)

Sets how fast (in pixels per second) a newly spawned particle moves. Each particle picks a random value between the two.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| minSpeed  | number | Slowest possible starting speed |
| maxSpeed  | number | Fastest possible starting speed |

```bas
spark.setSpeed(80, 200)
```

## setDirection(angleMin, angleMax)

Sets the range of directions (in degrees) a newly spawned particle can travel. 0 is to the right, 90 is down, and so on, matching `sprite.setAngle`. Use the full `0, 360` range (the default) for particles that spray outward in every direction, like an explosion.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angleMin  | number | Lowest possible direction, in degrees |
| angleMax  | number | Highest possible direction, in degrees |

```bas
' A narrow upward cone, like sparks from a struck flint
spark.setDirection(250, 290)
```

## setGravity(x, y)

Sets a constant acceleration, in pixels per second squared, applied to every particle every frame — positive `y` pulls particles downward over time, for example, letting sparks arc and fall instead of flying in a straight line forever.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal acceleration |
| y         | number | Vertical acceleration |

```bas
spark.setGravity(0, 300)
```

## setScaleOverLife(startScale, endScale)

Sets how a particle's size changes across its life, from `startScale` when it spawns to `endScale` right before it disappears. `1` is the texture's normal size.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| startScale | number | Size multiplier when the particle spawns |
| endScale   | number | Size multiplier right before the particle disappears |

```bas
' Starts full-size, shrinks away to nothing
smokeTrail.setScaleOverLife(1, 0)
```

## setAlphaOverLife(startAlpha, endAlpha)

Sets how a particle's transparency changes across its life. `1` is fully visible, `0` is fully invisible. Defaults to `1, 0` — every particle fades out by the time it disappears, unless this is called with different values.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| startAlpha | number | Opacity when the particle spawns |
| endAlpha   | number | Opacity right before the particle disappears |

```bas
spark.setAlphaOverLife(1, 0)
```

## setColorOverLife(startColor, endColor)

Sets how a particle's color tint changes across its life, from `startColor` when it spawns to `endColor` right before it disappears. Colors are numbers in the form `0xRRGGBB` — for example, `0xFF0000` is red.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| startColor | number | Tint color when the particle spawns |
| endColor   | number | Tint color right before the particle disappears |

```bas
' Fire-like sparks: starts yellow-white, cools to red
spark.setColorOverLife(0xFFFF88, 0xFF3300)
```

## setSpawnPoint()

Makes every new particle spawn from the emitter's exact position. This is the default — call this to switch back after using `setSpawnCircle`/`setSpawnBoxShape`.

```bas
spark.setSpawnPoint()
```

## setSpawnCircle(radius)

Makes every new particle spawn at a random point within a circle around the emitter's position, instead of exactly on it.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| radius    | number | Circle radius, in pixels |

```bas
' A campfire's worth of embers, not just one exact point
embers.setSpawnCircle(12)
```

## setSpawnBoxShape(width, height)

Makes every new particle spawn at a random point within a rectangle centered on the emitter's position, instead of exactly on it.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| width     | number | Rectangle width, in pixels |
| height    | number | Rectangle height, in pixels |

```bas
' Dust drifting up from along the whole width of a road
dust.setSpawnBoxShape(200, 20)
```

## start()

Begins continuous spawning at the rate set by `setSpawnRate`. Has no effect on `burst()`.

```bas
smokeTrail.start()
```

## stop()

Stops continuous spawning. Particles already alive keep moving, fading, and disappearing normally — only new spawning halts.

```bas
smokeTrail.stop()
```

## burst(count)

Spawns `count` particles immediately, once. Works regardless of whether the emitter is currently `start()`ed or `stop()`ped — useful for a one-off puff on top of a steady effect, or as the entire effect for something like an impact or explosion.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| count     | number | How many particles to spawn right now |

```bas
dim spark as Emitter("spark.png")
world.add(spark)

function onEnemyHit()
  spark.transform.setPosition(enemy.transform.x(), enemy.transform.y())
  spark.burst(15)
endfunction
```

## attachTo(parent)

Makes this emitter follow another sprite's position automatically, like a smoke trail behind something moving. Works exactly like `sprite.attachTo` (see the [sprite](sprite) docs) — once attached, the emitter's position is relative to the parent instead of the world.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| parent    | object | The sprite (or `animatedsprite`) to attach to. |

```bas
dim trail as Emitter("smoke.png")

function onenter()
  trail.attachTo(player)
  trail.setSpawnRate(20)
  trail.start()
  world.add(trail)
endfunction
```

## detach()

Stops this emitter from following whatever it was attached to with `attachTo`. It stays exactly where it was on screen at that moment; nothing resets. Calling `detach()` when the emitter isn't attached to anything does nothing.

```bas
trail.detach()
```

## transform

Position is controlled through `.transform`, exactly like every other visual object — see [ObjectTransform](objecttransform). While attached to another sprite (see `attachTo` above), position is relative to that sprite instead of the world.
