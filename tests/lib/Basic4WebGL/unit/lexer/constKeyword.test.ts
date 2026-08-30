import { describe, test, expect } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';

const project: CompilerProject = { lib: [], files: [] };

const lex = (source: string) => {
  project.files = [{ name: 'Main.bas', source }];
  return compiler.lexOnly(project)[0].tokens;
};

describe('const / endconst lexer tokens', () => {
  test('const is a Const token, not a Variable', () => {
    const names = lex('const').map((t: any) => t.token.name);
    expect(names).toContain('Const');
    expect(names).not.toContain('Variable');
  });

  test('endconst is an EndConst token', () => {
    const names = lex('endconst').map((t: any) => t.token.name);
    expect(names).toContain('EndConst');
  });

  test('constant (an identifier starting with "const") still lexes as Variable', () => {
    const names = lex('constant').map((t: any) => t.token.name);
    expect(names).toContain('Variable');
    expect(names).not.toContain('Const');
  });
});
