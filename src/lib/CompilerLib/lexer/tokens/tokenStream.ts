import Token from './Token';

const eof = { token: { name: 'EndOfFile', value: 0, stripped: false } };

const generateEof = (tokens: Array<Token>): Token => {
  const { line, col, filename } = tokens[tokens.length - 1];

  return new Token(eof.token, '', line, col, filename);
};

export class TokenStream {
  private tokenPtr: number = 0;
  public tokens: Array<Token> = [];

  constructor(tokens: Array<Token>) {
    this.tokenPtr = 0;
    this.tokens = tokens;
  }

  public prev(): Token {
    if (this.tokenPtr === 0) return generateEof(this.tokens);
    return this.tokens[this.tokenPtr - 1];
  }
  public next(): Token {
    if (this.tokenPtr >= this.tokens.length) return generateEof(this.tokens);
    return this.tokens[this.tokenPtr + 1];
  }
  public at(position: number): Token {
    if (position >= this.tokens.length) return generateEof(this.tokens);
    return this.tokens[position];
  }
  public current(): Token {
    if (this.tokenPtr >= this.tokens.length) return generateEof(this.tokens);
    return this.tokens[this.tokenPtr];
  }
  public advance(): void {
    this.tokenPtr++;
  }
  public endOfStream(): boolean {
    return this.tokenPtr >= this.tokens.length;
  }
}

export default TokenStream;
