import Token from '../lexer/Token';
import ParserResults, { ParseFileResult } from '../parser/parserResults';
import { getParserRule } from '../parser/parserRuleFactory';
import Symbols from '../symbols';
import { Tree } from '../tree';
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
  } catch (e) {
    throw e;
    throw new Error(
      `${filename} - Parse error: ${e} at ${stream.current().line}:${
        stream.current().col
      } near '${stream.current().text}'`
    );
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
