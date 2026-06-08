import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transformSource        = readFileSync('src/lib/Basic4WebGL/defs/transform.bas',        'utf-8');
const animatedSpriteSource   = readFileSync('src/lib/Basic4WebGL/defs/animatedsprite.bas',   'utf-8');

const transpileWithAnimSprite = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas',  source: transformSource      },
      { name: 'AnimatedSprite.bas',   source: animatedSpriteSource },
      { name: 'Main.bas',             source                       },
    ],
  });

// ─── Construction ─────────────────────────────────────────────────────────────

describe('AnimatedSprite — construction', () => {
  test('compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.createAnimatedSprite(', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\nendfunction'
    );
    expect(result.code).toContain('_sb.createAnimatedSprite(');
  });
});

// ─── addAnim ──────────────────────────────────────────────────────────────────

describe('AnimatedSprite — addAnim', () => {
  test('compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  s.addAnim("run", 0, 7, 12, true)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.addAnim(', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  s.addAnim("run", 0, 7, 12, true)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.addAnim(');
  });
});

// ─── play ─────────────────────────────────────────────────────────────────────

describe('AnimatedSprite — play', () => {
  test('compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  s.play("run")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.playAnim(', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  s.play("run")',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.playAnim(');
  });
});

// ─── isPlaying ────────────────────────────────────────────────────────────────

describe('AnimatedSprite — isPlaying', () => {
  test('compiles without error in if condition', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  if s.isPlaying("run") == false',
      '    s.play("idle")',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.isPlayingAnim(', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  if s.isPlaying("run") == false',
      '    s.play("idle")',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.isPlayingAnim(');
  });
});

// ─── Visual / transform methods ───────────────────────────────────────────────

describe('AnimatedSprite — visual methods', () => {
  test('setScale compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\n  s.setScale(2, 2)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('setFlip compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\n  s.setFlip(true, false)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('setVisible compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\n  s.setVisible(false)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('setAlpha compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\n  s.setAlpha(0.5)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('setAngle compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\n  s.setAngle(45)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('width compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  dim w',
      '  w = s.width()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('height compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  dim h',
      '  h = s.height()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── End-to-end ───────────────────────────────────────────────────────────────

describe('AnimatedSprite — end-to-end', () => {
  test('full platformer-style program compiles without error', () => {
    const result = transpileWithAnimSprite([
      'dim hero as AnimatedSprite("hero.png", 48, 48)',
      '',
      'function onenter()',
      '  hero.addAnim("idle",  0,  3,  8, true)',
      '  hero.addAnim("run",   4, 11, 12, true)',
      '  hero.addAnim("jump", 12, 15, 10, false)',
      '  hero.play("idle")',
      '  hero.transform.setPosition(100, 200)',
      'endfunction',
      '',
      'function onupdate()',
      '  if hero.isPlaying("jump") == false',
      '    hero.play("idle")',
      '  endif',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });
});
