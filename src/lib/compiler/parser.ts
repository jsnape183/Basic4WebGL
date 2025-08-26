import Token from '../lexer/Token';
import ParserResults, { ParseFileResult } from '../parser/parserResults';
import Symbols from '../symbols';
import { Tree } from '../tree';
import TokenStream from './tokenStream';
import { LexerResult } from './types';

const parseFile = (
  filename: string,
  tokens: Array<Token>,
  parserRules: Record<string, Function>,
  symbolTable: Symbols
): ParseFileResult => {
  const stream = new TokenStream(tokens);

  try {
    const parseResult = parserRules.Root(filename, stream, symbolTable) as Tree;
    return new ParseFileResult(filename, parseResult, symbolTable);
  } catch (e) {
    throw new Error(
      `${filename} - Parse error: ${e} at ${stream.current().line}:${
        stream.current().col
      } near '${stream.current().text}'`
    );
  }
};

export const parse = (
  tokens: Array<LexerResult>,
  parserRules: Record<string, Function>,
  symbolTable: Symbols
) => {
  const parseResult = new ParserResults(symbolTable);

  tokens.forEach((tokenSet) => {
    parseResult.results.push(
      parseFile(tokenSet.name, tokenSet.tokens, parserRules, symbolTable)
    );
    symbolTable.clearScope();
  });

  return parseResult;
};

export default parse;
