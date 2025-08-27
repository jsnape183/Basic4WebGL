import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/parserRuleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';

@RegisterParserRule('BoolTerm')
class BoolTermRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    return getParserRule('BoolFactor').parse(
      tokenStream,
      symbolTable,
      undefined
    );
  }
}

export default BoolTermRule;
