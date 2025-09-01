import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';

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
