import BuiltInType from './builtInTypes';
import { SourceLocation } from './compiler/types';

export class CompilationError extends Error {
  public loc?: SourceLocation;
  constructor(message: string, loc?: SourceLocation) {
    super(message);
    this.name = 'CompilatonError';
    this.loc = loc;
  }
}

export class SymbolError extends Error {
  public loc?: SourceLocation;
  constructor(message: string, loc?: SourceLocation) {
    super(message);
    this.name = 'SymbolError';
    this.loc = loc;
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
  public loc?: SourceLocation;
  constructor(expectedTypes: string[], actualType: BuiltInType, loc?: SourceLocation) {
    super(
      `Semantic Error: Expected type(s) ${expectedTypes
        .map((t) => t)
        .join(', ')} but got ${actualType.name}`
    );
    this.name = 'SemanticTypeError';
    this.loc = loc;
  }
}

export class SemanticError extends Error {
  public loc?: SourceLocation;
  constructor(message: string, loc?: SourceLocation) {
    super(message);
    this.name = 'SemanticError';
    this.loc = loc;
  }
}
