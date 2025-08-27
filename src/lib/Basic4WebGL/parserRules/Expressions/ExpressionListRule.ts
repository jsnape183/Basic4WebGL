import { check, matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import ExpressionListNode from '../../nodes/ExpressionListNode';
import tokens from '../../tokens';

@RegisterParserRule('ExpressionList')
class ExpressionListRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.OpenParen, tokenStream);
    if (check(tokens.CloseParen, tokenStream.current())) {
      matchAndMove(tokens.CloseParen, tokenStream);
      return new ExpressionListNode(null, undefined);
    }
    let expr = [
      getParserRule('Expression').parse(tokenStream, symbolTable, undefined),
    ];
    while (check(tokens.Comma, tokenStream.current())) {
      matchAndMove(tokens.Comma, tokenStream);
      expr.push(
        getParserRule('Expression').parse(tokenStream, symbolTable, undefined)
      );
    }
    matchAndMove(tokens.CloseParen, tokenStream);
    return new ExpressionListNode(null, expr);
  }
}

export default ExpressionListRule;
