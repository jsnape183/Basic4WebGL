import { describe, test, expect } from 'vitest';
import {
  CompilationError,
  SymbolError,
  SemanticError,
  SemanticTypeError,
} from '@CompilerLib/errors';
import BuiltInType from '@CompilerLib/builtInTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

const loc: SourceLocation = { line: 4, col: 2, filename: 'Foo.bas' };

describe('CompilationError', () => {
  test('stores loc when provided', () => {
    const e = new CompilationError('bad token', loc);
    expect(e.loc).toEqual(loc);
  });
  test('loc is undefined when not provided', () => {
    const e = new CompilationError('bad token');
    expect(e.loc).toBeUndefined();
  });
});

describe('SymbolError', () => {
  test('stores loc when provided', () => {
    const e = new SymbolError('undeclared', loc);
    expect(e.loc).toEqual(loc);
  });
  test('loc is undefined when not provided', () => {
    expect(new SymbolError('x').loc).toBeUndefined();
  });
});

describe('SemanticError', () => {
  test('stores loc when provided', () => {
    const e = new SemanticError('type mismatch', loc);
    expect(e.loc).toEqual(loc);
  });
  test('loc is undefined when not provided', () => {
    expect(new SemanticError('x').loc).toBeUndefined();
  });
});

describe('SemanticTypeError', () => {
  test('stores loc when provided', () => {
    const e = new SemanticTypeError(['Integer'], new BuiltInType('String'), loc);
    expect(e.loc).toEqual(loc);
  });
  test('loc is undefined when not provided', () => {
    const e = new SemanticTypeError(['Integer'], new BuiltInType('String'));
    expect(e.loc).toBeUndefined();
  });
});
