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

describe('input.bind', () => {
  test('compiles with zero diagnostics', () => {
    const result = transpileMain(['function oncreate()','  input.bind("jump", "key", 32)','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.bind(', () => {
    const result = transpileMain(['function oncreate()','  input.bind("jump", "key", 32)','endfunction'].join('\n'));
    expect(result.code).toContain('_sb.bind(');
  });
  test('accepts a keyboard.* constant as the code argument', () => {
    const result = transpileMain(['function oncreate()','  input.bind("jump", "key", keyboard.SPACE)','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_keyboard.space');
  });
  test('accepts a controller.* button constant as the code argument', () => {
    const result = transpileMain(['function oncreate()','  input.bind("jump", "button", controller.A)','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_controller.a');
  });
  test('accepts a controller.* axis-half constant as the code argument', () => {
    const result = transpileMain(['function oncreate()','  input.bind("aim_right", "axis", controller.RSTICK_RIGHT)','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_controller.rstick_right');
  });
});

describe('input.clearBindings', () => {
  test('compiles and emits _sb.clearBindings(', () => {
    const result = transpileMain(['function rebind()','  input.clearBindings("jump")','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.clearBindings(');
  });
});

describe('input.held / pressed / released', () => {
  test('input.held emits _sb.held(', () => {
    const result = transpileMain(['function onupdate(delta)','  dim h','  h = input.held("fire")','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.held(');
  });
  test('input.pressed emits _sb.pressed(', () => {
    const result = transpileMain(['function onupdate(delta)','  if input.pressed("jump") then','  endif','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.pressed(');
  });
  test('input.released emits _sb.released(', () => {
    const result = transpileMain(['function onupdate(delta)','  if input.released("charge") then','  endif','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.released(');
  });
});

describe('input.strength / axis', () => {
  test('input.strength emits _sb.strength(', () => {
    const result = transpileMain(['function onupdate(delta)','  dim s','  s = input.strength("fire")','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.strength(');
  });
  test('input.axis emits _sb.axis(', () => {
    const result = transpileMain(['function onupdate(delta)','  dim move','  move = input.axis("move_left", "move_right")','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.axis(');
  });
});

describe('input.padConnected / setDeadzone', () => {
  test('input.padConnected emits _sb.padConnected(', () => {
    const result = transpileMain(['function onupdate(delta)','  dim p','  p = input.padConnected()','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.padConnected(');
  });
  test('input.setDeadzone emits _sb.setDeadzone(', () => {
    const result = transpileMain(['function oncreate()','  input.setDeadzone(0.2)','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.setDeadzone(');
  });
});

describe('input — deprecated functions still compile', () => {
  test('getKeyDown / keyPressed / keyReleased unchanged', () => {
    const result = transpileMain(['function onupdate(delta)','  dim a','  a = input.getKeyDown(37)','  a = input.keyPressed(38)','  a = input.keyReleased(39)','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.getKeyDown(');
    expect(result.code).toContain('_sb.keyPressed(');
    expect(result.code).toContain('_sb.keyReleased(');
  });
  test('getKeyDown accepts a keyboard.* constant', () => {
    const result = transpileMain(['function onupdate(delta)','  dim a','  a = input.getKeyDown(keyboard.LEFT)','endfunction'].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_keyboard.left');
  });
});
