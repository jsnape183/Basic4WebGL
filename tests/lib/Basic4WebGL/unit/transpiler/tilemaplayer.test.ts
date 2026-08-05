import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transformSource   = readFileSync('src/lib/Basic4WebGL/defs/transform.bas',    'utf-8');
const tileMapLayerSource = readFileSync('src/lib/Basic4WebGL/defs/tilemaplayer.bas', 'utf-8');

const transpileWithTileMapLayer = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource    },
      { name: 'TileMapLayer.bas',    source: tileMapLayerSource },
      { name: 'Main.bas',            source                     },
    ],
  });

// ─── Construction ─────────────────────────────────────────────────────────────

describe('TileMapLayer — construction', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapLayer(
      'function test()\n  dim m as TileMapLayer(call("null"))\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── tileAt ───────────────────────────────────────────────────────────────────

describe('TileMapLayer — tileAt', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapLayer([
      'function test()',
      '  dim m as TileMapLayer(call("null"))',
      '  dim t',
      '  t = m.tileAt(100, 200)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.tileAt(', () => {
    const result = transpileWithTileMapLayer([
      'function test()',
      '  dim m as TileMapLayer(call("null"))',
      '  dim t',
      '  t = m.tileAt(100, 200)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.tileAt(');
  });
});

// ─── widthPx / heightPx ───────────────────────────────────────────────────────

describe('TileMapLayer — widthPx / heightPx', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapLayer([
      'function test()',
      '  dim m as TileMapLayer(call("null"))',
      '  dim w',
      '  dim h',
      '  w = m.widthPx()',
      '  h = m.heightPx()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── transform ────────────────────────────────────────────────────────────────

describe('TileMapLayer — transform', () => {
  test('setPosition compiles without error', () => {
    const result = transpileWithTileMapLayer([
      'function test()',
      '  dim m as TileMapLayer(call("null"))',
      '  m.transform.setPosition(-100, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── setDepth ─────────────────────────────────────────────────────────────────

describe('TileMapLayer — setDepth', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapLayer(
      'function test()\n  dim m as TileMapLayer(call("null"))\n  m.setDepth(2)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── Returned from a plain function (critical mechanism for TileMapSet.layer()) ─

describe('TileMapLayer — constructed and returned from a plain function', () => {
  test('compiles without error, and the returned value supports method calls', () => {
    const result = transpileWithTileMapLayer([
      'function makeLayer()',
      '  dim result as TileMapLayer(call("null"))',
      '  return result',
      'endfunction',
      '',
      'function test()',
      '  dim layer as TileMapLayer',
      '  layer = makeLayer()',
      '  dim t',
      '  t = layer.tileAt(10, 20)',
      '  layer.transform.setPosition(5, 5)',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });
});
