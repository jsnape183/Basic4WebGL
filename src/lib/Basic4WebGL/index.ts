import TokenResolver from './TokenResolver';
import { CompilerProject, CompileResult, Diagnostic, SourceLocation } from '@CompilerLib/compiler/types';
import parser from '@CompilerLib/parser';
import lexer from '@CompilerLib/lexer';
import transpilerRules from './transpilerRules';
import Transpiler from '@CompilerLib/transpiler';
import Symbols, { SymbolScope } from '@CompilerLib/symbols';
import './parserRules';
import './builtInTypes';
import { isMatchingType } from './transpilerRules/symbolRules';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import builtInTypes from './builtInTypes';

const lexOnly = (project: CompilerProject) => lexer.lex(project, TokenResolver);

const parse = (project: CompilerProject) => {
  const result = parser(
    lexOnly(project),
    new Symbols(getBuiltInType(builtInTypes.Variant), isMatchingType)
  );
  return result;
};

const transpile = (project: CompilerProject): CompileResult => {
  try {
    const transpilerInstance = new Transpiler();
    const parseResult = parse(project);
    const globals = transpilerRules.symbolRules(
      parseResult.symbolTable,
      new SymbolScope('', '')
    );
    const code =
      globals +
      transpilerInstance.transpile(parseResult, parseResult.symbolTable, transpilerRules);
    return { code, diagnostics: [], symbols: parseResult.symbolTable.getSnapshot() };
  } catch (e: unknown) {
    const err = e as Error & { loc?: SourceLocation };
    const diagnostic: Diagnostic = {
      message: err.message,
      severity: 'error',
      loc: err.loc,
    };
    return { diagnostics: [diagnostic] };
  }
};

export default {
  lexOnly,
  parse,
  transpile,
};
