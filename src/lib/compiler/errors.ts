export class CompilationError extends Error {
  public line: number;
  public col: number;

  constructor(message: string, line: number, col: number, filename: string) {
    super(`${message} at ${line}:${col} in ${filename}`);
    this.name = "CompilatonError";
    this.line = line;
    this.col = col;
  }
}
