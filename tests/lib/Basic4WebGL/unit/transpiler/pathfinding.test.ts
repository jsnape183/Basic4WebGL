import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const pathfindingSource = readFileSync('src/lib/Basic4WebGL/defs/pathfinding.bas', 'utf-8');
const arraySource = readFileSync('src/lib/Basic4WebGL/defs/array.bas', 'utf-8');

const transpileWithPathfinding = (source: string) =>
  compiler.transpile({
    lib: [
      { name: 'pathfinding', source: pathfindingSource },
      { name: 'array', source: arraySource },
    ],
    files: [{ name: 'Main.bas', source }],
  });

// ─── setup ──────────────────────────────────────────────────────────────────

describe('pathfinding — setup', () => {
  test('compiles without error', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim tm',
      '  dim layers(0)',
      '  array.push(layers, "walls")',
      '  pathfinding.setup(tm, layers)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.setupNavGrid( and passes the TileMapSet instance directly (no ._handle in the call string)', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim tm',
      '  dim layers(0)',
      '  array.push(layers, "walls")',
      '  pathfinding.setup(tm, layers)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setupNavGrid(');
    expect(result.code).not.toContain('setup_tm._handle');
  });
});

// ─── setRecomputeInterval ───────────────────────────────────────────────────

describe('pathfinding — setRecomputeInterval', () => {
  test('compiles without error', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  pathfinding.setRecomputeInterval(200)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.setRecomputeInterval(', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  pathfinding.setRecomputeInterval(200)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setRecomputeInterval(');
  });
});

// ─── navigateTo ─────────────────────────────────────────────────────────────

describe('pathfinding — navigateTo', () => {
  test('compiles without error', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  pathfinding.navigateTo(enemy, 100, 200, 120)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.navigateTo( and passes the sprite instance directly', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  pathfinding.navigateTo(enemy, 100, 200, 120)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.navigateTo(');
    expect(result.code).not.toContain('navigateto_enemy._handle');
  });
});

// ─── isNavigating ───────────────────────────────────────────────────────────

describe('pathfinding — isNavigating', () => {
  test('compiles without error', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  dim navigating',
      '  navigating = pathfinding.isNavigating(enemy)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.isNavigating(', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  dim navigating',
      '  navigating = pathfinding.isNavigating(enemy)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.isNavigating(');
  });
});

// ─── stopNavigating ─────────────────────────────────────────────────────────

describe('pathfinding — stopNavigating', () => {
  test('compiles without error', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  pathfinding.stopNavigating(enemy)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.stopNavigating(', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  pathfinding.stopNavigating(enemy)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.stopNavigating(');
  });
});
