import Token from '../lexer/tokens/Token';
import { TokenMatch } from '../lexer/tokens/Token';

export type ProjectFile = {
  name: string;
  source: string;
};

export type CompilerProject = {
  lib: Array<ProjectFile>;
  files: Array<ProjectFile>;
};
