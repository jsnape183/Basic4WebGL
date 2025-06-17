export class TokenMatch {
  public value: Number;
  public name: string;
  public stripped: Boolean;

  constructor(value: Number, name: string, stripped: Boolean = false) {
    this.value = value;
    this.name = name;
    this.stripped = stripped;
  }
}

class Token {
  public token: TokenMatch;
  public text: string;
  public line: number;
  public col: number;
  public filename: string;

  constructor(
    token: TokenMatch,
    text: string,
    line: number,
    col: number,
    filename: string
  ) {
    this.token = token;
    this.text = text;
    this.line = line;
    this.col = col;
    this.filename = filename;
  }
}

export default Token;
