import { describe, test, expect } from 'vitest';
import {
  CompilationError,
  SymbolError,
  SemanticError,
  SemanticTypeError,
  UnexpectedError,
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

// Roadmap issue #2: the message template had a typo ("occured") and a stray
// trailing `}` left over from a bad edit — pinning the corrected message so
// neither can silently reappear.
describe('UnexpectedError', () => {
  test('wraps the inner error, spelling "occurred" correctly with no stray characters', () => {
    const inner = new Error('boom');
    inner.stack = 'Error: boom\n    at somewhere';
    const e = new UnexpectedError(inner);
    expect(e.message).toBe(
      'An unexpected error occurred with the message Error "boom"\n      Stack Trace Error: boom\n    at somewhere'
    );
    expect(e.name).toBe('UnexpectedError');
    expect(e.innerError).toBe(inner);
  });

  test('does not end with a stray closing brace', () => {
    const e = new UnexpectedError(new Error('boom'));
    expect(e.message.endsWith('}')).toBe(false);
  });
});
