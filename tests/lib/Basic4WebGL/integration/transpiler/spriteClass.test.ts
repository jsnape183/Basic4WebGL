import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import { compileOk } from '../../helpers';
import { packageModules } from '../../../../../src/constants/packageModules';
import { firstPartyPackages } from '../../../../../src/constants/firstPartyPackages';

const spriteLib = {
  name: 'sprite',
  source: readFileSync('src/lib/Basic4WebGL/defs/sprite.bas', 'utf-8'),
};

const transformLib = {
  name: 'ObjectTransform',
  source: readFileSync('src/lib/Basic4WebGL/defs/transform.bas', 'utf-8'),
};

const libs = [transformLib, spriteLib];

describe('Sprite class — instantiation', () => {
  test('dim as sprite with constructor arg compiles without error', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('new_sb_sprite(');
  });
});

describe('Sprite class — transform methods', () => {
  test('s.transform.setPosition(x, y) compiles without error', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.transform.setPosition(100, 200)',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('transform.setposition(100,200)');
  });

  test('s.transform.x() compiles and output contains x()', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    dim x',
      '    x = s.transform.x()',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('transform.x()');
  });

  test('s.transform.y() compiles and output contains y()', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    dim y',
      '    y = s.transform.y()',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('transform.y()');
  });

  test('transform methods used as args — no spurious semicolons', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.transform.setPosition(s.transform.x(), s.transform.y())',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('transform.setposition(');
    expect(result).not.toContain('transform.x();');
    expect(result).not.toContain('transform.y();');
    expect(result).toContain('transform.x()');
    expect(result).toContain('transform.y()');
  });

  test('chained method result used in arithmetic — Unknown + Number is valid', () => {
    const src = [
      'function onupdate()',
      '    dim s as sprite("bunny.png")',
      '    s.transform.setPosition(s.transform.x()+1, s.transform.y())',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('transform.setposition(');
    expect(result).toContain('transform.x()+1');
  });
});

describe('Sprite class — setAlpha (still on Sprite directly)', () => {
  test('s.setAlpha(0.5) still compiles', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.setAlpha(0.5)',
      'endfunction',
    ].join('\n');
    compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
  });
});

describe('Sprite class — package module loader', () => {
  // This describe validates the real loader path (packageModules + firstPartyPackages),
  // not hardcoded libs. If transform is ever removed from the softgfx module list,
  // or loaded after sprite, these tests catch it before it reaches users.
  const softgfx = firstPartyPackages.find((p) => p.id === 'softgfx')!;
  const loaderLib = softgfx.moduleNames
    .map((name) => ({ name, source: packageModules[name] ?? '' }))
    .filter((m) => m.source !== '');

  test('ObjectTransform is registered in softgfx module list', () => {
    expect(softgfx.moduleNames).toContain('ObjectTransform');
  });

  test('ObjectTransform is loaded before sprite in module order', () => {
    const names = loaderLib.map((m) => m.name);
    expect(names.indexOf('ObjectTransform')).toBeLessThan(names.indexOf('sprite'));
  });

  test('sprite compiles via package loader without ObjectTransform missing error', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.transform.setPosition(100, 200)',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: loaderLib, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('transform.setposition(100,200)');
  });

  test('sprite constructor emits this.transform = new objecttransform(...) — not constructor.transform', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: loaderLib, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('this.transform=new_sb_ObjectTransform(');
    expect(result).not.toContain('constructor.transform');
  });
});

describe('Sprite class — _handle in method body', () => {
  test('sprite.bas constructor assigns _handle', () => {
    expect(spriteLib.source).toContain('_handle = call("_sb.createSprite(constructor_imagePath)")');
  });

  test('sprite.bas constructor initialises transform', () => {
    expect(spriteLib.source).toContain('dim transform as ObjectTransform(call("this._handle"))');
  });

  test('transform.bas setPosition emits this._handle', () => {
    expect(transformLib.source).toContain('this._handle');
  });
});

describe('Sprite class — setDepth', () => {
  test('s.setDepth(5) compiles and emits _sb.setDepth call', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.setDepth(5)',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: libs, files: [{ name: 'Main', source: src }] });
    expect(result).toContain('_sb.setDepth');
    expect(result).toContain('5');
  });
});
