import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transformSource = readFileSync('src/lib/Basic4WebGL/defs/transform.bas', 'utf-8');
const tileMapSource   = readFileSync('src/lib/Basic4WebGL/defs/tilemap.bas',   'utf-8');

const transpileWithTileMap = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource },
      { name: 'TileMap.bas',         source: tileMapSource  },
      { name: 'Main.bas',            source                 },
    ],
  });

// ─── Construction ─────────────────────────────────────────────────────────────

describe('TileMap — construction', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMap(
      'function test()\n  dim m as TileMap("tileset.png", 32, 32)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.createTileMap(', () => {
    const result = transpileWithTileMap(
      'function test()\n  dim m as TileMap("tileset.png", 32, 32)\nendfunction'
    );
    expect(result.code).toContain('_sb.createTileMap(');
  });
});

// ─── load ─────────────────────────────────────────────────────────────────────

describe('TileMap — load', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMap([
      'function test()',
      '  dim m as TileMap("tileset.png", 32, 32)',
      '  m.load("level1.json")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.loadTileMap(', () => {
    const result = transpileWithTileMap([
      'function test()',
      '  dim m as TileMap("tileset.png", 32, 32)',
      '  m.load("level1.json")',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.loadTileMap(');
  });
});

// ─── tileAt ───────────────────────────────────────────────────────────────────

describe('TileMap — tileAt', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMap([
      'function test()',
      '  dim m as TileMap("tileset.png", 32, 32)',
      '  dim t',
      '  t = m.tileAt(100, 200)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.tileAt(', () => {
    const result = transpileWithTileMap([
      'function test()',
      '  dim m as TileMap("tileset.png", 32, 32)',
      '  dim t',
      '  t = m.tileAt(100, 200)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.tileAt(');
  });
});

// ─── widthPx / heightPx ───────────────────────────────────────────────────────

describe('TileMap — widthPx', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMap([
      'function test()',
      '  dim m as TileMap("tileset.png", 32, 32)',
      '  dim w',
      '  w = m.widthPx()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.tileMapWidthPx(', () => {
    const result = transpileWithTileMap([
      'function test()',
      '  dim m as TileMap("tileset.png", 32, 32)',
      '  dim w',
      '  w = m.widthPx()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.tileMapWidthPx(');
  });
});

describe('TileMap — heightPx', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMap([
      'function test()',
      '  dim m as TileMap("tileset.png", 32, 32)',
      '  dim h',
      '  h = m.heightPx()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.tileMapHeightPx(', () => {
    const result = transpileWithTileMap([
      'function test()',
      '  dim m as TileMap("tileset.png", 32, 32)',
      '  dim h',
      '  h = m.heightPx()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.tileMapHeightPx(');
  });
});

// ─── transform ────────────────────────────────────────────────────────────────

describe('TileMap — transform', () => {
  test('setPosition compiles without error', () => {
    const result = transpileWithTileMap([
      'function test()',
      '  dim m as TileMap("tileset.png", 32, 32)',
      '  m.transform.setPosition(-100, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── End-to-end ───────────────────────────────────────────────────────────────

describe('TileMap — end-to-end', () => {
  test('full platformer map program compiles without error', () => {
    const result = transpileWithTileMap([
      'dim bg as TileMap("tileset.png", 32, 32)',
      '',
      'function onenter()',
      '  bg.load("level1.json")',
      '  bg.transform.setPosition(0, 0)',
      'endfunction',
      '',
      'function onupdate()',
      '  dim tileId',
      '  tileId = bg.tileAt(100, 200)',
      '  if tileId > 0',
      '    bg.transform.setPosition(-50, 0)',
      '  endif',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });
});
