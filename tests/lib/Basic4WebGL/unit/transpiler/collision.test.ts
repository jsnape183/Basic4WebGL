import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const collisionSource = readFileSync('src/lib/Basic4WebGL/defs/collision.bas', 'utf-8');
const gfxSource = readFileSync('src/lib/Basic4WebGL/defs/gfx.bas', 'utf-8');
const rayhitSource = readFileSync('src/lib/Basic4WebGL/defs/rayhit.bas', 'utf-8');

const transpileWithCollision = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'collision', source: collisionSource }, { name: 'rayhit', source: rayhitSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithGfx = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'gfx', source: gfxSource }],
    files: [{ name: 'Main.bas', source }],
  });

// ─── spriteCollide ────────────────────────────────────────────────────────────

describe('collision — spriteCollide', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim a',
      '  dim b',
      '  dim hit',
      '  hit = collision.spriteCollide(a, b)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.spriteCollide(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim a',
      '  dim b',
      '  dim hit',
      '  hit = collision.spriteCollide(a, b)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.spriteCollide(');
  });
});

// ─── boxCollide ───────────────────────────────────────────────────────────────

describe('collision — boxCollide', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim hit',
      '  hit = collision.boxCollide(10, 20, 32, 48, 50, 60, 40, 40)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.boxCollide(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim hit',
      '  hit = collision.boxCollide(10, 20, 32, 48, 50, 60, 40, 40)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.boxCollide(');
  });
});

// ─── circleCollide ────────────────────────────────────────────────────────────

describe('collision — circleCollide', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim coin',
      '  dim player',
      '  dim hit',
      '  hit = collision.circleCollide(coin, 12, player, 20)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.circleCollide(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim coin',
      '  dim player',
      '  dim hit',
      '  hit = collision.circleCollide(coin, 12, player, 20)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.circleCollide(');
  });
});

// ─── pointInBox ───────────────────────────────────────────────────────────────

describe('collision — pointInBox', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim btn',
      '  dim hit',
      '  hit = collision.pointInBox(100, 200, btn)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.pointInBox(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim btn',
      '  dim hit',
      '  hit = collision.pointInBox(100, 200, btn)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.pointInBox(');
  });
});

// ─── raycast ─────────────────────────────────────────────────────────────────

describe('collision — raycast', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim enemies',
      '  dim hit',
      '  hit = collision.raycast(100, 200, 90, 300, enemies)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.raycast(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim enemies',
      '  dim hit',
      '  hit = collision.raycast(100, 200, 90, 300, enemies)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.raycast(');
  });
});

// ─── raycastAll ───────────────────────────────────────────────────────────────

describe('collision — raycastAll', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim enemies',
      '  dim hits',
      '  hits = collision.raycastAll(100, 200, 45, 400, enemies)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.raycastAll(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim enemies',
      '  dim hits',
      '  hits = collision.raycastAll(100, 200, 45, 400, enemies)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.raycastAll(');
  });
});

// ─── setupTileCollision ───────────────────────────────────────────────────────

describe('collision — setupTileCollision', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim level',
      '  collision.setupTileCollision(level)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.setupTileCollision(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim level',
      '  collision.setupTileCollision(level)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setupTileCollision(');
  });
});

// ─── RayHit property access ───────────────────────────────────────────────────

describe('collision — RayHit property access', () => {
  test('h.distance property access compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim h as rayhit',
      '  dim d',
      '  d = h.distance',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('h.sprite property access compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim h as rayhit',
      '  dim s',
      '  s = h.sprite',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── gfx.boxCollide backward compat ──────────────────────────────────────────

describe('gfx — boxCollide backward compat', () => {
  test('compiles without error', () => {
    const result = transpileWithGfx([
      'function test()',
      '  dim a',
      '  dim b',
      '  dim hit',
      '  hit = gfx.boxCollide(a, b)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.spriteCollide( (not _sb.boxCollide)', () => {
    const result = transpileWithGfx([
      'function test()',
      '  dim a',
      '  dim b',
      '  dim hit',
      '  hit = gfx.boxCollide(a, b)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.spriteCollide(');
    expect(result.code).not.toContain('_sb.boxCollide(');
  });
});
