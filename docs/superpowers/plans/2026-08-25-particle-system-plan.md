# Particle System (`Emitter`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a general-purpose `Emitter` class for particle effects (impacts, trails, ambient effects, bursts), built on PixiJS v8's native `ParticleContainer`/`Particle` for rendering with hand-rolled spawn/lifetime/behavior logic in a new engine module — matching how `tween`/`pathfinding`/`collision` are already built.

**Architecture:** One `PIXI.ParticleContainer` per `Emitter` instance (added to `world`/`hud` exactly like a sprite's handle). A new `src/components/Runner/engine/particles.js` owns all particle spawning/aging/interpolation, driven once per fixed step from `scene.js`'s `_fixedStep`. `Emitter.bas` is a thin class (like `TileMap`/`TileMapSet`) whose methods `call()` straight into the new engine functions. `attachTo`/`detach` are reused unchanged from the existing `attach` engine module — no new follow logic.

**Tech Stack:** softBASIC compiler/transpiler (existing), PixiJS v8 (`PIXI.ParticleContainer`, `PIXI.Particle`, both core, no new dependency), Vitest.

**Design doc:** `docs/superpowers/specs/2026-08-25-particle-system-design.md` — read this first if anything below seems under-motivated.

**One refinement over the spec:** the spec flagged `setSpawnShape(shape, ...)` as needing a concrete signature because softBASIC has no variadic/optional parameters. Resolved here as three separate methods — `setSpawnPoint()` (also the default, so this is really just "reset"), `setSpawnCircle(radius)`, `setSpawnBoxShape(width, height)` — no variadic ambiguity at all. (Named `setSpawnBoxShape` rather than `setSpawnBox` only to read unambiguously next to `setSpawnPoint`/`setSpawnCircle`; open to renaming, not load-bearing.)

---

### Task 1: Engine module skeleton — `createEmitter` and one-shot `burst`

**Files:**
- Create: `src/components/Runner/engine/particles.js`
- Test: `tests/components/Runner/particles.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/components/Runner/particles.test.ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/particles.js is a plain script (not an ES module) — same loading
// technique tween.test.ts/pathfinding.test.ts already use, since it declares
// a bare `const _sbParticles` the runner concatenates into the sandboxed
// iframe rather than importing. It references `PIXI` and `_sbAssets`
// (inside createEmitter), so both are stubbed in, mirroring
// tests/components/Runner/tilemap.test.ts's loadTilemapWithAssets pattern.
class FakeParticle {
  x: number; y: number; scaleX: number; scaleY: number; rotation: number;
  alpha: number; tint: number; texture: unknown;
  constructor(opts: { texture: unknown; x: number; y: number }) {
    this.texture = opts.texture;
    this.x = opts.x; this.y = opts.y;
    this.scaleX = 1; this.scaleY = 1; this.rotation = 0; this.alpha = 1; this.tint = 0xffffff;
  }
}
class FakeParticleContainer {
  particles: FakeParticle[] = [];
  addParticle(p: FakeParticle) { this.particles.push(p); }
  removeParticle(p: FakeParticle) { this.particles = this.particles.filter((x) => x !== p); }
}

function loadParticles(assetsByPath: Record<string, unknown> = {}) {
  const src = readFileSync('src/components/Runner/engine/particles.js', 'utf-8');
  const PIXI = { ParticleContainer: FakeParticleContainer, Particle: FakeParticle };
  const _sbAssets = { get: (path: string) => assetsByPath[path] };
  const factory = new Function(
    'PIXI', '_sbAssets',
    `${src}\n return _sbParticles;`
  );
  return factory(PIXI, _sbAssets);
}

describe('createEmitter', () => {
  test('returns a real ParticleContainer-shaped handle', () => {
    const particles = loadParticles({ 'spark.png': 'spark-texture' });
    const handle = particles.createEmitter('spark.png');
    expect(handle).toBeInstanceOf(FakeParticleContainer);
    expect(handle.particles).toEqual([]);
  });

  test('two different emitters get independent state', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const a = particles.createEmitter('spark.png');
    const b = particles.createEmitter('spark.png');
    particles.emitterBurst(a, 3);
    expect(a.particles).toHaveLength(3);
    expect(b.particles).toHaveLength(0);
  });
});

describe('emitterBurst', () => {
  test('spawns exactly n particles immediately', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.emitterBurst(handle, 5);
    expect(handle.particles).toHaveLength(5);
  });

  test('spawned particles start at the emitter position (default 0,0)', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.emitterBurst(handle, 1);
    expect(handle.particles[0].x).toBe(0);
    expect(handle.particles[0].y).toBe(0);
  });

  test('bursting on an unknown handle does nothing (no throw)', () => {
    const particles = loadParticles();
    expect(() => particles.emitterBurst({}, 5)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/particles.test.ts`
Expected: FAIL — `particles.createEmitter is not a function` (module doesn't exist yet).

- [ ] **Step 3: Write the engine module**

```javascript
// src/components/Runner/engine/particles.js
const _sbParticles = {
  _emitters: new Map(), // ParticleContainer handle -> runtime state

  createEmitter(texturePath) {
    const texture = _sbAssets.get(texturePath);
    const container = new PIXI.ParticleContainer({
      dynamicProperties: { position: true, scale: true, rotation: true, color: true },
    });
    this._emitters.set(container, {
      texture,
      particles: [], // { particle, age, lifetime, vx, vy }
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
      spawnShape: 'point', spawnRadius: 0, spawnBoxW: 0, spawnBoxH: 0,
      x: 0, y: 0,
    });
    return container;
  },

  // Spawns a single particle for `handle`'s emitter, at its current spawn
  // position (respecting spawn shape) with a random speed/direction/lifetime
  // drawn from that emitter's configured ranges. Shared by both burst() and
  // the continuous per-step spawn loop (added in a later task) so there is
  // exactly one place that decides "what does a freshly spawned particle
  // look like."
  _spawnOne(container, state) {
    if (state.particles.length >= state.maxParticles) return;

    let sx = state.x;
    let sy = state.y;
    if (state.spawnShape === 'circle' && state.spawnRadius > 0) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * state.spawnRadius;
      sx += Math.cos(angle) * r;
      sy += Math.sin(angle) * r;
    } else if (state.spawnShape === 'box') {
      sx += (Math.random() - 0.5) * state.spawnBoxW;
      sy += (Math.random() - 0.5) * state.spawnBoxH;
    }

    const speed = state.speedMin + Math.random() * (state.speedMax - state.speedMin);
    const dirDeg = state.dirMin + Math.random() * (state.dirMax - state.dirMin);
    const dirRad = (dirDeg * Math.PI) / 180;
    const lifetime = state.lifetimeMin + Math.random() * (state.lifetimeMax - state.lifetimeMin);

    const particle = new PIXI.Particle({ texture: state.texture, x: sx, y: sy });
    container.addParticle(particle);
    state.particles.push({
      particle,
      age: 0,
      lifetime,
      vx: Math.cos(dirRad) * speed,
      vy: Math.sin(dirRad) * speed,
    });
  },

  emitterBurst(handle, count) {
    const state = this._emitters.get(handle);
    if (!state) return;
    for (let i = 0; i < Number(count); i++) this._spawnOne(handle, state);
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/particles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/particles.js tests/components/Runner/particles.test.ts
git commit -m "feat: add particles engine module — createEmitter and one-shot burst"
```

---

### Task 2: Per-fixed-step update — aging, movement, gravity, death

**Files:**
- Modify: `src/components/Runner/engine/particles.js`
- Test: `tests/components/Runner/particles.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/particles.test.ts`:

```typescript
describe('_particlesUpdate — aging and movement', () => {
  test('does nothing when no emitters exist', () => {
    const particles = loadParticles();
    expect(() => particles._particlesUpdate(16.67)).not.toThrow();
  });

  test('a particle moves according to its velocity each step', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterSpeed(handle, 100, 100); // fixed speed
    particles.setEmitterDirection(handle, 0, 0); // straight along +x
    particles.emitterBurst(handle, 1);

    particles._particlesUpdate(1000); // 1 second

    expect(handle.particles[0].x).toBeCloseTo(100);
    expect(handle.particles[0].y).toBeCloseTo(0);
  });

  test('gravity accelerates a particle over time', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterSpeed(handle, 0, 0);
    particles.setEmitterGravity(handle, 0, 100); // px/s^2 downward
    particles.emitterBurst(handle, 1);

    particles._particlesUpdate(1000); // 1s: vy becomes 100, y += 100 this step
    expect(handle.particles[0].y).toBeCloseTo(100);
    particles._particlesUpdate(1000); // 2nd second: vy is now 200, y += 200
    expect(handle.particles[0].y).toBeCloseTo(300);
  });

  test('a particle is removed from the container once its lifetime elapses', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterLifetime(handle, 0.5, 0.5);
    particles.setEmitterSpeed(handle, 0, 0);
    particles.emitterBurst(handle, 1);

    particles._particlesUpdate(400);
    expect(handle.particles).toHaveLength(1); // still alive at 0.4s of 0.5s

    particles._particlesUpdate(200); // now at 0.6s, past its 0.5s lifetime
    expect(handle.particles).toHaveLength(0);
  });

  test('only affects particles belonging to the emitter being updated, not other emitters', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const a = particles.createEmitter('spark.png');
    const b = particles.createEmitter('spark.png');
    particles.setEmitterSpeed(a, 100, 100);
    particles.setEmitterDirection(a, 0, 0);
    particles.setEmitterSpeed(b, 0, 0);
    particles.emitterBurst(a, 1);
    particles.emitterBurst(b, 1);

    particles._particlesUpdate(1000);

    expect(a.particles[0].x).toBeCloseTo(100);
    expect(b.particles[0].x).toBeCloseTo(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/particles.test.ts`
Expected: FAIL — `setEmitterSpeed`/`setEmitterDirection`/`setEmitterGravity`/`setEmitterLifetime`/`_particlesUpdate` don't exist yet.

- [ ] **Step 3: Implement the setters and the update loop**

Add to `_sbParticles` in `src/components/Runner/engine/particles.js` (after `_spawnOne`, before `emitterBurst` or after — order doesn't matter, grouped here for readability):

```javascript
  setEmitterLifetime(handle, min, max) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.lifetimeMin = Number(min);
    state.lifetimeMax = Number(max);
  },

  setEmitterSpeed(handle, min, max) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.speedMin = Number(min);
    state.speedMax = Number(max);
  },

  setEmitterDirection(handle, angleMin, angleMax) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.dirMin = Number(angleMin);
    state.dirMax = Number(angleMax);
  },

  setEmitterGravity(handle, x, y) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.gravityX = Number(x);
    state.gravityY = Number(y);
  },

  // Called once per fixed simulation step (see Task 5 for the _fixedStep
  // wiring). Ages every particle across every emitter, integrates velocity
  // (gravity first, then position), and removes anything past its lifetime.
  // No-ops cheaply when _emitters is empty, matching
  // _sbPathfinding._pathfindingUpdate's existing early-return convention.
  _particlesUpdate(delta) {
    if (this._emitters.size === 0) return;
    const dt = delta / 1000;
    for (const [handle, state] of this._emitters) {
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.age += dt;
        if (p.age >= p.lifetime) {
          handle.removeParticle(p.particle);
          state.particles.splice(i, 1);
          continue;
        }
        p.vx += state.gravityX * dt;
        p.vy += state.gravityY * dt;
        p.particle.x += p.vx * dt;
        p.particle.y += p.vy * dt;
      }
    }
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/particles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/particles.js tests/components/Runner/particles.test.ts
git commit -m "feat: age, move, and expire particles in _particlesUpdate"
```

---

### Task 3: Lifetime-based property interpolation — scale, alpha, color

**Files:**
- Modify: `src/components/Runner/engine/particles.js`
- Test: `tests/components/Runner/particles.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/particles.test.ts`:

```typescript
describe('_particlesUpdate — property interpolation over life', () => {
  test('alpha defaults to fading from 1 to 0 across a particle life', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterLifetime(handle, 1, 1);
    particles.setEmitterSpeed(handle, 0, 0);
    particles.emitterBurst(handle, 1);

    particles._particlesUpdate(500); // halfway through its 1s life
    expect(handle.particles[0].alpha).toBeCloseTo(0.5);
  });

  test('setEmitterAlphaOverLife overrides the default fade', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterLifetime(handle, 1, 1);
    particles.setEmitterSpeed(handle, 0, 0);
    particles.setEmitterAlphaOverLife(handle, 0, 1); // fade IN instead
    particles.emitterBurst(handle, 1);

    particles._particlesUpdate(500);
    expect(handle.particles[0].alpha).toBeCloseTo(0.5);
    particles._particlesUpdate(499); // just under its full lifetime
    expect(handle.particles[0].alpha).toBeCloseTo(0.999, 2);
  });

  test('setEmitterScaleOverLife interpolates scaleX/scaleY together', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterLifetime(handle, 1, 1);
    particles.setEmitterSpeed(handle, 0, 0);
    particles.setEmitterScaleOverLife(handle, 1, 0.2);
    particles.emitterBurst(handle, 1);

    particles._particlesUpdate(500);
    expect(handle.particles[0].scaleX).toBeCloseTo(0.6);
    expect(handle.particles[0].scaleY).toBeCloseTo(0.6);
  });

  test('setEmitterColorOverLife interpolates tint channel-wise', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterLifetime(handle, 1, 1);
    particles.setEmitterSpeed(handle, 0, 0);
    particles.setEmitterColorOverLife(handle, 0xff0000, 0x0000ff); // red -> blue
    particles.emitterBurst(handle, 1);

    particles._particlesUpdate(500); // halfway
    // Halfway between pure red (0xff0000) and pure blue (0x0000ff) is
    // roughly a 50/50 mix on each channel: ~0x800080.
    const tint = handle.particles[0].tint;
    const r = (tint >> 16) & 0xff;
    const g = (tint >> 8) & 0xff;
    const b = tint & 0xff;
    expect(r).toBeCloseTo(128, -1);
    expect(g).toBe(0);
    expect(b).toBeCloseTo(128, -1);
  });

  test('default color-over-life (white to white) leaves tint unchanged', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterSpeed(handle, 0, 0);
    particles.emitterBurst(handle, 1);
    particles._particlesUpdate(500);
    expect(handle.particles[0].tint).toBe(0xffffff);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/particles.test.ts`
Expected: FAIL — new setters don't exist, and `_particlesUpdate` doesn't touch alpha/scale/tint yet.

- [ ] **Step 3: Implement**

Add setters (alongside the ones from Task 2):

```javascript
  setEmitterScaleOverLife(handle, start, end) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.scaleStart = Number(start);
    state.scaleEnd = Number(end);
  },

  setEmitterAlphaOverLife(handle, start, end) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.alphaStart = Number(start);
    state.alphaEnd = Number(end);
  },

  setEmitterColorOverLife(handle, startColor, endColor) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.colorStart = Number(startColor);
    state.colorEnd = Number(endColor);
  },
```

Add a small helper and call it from `_particlesUpdate`, right after the position integration (before the loop's closing brace):

```javascript
  // Linearly interpolates one 0xRRGGBB color toward another by `t` (0..1),
  // channel-wise. Shared by _particlesUpdate; not exposed to softBASIC.
  _lerpColor(start, end, t) {
    const sr = (start >> 16) & 0xff, sg = (start >> 8) & 0xff, sb = start & 0xff;
    const er = (end >> 16) & 0xff, eg = (end >> 8) & 0xff, eb = end & 0xff;
    const r = Math.round(sr + (er - sr) * t);
    const g = Math.round(sg + (eg - sg) * t);
    const b = Math.round(sb + (eb - sb) * t);
    return (r << 16) | (g << 8) | b;
  },
```

Then, inside `_particlesUpdate`'s per-particle loop, after `p.particle.y += p.vy * dt;` and before the loop moves to the next particle, add:

```javascript
        const t = p.age / p.lifetime;
        const scale = state.scaleStart + (state.scaleEnd - state.scaleStart) * t;
        p.particle.scaleX = scale;
        p.particle.scaleY = scale;
        p.particle.alpha = state.alphaStart + (state.alphaEnd - state.alphaStart) * t;
        p.particle.tint = this._lerpColor(state.colorStart, state.colorEnd, t);
```

(Full `_particlesUpdate` after this task, for clarity — replaces the Task 2 version:)

```javascript
  _particlesUpdate(delta) {
    if (this._emitters.size === 0) return;
    const dt = delta / 1000;
    for (const [handle, state] of this._emitters) {
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.age += dt;
        if (p.age >= p.lifetime) {
          handle.removeParticle(p.particle);
          state.particles.splice(i, 1);
          continue;
        }
        p.vx += state.gravityX * dt;
        p.vy += state.gravityY * dt;
        p.particle.x += p.vx * dt;
        p.particle.y += p.vy * dt;

        const t = p.age / p.lifetime;
        const scale = state.scaleStart + (state.scaleEnd - state.scaleStart) * t;
        p.particle.scaleX = scale;
        p.particle.scaleY = scale;
        p.particle.alpha = state.alphaStart + (state.alphaEnd - state.alphaStart) * t;
        p.particle.tint = this._lerpColor(state.colorStart, state.colorEnd, t);
      }
    }
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/particles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/particles.js tests/components/Runner/particles.test.ts
git commit -m "feat: interpolate particle scale, alpha, and color over life"
```

---

### Task 4: Continuous spawning — start/stop/spawnRate/maxParticles

**Files:**
- Modify: `src/components/Runner/engine/particles.js`
- Test: `tests/components/Runner/particles.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/particles.test.ts`:

```typescript
describe('emitterStart / emitterStop / continuous spawning', () => {
  test('a fresh emitter does not spawn on its own', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterSpawnRate(handle, 10);
    particles._particlesUpdate(1000);
    expect(handle.particles).toHaveLength(0);
  });

  test('start() begins spawning at the configured rate', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterSpawnRate(handle, 10); // 10/sec
    particles.setEmitterLifetime(handle, 100, 100); // effectively immortal for this test
    particles.emitterStart(handle);

    particles._particlesUpdate(1000); // 1 full second
    expect(handle.particles).toHaveLength(10);
  });

  test('stop() halts new spawns but leaves existing particles alone', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterSpawnRate(handle, 10);
    particles.setEmitterLifetime(handle, 100, 100);
    particles.emitterStart(handle);
    particles._particlesUpdate(500); // 5 particles

    particles.emitterStop(handle);
    particles._particlesUpdate(500); // would have been 5 more

    expect(handle.particles).toHaveLength(5);
  });

  test('spawning respects maxParticles even while continuously spawning', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterSpawnRate(handle, 100);
    particles.setEmitterLifetime(handle, 100, 100);
    particles.setEmitterMaxParticles(handle, 3);
    particles.emitterStart(handle);

    particles._particlesUpdate(1000);
    expect(handle.particles).toHaveLength(3);
  });

  test('burst still works independently while an emitter is continuously running', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterSpawnRate(handle, 0); // no continuous spawning
    particles.setEmitterLifetime(handle, 100, 100);
    particles.emitterStart(handle);
    particles.emitterBurst(handle, 4);
    particles._particlesUpdate(1000);
    expect(handle.particles).toHaveLength(4); // only the burst, spawnRate is 0
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/particles.test.ts`
Expected: FAIL — `setEmitterSpawnRate`/`emitterStart`/`emitterStop`/`setEmitterMaxParticles` don't exist; nothing spawns continuously yet.

- [ ] **Step 3: Implement**

Add setters and actions:

```javascript
  setEmitterSpawnRate(handle, perSecond) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.spawnRate = Number(perSecond);
  },

  setEmitterMaxParticles(handle, n) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.maxParticles = Number(n);
  },

  emitterStart(handle) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.spawning = true;
  },

  emitterStop(handle) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.spawning = false;
  },
```

Add continuous spawning to the top of `_particlesUpdate`'s per-emitter loop, before the aging/removal inner loop:

```javascript
      if (state.spawning && state.spawnRate > 0) {
        state.spawnAccumulator += state.spawnRate * dt;
        while (state.spawnAccumulator >= 1) {
          this._spawnOne(handle, state);
          state.spawnAccumulator -= 1;
        }
      }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/particles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/particles.js tests/components/Runner/particles.test.ts
git commit -m "feat: continuous spawning via emitterStart/emitterStop/spawnRate"
```

---

### Task 5: Spawn shapes — point (default), circle, box

**Files:**
- Modify: `src/components/Runner/engine/particles.js`
- Test: `tests/components/Runner/particles.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/particles.test.ts`:

```typescript
describe('spawn shapes', () => {
  test('default (point) spawns exactly at the emitter position', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterPosition(handle, 50, 60);
    particles.emitterBurst(handle, 1);
    expect(handle.particles[0].x).toBe(50);
    expect(handle.particles[0].y).toBe(60);
  });

  test('setEmitterSpawnCircle spawns within the given radius of the emitter position', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterPosition(handle, 100, 100);
    particles.setEmitterSpawnCircle(handle, 10);
    particles.emitterBurst(handle, 50);
    for (const p of handle.particles) {
      const dist = Math.hypot(p.x - 100, p.y - 100);
      expect(dist).toBeLessThanOrEqual(10 + 1e-9);
    }
  });

  test('setEmitterSpawnBoxShape spawns within the given box centered on the emitter position', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterPosition(handle, 100, 100);
    particles.setEmitterSpawnBoxShape(handle, 20, 10);
    particles.emitterBurst(handle, 50);
    for (const p of handle.particles) {
      expect(p.x).toBeGreaterThanOrEqual(90);
      expect(p.x).toBeLessThanOrEqual(110);
      expect(p.y).toBeGreaterThanOrEqual(95);
      expect(p.y).toBeLessThanOrEqual(105);
    }
  });

  test('setEmitterSpawnPoint reverts to spawning exactly at the emitter position', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterPosition(handle, 5, 5);
    particles.setEmitterSpawnCircle(handle, 10);
    particles.setEmitterSpawnPoint(handle);
    particles.emitterBurst(handle, 1);
    expect(handle.particles[0].x).toBe(5);
    expect(handle.particles[0].y).toBe(5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/particles.test.ts`
Expected: FAIL — `setEmitterPosition`/`setEmitterSpawnCircle`/`setEmitterSpawnBoxShape`/`setEmitterSpawnPoint` don't exist. (`_spawnOne` already implements circle/box behavior from Task 1, gated on `state.spawnShape` — this task just adds the setters that actually change it away from the `'point'` default.)

- [ ] **Step 3: Implement**

```javascript
  setEmitterPosition(handle, x, y) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.x = Number(x);
    state.y = Number(y);
  },

  setEmitterSpawnPoint(handle) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.spawnShape = 'point';
  },

  setEmitterSpawnCircle(handle, radius) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.spawnShape = 'circle';
    state.spawnRadius = Number(radius);
  },

  setEmitterSpawnBoxShape(handle, width, height) {
    const state = this._emitters.get(handle);
    if (!state) return;
    state.spawnShape = 'box';
    state.spawnBoxW = Number(width);
    state.spawnBoxH = Number(height);
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/particles.test.ts`
Expected: PASS. Also run the full file once to confirm nothing earlier regressed: `npx vitest run tests/components/Runner/particles.test.ts` (all describes).

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/particles.js tests/components/Runner/particles.test.ts
git commit -m "feat: add point/circle/box spawn shapes and setEmitterPosition"
```

---

### Task 6: Wire into `_sb` and the fixed-timestep loop

**Files:**
- Modify: `src/components/Runner/softBasicEngine.js`
- Modify: `src/components/Runner/engine/scene.js`
- Modify: `tests/components/Runner/scene.test.ts` (or wherever `_fixedStep`'s call list is already asserted — confirm exact file with `grep -rn "_tweenUpdate" tests/components/Runner/` before editing; adjust the step below to match whatever that search finds if it's not `scene.test.ts`)

- [ ] **Step 1: Confirm the existing test location and pattern**

Run: `grep -rn "_tweenUpdate\|_pathfindingUpdate" tests/components/Runner/*.test.ts`

Find the test (or tests) that assert `_fixedStep` calls `_tweenUpdate`/`_pathfindingUpdate`. Use the exact same pattern for a new assertion covering `_particlesUpdate`.

- [ ] **Step 2: Write the failing test**

Add a test alongside whatever the search in Step 1 found, following its exact existing style (likely something that stubs `_particlesUpdate` with a spy/counter and calls `_fixedStep`, asserting it was called once per step with the delta). Concretely, something of this shape:

```typescript
test('_fixedStep calls _particlesUpdate once with the step delta', () => {
  // Match the existing setup this file already uses for the
  // _pathfindingUpdate/_tweenUpdate assertions immediately above/below this
  // one — same _sbScene-loading technique, same fake delta value.
  const scene = loadScene(); // however the existing tests in this file obtain it
  let calledWith: number | null = null;
  scene._particlesUpdate = (delta: number) => { calledWith = delta; };
  scene._fixedStep(16.67);
  expect(calledWith).toBe(16.67);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/scene.test.ts` (or the correct file from Step 1)
Expected: FAIL — `_fixedStep` doesn't call `_particlesUpdate` yet.

- [ ] **Step 4: Wire it in**

In `src/components/Runner/engine/scene.js`, add one line to `_fixedStep`:

```javascript
  _fixedStep(delta) {
    _sbLifecycle._update.call(this, delta);
    if (this._activeScene && this._activeScene.onupdate) {
      try { this._activeScene.onupdate(delta); } catch(e) { _throwError(e); }
    }
    this._applySwitch();
    this._cameraUpdate(delta);
    this._pathfindingUpdate(delta);
    this._tweenUpdate(delta);
    this._particlesUpdate(delta);
    this._resetFrameInput();
  },
```

In `src/components/Runner/softBasicEngine.js`, add `_sbParticles` to the spread — before `_sbFrameLoop` (comment already there explains why that one must stay last):

```javascript
const _sb = {
  ..._sbLifecycle,
  ..._sbScene,
  ..._sbInput,
  ..._sbAssets,
  ..._sbFile,
  ..._sbSave,
  ..._sbAudio,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbCamera,
  ..._sbSprites,
  ..._sbAnimatedSprites,
  ..._sbTilemaps,
  ..._sbCollision,
  ..._sbPathfinding,
  ..._sbTween,
  ..._sbAttach,
  ..._sbParticles,
  // Last on purpose. _sbFrameLoop supplies `_update`, ...
  ..._sbFrameLoop,
};
```

Find where `tween.js`/`attach.js` are `<script>`-included (or otherwise concatenated) alongside the other engine files for the actual sandboxed runner build — search `grep -rn "engine/tween.js\|engine/attach.js" src/components/Runner/` — and add `engine/particles.js` to that same list, in the same position relative to the others (order doesn't matter functionally here since `particles.js` doesn't reference any other engine module's internals, only the globals `PIXI`/`_sbAssets` already available to every other module by the time it runs).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/scene.test.ts` (or the correct file)
Expected: PASS

- [ ] **Step 6: Run the full suite and build to catch any wiring mistake**

Run: `npx vitest run`
Expected: all passing, same count as before plus this task's new test.

Run: `npx vite build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/Runner/softBasicEngine.js src/components/Runner/engine/scene.js tests/components/Runner/scene.test.ts
git commit -m "feat: wire particles engine module into _sb and the fixed-timestep loop"
```

---

### Task 7: `Emitter.bas` class def

**Files:**
- Create: `src/lib/Basic4WebGL/defs/Emitter.bas`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/emitter.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/lib/Basic4WebGL/unit/transpiler/emitter.test.ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transformSource = readFileSync('src/lib/Basic4WebGL/defs/transform.bas', 'utf-8');
const emitterSource = readFileSync('src/lib/Basic4WebGL/defs/Emitter.bas', 'utf-8');

const transpileWithEmitter = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource },
      { name: 'Emitter.bas', source: emitterSource },
      { name: 'Main.bas', source },
    ],
  });

describe('Emitter — construction', () => {
  test('compiles without error', () => {
    const result = transpileWithEmitter(
      'function test()\n  dim e as Emitter("spark.png")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.createEmitter(', () => {
    const result = transpileWithEmitter(
      'function test()\n  dim e as Emitter("spark.png")\nendfunction'
    );
    expect(result.code).toContain('_sb.createEmitter(');
  });

  test('has a transform, like every other visual object', () => {
    const result = transpileWithEmitter([
      'function test()',
      '  dim e as Emitter("spark.png")',
      '  e.transform.setPosition(10, 20)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('Emitter — config setters emit the matching _sb call', () => {
  const cases: Array<[string, string]> = [
    ['e.setLifetime(0.5, 1)', '_sb.setEmitterLifetime('],
    ['e.setSpawnRate(20)', '_sb.setEmitterSpawnRate('],
    ['e.setMaxParticles(100)', '_sb.setEmitterMaxParticles('],
    ['e.setSpeed(50, 100)', '_sb.setEmitterSpeed('],
    ['e.setDirection(0, 360)', '_sb.setEmitterDirection('],
    ['e.setGravity(0, 50)', '_sb.setEmitterGravity('],
    ['e.setScaleOverLife(1, 0)', '_sb.setEmitterScaleOverLife('],
    ['e.setAlphaOverLife(1, 0)', '_sb.setEmitterAlphaOverLife('],
    ['e.setColorOverLife(16711680, 255)', '_sb.setEmitterColorOverLife('],
    ['e.setSpawnPoint()', '_sb.setEmitterSpawnPoint('],
    ['e.setSpawnCircle(10)', '_sb.setEmitterSpawnCircle('],
    ['e.setSpawnBoxShape(20, 10)', '_sb.setEmitterSpawnBoxShape('],
  ];

  test.each(cases)('%s -> %s', (call, expectedSnippet) => {
    const result = transpileWithEmitter([
      'function test()',
      '  dim e as Emitter("spark.png")',
      `  ${call}`,
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain(expectedSnippet);
  });
});

describe('Emitter — actions', () => {
  test('start/stop/burst emit their matching _sb calls', () => {
    const result = transpileWithEmitter([
      'function test()',
      '  dim e as Emitter("spark.png")',
      '  e.start()',
      '  e.stop()',
      '  e.burst(10)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.emitterStart(');
    expect(result.code).toContain('_sb.emitterStop(');
    expect(result.code).toContain('_sb.emitterBurst(');
  });

  test('attachTo/detach emit the existing shared attach engine calls, not new ones', () => {
    const result = transpileWithEmitter([
      'function test()',
      '  dim e as Emitter("spark.png")',
      '  dim s',
      '  e.attachTo(s)',
      '  e.detach()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.attachSprite(');
    expect(result.code).toContain('_sb.detachSprite(');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/emitter.test.ts`
Expected: FAIL — `Emitter.bas` doesn't exist, `readFileSync` throws.

- [ ] **Step 3: Write `Emitter.bas`**

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

function setSpawnRate(perSecond)
    call("_sb.setEmitterSpawnRate(this._handle, setspawnrate_perSecond)")
endfunction

function setMaxParticles(n)
    call("_sb.setEmitterMaxParticles(this._handle, setmaxparticles_n)")
endfunction

function setSpeed(minSpeed, maxSpeed)
    call("_sb.setEmitterSpeed(this._handle, setspeed_minSpeed, setspeed_maxSpeed)")
endfunction

function setDirection(angleMin, angleMax)
    call("_sb.setEmitterDirection(this._handle, setdirection_angleMin, setdirection_angleMax)")
endfunction

function setGravity(x, y)
    call("_sb.setEmitterGravity(this._handle, setgravity_x, setgravity_y)")
endfunction

function setScaleOverLife(startScale, endScale)
    call("_sb.setEmitterScaleOverLife(this._handle, setscaleoverlife_startScale, setscaleoverlife_endScale)")
endfunction

function setAlphaOverLife(startAlpha, endAlpha)
    call("_sb.setEmitterAlphaOverLife(this._handle, setalphaoverlife_startAlpha, setalphaoverlife_endAlpha)")
endfunction

function setColorOverLife(startColor, endColor)
    call("_sb.setEmitterColorOverLife(this._handle, setcoloroverlife_startColor, setcoloroverlife_endColor)")
endfunction

function setSpawnPoint()
    call("_sb.setEmitterSpawnPoint(this._handle)")
endfunction

function setSpawnCircle(radius)
    call("_sb.setEmitterSpawnCircle(this._handle, setspawncircle_radius)")
endfunction

function setSpawnBoxShape(width, height)
    call("_sb.setEmitterSpawnBoxShape(this._handle, setspawnboxshape_width, setspawnboxshape_height)")
endfunction

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

Note: `self.transform.setPosition(x, y)` (from `ObjectTransform`, already wired via the constructor exactly like `TileMap`/`TileMapSet`) is what softBASIC code calls to move an emitter — it goes through `ObjectTransform`'s existing `_sb.setPosition`/`_sbSprites.setPosition`, which mutates `handle.position` directly. **This task must also make `particles.js`'s `_spawnOne` read the emitter's position from `handle.position` instead of (or in addition to) `state.x`/`state.y`** — go back and reconcile this before calling the task done:

- [ ] **Step 3a: Reconcile position source**

`Task 5` added `setEmitterPosition(handle, x, y)` as a *particles-module-owned* `state.x`/`state.y`, written directly by a dedicated setter. But `Emitter.bas` (this task) instead relies on the standard `self.transform.setPosition(...)` — the same mechanism every other visual class (`sprite`, `tilemap`) uses — which writes to `handle.position.x`/`handle.position.y` on the *PIXI container itself*, not into `particles.js`'s own `state` map.

Resolve this now, before writing more code: **delete `setEmitterPosition` from `particles.js` and its test from Task 5** (it's now redundant — `ObjectTransform`/`_sbSprites.setPosition` already does this job, and having two different ways to move an emitter is exactly the kind of inconsistency this codebase's own conventions elsewhere warn against). Change `_spawnOne` to read `container.position.x`/`container.position.y` instead of `state.x`/`state.y`:

```javascript
  _spawnOne(container, state) {
    if (state.particles.length >= state.maxParticles) return;

    let sx = container.position.x;
    let sy = container.position.y;
    // ... rest unchanged (spawnShape branches, etc.)
  },
```

Update the Task 5 tests that called `particles.setEmitterPosition(handle, x, y)` to instead set `handle.position = { x, y }` directly on the fake container before bursting (matching how a real `PIXI.ParticleContainer`'s `.position` already works — the `FakeParticleContainer` test double from Task 1 needs a `position = { x: 0, y: 0 }` field added for this to work; add it now).

Re-run `npx vitest run tests/components/Runner/particles.test.ts` to confirm this reconciliation didn't break anything before moving on.

- [ ] **Step 4: Run the emitter transpiler tests to verify they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/emitter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/Emitter.bas tests/lib/Basic4WebGL/unit/transpiler/emitter.test.ts src/components/Runner/engine/particles.js tests/components/Runner/particles.test.ts
git commit -m "feat: add Emitter.bas, unify emitter positioning through the standard transform"
```

---

### Task 8: Register the module in the softGfx package

**Files:**
- Modify: `src/constants/packageModules.ts`
- Modify: `src/constants/firstPartyPackages.ts`
- Check: `tests/ui/constants/packageModules.test.ts` (confirm exact assertions before editing — likely a "every module name has a corresponding import" style test that just needs the new entry to already pass, or may need an explicit addition; read the file first)

- [ ] **Step 1: Read the existing test to know if it needs a new assertion**

Run: `cat tests/ui/constants/packageModules.test.ts`

If it's a generic "every entry in `moduleNames` across all packages has a matching key in `packageModules`" style test, no new test is needed — it'll just start covering `Emitter` once added. If it asserts specific module names individually, add `Emitter` to that list following the exact existing style.

- [ ] **Step 2: Register the module**

In `src/constants/packageModules.ts`, add the import and the export entry (alongside `Keyframe`/`tween`):

```typescript
import Emitter from '../lib/Basic4WebGL/defs/Emitter.bas?raw';
```

```typescript
export const packageModules: Record<string, string> = {
  // ... existing entries ...
  Keyframe,
  tween,
  Emitter,
};
```

In `src/constants/firstPartyPackages.ts`, add `'Emitter'` to `softgfx`'s `moduleNames` and bump its version (matching the exact precedent set when `Keyframe`/`tween` were added — that bumped `2.5.0` -> `2.6.0`):

```typescript
  {
    id: 'softgfx',
    name: 'softGfx',
    version: '2.7.0',
    isCore: false,
    isFirstParty: true,
    moduleNames: ['gfx', 'input', 'drawing', 'stage', 'pen', 'assetmanager', 'ObjectTransform', 'sprite', 'animatedsprite', 'text', 'tilemap', 'tilemaplayer', 'tilemapset', 'audio', 'collision', 'pathfinding', 'marker', 'rayhit', 'scene', 'scenemanager', 'camera', 'world', 'hud', 'Keyframe', 'tween', 'Emitter'],
  },
```

- [ ] **Step 3: Run tests to verify everything still passes**

Run: `npx vitest run tests/ui/constants/packageModules.test.ts`
Expected: PASS (add an assertion first per Step 1 if the file's existing style calls for one, then confirm it passes).

Run: `npx vitest run` (full suite) and `npx vite build` — this task touches shared registration data other tests may indirectly depend on (e.g. anything constructing a default project with `softgfx`).
Expected: all passing, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/constants/packageModules.ts src/constants/firstPartyPackages.ts tests/ui/constants/packageModules.test.ts
git commit -m "feat: register Emitter in the softGfx package"
```

---

### Task 9: API reference docs

**Files:**
- Create: `src/docs/api-reference/emitter.md`
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Write the docs page**

Follow this codebase's established API-doc conventions (see `CLAUDE.md`: beginner audience, no JS/PIXI internals, `number`/`string`/`true or false`/`object`/`array` typing, one-sentence description → parameter table → `**Returns:**` line (omit for void) → `.bas` example, game-scenario examples, `## Constructor` section first since this is a class). Cross-reference every setter name against `Emitter.bas` from Task 7 before writing a single example — do not write from memory.

```markdown
# Emitter

An `Emitter` produces a stream of small, short-lived visual particles — sparks from a hit, smoke trailing behind something moving, dust drifting near a torch, a burst when something explodes. Each particle moves on its own, fades or changes color over its short life, and disappears automatically.

## Constructor

```bas
dim spark as Emitter("spark.png")
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
function onEnemyHit()
  spark.transform.setPosition(enemy.transform.x(), enemy.transform.y())
  spark.burst(15)
endfunction
```

## attachTo(parent) / detach()

Works exactly like `sprite.attachTo`/`detach` (see the [sprite](sprite) docs) — the emitter follows the given sprite's position automatically, useful for a trail effect behind something moving. `detach()` stops following and returns it to spawning at a fixed position.

```bas
dim trail as Emitter("smoke.png")

function onenter()
  trail.attachTo(player)
  trail.setSpawnRate(20)
  trail.start()
  world.add(trail)
endfunction
```

## transform

Position is controlled through `.transform`, exactly like every other visual object — see [ObjectTransform](objecttransform). While attached to another sprite (see `attachTo` above), position is relative to that sprite instead of the world.
```

- [ ] **Step 2: Register the doc page in the nav manifest**

In `src/docs/manifest.ts`, add an entry to the `softGfx` group's `topics` array (alongside `tween`):

```typescript
          { slug: 'emitter',         title: 'Emitter',         file: 'api-reference/emitter.md' },
```

- [ ] **Step 3: Verify the docs page renders and cross-check every example against `Emitter.bas`**

Run `npm run dev`, navigate to `/docs/api-reference/emitter` in the browser preview, and confirm the page renders without errors and every method listed matches a real method in `src/lib/Basic4WebGL/defs/Emitter.bas` — no method name typos, no invented parameters.

- [ ] **Step 4: Commit**

```bash
git add src/docs/api-reference/emitter.md src/docs/manifest.ts
git commit -m "docs: add Emitter API reference page"
```

---

### Task 10: Mark the roadmap item done

**Files:**
- Modify: `docs/language/library-roadmap.md`

- [ ] **Step 1: Update the entry**

Find the line in the "Lower Priority / Future" section: `- **Particle system** — emitter abstraction over PIXI particles. Not started.`

Replace it with a `[DONE]` entry in the same narrative style as the `Keyframe`/`attachTo` entries in the "Priorities" section (move it there, since it's now shipped, not still lower-priority/future):

```markdown
- ~~Particle system~~ **[DONE]** — `Emitter` class (`Emitter.bas` + `src/components/Runner/engine/particles.js`) shipped: `setLifetime`/`setSpawnRate`/`setMaxParticles`/`setSpeed`/`setDirection`/`setGravity`/`setScaleOverLife`/`setAlphaOverLife`/`setColorOverLife`/`setSpawnPoint`/`setSpawnCircle`/`setSpawnBoxShape` config, `start`/`stop`/`burst` actions, `attachTo`/`detach` reused unchanged from the existing sprite-attachment feature (a `PIXI.ParticleContainer` is a `PIXI.Container` subclass, so it reparents exactly like any sprite's handle). Built on PixiJS v8's native `ParticleContainer`/`Particle` for rendering, with all spawn/lifetime/behavior logic hand-written — the official `@pixi/particle-emitter` library that would otherwise provide that behavior layer does not support PixiJS v8 ([confirmed via the project's own tracking issue](https://github.com/pixijs-userland/particle-emitter/issues/211)), and an unofficial community fork was rejected in favor of consistency with how this codebase already builds every other engine capability (PIXI supplies primitives, a hand-written module supplies behavior — the same shape as `tween`/`pathfinding`/`collision`). Individual particle positions deliberately skip the fixed-timestep interpolation system sprites get (see `docs/superpowers/plans/2026-08-24-fixed-timestep-interpolation-plan.md`) — a scope cut, not an oversight, since interpolating potentially hundreds of particles a frame works against the reason `ParticleContainer` was chosen, and per-particle jitter in a chaotic burst is far less perceptible than the same jitter on a single primary sprite. Design: `docs/superpowers/specs/2026-08-25-particle-system-design.md`. Plan: `docs/superpowers/plans/2026-08-25-particle-system-plan.md`. Tests: `tests/components/Runner/particles.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/emitter.test.ts`. Docs: `src/docs/api-reference/emitter.md`. Demo integration deliberately out of scope for this work — a separate follow-up decision.
```

- [ ] **Step 2: Verify no other stale references remain**

Run: `grep -rn "Particle system\|particle system" docs/language/library-roadmap.md docs/roadmap.md`
Expected: only the new `[DONE]` line remains; no leftover "Not started" duplicate.

- [ ] **Step 3: Commit**

```bash
git add docs/language/library-roadmap.md
git commit -m "docs: mark particle system done in the library roadmap"
```

---

### Task 11: Final verification pass

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: every test passes, including all new ones from Tasks 1–8.

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: succeeds, no new warnings beyond the pre-existing chunk-size one.

- [ ] **Step 3: Live smoke test**

Start the dev server, create (or open an existing) project, write a tiny throwaway scene using `Emitter` — construct one, `world.add` it, `burst(20)` on a keypress — and confirm particles actually render, move, and disappear in the browser preview. This is the one thing none of the unit tests can confirm: that `PIXI.ParticleContainer`/`PIXI.Particle`'s real constructor options match what Task 1's code assumed (flagged in the design spec as unverified against the live API). If the real API differs from the `dynamicProperties`/constructor shape used in Task 1, fix `particles.js` now, before calling this done — do not leave a live mismatch behind a passing-but-mocked test suite.

- [ ] **Step 4: Commit any live-verification fixes found in Step 3, if any**

Only if Step 3 required changes — otherwise nothing to commit here.
