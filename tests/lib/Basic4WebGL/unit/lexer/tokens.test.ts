import { describe, test, expect } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import tokens from '@Basic4WebGL/tokens';

const project: CompilerProject = { lib: [], files: [] };

const lex = (source: string) => {
  project.files = [{ name: 'Main.bas', source }];
  return compiler.lexOnly(project)[0].tokens;
};

// ─── Keywords ────────────────────────────────────────────────────────────────

describe('keywords', () => {
  test.each([
    ['print',       tokens.Print.name],
    ['if',          tokens.If.name],
    ['endif',       tokens.EndIf.name],
    ['while',       tokens.While.name],
    ['endwhile',    tokens.EndWhile.name],
    ['for',         tokens.For.name],
    ['next',        tokens.Next.name],
    ['to',          tokens.To.name],
    ['function',    tokens.Function.name],
    ['endfunction', tokens.EndFunction.name],
    ['return',      tokens.Return.name],
    ['dim',         tokens.Dim.name],
    ['as',          tokens.As.name],
    ['and',         tokens.And.name],
    ['or',          tokens.Or.name],
    ['not',         tokens.Not.name],
    ['true',        tokens.BoolTrue.name],
    ['false',       tokens.BoolFalse.name],
  ])('"%s" produces a %s token', (source, expectedName) => {
    expect(lex(source)[0].token.name).toBe(expectedName);
  });
});

// ─── Operators ───────────────────────────────────────────────────────────────

describe('operators', () => {
  test.each([
    ['+',  tokens.Add.name],
    ['-',  tokens.Subtract.name],
    ['*',  tokens.Multiply.name],
    ['/',  tokens.Divide.name],
    ['=',  tokens.Equals.name],
    ['<',  tokens.LessThan.name],
    ['>',  tokens.GreaterThan.name],
    ['<=', tokens.LessThanEqualTo.name],
    ['>=', tokens.GreaterThanEqualTo.name],
    ['<>', tokens.NotEquals.name],
    ['(',  tokens.OpenParen.name],
    [')',  tokens.CloseParen.name],
    ['.',  tokens.Dot.name],
    [',',  tokens.Comma.name],
  ])('"%s" produces a %s token', (source, expectedName) => {
    expect(lex(source)[0].token.name).toBe(expectedName);
  });
});

// ─── Literals ─────────────────────────────────────────────────────────────────

describe('literals', () => {
  test('integer literal produces a Number token with correct text', () => {
    const result = lex('42');
    expect(result[0].token.name).toBe(tokens.Number.name);
    expect(result[0].text).toBe('42');
  });

  test('float literal produces a Number token with correct text', () => {
    const result = lex('3.14');
    expect(result[0].token.name).toBe(tokens.Number.name);
    expect(result[0].text).toBe('3.14');
  });

  test('string literal produces a String token preserving quotes', () => {
    const result = lex('"hello world"');
    expect(result[0].token.name).toBe(tokens.String.name);
    expect(result[0].text).toBe('"hello world"');
  });

  test('identifier produces a Variable token with correct text', () => {
    const result = lex('myVar');
    expect(result[0].token.name).toBe(tokens.Variable.name);
    expect(result[0].text).toBe('myVar');
  });
});

// ─── Multi-token expressions ──────────────────────────────────────────────────

describe('multi-token expressions', () => {
  test('arithmetic expression produces correct token sequence', () => {
    const result = lex('2+3');
    expect(result.map(t => t.token.name)).toEqual([
      tokens.Number.name,
      tokens.Add.name,
      tokens.Number.name,
    ]);
  });

  test('comparison expression produces correct token sequence', () => {
    const result = lex('x<=10');
    expect(result.map(t => t.token.name)).toEqual([
      tokens.Variable.name,
      tokens.LessThanEqualTo.name,
      tokens.Number.name,
    ]);
  });

  test('print statement produces correct token sequence', () => {
    const result = lex('print "hello"');
    expect(result.map(t => t.token.name)).toEqual([
      tokens.Print.name,
      tokens.String.name,
    ]);
  });

  test('keywords are not matched as variable names', () => {
    const result = lex('if');
    expect(result[0].token.name).toBe(tokens.If.name);
    expect(result[0].token.name).not.toBe(tokens.Variable.name);
  });
});

// ─── Errors ───────────────────────────────────────────────────────────────────

describe('errors', () => {
  test('unexpected character throws a compilation error', () => {
    expect(() => lex('@')).toThrow('Unexpected token @');
  });
});
