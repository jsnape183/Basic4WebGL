import { matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import OrNode from '../../nodes/OrNode';
import tokens from '../../tokens';

@RegisterRule('Or')
class OrRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const term = data?.term;
    matchAndMove(tokens.Or, tokenStream);
    return new OrNode(null, [
      term,
      getRule('BoolTerm').parse(tokenStream, symbolTable, undefined),
    ]);
  }
}

export default OrRule;
