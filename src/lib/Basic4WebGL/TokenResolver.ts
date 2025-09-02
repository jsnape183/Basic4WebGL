import tokens from './tokens';
import {
  matchChar,
  matchAll,
  matchString,
  matchPattern,
} from '../CompilerLib/lexer/resolverHelpers';
import {
  TokenResolverConfig,
  TokenResolverRule,
  TokenResolverRuleResult,
} from '../CompilerLib/lexer/tokens/TokenResolverRule';

export const tokenResolver: Array<TokenResolverRule> = [
  {
    isMatch: (): TokenResolverRuleResult => ({
      match: false,
      token: tokens.Error,
      position: 0,
      text: '',
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchAll(input, ' '),
      token: tokens.WhiteSpace,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^(\r\n|\r|\n)/),
      token: tokens.NewLine,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchAll(input, '\n'),
      token: tokens.NewLine,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchAll(input, ':'),
      token: tokens.SoftNewLine,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '+'),
      token: tokens.Add,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '-'),
      token: tokens.Subtract,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '*'),
      token: tokens.Multiply,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '/'),
      token: tokens.Divide,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '('),
      token: tokens.OpenParen,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, ')'),
      token: tokens.CloseParen,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '='),
      token: tokens.Equals,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchString(input, '>='),
      token: tokens.GreaterThanEqualTo,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '>'),
      token: tokens.GreaterThan,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchString(input, '<='),
      token: tokens.LessThanEqualTo,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '<'),
      token: tokens.LessThan,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, '.'),
      token: tokens.Dot,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^print(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.Print,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^call(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.Call,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^dim(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.Dim,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^class(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.Class,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^as(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.As,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^function(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.Function,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^return(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.Return,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^endfunction(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.EndFunction,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchChar(input, ','),
      token: tokens.Comma,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchString(input, 'true'),
      token: tokens.BoolTrue,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^and(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.And,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^or(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.Or,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^not(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.Not,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^if(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.If,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^endif(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.EndIf,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^while(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.While,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^endwhile(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.EndWhile,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^for(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.For,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^next(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.Next,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^in(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.In,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^to(?=[ \r\n]|[^a-zA-Z0-9]|$)/i),
      token: tokens.To,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^'.*/),
      token: tokens.Comment,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^[+-]?([0-9]*[.])?[0-9]+/i),
      token: tokens.Number,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /^"(.*?)"/),
      token: tokens.String,
    }),
  },
  {
    isMatch: (input: string): TokenResolverRuleResult => ({
      ...matchPattern(input, /[A-Za-z][A-Za-z_$0-9]*/),
      token: tokens.Variable,
    }),
  },
];

export default {
  tokenResolver,
  newLineToken: tokens.NewLine,
} as TokenResolverConfig;
