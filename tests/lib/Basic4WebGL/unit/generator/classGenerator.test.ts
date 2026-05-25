import { describe, test, expect } from 'vitest';
import { generateClass } from '@Basic4WebGL/library/generator/classGenerator';
import { ClassDescriptor } from '@Basic4WebGL/library/generator/types';
import { transformDescriptor } from '@Basic4WebGL/library/descriptors/transform.descriptor';

const spriteDescriptor: ClassDescriptor = {
  name: 'sprite',
  properties: ['_handle'],
  constructor: {
    params: ['imagePath'],
    body: (p, _self) => `_sb.createSprite(${p.imagePath})`,
    assignTo: '_handle',
  },
  methods: [
    {
      name: 'setPosition',
      params: ['x', 'y'],
      body: (p, self) => `_sb.setPosition(${self._handle}, ${p.x}, ${p.y})`,
    },
    {
      name: 'getX',
      params: [],
      returns: (_p, self) => `_sb.getPositionX(${self._handle})`,
    },
    {
      name: 'setAlpha',
      params: ['a'],
      body: (p, self) => `_sb.setAlpha(${self._handle}, ${p.a})`,
    },
  ],
};

test('starts with Class keyword', () => {
  const output = generateClass(spriteDescriptor);
  expect(output.trimStart().startsWith('Class')).toBe(true);
});

test('ends with EndClass', () => {
  const output = generateClass(spriteDescriptor);
  expect(output.trimEnd().endsWith('EndClass')).toBe(true);
});

test('generates dim declaration for each property', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('dim _handle');
});

test('generates Constructor and EndConstructor blocks', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('Constructor(imagePath)');
  expect(output).toContain('EndConstructor');
});

test('constructor param is prefixed with constructor_', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('_handle = call("_sb.createSprite(constructor_imagePath)")');
});

test('class self proxy resolves to this.prop', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('this._handle');
});

test('method params are prefixed with lowercased methodname_', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('setposition_x');
  expect(output).toContain('setposition_y');
});

test('body function generates call(...) without return', () => {
  const output = generateClass(spriteDescriptor);
  const lines = output.split('\n');
  const callLine = lines.find((l) => l.includes('_sb.setPosition'));
  expect(callLine).toBeDefined();
  expect(callLine).toContain('call("');
  expect(callLine).not.toContain('return call(');
});

test('returns function generates return call(...)', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('return call("_sb.getPositionX(this._handle)")');
});

test('generates a function block for each method', () => {
  const output = generateClass(spriteDescriptor);
  expect(output).toContain('function setPosition(x, y)');
  expect(output).toContain('function getX()');
  expect(output).toContain('function setAlpha(a)');
});

test('class without constructor omits Constructor block', () => {
  const noCtorDescriptor: ClassDescriptor = {
    name: 'simple',
    properties: ['x'],
    methods: [
      { name: 'getX', params: [], returns: (_p, self) => `${self.x}` },
    ],
  };
  const output = generateClass(noCtorDescriptor);
  expect(output).not.toContain('Constructor');
  expect(output).not.toContain('EndConstructor');
});

test('constructor after lines are emitted after the assignTo line', () => {
  const desc: ClassDescriptor = {
    name: 'sprite',
    properties: ['_handle'],
    constructor: {
      params: ['imagePath'],
      body: (p, _self) => `_sb.createSprite(${p.imagePath})`,
      assignTo: '_handle',
      after: (_p, self) => [`dim transform as ObjectTransform(call("${self._handle}"))`],
    },
    methods: [],
  };
  const output = generateClass(desc);
  const lines = output.split('\n');
  const assignIdx = lines.findIndex((l) => l.includes('_handle = call('));
  const afterIdx = lines.findIndex((l) => l.includes('dim transform as ObjectTransform'));
  expect(afterIdx).toBeGreaterThan(assignIdx);
  expect(output).toContain('dim transform as ObjectTransform(call("this._handle"))');
});

describe('transformDescriptor', () => {
  test('generates Class / EndClass wrapper', () => {
    const output = generateClass(transformDescriptor);
    expect(output.trimStart().startsWith('Class')).toBe(true);
    expect(output.trimEnd().endsWith('EndClass')).toBe(true);
  });

  test('generates dim _handle property', () => {
    const output = generateClass(transformDescriptor);
    expect(output).toContain('dim _handle');
  });

  test('constructor stores handle param', () => {
    const output = generateClass(transformDescriptor);
    expect(output).toContain('Constructor(handle)');
    expect(output).toContain('_handle = call("constructor_handle")');
  });

  test('setPosition delegates to _sb.setPosition with this._handle', () => {
    const output = generateClass(transformDescriptor);
    expect(output).toContain('function setPosition(x, y)');
    expect(output).toContain('call("_sb.setPosition(this._handle, setposition_x, setposition_y)")');
  });

  test('x returns _sb.getPositionX', () => {
    const output = generateClass(transformDescriptor);
    expect(output).toContain('function x()');
    expect(output).toContain('return call("_sb.getPositionX(this._handle)")');
  });

  test('y returns _sb.getPositionY', () => {
    const output = generateClass(transformDescriptor);
    expect(output).toContain('function y()');
    expect(output).toContain('return call("_sb.getPositionY(this._handle)")');
  });
});
