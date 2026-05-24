import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import { compileOk } from '../../helpers';

const textLib = {
  name: 'text',
  source: readFileSync('src/lib/Basic4WebGL/defs/text.bas', 'utf-8'),
};

describe('Text class — instantiation', () => {
  test('dim as text with constructor args compiles', () => {
    const src = [
      'function onenter()',
      '    dim label as text("Hello", 10, 20)',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [textLib], files: [{ name: 'Main', source: src }] });
    expect(result).toContain('newtext(');
  });
});

describe('Text class — instance methods', () => {
  test('setText on text instance compiles', () => {
    const src = [
      'function onenter()',
      '    dim label as text("Hello", 10, 20)',
      '    label.setText("World")',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [textLib], files: [{ name: 'Main', source: src }] });
    expect(result).toContain('settext(');
  });

  test('setPosition on text instance compiles', () => {
    const src = [
      'function onenter()',
      '    dim label as text("Hello", 10, 20)',
      '    label.setPosition(50, 100)',
      'endfunction',
    ].join('\n');
    compileOk({ lib: [textLib], files: [{ name: 'Main', source: src }] });
  });
});

describe('Text class — _handle in method body', () => {
  test('text.bas setText emits this._handle in call string', () => {
    expect(textLib.source).toContain('this._handle');
  });

  test('text.bas constructor assigns _handle', () => {
    expect(textLib.source).toContain('_handle = call("_sb.createText(constructor_content, constructor_x, constructor_y)")');
  });
});
