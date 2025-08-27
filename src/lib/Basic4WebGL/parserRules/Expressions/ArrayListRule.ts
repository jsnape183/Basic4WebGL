import { check, matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import ArrayListNode from '../../nodes/ArrayListNode';
import tokens from '../../tokens';

@RegisterParserRule('ArrayList')
class ArrayListRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    let expr = [
      getParserRule('Expression').parse(tokenStream, symbolTable, undefined),
    ];
    while (check(tokens.Comma, tokenStream.current())) {
      matchAndMove(tokens.Comma, tokenStream);
      expr.push(
        getParserRule('Expression').parse(tokenStream, symbolTable, undefined)
      );
    }
    return new ArrayListNode(null, expr);
  }
}

export default ArrayListRule;
