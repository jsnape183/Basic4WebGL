import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import type { SourceLocation } from '@CompilerLib/compiler/types';
import { CompilationError } from '@CompilerLib/errors';
import { scopeTypes, symbolTypes, ConstantSymbol } from '../../symbolTypes';
import tokens from '../../tokens';
import { newLines } from '../../parserConfig';
import ConstBlockNode from '../../nodes/ConstBlockNode';
import { isInsideBlock } from './BlockRule';

type LiteralKind = 'number' | 'string' | 'boolean';

function readLiteral(
  tokenStream: TokenStream,
  loc: SourceLocation | undefined
): { value: number | string | boolean; valueKind: LiteralKind } {
  if (check(tokens.Subtract, tokenStream.current())) {
    matchAndMove(tokens.Subtract, tokenStream);
    matchAndMove(tokens.Number, tokenStream);
    return { value: -Number(tokenStream.prev().text), valueKind: 'number' };
  }
  if (check(tokens.Number, tokenStream.current())) {
    matchAndMove(tokens.Number, tokenStream);
    return { value: Number(tokenStream.prev().text), valueKind: 'number' };
  }
  if (check(tokens.String, tokenStream.current())) {
    matchAndMove(tokens.String, tokenStream);
    const raw = tokenStream.prev().text;
    return { value: raw.slice(1, -1), valueKind: 'string' };
  }
  if (check(tokens.BoolTrue, tokenStream.current())) {
    matchAndMove(tokens.BoolTrue, tokenStream);
    return { value: true, valueKind: 'boolean' };
  }
  if (check(tokens.BoolFalse, tokenStream.current())) {
    matchAndMove(tokens.BoolFalse, tokenStream);
    return { value: false, valueKind: 'boolean' };
  }
  throw new CompilationError(
    'A const value must be a plain number, string, true, or false — expressions and other names are not allowed.',
    loc
  );
}

@RegisterParserRule('Const')
class ConstBlockRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();

    if (symbolTable.getScopeType() !== scopeTypes.Globals || isInsideBlock()) {
      throw new CompilationError(
        'const declarations are only allowed at the top level of a file, not inside a function, class, or block.',
        loc
      );
    }

    matchAndMove(tokens.Const, tokenStream);
    const moduleName = symbolTable.getScopeName();
    const declaredHere = new Set<string>();

    const parseOne = () => {
      matchAndMove(tokens.Variable, tokenStream);
      const name = tokenStream.prev().text.toLowerCase();
      const declLoc = tokenStream.prev().loc();
      if (
        declaredHere.has(name) ||
        symbolTable.findAnyInScope(name, moduleName) !== undefined
      ) {
        throw new CompilationError(
          `'${name}' is already declared — a constant cannot be redeclared.`,
          declLoc
        );
      }
      matchAndMove(tokens.Equals, tokenStream);
      const { value, valueKind } = readLiteral(tokenStream, declLoc);
      // The literal must be the whole right-hand side. Anything left on the
      // line (an operator, a call, another token) means it was an expression.
      if (
        !check(newLines, tokenStream.current()) &&
        !check(tokens.EndConst, tokenStream.current()) &&
        !check(tokens.EndOfFile, tokenStream.current())
      ) {
        throw new CompilationError(
          'A const value must be a plain number, string, true, or false — expressions and other names are not allowed.',
          declLoc
        );
      }
      symbolTable.addTyped(
        new ConstantSymbol(
          name,
          symbolTypes.Constant,
          symbolTable.getScope(),
          symbolTable.getFullScopeName(),
          value,
          valueKind
        )
      );
      declaredHere.add(name);
    };

    // Single-line form: `const NAME = literal` (identifier on the same line).
    if (check(tokens.Variable, tokenStream.current())) {
      parseOne();
      matchAndMove(newLines, tokenStream);
      return new ConstBlockNode({ module: moduleName }, loc);
    }

    // Block form.
    matchAndMove(newLines, tokenStream);
    while (
      !check(tokens.EndConst, tokenStream.current()) &&
      !check(tokens.EndOfFile, tokenStream.current())
    ) {
      if (check(newLines, tokenStream.current())) {
        matchAndMove(newLines, tokenStream);
        continue;
      }
      parseOne();
      matchAndMove(newLines, tokenStream);
    }
    matchAndMove(tokens.EndConst, tokenStream);
    matchAndMove(newLines, tokenStream);
    return new ConstBlockNode({ module: moduleName }, loc);
  }
}

export default ConstBlockRule;
