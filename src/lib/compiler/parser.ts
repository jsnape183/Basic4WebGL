import Token from '../lexer/Token';
import ParserResults, { ParseFileResult } from '../parser/parserResults';
import { getParserRule } from '../parser/parserRuleFactory';
import Symbols from '../symbols';
import { Tree } from '../tree';
import { CompilationError, SymbolError, UnexpectedError } from './errors';
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
  } catch (e: unknown) {
    console.log(e instanceof CompilationError);
    if (e instanceof CompilationError) {
      throw e;
    }
    if (e instanceof SymbolError) {
      throw new CompilationError(
        e.message,
        stream.current().line,
        stream.current().col,
        filename
      );
    }
    throw new UnexpectedError(e as Error);
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
