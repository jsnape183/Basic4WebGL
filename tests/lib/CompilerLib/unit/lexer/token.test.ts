import { describe, test, expect } from 'vitest';
import Token, { TokenMatch } from '@CompilerLib/lexer/tokens/Token';

describe('Token.loc()', () => {
  test('returns SourceLocation with matching line, col, and filename', () => {
    const match = new TokenMatch(1, 'Number');
    const token = new Token(match, '42', 5, 12, 'Main.bas');
    const loc = token.loc();
    expect(loc.line).toBe(5);
    expect(loc.col).toBe(12);
    expect(loc.filename).toBe('Main.bas');
  });

  test('returns a plain object (not the token itself)', () => {
    const match = new TokenMatch(1, 'Number');
    const token = new Token(match, '1', 1, 0, 'A.bas');
    const loc = token.loc();
    expect(loc).not.toBe(token);
    expect(Object.keys(loc)).toEqual(['line', 'col', 'filename']);
  });
});
