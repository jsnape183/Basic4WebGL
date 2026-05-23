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
import { formatSymbol } from '@Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers';
import { newLines } from '../../parserConfig';

/**
 * Handles dot-access on Object instances in statement context.
 *
 * Two forms:
 *   obj.prop = expr          — property assignment (one or more levels)
 *   obj.prop.sub = expr      — chained property assignment
 *   obj.method(args)         — method call (delegates to FunctionCall)
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

    // If the next token is '(' this is a method call — delegate to FunctionCall
    if (check(tokens.OpenParen, tokenStream.current())) {
      symbolTable.setScope(ownerName);
      let node: Tree;
      try {
        const functionSymbol = symbolTable.get(memberName, symbolTypes.Function);
        node = getParserRule('FunctionCall').parse(
          tokenStream,
          symbolTable,
          functionSymbol
        );
      } finally {
        symbolTable.clearScope();
      }
      return node;
    }

    // Otherwise: property chain assignment  obj.a.b.c = expr
    let chain = `${ownerFormatted}.${memberName}`;
    while (check(tokens.Dot, tokenStream.current())) {
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      chain += `.${tokenStream.prev().text.toLowerCase()}`;
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
