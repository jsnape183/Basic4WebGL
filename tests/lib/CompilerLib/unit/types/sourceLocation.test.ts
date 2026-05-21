import { describe, test, expect } from 'vitest';
import type { SourceLocation, Diagnostic, CompileResult } from '@CompilerLib/compiler/types';

describe('SourceLocation', () => {
  test('has line, col, and filename fields', () => {
    const loc: SourceLocation = { line: 3, col: 7, filename: 'Main.bas' };
    expect(loc.line).toBe(3);
    expect(loc.col).toBe(7);
    expect(loc.filename).toBe('Main.bas');
  });
});

describe('Diagnostic', () => {
  test('requires message and severity', () => {
    const d: Diagnostic = { message: 'oops', severity: 'error' };
    expect(d.message).toBe('oops');
    expect(d.severity).toBe('error');
    expect(d.loc).toBeUndefined();
  });

  test('accepts optional loc', () => {
    const d: Diagnostic = {
      message: 'bad',
      severity: 'warning',
      loc: { line: 1, col: 0, filename: 'f.bas' },
    };
    expect(d.loc?.line).toBe(1);
  });
});

describe('CompileResult', () => {
  test('success shape has code and empty diagnostics', () => {
    const r: CompileResult = { code: 'let x = 1;', diagnostics: [] };
    expect(r.code).toBe('let x = 1;');
    expect(r.diagnostics).toHaveLength(0);
    expect(r.sourceMap).toBeUndefined();
  });

  test('failure shape has diagnostics and no code', () => {
    const r: CompileResult = {
      diagnostics: [{ message: 'err', severity: 'error' }],
    };
    expect(r.code).toBeUndefined();
    expect(r.diagnostics[0].severity).toBe('error');
  });
});
