import type { SymbolSnapshotEntry } from '../symbols';

export type ProjectFile = {
  name: string;
  source: string;
};

export type CompilerProject = {
  lib: Array<ProjectFile>;
  files: Array<ProjectFile>;
};

export type SourceLocation = {
  line: number;
  col: number;
  filename: string;
};

export type Diagnostic = {
  message: string;
  severity: 'error' | 'warning';
  loc?: SourceLocation;
};

export type CompileResult = {
  code?: string;
  diagnostics: Diagnostic[];
  sourceMap?: string;
  symbols?: SymbolSnapshotEntry[];
};
