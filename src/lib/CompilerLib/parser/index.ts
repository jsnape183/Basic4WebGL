import Token from '../lexer/tokens/Token';
import ParserResults, { ParseFileResult } from './ParserResults';
import { getParserRule } from './parserRuleFactory';
import Symbols from '../symbols';
import { Tree } from '../tree';
import {
  CompilationError,
  SemanticError,
  SemanticTypeError,
  UnexpectedError,
} from '../errors';
import TokenStream from '../lexer/tokens/tokenStream';
import { LexerResult } from '../lexer';
import validateTree from '../tree/validator';

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
    validateTree(parseResult);
    return new ParseFileResult(filename, parseResult, symbolTable);
  } catch (e: unknown) {
    if (e instanceof UnexpectedError) {
      throw new UnexpectedError(e as Error);
    }
    if (
      e instanceof CompilationError ||
      e instanceof SemanticError ||
      e instanceof SemanticTypeError
    ) {
      throw new CompilationError(
        `Compilation Error - ${(e as Error).message} occurred at ${
          stream.current().line
        }:${stream.current().col} in ${filename}`
      );
    }
    throw e;
  }
};

export const parser = (tokens: Array<LexerResult>, symbolTable: Symbols) => {
  const parseResult = new ParserResults(symbolTable);

  tokens.forEach((tokenSet) => {
    parseResult.results.push(
      parseFile(tokenSet.name, tokenSet.tokens, symbolTable)
    );
    symbolTable.clearScope();
  });

  return parseResult;
};

export default parser;
