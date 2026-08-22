import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const tweenSource = readFileSync('src/lib/Basic4WebGL/defs/tween.bas', 'utf-8');

const transpileWithTween = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'tween', source: tweenSource }],
    files: [{ name: 'Main.bas', source }],
  });

describe('tween — play', () => {
  test('compiles without error', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  dim frames(0)',
      '  tween.play(sprite, frames, false)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.tweenPlay( and passes the sprite instance directly', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  dim frames(0)',
      '  tween.play(sprite, frames, false)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.tweenPlay(');
    expect(result.code).not.toContain('play_sprite._handle');
  });
});

describe('tween — stop', () => {
  test('compiles without error', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  tween.stop(sprite)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.tweenStop(', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  tween.stop(sprite)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.tweenStop(');
  });
});

describe('tween — isPlaying', () => {
  test('compiles without error', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  dim playing',
      '  playing = tween.isPlaying(sprite)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.tweenIsPlaying(', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  dim playing',
      '  playing = tween.isPlaying(sprite)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.tweenIsPlaying(');
  });
});
