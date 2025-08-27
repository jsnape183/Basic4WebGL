import { check, matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import TermNode from '../../nodes/TermNode';
import { booleans } from '../../parserConfig';

@RegisterParserRule('BoolFactor')
class BoolFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    if (check(booleans, tokenStream.current())) {
      matchAndMove(booleans, tokenStream);
      return new TermNode(tokenStream.prev().text, undefined);
    }
    return getParserRule('Relation').parse(tokenStream, symbolTable, undefined);
  }
}

export default BoolFactorRule;
