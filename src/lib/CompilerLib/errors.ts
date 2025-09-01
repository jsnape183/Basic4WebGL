import BuiltInType from './builtInTypes';

export class CompilationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompilatonError';
  }
}

export class SymbolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SymbolError';
  }
}

export class UnexpectedError extends Error {
  public innerError: Error;
  constructor(error: Error) {
    super(`An unexpected error occured with the message ${error.name} "${error.message}"
      Stack Trace ${error?.stack}}`);
    this.name = 'UnexpectedError';
    this.innerError = error;
  }
}

export class SemanticTypeError extends Error {
  constructor(expectedTypes: string[], actualType: BuiltInType) {
    super(
      `Semantic Error: Expected type(s) ${expectedTypes
        .map((t) => t)
        .join(', ')} but got ${actualType.name}`
    );
    this.name = 'SemanticTypeError';
  }
}

export class SemanticError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SemanticError';
  }
}
