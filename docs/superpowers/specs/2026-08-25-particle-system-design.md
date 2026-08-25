# Particle System (`Emitter`) — Design

## Goal

A new softBASIC engine feature: a general-purpose `Emitter` class for particle effects — impacts/sparks, trails, ambient effects (torches, dust), and explosions/area bursts. Motivated by wanting to visually "spice up" the existing demos (Dungeon Explorer, Bullet-Hell Shooter, Coins Platformer, the Raycaster), but this spec covers the engine capability only — which demos adopt it, and how, is a deliberately separate follow-up decision, not part of this feature's scope.

Tracked as a known gap before this: `docs/language/library-roadmap.md`'s "Lower Priority / Future" section already lists *"Particle system — emitter abstraction over PIXI particles. Not started."* This closes that out.

## Key design decision: PIXI for rendering, hand-rolled behavior on top

Researched before designing this (not assumed): PixiJS v8 ships a native `PIXI.ParticleContainer` + `PIXI.Particle` in core — purpose-built for rendering large numbers of lightweight particles fast (batched position/scale/rotation/color, far cheaper per-instance than a full `PIXI.Sprite`). It is *only* a rendering optimization, though — no spawn rate, lifetime, or behavior-over-time concept built in. The library that traditionally provided that behavior layer, `@pixi/particle-emitter`, does **not** support PixiJS v8 (confirmed via the project's own [open GitHub issue](https://github.com/pixijs-userland/particle-emitter/issues/211) — the v8 `DisplayObject` changes were too large to port). An unofficial community fork (`@spd789562/particle-emitter`) exists for v8, but pulling in an obscure third-party package for something this central was rejected in favor of consistency with how this codebase already builds every other engine capability (`tween`, `pathfinding`, `collision`) — PIXI supplies primitives, a hand-written module in `src/components/Runner/engine/` supplies the game-facing behavior on top.

So: one `PIXI.ParticleContainer` per `Emitter` instance (added to `worldContainer`/`hudContainer` exactly like any other sprite's `_handle`), with individual `PIXI.Particle`s spawned into and removed from it. All spawn timing, velocity integration, aging, and lifetime-based property interpolation is hand-written JS in a new `src/components/Runner/engine/particles.js`, following the exact shape `tween.js` and `pathfinding.js` already use — a small piece of state per active instance, no framework beyond what's already established.

**PIXI's `Particle` API is documented as "stable but experimental."** Accepted as ordinary version-pin risk, not a special case — every engine module here is already built against a CDN-pinned PIXI version that could change on any future bump, same as `PIXI.Sprite`, `PIXI.Container`, or anything else this codebase touches.

Exact `PIXI.ParticleContainer`/`PIXI.Particle` constructor signatures (constructor options shape, which properties `dynamicProperties` needs to mark) are **not pinned in this spec** — to be confirmed against the actual installed PIXI version's real API during implementation, the same way every other engine feature in this codebase verifies live rather than assumes.

## Integration with the fixed-timestep loop

Hooks into the same fixed-step simulation every other per-frame system already uses. `scene.js`'s `_fixedStep(delta)` gains one more call, alongside the existing ones:

```js
_fixedStep(delta) {
  _sbLifecycle._update.call(this, delta);
  if (this._activeScene && this._activeScene.onupdate) { /* ... */ }
  this._applySwitch();
  this._cameraUpdate(delta);
  this._pathfindingUpdate(delta);
  this._tweenUpdate(delta);
  this._particlesUpdate(delta);   // <-- new
  this._resetFrameInput();
}
```

So spawn rate and particle lifetime are frame-rate independent, exactly like kinematics/pathfinding/tween.

**Deliberate scope cut: individual particles are not run through the interpolated-render system.** Sprites get their position blended between fixed-step samples via `_sbFrameLoop`'s snapshot/render-prepare/after-render cycle (see `docs/superpowers/plans/2026-08-24-fixed-timestep-interpolation-plan.md`). Particles skip this. Two reasons: interpolating potentially hundreds of individual particles every rendered frame adds real per-particle overhead that works against the entire reason `ParticleContainer` was chosen over plain sprites, and a few pixels of jitter on one spark within a chaotic burst of many is far less perceptible than the same jitter would be on a single primary sprite like the player. If an emitter is `attachTo()`'d to a moving sprite, the *emitter itself* (and therefore where newly-spawned particles originate) still moves correctly every fixed step — only in-flight particles' own subsequent motion is exempt from interpolation.

## The `Emitter` class

Shaped like `sprite` — `Constructor(texturePath)`, added via `world.add`/`world.remove`, positioned via the standard `self.transform`:

```bas
dim spark as Emitter("spark.png")

function onenter()
  spark.transform.setPosition(100, 100)
  spark.setLifetime(0.5, 1.0)
  spark.setSpeed(50, 120)
  spark.setDirection(0, 360)
  spark.setAlphaOverLife(1, 0)
  world.add(spark)
  spark.burst(20)              ' one-shot: an impact/explosion
endfunction
```

```bas
dim trail as Emitter("smoke.png")

function onenter()
  trail.attachTo(player)       ' follows the player automatically, reusing attachTo/detach
  trail.transform.setPosition(0, 0)
  trail.setSpawnRate(30)       ' continuous
  trail.setLifetime(0.3, 0.6)
  trail.setScaleOverLife(1, 0.2)
  world.add(trail)
  trail.start()
endfunction
```

### Config setters (all optional; every property has a sensible default, set in the constructor — no `Keyframe`-style `has*` tracking needed, since an `Emitter`'s own config is never combined with another emitter's the way multiple `tween` keyframes can combine channels)

| Setter | Purpose | Default |
|---|---|---|
| `setLifetime(min, max)` | Seconds a particle lives before dying | `1, 1` |
| `setSpawnRate(perSecond)` | Continuous emission rate while `start()`ed | `0` (off) |
| `setMaxParticles(n)` | Hard cap on concurrent particles for this emitter | `200` |
| `setSpeed(min, max)` | Initial velocity magnitude (px/s) | `50, 100` |
| `setDirection(angleMin, angleMax)` | Spawn velocity angle spread, degrees | `0, 360` (full circle) |
| `setGravity(x, y)` | Constant acceleration applied every fixed step (px/s²) | `0, 0` |
| `setScaleOverLife(start, end)` | Linear scale interpolation across the particle's life | `1, 1` |
| `setAlphaOverLife(start, end)` | Linear alpha interpolation across the particle's life | `1, 0` (fade out) |
| `setColorOverLife(startRGB, endRGB)` | Linear tint interpolation (each an `0xRRGGBB` int) | `0xFFFFFF, 0xFFFFFF` (no shift) |
| `setSpawnShape(shape, ...)` | Where within the emitter new particles originate: `"point"` (default), `"circle"` (radius), `"box"` (w, h) | `"point"` |

### Actions

- `start()` / `stop()` — toggle continuous emission (driven by `setSpawnRate`). A stopped emitter's already-alive particles keep aging/moving/dying normally; only new spawning halts.
- `burst(count)` — spawns `count` particles immediately, once. Independent of `start()`/`stop()` state — usable on a continuously-running emitter too (e.g. a bigger puff on top of steady smoke).
- `attachTo(sprite)` / `detach()` — reuses the *existing* `_sbAttach.attachSprite`/`detachSprite` engine functions unchanged (a `PIXI.ParticleContainer` is a `PIXI.Container` subclass, so it reparents exactly like any sprite's handle does — no new follow logic needed).

## Engine implementation shape

New `src/components/Runner/engine/particles.js`:

```js
const _sbParticles = {
  _emitters: new Map(), // ParticleContainer handle -> runtime state

  createEmitter(texturePath) {
    const texture = _sbAssets.get(texturePath);
    const container = new PIXI.ParticleContainer(/* dynamic-properties options, TBD against real API */);
    this._emitters.set(container, {
      texture,
      particles: [],           // { particle, age, lifetime, vx, vy }
      spawning: false,
      spawnAccumulator: 0,
      lifetimeMin: 1, lifetimeMax: 1,
      spawnRate: 0,
      maxParticles: 200,
      speedMin: 50, speedMax: 100,
      dirMin: 0, dirMax: 360,
      gravityX: 0, gravityY: 0,
      scaleStart: 1, scaleEnd: 1,
      alphaStart: 1, alphaEnd: 0,
      colorStart: 0xffffff, colorEnd: 0xffffff,
      spawnShape: 'point', spawnShapeArgs: [],
    });
    return container;
  },

  // One setter per config field, each mutating this._emitters.get(handle).
  setEmitterLifetime(handle, min, max) { /* ... */ },
  // ... etc for every field in the table above ...

  emitterStart(handle) { this._emitters.get(handle).spawning = true; },
  emitterStop(handle) { this._emitters.get(handle).spawning = false; },
  emitterBurst(handle, count) { /* spawn `count` particles immediately */ },

  _particlesUpdate(delta) {
    const dt = delta / 1000;
    for (const [handle, state] of this._emitters) {
      // 1. continuous spawn: accumulate state.spawnRate * dt, spawn whole particles, respecting maxParticles
      // 2. for each live particle: age += dt; if age >= lifetime, remove from container + array;
      //    else integrate position (velocity, then gravity), interpolate scale/alpha/color by age/lifetime, write back to the PIXI.Particle
    }
  },
};
```

Wired into `_sb` in `softBasicEngine.js` (spread order matters only in that it must come before `_sbFrameLoop`, same rule every other module already follows) and `_particlesUpdate` added to `scene.js`'s `_fixedStep` as shown above.

## `.bas` def file

New `src/lib/Basic4WebGL/defs/Emitter.bas`, hand-written (not descriptor-generated — matching `tween`/`Keyframe`/`pathfinding`, not the `registry.ts`-generated files):

```bas
Class
dim _handle

Constructor(texturePath)
    self._handle = call("_sb.createEmitter(constructor_texturePath)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function setLifetime(minSeconds, maxSeconds)
    call("_sb.setEmitterLifetime(this._handle, setlifetime_minSeconds, setlifetime_maxSeconds)")
endfunction

' ... one function per setter in the table above, same call() shape ...

function start()
    call("_sb.emitterStart(this._handle)")
endfunction

function stop()
    call("_sb.emitterStop(this._handle)")
endfunction

function burst(count)
    call("_sb.emitterBurst(this._handle, burst_count)")
endfunction

function attachTo(parent)
    call("_sb.attachSprite(this._handle, attachto_parent)")
endfunction

function detach()
    call("_sb.detachSprite(this._handle)")
endfunction

EndClass
```

## Caveats (documented plainly, matching this codebase's existing convention)

1. **`setSpawnShape`'s variadic-looking signature isn't actually variadic.** softBASIC has no variadic parameter support (see the array-literal design's rejection of an `array.of(...)` approach for the same reason). `setSpawnShape("point")`, `setSpawnShape("circle", radius)`, and `setSpawnShape("box", w, h)` need to resolve to a fixed parameter list — exact signature (e.g. `setSpawnShape(shape, a, b)` with unused args ignored per shape) to be nailed down in the implementation plan, not this spec.
2. **`world.remove()` on an attached emitter has the same caveat `attachTo`'s own spec already documents for any attached sprite** — call `detach()` first, or it remains a dangling child of its (still-alive) parent instead of being cleaned up.
3. **Particles are not queryable game objects.** No collision/hit-testing against individual particles, no softBASIC-level access to a single particle's own state — purely visual. If a demo needs "did this particle hit something," that's built at the demo layer (e.g. spawn a burst *because* a hit was already detected elsewhere), not by the particle system itself.
4. **No color-over-life without a plain (non-tinted) source texture in mind.** `setColorOverLife` multiplies the source texture's colors (standard PIXI tinting) — a texture that's already colorful will look different than a white/greyscale one under a color tint. Not a bug, just worth stating so it's not a surprise the first time someone tints a multi-colored spark texture.

## Tests

- Transpiler codegen tests for every `Emitter` method (`tests/lib/Basic4WebGL/unit/transpiler/emitter.test.ts`), mirroring the existing `tween`/`Keyframe` transpiler test shape.
- Engine-level tests (`tests/components/Runner/particles.test.ts`), following the real-module-concatenation pattern `tween.test.ts`/`attach.test.ts` already use. Covers at minimum: `createEmitter` returns a real `PIXI.ParticleContainer`-shaped handle; `burst(n)` spawns exactly `n` particles immediately regardless of `spawning` state; continuous spawning respects `spawnRate` and `maxParticles`; a particle is removed once `age >= lifetime`; scale/alpha/color interpolate linearly across a particle's life; `_particlesUpdate` is a no-op when `_emitters` is empty (cheap when unused, matching `_pathfindingUpdate`'s existing early-return pattern).
- `frameloop.test.ts`/`scene.test.ts` gain a check that `_particlesUpdate` is actually called from `_fixedStep`, mirroring the existing assertions for `_pathfindingUpdate`/`_tweenUpdate`.

## Docs

- New `src/docs/api-reference/emitter.md` — full API reference page (Constructor section per this codebase's class-doc convention, one entry per setter/action, beginner-audience game-scenario examples per the writing-style rules in `CLAUDE.md`).
- `docs/language/library-roadmap.md`: move "Particle system — emitter abstraction over PIXI particles. Not started." from "Lower Priority / Future" to done, with the same level of implementation-narrative detail the `tween`/`attachTo` entries already have (including the "why not the official/fork emitter library" reasoning from this spec).

## Explicitly out of scope for this spec

- Which (if any) existing demo adopts particle effects, and how — a separate decision after this ships, per the explicit instruction that started this design ("code first... then think of either amending existing demos or new demos").
- A visual particle editor in the IDE — explicitly deferred; this is a code-only API for now, matching how `tween`/`Keyframe` shipped.
- A shared/global particle pool across multiple emitters (one `ParticleContainer` per `Emitter` instance is simpler and sufficient; a shared pool would be a pure performance optimization with real added complexity — texture-atlas constraints across unrelated effects, cross-emitter bookkeeping — not worth taking on before there's a demonstrated need).
