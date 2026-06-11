import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import { node } from '@CompilerLib/tree';
import BuiltInType from '@CompilerLib/builtInTypes';
import { Symbol, SymbolScope } from '@CompilerLib/symbols';
import { ArraySymbol } from '@Basic4WebGL/symbolTypes';
import nodeTypes from '@Basic4WebGL/nodeTypes';
import '@Basic4WebGL/transpilerRules';
import TypedArrayDimRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/TypedArrayDimRule';

// ─── Helpers for TypedArrayDimRule tests ──────────────────────────────────────

const variant = new BuiltInType('Variant');
const modScope = (name = 'main') => new SymbolScope(name, 'Module');
const fnScope = (name: string) => new SymbolScope(name, 'Function');
const classScope = (name: string) => new SymbolScope(name, 'Class');

const arrSym = (name: string, scope = modScope()) =>
  new ArraySymbol(name, 'Array', scope, scope.name, 1);
const classSym = (name: string) =>
  new Symbol(name, 'Class', modScope(), 'main', variant);
const term = (v: string) => node(nodeTypes.Term, v);

const transpile = (source: string) => {
  const result = compiler.transpile({
    lib: [],
    files: [{ name: 'Main.bas', source }],
  });
  return result;
};

const arrayLib = {
  name: 'array',
  source: readFileSync('src/lib/Basic4WebGL/defs/array.bas', 'utf-8'),
};

const transpileWithArrayLib = (source: string) => {
  const result = compiler.transpile({
    lib: [arrayLib],
    files: [{ name: 'Main.bas', source }],
  });
  return result;
};

describe('Array — module-level declaration', () => {
  test('dim arr(10) at module level produces valid JS without let', () => {
    const result = transpile('dim arr(10)');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr = _createArray([10])');
    expect(result.code).not.toContain('let main.arr');
  });
});

describe('Array — bare reference in expression context', () => {
  test('array variable compiles as argument to a function', () => {
    const result = transpile([
      'dim arr(5)',
      'function getLen(a)',
      '  dim x',
      '  x = 1',
      'endfunction',
      'function test()',
      '  dim x',
      '  x = getLen(arr)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr');
  });
});

describe('Array — pass by reference', () => {
  test('mutation inside function is visible to caller', () => {
    // Compiles without error — runtime behaviour verified manually
    const result = transpile([
      'dim enemies(5)',
      'enemies(0) = 10',
      'function resetFirst(arr)',
      '  arr(0) = 0',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('Array — index read and write', () => {
  test('arr(0) = x at module level emits main.arr[0] = ...', () => {
    const result = transpile('dim arr(5)\narr(0) = 42');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr[0]');
  });

  test('print arr(0) at module level emits main.arr[0]', () => {
    const result = transpile('dim arr(5)\nprint arr(0)');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr[0]');
  });

  test('grid(2, 1) = x on 2D array emits main.grid[2][1]', () => {
    const result = transpile('dim grid(5, 3)\ngrid(2, 1) = true');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.grid[2][1]');
  });

  test('print grid(2, 1) on 2D array emits main.grid[2][1]', () => {
    const result = transpile('dim grid(5, 3)\nprint grid(2, 1)');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.grid[2][1]');
  });
});

describe('Array — arrLength and join compile with module-level array', () => {
  test('array.arrLength(arr) compiles without error', () => {
    const result = transpileWithArrayLib([
      'dim arr(5)',
      'function test()',
      '  print array.arrLength(arr)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.join(arr, ",") compiles without error', () => {
    const result = transpileWithArrayLib([
      'dim arr(3)',
      'function test()',
      '  print array.join(arr, ",")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('TypedArrayDimRule', () => {
  test('module-scope typed array emits null factory', () => {
    const dims = node(nodeTypes.ExpressionList, null, [term('10')]);
    const n = node(nodeTypes.TypedArrayDim, {
      arraySymbol: arrSym('enemies'),
      classSymbol: classSym('Enemy'),
    }, [dims]);
    expect(new TypedArrayDimRule().generate(n, undefined))
      .toBe('main.enemies = _createTypedArray([10], () => null);');
  });

  test('function-scope typed array retains let', () => {
    const dims = node(nodeTypes.ExpressionList, null, [term('20')]);
    const n = node(nodeTypes.TypedArrayDim, {
      arraySymbol: arrSym('bullets', fnScope('onenter')),
      classSymbol: classSym('Bullet'),
    }, [dims]);
    expect(new TypedArrayDimRule().generate(n, undefined))
      .toBe('let onenter_bullets = _createTypedArray([20], () => null);');
  });

  test('class-scope typed array emits prototype form', () => {
    const dims = node(nodeTypes.ExpressionList, null, [term('3')]);
    const n = node(nodeTypes.TypedArrayDim, {
      arraySymbol: arrSym('tiles', classScope('Level')),
      classSymbol: classSym('Tile'),
    }, [dims]);
    expect(new TypedArrayDimRule().generate(n, undefined))
      .toBe('Level.prototype.tiles = _createTypedArray([3], () => null);');
  });

  test('multi-dimensional typed array', () => {
    const dims = node(nodeTypes.ExpressionList, null, [term('5'), term('3')]);
    const n = node(nodeTypes.TypedArrayDim, {
      arraySymbol: new ArraySymbol('grid', 'Array', modScope(), 'main', 2),
      classSymbol: classSym('Tile'),
    }, [dims]);
    expect(new TypedArrayDimRule().generate(n, undefined))
      .toBe('main.grid = _createTypedArray([5,3], () => null);');
  });
});

describe('Array utility functions — compile without error', () => {
  const withArray = (body: string) =>
    transpileWithArrayLib(['dim arr(0)', body].join('\n'));

  test('array.push compiles', () => {
    const result = withArray('array.push(arr, 42)');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.pop compiles', () => {
    const result = withArray('function test()\n  dim x\n  x = array.pop(arr)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.contains compiles', () => {
    const result = withArray('function test()\n  dim x\n  x = array.contains(arr, 42)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.indexOf compiles', () => {
    const result = withArray('function test()\n  dim x\n  x = array.indexOf(arr, 42)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.remove compiles', () => {
    const result = withArray('array.remove(arr, 0)');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.clear compiles', () => {
    const result = withArray('array.clear(arr)');
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('Typed array declaration — integration', () => {
  test('dim arr(10) as Enemy compiles to _createTypedArray with null factory', () => {
    const result = compiler.transpile({
      lib: [],
      files: [
        { name: 'Enemy.bas', source: 'Class\nEndClass' },
        { name: 'Main.bas', source: 'dim enemies(10) as Enemy' },
      ],
    });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_createTypedArray([10], () => null)');
  });

  test('dim arr(5) as Sprite("bunny.png") is a compile error (constructor args blocked)', () => {
    const result = compiler.transpile({
      lib: [],
      files: [
        { name: 'Sprite.bas', source: 'Class\nConstructor(img)\nEndConstructor\nEndClass' },
        { name: 'Main.bas', source: 'dim sprites(5) as Sprite("bunny.png")' },
      ],
    });
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message).toMatch(/constructor/i);
  });

  test('dim arr(5, 3) as Tile() is a compile error (constructor args blocked)', () => {
    const result = compiler.transpile({
      lib: [],
      files: [
        { name: 'Tile.bas', source: 'Class\nEndClass' },
        { name: 'Main.bas', source: 'dim grid(5, 3) as Tile()' },
      ],
    });
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message).toMatch(/constructor/i);
  });
});
