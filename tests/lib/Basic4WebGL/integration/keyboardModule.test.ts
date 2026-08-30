import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import compiler from '@Basic4WebGL/index';

const keyboardLib = {
  name: 'keyboard',
  source: readFileSync('src/lib/Basic4WebGL/defs/keyboard.bas', 'utf-8'),
};
const mathLib = {
  name: 'math',
  source: readFileSync('src/lib/Basic4WebGL/defs/math.bas', 'utf-8'),
};
const inputLib = {
  name: 'input',
  source: readFileSync('src/lib/Basic4WebGL/defs/input.bas', 'utf-8'),
};

const transpile = (source: string) =>
  compiler.transpile({ lib: [keyboardLib, mathLib, inputLib], files: [{ name: 'Main.bas', source }] });

describe('keyboard module', () => {
  test('keyboard.bas compiles on its own with no diagnostics', () => {
    const result = compiler.transpile({
      lib: [keyboardLib],
      files: [{ name: 'Main.bas', source: 'function test()\n  dim x\n  x = 1\nendfunction' }],
    });
    expect(result.diagnostics).toHaveLength(0);
  });

  test('keyboard.SPACE resolves and compiles through input.getKeyDown', () => {
    const src = [
      'function test()',
      '  dim held',
      '  held = input.getKeyDown(keyboard.SPACE)',
      'endfunction',
    ].join('\n');
    const result = transpile(src);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_keyboard.space');
  });

  test('emitted holder is frozen and includes the full expected set', () => {
    const result = transpile('function test()\n  dim x\n  x = keyboard.A\nendfunction');
    expect(result.code).toContain('const _const_keyboard = Object.freeze({');
    for (const [name, val] of [
      ['left', 37], ['up', 38], ['right', 39], ['down', 40],
      ['space', 32], ['enter', 13], ['escape', 27], ['tab', 9], ['backspace', 8],
      ['delete', 46], ['home', 36], ['end', 35],
      ['shift', 16], ['ctrl', 17], ['alt', 18],
      ['a', 65], ['z', 90], ['digit_0', 48], ['digit_9', 57],
    ] as [string, number][]) {
      expect(result.code).toContain(`${name}: ${val}`);
    }
  });

  test('assigning to a keyboard constant is rejected', () => {
    const result = transpile('function test()\n  keyboard.SPACE = 1\nendfunction');
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});
