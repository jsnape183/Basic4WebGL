import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

const spriteSource    = readFileSync('src/lib/Basic4WebGL/defs/sprite.bas',     'utf-8');
const transformSource = readFileSync('src/lib/Basic4WebGL/defs/transform.bas',  'utf-8');

const transpileWithSprite = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource },
      { name: 'Sprite.bas',          source: spriteSource    },
      { name: 'Main.bas',            source                  },
    ],
  });

// ─── Inline init ─────────────────────────────────────────────────────────────

describe('dim x = expr — inline init', () => {
  test('1. dim x = 10 compiles without diagnostics', () => {
    const result = transpile('function onenter()\n  dim x = 10\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('2. dim x = 10 emits = 10 not = undefined', () => {
    const result = transpile('function onenter()\n  dim x = 10\nendfunction');
    expect(result.code).toContain('onenter_x = 10');
    expect(result.code).not.toContain('onenter_x = undefined');
  });

  test('3. dim x = "hello" compiles without diagnostics', () => {
    const result = transpile('function onenter()\n  dim x = "hello"\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('4. dim x = someVar + 1 compiles without diagnostics', () => {
    const result = transpile([
      'function onenter()',
      '  dim someVar',
      '  someVar = 5',
      '  dim x = someVar + 1',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── Multi-declarator plain ───────────────────────────────────────────────────

describe('dim x, y — multi-declarator plain', () => {
  test('5. dim x, y compiles without diagnostics', () => {
    const result = transpile('function onenter()\n  dim x, y\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('6. dim x, y emits two separate declarations', () => {
    const result = transpile('function onenter()\n  dim x, y\nendfunction');
    expect(result.code).toContain('onenter_x = undefined');
    expect(result.code).toContain('onenter_y = undefined');
  });

  test('7. dim x, y, z emits three declarations', () => {
    const result = transpile('function onenter()\n  dim x, y, z\nendfunction');
    expect(result.code).toContain('onenter_x = undefined');
    expect(result.code).toContain('onenter_y = undefined');
    expect(result.code).toContain('onenter_z = undefined');
  });
});

// ─── Multi-declarator objects ─────────────────────────────────────────────────

describe('dim x, y as Sprite — multi-declarator with objects', () => {
  test('8. dim x, y as Sprite("img.png") compiles without diagnostics', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x, y as Sprite("img.png")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('9. dim x, y as Sprite("img.png") — as binds only to y', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x, y as Sprite("img.png")\nendfunction'
    );
    expect(result.code).toContain('onenter_x = undefined');
    expect(result.code).toContain('onenter_y = new _sb_sprite(');
    expect(result.code).not.toContain('onenter_x = new _sb_sprite(');
  });

  test('10. dim x as Sprite("a"), y as Sprite("b") compiles without diagnostics', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x as Sprite("a"), y as Sprite("b")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('11. dim x as Sprite("a"), y as Sprite("b") emits two new _sb_sprite()', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x as Sprite("a"), y as Sprite("b")\nendfunction'
    );
    expect(result.code).toContain('onenter_x = new _sb_sprite(');
    expect(result.code).toContain('onenter_y = new _sb_sprite(');
  });
});

// ─── Combo ────────────────────────────────────────────────────────────────────

describe('dim combo — mixed init forms', () => {
  test('12. dim x = 10, y compiles without diagnostics', () => {
    const result = transpile('function onenter()\n  dim x = 10, y\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('13. dim x = 10, y — x gets 10, y gets undefined', () => {
    const result = transpile('function onenter()\n  dim x = 10, y\nendfunction');
    expect(result.code).toContain('onenter_x = 10');
    expect(result.code).toContain('onenter_y = undefined');
  });

  test('14. dim x = 10, y, z as Sprite("img.png") compiles without diagnostics', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x = 10, y, z as Sprite("img.png")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('15. dim x = 10, y, z as Sprite("img.png") — three statements in order', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x = 10, y, z as Sprite("img.png")\nendfunction'
    );
    expect(result.code).toContain('onenter_x = 10');
    expect(result.code).toContain('onenter_y = undefined');
    expect(result.code).toContain('onenter_z = new _sb_sprite(');
  });
});

// ─── Array restriction ────────────────────────────────────────────────────────

describe('dim array restriction', () => {
  test("16. dim x(10), y produces diagnostic containing 'x(10)'", () => {
    const result = transpile('function onenter()\n  dim x(10), y\nendfunction');
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message).toContain("'x(10)'");
  });

  test("17. dim x, y(10) produces diagnostic containing 'y(10)'", () => {
    const result = transpile('function onenter()\n  dim x, y(10)\nendfunction');
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message).toContain("'y(10)'");
  });
});

// ─── Regression ───────────────────────────────────────────────────────────────

describe('dim regression — existing forms unchanged', () => {
  test('18. dim x compiles and emits undefined', () => {
    const result = transpile('function onenter()\n  dim x\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_x = undefined');
  });

  test('19. dim x as Sprite("img.png") compiles and emits new _sb_sprite()', () => {
    const result = transpileWithSprite(
      'function onenter()\n  dim x as Sprite("img.png")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_x = new _sb_sprite(');
  });

  test('20. dim x(5) compiles and emits _createArray([5])', () => {
    const result = transpile('function onenter()\n  dim x(5)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_createArray([5])');
  });
});
