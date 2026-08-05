import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import PropertyAssignNode from '../../nodes/PropertyAssignNode';
import PropertyMethodCallNode from '../../nodes/PropertyMethodCallNode';
import SelfArrayAssignNode from '../../nodes/SelfArrayAssignNode';
import SelfDictAssignNode from '../../nodes/SelfDictAssignNode';
import TypedElementAccessNode from '../../nodes/TypedElementAccessNode';
import { newLines } from '../../parserConfig';
import { assertInsideClass } from './classGuards';
import { symbolTypes } from '../../symbolTypes';
import resolveSelfMember from './Expressions/helpers/resolveSelfMember';

@RegisterParserRule('Self')
class SelfRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    assertInsideClass(symbolTable);

    matchAndMove(tokens.Self, tokenStream);
    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const memberName = tokenStream.prev().text.toLowerCase();
    let chain = `this.${memberName}`;

    if (check(tokens.OpenBracket, tokenStream.current())) {
      // self.member["key"] = value — indexed write of a class dictionary field.
      matchAndMove(tokens.OpenBracket, tokenStream);
      const keyExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
      matchAndMove(tokens.CloseBracket, tokenStream);
      matchAndMove(tokens.Equals, tokenStream);
      const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
      matchAndMove(newLines, tokenStream);
      return new SelfDictAssignNode({ chain }, [keyExpr, expr], loc);
    }

    if (check(tokens.OpenParen, tokenStream.current())) {
      // A method of that name always wins (issue #13's rule) — only divert
      // to array-element handling when the member is provably a declared
      // array field and provably not a method.
      const isMethod =
        resolveSelfMember(symbolTable, memberName, symbolTypes.Function) !== undefined;
      const arraySymbol = isMethod
        ? undefined
        : resolveSelfMember(symbolTable, memberName, symbolTypes.Array);

      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);

      // self.bullets(0).explode() — chain a method call, as a statement, onto
      // the element read out of a TYPED array field (dim bullets(3) as
      // Bullet). Mirrors the expression-context shape in SelfFactorRule.
      if (
        arraySymbol &&
        (arraySymbol as any).classSymbol &&
        check(tokens.Dot, tokenStream.current())
      ) {
        matchAndMove(tokens.Dot, tokenStream);
        matchAndMove(tokens.Variable, tokenStream);
        const innerMember = tokenStream.prev().text.toLowerCase();
        if (check(tokens.OpenParen, tokenStream.current())) {
          const innerArgs = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
          matchAndMove(newLines, tokenStream);
          return new TypedElementAccessNode(
            { chain, name: memberName, memberName: innerMember, kind: 'array', isStatement: true },
            [args, innerArgs],
            loc
          );
        }
      }

      // self.arr(i) = value — array element assignment on a class member
      if (check(tokens.Equals, tokenStream.current())) {
        matchAndMove(tokens.Equals, tokenStream);
        const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
        matchAndMove(newLines, tokenStream);
        return new SelfArrayAssignNode({ chain }, [args, expr], loc);
      }
      // self.method(args) — method call statement
      matchAndMove(newLines, tokenStream);
      return new PropertyMethodCallNode(chain, args, loc);
    }

    // self.prop.sub.method(args) — chained call through a sub-object
    while (check(tokens.Dot, tokenStream.current())) {
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      chain += `.${tokenStream.prev().text.toLowerCase()}`;

      if (check(tokens.OpenParen, tokenStream.current())) {
        const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
        matchAndMove(newLines, tokenStream);
        return new PropertyMethodCallNode(chain, args, loc);
      }
    }

    // self.property = expr
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
    matchAndMove(newLines, tokenStream);
    return new PropertyAssignNode({ chain }, expr, loc);
  }
}

export default SelfRule;
