import { matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/parserRuleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import AndNode from '../../nodes/AndNode';
import tokens from '../../tokens';

@RegisterParserRule('And')
class AndRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const term = data?.term;
    matchAndMove(tokens.And, tokenStream);
    return new AndNode(null, [
      term,
      getParserRule('BoolTerm').parse(tokenStream, symbolTable, undefined),
    ]);
  }
}

export default AndRule;
