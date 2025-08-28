import Token from '../lexer/Token';
import ParserResults, { ParseFileResult } from '../parser/parserResults';
import { getParserRule } from '../parser/parserRuleFactory';
import Symbols from '../symbols';
import { Tree } from '../tree';
import { CompilationError, UnexpectedError } from './errors';
import TokenStream from './tokenStream';
import { LexerResult } from './types';

const parseFile = (
  filename: string,
  tokens: Array<Token>,
  symbolTable: Symbols
): ParseFileResult => {
  const stream = new TokenStream(tokens);
  try {
    const parseResult = getParserRule('Root').parse(stream, symbolTable, {
      name: filename,
    }) as Tree;
    return new ParseFileResult(filename, parseResult, symbolTable);
  } catch (e: any) {
    if (e instanceof CompilationError) {
      throw e;
    }
    throw new UnexpectedError(e);
  }
};

export const parse = (tokens: Array<LexerResult>, symbolTable: Symbols) => {
  const parseResult = new ParserResults(symbolTable);

  tokens.forEach((tokenSet) => {
    parseResult.results.push(
      parseFile(tokenSet.name, tokenSet.tokens, symbolTable)
    );
    symbolTable.clearScope();
  });

  return parseResult;
};

export default parse;
