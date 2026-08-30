import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import { packageModules } from '../../../../../src/constants/packageModules';

const keyboardLib = {
  name: 'keyboard',
  source: readFileSync('src/lib/Basic4WebGL/defs/keyboard.bas', 'utf-8'),
};
const controllerLib = {
  name: 'controller',
  source: readFileSync('src/lib/Basic4WebGL/defs/controller.bas', 'utf-8'),
};
const inputLib = {
  name: 'input',
  source: readFileSync('src/lib/Basic4WebGL/defs/input.bas', 'utf-8'),
};

/** Transpile a Main.bas body with keyboard + controller + input defs in scope. */
const transpileMain = (body: string) =>
  compiler.transpile({
    lib: [keyboardLib, controllerLib, inputLib],
    files: [{ name: 'Main.bas', source: body }],
  });

describe('controller — registration', () => {
  test('packageModules["controller"] resolves to real source', () => {
    expect(packageModules.controller).toBeTypeOf('string');
    expect(packageModules.controller).toContain('const');
    expect(packageModules.controller).toContain('endconst');
  });
});

describe('controller — constant references', () => {
  test('controller.A compiles with zero diagnostics', () => {
    const result = transpileMain('function test()\n  dim n\n  n = controller.A\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('controller.A emits _const_controller.a', () => {
    const result = transpileMain('function test()\n  dim n\n  n = controller.A\nendfunction');
    expect(result.code).toContain('_const_controller.a');
  });

  test('controller.RSTICK_RIGHT (axis half) compiles with zero diagnostics', () => {
    const result = transpileMain('function test()\n  dim n\n  n = controller.RSTICK_RIGHT\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });
});
