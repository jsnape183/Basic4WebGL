import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const keyframeSource = readFileSync('src/lib/Basic4WebGL/defs/Keyframe.bas', 'utf-8');

const transpileWithKeyframe = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'Keyframe', source: keyframeSource }],
    files: [{ name: 'Main.bas', source }],
  });

describe('Keyframe — construction and defaults', () => {
  test('compiles without error', () => {
    const result = transpileWithKeyframe([
      'function test()',
      '  dim k as Keyframe',
      '  k = new Keyframe()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('constructor sets neutral defaults for every field', () => {
    const result = transpileWithKeyframe([
      'function test()',
      '  dim k as Keyframe',
      '  k = new Keyframe()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('this.time = 0');
    expect(result.code).toContain('this.angle = 0');
    expect(result.code).toContain('this.scalex = 1');
    expect(result.code).toContain('this.scaley = 1');
    expect(result.code).toContain('this.alpha = 1');
    expect(result.code).toContain('this.x = 0');
    expect(result.code).toContain('this.y = 0');
  });

  test('constructor starts every channel unset (has* flags false)', () => {
    // tween only writes a channel to the sprite handle if some keyframe in
    // the played sequence actually set it -- these flags are how it knows.
    // Unset by default means a fresh Keyframe with no setter calls controls
    // nothing at all, not "everything, at its neutral value".
    const result = transpileWithKeyframe([
      'function test()',
      '  dim k as Keyframe',
      '  k = new Keyframe()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('this.hasangle = false');
    expect(result.code).toContain('this.hasscalex = false');
    expect(result.code).toContain('this.hasscaley = false');
    expect(result.code).toContain('this.hasalpha = false');
    expect(result.code).toContain('this.hasposition = false');
  });
});

describe('Keyframe — setters', () => {
  test('each setter assigns its field (compiled lowercase)', () => {
    const result = transpileWithKeyframe([
      'function test()',
      '  dim k as Keyframe',
      '  k = new Keyframe()',
      '  k.setTime(0.4)',
      '  k.setAngle(360)',
      '  k.setScaleX(2)',
      '  k.setScaleY(2)',
      '  k.setAlpha(0.5)',
      '  k.setPosition(100, 50)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('.prototype.settime');
    expect(result.code).toContain('.prototype.setangle');
    expect(result.code).toContain('.prototype.setscalex');
    expect(result.code).toContain('.prototype.setscaley');
    expect(result.code).toContain('.prototype.setalpha');
    expect(result.code).toContain('.prototype.setposition');
  });

  test('each setter also flips its has* flag true', () => {
    const result = transpileWithKeyframe([
      'function test()',
      '  dim k as Keyframe',
      '  k = new Keyframe()',
      '  k.setAngle(360)',
      '  k.setScaleX(2)',
      '  k.setScaleY(2)',
      '  k.setAlpha(0.5)',
      '  k.setPosition(100, 50)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('this.hasangle = true');
    expect(result.code).toContain('this.hasscalex = true');
    expect(result.code).toContain('this.hasscaley = true');
    expect(result.code).toContain('this.hasalpha = true');
    expect(result.code).toContain('this.hasposition = true');
  });
});
