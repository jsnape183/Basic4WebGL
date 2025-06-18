import { createKeyValueEnum } from "../compiler/helpers";
import { TokenMatch } from "../lexer/Token";

export const tokens = createKeyValueEnum<TokenMatch>([
  "EndOfFile",
  "Error",
  "WhiteSpace",
  "Comment",
  "NewLine",
  "SoftNewLine",
  "Number",
  "String",
  "Add",
  "Subtract",
  "Divide",
  "Multiply",
  "OpenParen",
  "CloseParen",
  "Equals",
  "GreaterThan",
  "GreaterThanEqualTo",
  "LessThan",
  "LessThanEqualTo",
  "Dot",
  "Print",
  "Call",
  "Variable",
  "Dim",
  "As",
  "Function",
  "Return",
  "EndFunction",
  "Comma",
  "BoolTrue",
  "BoolFalse",
  "And",
  "Or",
  "Not",
  "If",
  "EndIf",
  "While",
  "EndWhile",
  "Do",
  "Until",
  "For",
  "Next",
  "To",
  "In",
]);

tokens.WhiteSpace.stripped = true;
tokens.Comment.stripped = true;

export default tokens;
