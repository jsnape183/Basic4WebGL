import { matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import AndNode from '../../nodes/AndNode';
import tokens from '../../tokens';

@RegisterRule('And')
class AndRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const term = data?.term;
    matchAndMove(tokens.And, tokenStream);
    return new AndNode(null, [
      term,
      getRule('BoolTerm').parse(tokenStream, symbolTable, undefined),
    ]);
  }
}

export default AndRule;
