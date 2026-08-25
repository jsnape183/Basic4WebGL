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

    // Particle x/y are LOCAL to `container` — PIXI composes container.position
    // with each child's local position at render time, so the container's own
    // position must NOT be added in here too. The container's position (set via
    // the emitter's transform) already places local (0,0) at the right world spot.
    let sx = 0;
    let sy = 0;
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

    // anchorX/anchorY default to 0 (top-left) in PIXI — center-anchor so
    // setScaleOverLife shrinks/grows the particle around its spawn point
    // instead of visually dragging it toward its top-left corner.
    const particle = new PIXI.Particle({ texture: state.texture, x: sx, y: sy, anchorX: 0.5, anchorY: 0.5 });
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

  // Called once per fixed simulation step (see Task 5 for the _fixedStep
  // wiring). Ages every particle across every emitter, integrates velocity
  // (gravity first, then position), and removes anything past its lifetime.
  // No-ops cheaply when _emitters is empty, matching
  // _sbPathfinding._pathfindingUpdate's existing early-return convention.
  _particlesUpdate(delta) {
    if (this._emitters.size === 0) return;
    const dt = delta / 1000;
    for (const [handle, state] of this._emitters) {
      // Particles spawned here fall through to the aging loop below in this same
      // call, so a particle born mid-frame is aged by the full frame's dt before
      // ever being rendered (and can die same-frame if lifetime <= dt).
      if (state.spawning && state.spawnRate > 0) {
        state.spawnAccumulator += state.spawnRate * dt;
        while (state.spawnAccumulator >= 1) {
          this._spawnOne(handle, state);
          state.spawnAccumulator -= 1;
        }
      }

      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.age += dt;
        if (p.age > p.lifetime) {
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
};
