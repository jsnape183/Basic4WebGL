import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import PropertyAssignNode from '../../nodes/PropertyAssignNode';
import PropertyMethodCallNode from '../../nodes/PropertyMethodCallNode';
import SelfArrayAssignNode from '../../nodes/SelfArrayAssignNode';
import SelfDictAssignNode from '../../nodes/SelfDictAssignNode';
import TypedElementAccessNode from '../../nodes/TypedElementAccessNode';
import { formatSymbol } from '@Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers';
import { newLines } from '../../parserConfig';

/**
 * Handles dot-access on Object instances in statement context.
 *
 * Three forms:
 *   obj.prop = expr               — property assignment (one or more levels)
 *   obj.prop.sub = expr           — chained property assignment
 *   obj.method(args)              — method call (delegates to FunctionCall)
 *   obj.prop.method(args)         — chained method call → PropertyMethodCallNode
 */
@RegisterParserRule('ObjectProperty')
class ObjectPropertyRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: string
  ): Tree {
    const loc = tokenStream.current().loc();
    const ownerName = data;

    const ownerSymbol = symbolTable.get(ownerName, symbolTypes.Object);
    const ownerFormatted = formatSymbol(ownerSymbol);

    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const memberName = tokenStream.prev().text.toLowerCase();

    // obj.member["key"] = value — indexed write of a dictionary field
    // declared on the instance's class, accessed from outside the class.
    if (check(tokens.OpenBracket, tokenStream.current())) {
      const chain = `${ownerFormatted}.${memberName}`;
      matchAndMove(tokens.OpenBracket, tokenStream);
      const keyExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
      matchAndMove(tokens.CloseBracket, tokenStream);
      matchAndMove(tokens.Equals, tokenStream);
      const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
      matchAndMove(newLines, tokenStream);
      return new SelfDictAssignNode({ chain }, [keyExpr, expr], loc);
    }

    // If the next token is '(' this could be a direct method call OR an
    // indexed write of an array field (obj.member(i) = value), disambiguated
    // against a same-named method the same way self-field access is (issue
    // #13): a method of that name always wins.
    // Build the chain from ownerFormatted (e.g. main.scoredisplay) so the call
    // goes through the instance, not the class constructor.
    if (check(tokens.OpenParen, tokenStream.current())) {
      const chain = `${ownerFormatted}.${memberName}`;
      let isMethod = true;
      try {
        symbolTable.getInScope(memberName, symbolTypes.Function, ownerName);
      } catch {
        isMethod = false;
      }
      let arraySymbol;
      if (!isMethod) {
        try {
          arraySymbol = symbolTable.getInScope(memberName, symbolTypes.Array, ownerName);
        } catch {
          arraySymbol = undefined;
        }
      }
      const args = getParserRule('ExpressionList').parse(
        tokenStream,
        symbolTable,
        undefined
      );

      // obj.bullets(0).explode() — chain a method call, as a statement, onto
      // the element read out of a TYPED array field declared on another
      // instance's class (issue #20, the external-instance counterpart of
      // #14c's self.bullets(0).explode()).
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

      if (arraySymbol && check(tokens.Equals, tokenStream.current())) {
        matchAndMove(tokens.Equals, tokenStream);
        const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
        matchAndMove(newLines, tokenStream);
        return new SelfArrayAssignNode({ chain }, [args, expr], loc);
      }
      matchAndMove(newLines, tokenStream);
      return new PropertyMethodCallNode(chain, args, loc);
    }

    // Otherwise: property chain — may be an assignment or a chained method call
    let chain = `${ownerFormatted}.${memberName}`;
    while (check(tokens.Dot, tokenStream.current())) {
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      chain += `.${tokenStream.prev().text.toLowerCase()}`;

      // Chained method call: obj.prop.method(args) in statement context
      if (check(tokens.OpenParen, tokenStream.current())) {
        const args = getParserRule('ExpressionList').parse(
          tokenStream,
          symbolTable,
          undefined
        );
        matchAndMove(newLines, tokenStream);
        return new PropertyMethodCallNode(chain, args, loc);
      }
    }

    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);

    return new PropertyAssignNode({ chain }, expr, loc);
  }
}

export default ObjectPropertyRule;
