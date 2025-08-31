import TokenResolver from './TokenResolver';
import { CompilerProject } from '../compiler/types';
import lexer from '../compiler/Lexer';
import parser from '../compiler/parser';
import transpilerRules from './transpilerRules';
import Transpiler from '../transpiler';
import Symbols, { SymbolScope } from '../symbols';
import './parserRules';
import { isMatchingType } from './transpilerRules/symbolRules';
import VariantType from './builtInTypes/VariantType';

const lexOnly = (project: CompilerProject) => lexer.lex(project, TokenResolver);

const parse = (project: CompilerProject) =>
  parser(lexOnly(project), new Symbols(new VariantType(), isMatchingType));

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
