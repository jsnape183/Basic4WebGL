import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import { compileOk } from '../../helpers';

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
    expect(result).toContain('newsprite(');
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

  // Note: arithmetic on chained method results (e.g. transform.x()+10) is not tested here
  // because PropertyMethodTerm bypasses symbol resolution and returns Unknown type,
  // which fails the type checker when combined with arithmetic. This is a known limitation
  // tracked in the roadmap (P-level: type inference for composed class methods).
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
