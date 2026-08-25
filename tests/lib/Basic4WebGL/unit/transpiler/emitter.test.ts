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
