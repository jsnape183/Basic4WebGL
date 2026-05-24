import { describe, test, expect } from 'vitest';
import { generateModule } from '@Basic4WebGL/library/generator/moduleGenerator';
import { ModuleDescriptor } from '@Basic4WebGL/library/generator/types';

describe('generateModule', () => {
  const stageDescriptor: ModuleDescriptor = {
    name: 'stage',
    functions: [
      {
        name: 'add',
        params: ['obj'],
        body: (p, _self) => `_sb.addToStage(${p.obj})`,
      },
      {
        name: 'clear',
        params: [],
        body: (_p, _self) => `_sb.clear()`,
      },
    ],
  };

  test('does not start with Class', () => {
    const output = generateModule(stageDescriptor);
    expect(output.startsWith('Class')).toBe(false);
  });

  test('generates a function block for each descriptor function', () => {
    const output = generateModule(stageDescriptor);
    expect(output).toContain('function add(obj)');
    expect(output).toContain('function clear()');
    expect(output).toContain('endfunction');
  });

  test('function param is prefixed with functionname_', () => {
    const output = generateModule(stageDescriptor);
    expect(output).toContain('call("_sb.addToStage(add_obj)")');
  });

  test('body emits call(...) without return', () => {
    const output = generateModule(stageDescriptor);
    expect(output).toContain('    call("_sb.clear()")');
    expect(output).not.toContain('return call("_sb.clear()")');
  });

  test('returns emits return call(...)', () => {
    const desc: ModuleDescriptor = {
      name: 'gfx',
      functions: [
        {
          name: 'getKeyDown',
          params: ['keycode'],
          returns: (p, _self) => `_sb.getKeyDown(${p.keycode})`,
        },
      ],
    };
    const output = generateModule(desc);
    expect(output).toContain('return call("_sb.getKeyDown(getkeydown_keycode)")');
  });

  test('generates dim for module-level properties', () => {
    const desc: ModuleDescriptor = {
      name: 'audio',
      properties: ['_volume'],
      functions: [],
    };
    const output = generateModule(desc);
    expect(output).toContain('dim _volume');
  });

  test('module self proxy resolves to modulename.prop in call string', () => {
    const desc: ModuleDescriptor = {
      name: 'audio',
      properties: ['_volume'],
      functions: [
        {
          name: 'getVolume',
          params: [],
          returns: (_p, self) => `${self._volume}`,
        },
      ],
    };
    const output = generateModule(desc);
    expect(output).toContain('return call("audio._volume")');
  });
});
