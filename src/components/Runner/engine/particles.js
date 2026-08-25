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
