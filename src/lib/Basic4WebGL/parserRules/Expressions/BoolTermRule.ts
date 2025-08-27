import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';

@RegisterRule('BoolTerm')
class BoolTermRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    return getRule('BoolFactor').parse(tokenStream, symbolTable, undefined);
  }
}

export default BoolTermRule;
