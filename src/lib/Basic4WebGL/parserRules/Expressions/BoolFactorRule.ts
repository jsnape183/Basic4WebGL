import { check, matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import TermNode from '../../nodes/TermNode';
import { booleans } from '../../parserConfig';

@RegisterRule('BoolFactor')
class BoolFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    if (check(booleans, tokenStream.current())) {
      matchAndMove(booleans, tokenStream);
      return new TermNode(tokenStream.prev().text, undefined);
    }
    return getRule('Relation').parse(tokenStream, symbolTable, undefined);
  }
}

export default BoolFactorRule;
