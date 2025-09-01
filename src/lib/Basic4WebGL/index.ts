import TokenResolver from './TokenResolver';
import { CompilerProject } from '@CompilerLib/compiler/types';
import lexer from '@CompilerLib/lexer';
import parser from '@CompilerLib/parser';
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

const transpile = (project: CompilerProject) => {
  const transpiler = new Transpiler();
  const parseResult = parse(project);
  const globals = transpilerRules.symbolRules(
    parseResult.symbolTable,
    new SymbolScope('', '')
  );
  return (
    globals +
    transpiler.transpile(parseResult, parseResult.symbolTable, transpilerRules)
  );
};

export default {
  lexOnly: lexOnly,
  parse: parse,
  transpile: transpile,
};
