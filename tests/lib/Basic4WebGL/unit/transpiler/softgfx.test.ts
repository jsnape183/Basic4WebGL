import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const transformSource = readFileSync('src/lib/Basic4WebGL/defs/transform.bas', 'utf-8');
const spriteSource = readFileSync('src/lib/Basic4WebGL/defs/sprite.bas', 'utf-8');
const gfxSource = readFileSync('src/lib/Basic4WebGL/defs/gfx.bas', 'utf-8');
const inputSource = readFileSync('src/lib/Basic4WebGL/defs/input.bas', 'utf-8');
const stageSource = readFileSync('src/lib/Basic4WebGL/defs/stage.bas', 'utf-8');
const textSource = readFileSync('src/lib/Basic4WebGL/defs/text.bas', 'utf-8');
const penSource = readFileSync('src/lib/Basic4WebGL/defs/pen.bas', 'utf-8');

const transpileWithSprite = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource },
      { name: 'Sprite.bas', source: spriteSource },
      { name: 'Main.bas', source },
    ],
  });

const transpileWithGfx = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'gfx', source: gfxSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithInput = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'input', source: inputSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithStage = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'stage', source: stageSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithText = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'Text.bas', source: textSource },
      { name: 'Main.bas', source },
    ],
  });

const transpileWithPen = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'pen', source: penSource }],
    files: [{ name: 'Main.bas', source }],
  });

// ─── Sprite — new methods ─────────────────────────────────────────────────────

describe('Sprite — setScale', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setScale(2, 2)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setScale(', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setScale(2, 2)\nendfunction'
    );
    expect(result.code).toContain('_sb.setScale(');
  });
});

describe('Sprite — setFlip', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setFlip(true, false)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setFlip(', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setFlip(true, false)\nendfunction'
    );
    expect(result.code).toContain('_sb.setFlip(');
  });
});

describe('Sprite — setVisible', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setVisible(false)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setVisible(', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setVisible(false)\nendfunction'
    );
    expect(result.code).toContain('_sb.setVisible(');
  });
});

describe('Sprite — setTexture', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setTexture("other.png")\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setTexture(', () => {
    const result = transpileWithSprite(
      'function test()\n  dim s as Sprite("t.png")\n  s.setTexture("other.png")\nendfunction'
    );
    expect(result.code).toContain('_sb.setTexture(');
  });
});

describe('Sprite — width', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("t.png")',
      '  dim w',
      '  w = s.width()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getSpriteWidth(', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("t.png")',
      '  dim w',
      '  w = s.width()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.getSpriteWidth(');
  });
});

describe('Sprite — height', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("t.png")',
      '  dim h',
      '  h = s.height()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getSpriteHeight(', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("t.png")',
      '  dim h',
      '  h = s.height()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.getSpriteHeight(');
  });
});

// ─── ExpressionList regression — numeric args still work after BoolExpression widening ──

describe('ExpressionList — numeric arguments still parse correctly', () => {
  test('function call with arithmetic args compiles', () => {
    const result = compiler.transpile({
      lib: [],
      files: [{ name: 'Main.bas', source: [
        'function add(a, b)',
        '  return a + b',
        'endfunction',
        'function test()',
        '  dim x',
        '  x = add(1 + 2, x * 3)',
        'endfunction',
      ].join('\n') }],
    });
    expect(result.diagnostics).toHaveLength(0);
  });
  test('function call with multiple numeric args compiles', () => {
    const result = compiler.transpile({
      lib: [],
      files: [{ name: 'Main.bas', source: [
        'function sum(a, b, c)',
        '  return a + b + c',
        'endfunction',
        'function test()',
        '  dim x',
        '  x = sum(10, 20, 30)',
        'endfunction',
      ].join('\n') }],
    });
    expect(result.diagnostics).toHaveLength(0);
  });
  test('function call with boolean literal arg compiles', () => {
    const result = compiler.transpile({
      lib: [],
      files: [{ name: 'Main.bas', source: [
        'function toggle(flag)',
        '  return flag',
        'endfunction',
        'function test()',
        '  dim x',
        '  x = toggle(true)',
        'endfunction',
      ].join('\n') }],
    });
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── input — mouse input ──────────────────────────────────────────────────────

describe('input — mouseX', () => {
  test('compiles without error', () => {
    const result = transpileWithInput(
      'function test()\n  dim x\n  x = input.mouseX()\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getMouseX()', () => {
    const result = transpileWithInput(
      'function test()\n  dim x\n  x = input.mouseX()\nendfunction'
    );
    expect(result.code).toContain('_sb.getMouseX()');
  });
});

describe('input — mouseY', () => {
  test('compiles without error', () => {
    const result = transpileWithInput(
      'function test()\n  dim y\n  y = input.mouseY()\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getMouseY()', () => {
    const result = transpileWithInput(
      'function test()\n  dim y\n  y = input.mouseY()\nendfunction'
    );
    expect(result.code).toContain('_sb.getMouseY()');
  });
});

describe('input — mouseDown', () => {
  test('compiles without error', () => {
    const result = transpileWithInput(
      'function test()\n  if input.mouseDown()\n    dim x\n    x = 1\n  endif\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getMouseDown()', () => {
    const result = transpileWithInput(
      'function test()\n  if input.mouseDown()\n    dim x\n    x = 1\n  endif\nendfunction'
    );
    expect(result.code).toContain('_sb.getMouseDown()');
  });
});

// ─── stage — width, height, setBackground ─────────────────────────────────────

describe('stage — width', () => {
  test('compiles without error', () => {
    const result = transpileWithStage(
      'function test()\n  dim w\n  w = stage.width()\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getStageWidth()', () => {
    const result = transpileWithStage(
      'function test()\n  dim w\n  w = stage.width()\nendfunction'
    );
    expect(result.code).toContain('_sb.getStageWidth()');
  });
});

describe('stage — height', () => {
  test('compiles without error', () => {
    const result = transpileWithStage(
      'function test()\n  dim h\n  h = stage.height()\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getStageHeight()', () => {
    const result = transpileWithStage(
      'function test()\n  dim h\n  h = stage.height()\nendfunction'
    );
    expect(result.code).toContain('_sb.getStageHeight()');
  });
});

describe('stage — setBackground', () => {
  test('compiles without error', () => {
    const result = transpileWithStage(
      'function test()\n  stage.setBackground(20, 20, 40)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setBackground(', () => {
    const result = transpileWithStage(
      'function test()\n  stage.setBackground(20, 20, 40)\nendfunction'
    );
    expect(result.code).toContain('_sb.setBackground(setbackground_r');
  });
});

describe('stage — clear', () => {
  test('compiles without error', () => {
    const result = transpileWithStage(
      'function test()\n  stage.clear()\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.clear()', () => {
    const result = transpileWithStage(
      'function test()\n  stage.clear()\nendfunction'
    );
    expect(result.code).toContain('_sb.clear()');
  });
});

// ─── Text — setStyle ──────────────────────────────────────────────────────────

describe('Text — setStyle', () => {
  test('compiles without error', () => {
    const result = transpileWithText([
      'function test()',
      '  dim t as Text("hi", 10, 10)',
      '  t.setStyle(24, 255, 255, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setTextStyle(', () => {
    const result = transpileWithText([
      'function test()',
      '  dim t as Text("hi", 10, 10)',
      '  t.setStyle(24, 255, 255, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setTextStyle(');
  });
});

// ─── pen — setLineWidth ───────────────────────────────────────────────────────

describe('pen — setLineWidth', () => {
  test('compiles without error', () => {
    const result = transpileWithPen(
      'function test()\n  pen.setLineWidth(4)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setLineWidth(setlinewidth_n', () => {
    const result = transpileWithPen(
      'function test()\n  pen.setLineWidth(4)\nendfunction'
    );
    expect(result.code).toContain('_sb.setLineWidth(setlinewidth_n');
  });
});
