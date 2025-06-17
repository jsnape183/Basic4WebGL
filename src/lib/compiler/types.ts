import Token from "../lexer/Token";
import { TokenMatch } from "../lexer/Token";

export type ProjectFile = {
  name: string;
  source: string;
};

export type CompilerProject = {
  lib: Array<ProjectFile>;
  files: Array<ProjectFile>;
};

export type TokenResolverRuleResult = {
  match: boolean;
  position: number;
  token: TokenMatch;
  text: string;
};

export type TokenResolverRule = {
  isMatch: (input: string) => TokenResolverRuleResult;
};

export type TokenResolverConfig = {
  tokenResolver: Array<TokenResolverRule>;
  newLineToken: TokenMatch;
};

export type LexerResult = {
  name: string;
  tokens: Array<Token>;
};
