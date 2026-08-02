import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const fileSource = readFileSync('src/lib/Basic4WebGL/defs/file.bas', 'utf-8');

const transpileWithFile = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'file.bas', source: fileSource },
      { name: 'Main.bas', source },
    ],
  });

describe('file — write/read/exists/delete', () => {
  test('compiles without error', () => {
    const result = transpileWithFile([
      'function test()',
      '  file.write("save.json", "hello")',
      '  dim c',
      '  c = file.read("save.json")',
      '  dim e',
      '  e = file.exists("save.json")',
      '  file.delete("save.json")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.fileWrite(', () => {
    const result = transpileWithFile(
      'function test()\n  file.write("a", "b")\nendfunction'
    );
    expect(result.code).toContain('_sb.fileWrite(');
  });

  test('emits _sb.fileRead(', () => {
    const result = transpileWithFile(
      'function test()\n  dim c\n  c = file.read("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.fileRead(');
  });

  test('emits _sb.fileExists(', () => {
    const result = transpileWithFile(
      'function test()\n  dim e\n  e = file.exists("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.fileExists(');
  });

  test('emits _sb.fileDelete(', () => {
    const result = transpileWithFile(
      'function test()\n  file.delete("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.fileDelete(');
  });
});
