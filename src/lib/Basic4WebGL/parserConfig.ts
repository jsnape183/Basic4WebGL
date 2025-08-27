import tokens from './tokens';

export const newLines = [tokens.NewLine, tokens.EndOfFile, tokens.SoftNewLine];
export const factors = [tokens.String, tokens.Number, tokens.Variable];
export const booleans = [tokens.BoolTrue, tokens.BoolFalse];
export const relOps = [
  tokens.Equals,
  tokens.GreaterThan,
  tokens.GreaterThanEqualTo,
  tokens.LessThan,
  tokens.LessThanEqualTo,
];
