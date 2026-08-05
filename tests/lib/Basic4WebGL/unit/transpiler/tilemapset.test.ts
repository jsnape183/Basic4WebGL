import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transformSource    = readFileSync('src/lib/Basic4WebGL/defs/transform.bas',    'utf-8');
const tileMapLayerSource = readFileSync('src/lib/Basic4WebGL/defs/tilemaplayer.bas', 'utf-8');
const tileMapSetSource   = readFileSync('src/lib/Basic4WebGL/defs/tilemapset.bas',   'utf-8');
const worldSource        = readFileSync('src/lib/Basic4WebGL/defs/world.bas',        'utf-8');

const transpileWithTileMapSet = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'world', source: worldSource }],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource    },
      { name: 'TileMapLayer.bas',    source: tileMapLayerSource },
      { name: 'TileMapSet.bas',      source: tileMapSetSource   },
      { name: 'Main.bas',            source                     },
    ],
  });

// ─── Construction ─────────────────────────────────────────────────────────────

describe('TileMapSet — construction', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapSet(
      'function test()\n  dim tm as TileMapSet("level1.stm")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.createTileMapSet(', () => {
    const result = transpileWithTileMapSet(
      'function test()\n  dim tm as TileMapSet("level1.stm")\nendfunction'
    );
    expect(result.code).toContain('_sb.createTileMapSet(');
  });
});

// ─── layer() ──────────────────────────────────────────────────────────────────

describe('TileMapSet — layer', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapSet([
      'function test()',
      '  dim tm as TileMapSet("level1.stm")',
      '  dim bg as TileMapLayer',
      '  bg = tm.layer("background")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getTileMapSetLayer(', () => {
    const result = transpileWithTileMapSet([
      'function test()',
      '  dim tm as TileMapSet("level1.stm")',
      '  dim bg as TileMapLayer',
      '  bg = tm.layer("background")',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.getTileMapSetLayer(');
  });
});

// ─── layer() return value usable exactly like TileMapLayer ────────────────────
//
// Note: `dim bg as TileMapLayer` (explicit type) then a separate `bg = tm.layer(...)`
// assignment is required — a bare `dim bg` or inline chaining
// (`tm.layer("background").tileAt(...)`) fails to parse, since member/method access
// is only recognized on a variable declared with an explicit class type.

describe('TileMapSet — layer() return value supports the full TileMapLayer API', () => {
  test('tileAt / widthPx / heightPx / transform / setDepth all compile without error', () => {
    const result = transpileWithTileMapSet([
      'function test()',
      '  dim tm as TileMapSet("level1.stm")',
      '  dim bg as TileMapLayer',
      '  bg = tm.layer("background")',
      '  dim t',
      '  t = bg.tileAt(100, 200)',
      '  dim w',
      '  w = bg.widthPx()',
      '  dim h',
      '  h = bg.heightPx()',
      '  bg.transform.setPosition(-50, 0)',
      '  bg.setDepth(0)',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── transform (whole-map, same pattern as TileMap) ────────────────────────────

describe('TileMapSet — transform', () => {
  test('setPosition compiles without error', () => {
    const result = transpileWithTileMapSet([
      'function test()',
      '  dim tm as TileMapSet("level1.stm")',
      '  tm.transform.setPosition(-100, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  // "compiles without error" alone is not a real gate here — the compiler
  // happily emits a call to a property that doesn't exist on the class
  // (it would only fail at runtime). Assert the class body actually wires
  // up a transform, the same way TileMapLayer's own constructor does.
  test('TileMapSet class body actually constructs a transform', () => {
    const result = transpileWithTileMapSet(
      'function test()\n  dim tm as TileMapSet("level1.stm")\nendfunction'
    );
    const classBody = result.code.slice(result.code.indexOf('class _sb_tilemapset'));
    expect(classBody).toContain('this.transform = new _sb_objecttransform(this._handle)');
  });
});

// ─── world.add (TileMapSet is a normal renderable — no auto-render) ───────────

describe('TileMapSet — world.add', () => {
  test('compiles without error', () => {
    const result = transpileWithTileMapSet([
      'function test()',
      '  dim tm as TileMapSet("level1.stm")',
      '  world.add(tm)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.addToWorld(', () => {
    const result = transpileWithTileMapSet([
      'function test()',
      '  dim tm as TileMapSet("level1.stm")',
      '  world.add(tm)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.addToWorld(');
  });
});

// ─── End-to-end ───────────────────────────────────────────────────────────────

describe('TileMapSet — end-to-end', () => {
  test('full multi-layer platformer map program compiles without error', () => {
    const result = transpileWithTileMapSet([
      'dim tm as TileMapSet("level1.stm")',
      'dim solid as TileMapLayer',
      'dim background as TileMapLayer',
      '',
      'function onenter()',
      '  world.add(tm)',
      '  solid = tm.layer("collision")',
      '  background = tm.layer("background")',
      '  background.transform.setPosition(0, 0)',
      'endfunction',
      '',
      'function onupdate()',
      '  dim tileId',
      '  tileId = solid.tileAt(100, 200)',
      '  if tileId > 0',
      '    solid.transform.setPosition(-50, 0)',
      '  endif',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });
});
