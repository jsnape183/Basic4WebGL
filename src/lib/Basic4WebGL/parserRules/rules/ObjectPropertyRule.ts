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

    // If the next token is '(' this is a direct method call.
    // Build the chain from ownerFormatted (e.g. main.scoredisplay) so the call
    // goes through the instance, not the class constructor.
    if (check(tokens.OpenParen, tokenStream.current())) {
      const chain = `${ownerFormatted}.${memberName}`;
      const args = getParserRule('ExpressionList').parse(
        tokenStream,
        symbolTable,
        undefined
      );
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
