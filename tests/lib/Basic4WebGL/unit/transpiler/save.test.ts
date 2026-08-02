import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const saveSource = readFileSync('src/lib/Basic4WebGL/defs/save.bas', 'utf-8');

const transpileWithSave = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'save.bas', source: saveSource },
      { name: 'Main.bas', source },
    ],
  });

describe('save — set/get/exists/delete/setAll/getAll', () => {
  test('compiles without error', () => {
    const result = transpileWithSave([
      'function test()',
      '  save.set("score", 10)',
      '  dim s',
      '  s = save.get("score")',
      '  dim e',
      '  e = save.exists("score")',
      '  save.delete("score")',
      '  dim d[]',
      '  save.setAll(d)',
      '  dim all',
      '  all = save.getAll()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.saveSet(', () => {
    const result = transpileWithSave(
      'function test()\n  save.set("a", 1)\nendfunction'
    );
    expect(result.code).toContain('_sb.saveSet(');
  });

  test('emits _sb.saveGet(', () => {
    const result = transpileWithSave(
      'function test()\n  dim s\n  s = save.get("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.saveGet(');
  });

  test('emits _sb.saveExists(', () => {
    const result = transpileWithSave(
      'function test()\n  dim e\n  e = save.exists("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.saveExists(');
  });

  test('emits _sb.saveDelete(', () => {
    const result = transpileWithSave(
      'function test()\n  save.delete("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.saveDelete(');
  });

  test('emits _sb.saveSetAll(', () => {
    const result = transpileWithSave(
      'function test()\n  dim d[]\n  save.setAll(d)\nendfunction'
    );
    expect(result.code).toContain('_sb.saveSetAll(');
  });

  test('emits _sb.saveGetAll(', () => {
    const result = transpileWithSave(
      'function test()\n  dim all\n  all = save.getAll()\nendfunction'
    );
    expect(result.code).toContain('_sb.saveGetAll(');
  });
});
