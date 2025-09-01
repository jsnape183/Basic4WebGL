import Token from '../lexer/Token';
import TokenStream from './tokenStream';
import { TokenMatch } from '../lexer/Token';
import { CompilationError } from './errors';

export const checkAny = (
  expected: Array<TokenMatch>,
  actual: Token
): boolean => {
  return Boolean(expected.find((e) => e.value === actual.token.value));
};

export const matchAny = (expected: Array<TokenMatch>, actual: Token): void => {
  const result = checkAny(expected, actual);
  if (!result) {
    throw new CompilationError(
      `Expected ${expected.map((e) => e.name).join()} got ${actual.token.name}`
    );
  }
};

export const check = (
  expected: TokenMatch | Array<TokenMatch>,
  actual: Token
) => {
  if (Array.isArray(expected)) return checkAny(expected, actual);

  return expected.value === actual.token.value;
};

export const match = (expected: TokenMatch, actual: Token) => {
  if (!check(expected, actual)) {
    throw new CompilationError(
      `Expected ${expected.name} got ${actual.token.name}`
    );
  }

  return true;
};

export const matchAndMove = (
  expected: TokenMatch | Array<TokenMatch>,
  tokenStream: TokenStream
) => {
  if (Array.isArray(expected)) {
    matchAny(expected, tokenStream.current());
    tokenStream.advance();
    return;
  }

  match(expected, tokenStream.current());
  tokenStream.advance();
};
