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
