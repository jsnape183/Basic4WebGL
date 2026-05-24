import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import { compileOk } from '../../helpers';

const spriteLib = {
  name: 'sprite',
  source: readFileSync('src/lib/Basic4WebGL/defs/sprite.bas', 'utf-8'),
};

describe('Sprite class — instantiation', () => {
  test('dim as sprite with constructor arg compiles without error', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [spriteLib], files: [{ name: 'Main', source: src }] });
    expect(result).toContain('newsprite(');
  });
});

describe('Sprite class — instance methods', () => {
  test('setPosition call on sprite instance compiles', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.setPosition(100, 200)',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [spriteLib], files: [{ name: 'Main', source: src }] });
    expect(result).toContain('setposition(100,200)');
  });

  test('getX on sprite instance compiles and has return', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    dim x',
      '    x = s.getX()',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [spriteLib], files: [{ name: 'Main', source: src }] });
    expect(result).toContain('getx()');
  });

  test('setAlpha on sprite instance compiles', () => {
    const src = [
      'function onenter()',
      '    dim s as sprite("bunny.png")',
      '    s.setAlpha(0.5)',
      'endfunction',
    ].join('\n');
    compileOk({ lib: [spriteLib], files: [{ name: 'Main', source: src }] });
  });
});

describe('Sprite class — _handle in method body', () => {
  test('sprite.bas setPosition emits this._handle in call string', () => {
    expect(spriteLib.source).toContain('this._handle');
  });

  test('sprite.bas constructor assigns _handle', () => {
    expect(spriteLib.source).toContain('_handle = call("_sb.createSprite(constructor_imagePath)")');
  });
});
