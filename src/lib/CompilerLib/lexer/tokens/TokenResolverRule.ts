import { TokenMatch } from './Token';

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
