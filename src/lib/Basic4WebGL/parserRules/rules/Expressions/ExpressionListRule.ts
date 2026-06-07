import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import ExpressionListNode from '@Basic4WebGL/nodes/ExpressionListNode';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('ExpressionList')
class ExpressionListRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.OpenParen, tokenStream);
    if (check(tokens.CloseParen, tokenStream.current())) {
      matchAndMove(tokens.CloseParen, tokenStream);
      return new ExpressionListNode(null, undefined, loc);
    }
    let expr = [
      getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined),
    ];
    while (check(tokens.Comma, tokenStream.current())) {
      matchAndMove(tokens.Comma, tokenStream);
      expr.push(
        getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined)
      );
    }
    matchAndMove(tokens.CloseParen, tokenStream);
    return new ExpressionListNode(null, expr, loc);
  }
}

export default ExpressionListRule;
