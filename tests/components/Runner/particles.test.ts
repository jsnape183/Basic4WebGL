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
  position = { x: 0, y: 0 };
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

  test('a single burst larger than maxParticles is capped', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterMaxParticles(handle, 3);
    particles.emitterBurst(handle, 10);
    expect(handle.particles).toHaveLength(3);
  });
});

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
    particles.setEmitterLifetime(handle, 10, 10); // outlive the 2s this test covers (default is 1s)
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

  test('spawn accumulator carries fractional remainder across many small update calls', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    particles.setEmitterSpawnRate(handle, 3); // 3/sec -> 0.3 accumulated per 100ms call
    particles.setEmitterLifetime(handle, 100, 100); // nothing dies mid-test
    particles.emitterStart(handle);

    for (let i = 0; i < 10; i++) {
      particles._particlesUpdate(100); // each call alone would round down to 0 spawns
    }

    expect(handle.particles).toHaveLength(3); // 10 * 0.3 = 3.0 accumulated total
  });
});

describe('spawn shapes', () => {
  test('default (point) spawns exactly at the emitter position', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    handle.position = { x: 50, y: 60 };
    particles.emitterBurst(handle, 1);
    expect(handle.particles[0].x).toBe(50);
    expect(handle.particles[0].y).toBe(60);
  });

  test('setEmitterSpawnCircle spawns within the given radius of the emitter position', () => {
    const particles = loadParticles({ 'spark.png': 'tex' });
    const handle = particles.createEmitter('spark.png');
    handle.position = { x: 100, y: 100 };
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
    handle.position = { x: 100, y: 100 };
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
    handle.position = { x: 5, y: 5 };
    particles.setEmitterSpawnCircle(handle, 10);
    particles.setEmitterSpawnPoint(handle);
    particles.emitterBurst(handle, 1);
    expect(handle.particles[0].x).toBe(5);
    expect(handle.particles[0].y).toBe(5);
  });
});
