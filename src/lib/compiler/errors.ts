import BuiltInType from '../builtInTypes';

export class CompilationError extends Error {
  public line: number;
  public col: number;

  constructor(message: string, line: number, col: number, filename: string) {
    super(`Parse Error in ${filename} - ${message} at ${line}:${col}`);
    this.name = 'CompilatonError';
    this.line = line;
    this.col = col;
  }
}

export class SymbolError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class UnexpectedError extends Error {
  public innerError: Error;
  constructor(error: Error) {
    super(`An unexpected error occured with the message ${error.name} "${error.message}"
      Stack Trace ${error?.stack}}`);
    this.innerError = error;
  }
}

export class SemanticTypeError extends Error {
  constructor(expectedTypes: BuiltInType[], actualType: BuiltInType) {
    super(
      `Semantic Error: Expected type(s) ${expectedTypes
        .map((t) => t.name)
        .join(', ')} but got ${actualType.name}`
    );
  }
}

export class SemanticError extends Error {
  constructor(message: string) {
    super(message);
  }
}
