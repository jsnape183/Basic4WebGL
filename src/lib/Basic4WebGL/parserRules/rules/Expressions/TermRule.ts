import { check } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import ExpressionNode from '@Basic4WebGL/nodes/ExpressionNode';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('Term')
class TermRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    let factor = getParserRule('Factor').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    while (check([tokens.Multiply, tokens.Divide], tokenStream.current())) {
      switch (tokenStream.current().token.value) {
        case tokens.Multiply.value:
          factor = getParserRule('Multiply').parse(tokenStream, symbolTable, {
            factor,
          });
          break;
        case tokens.Divide.value:
          factor = getParserRule('Divide').parse(tokenStream, symbolTable, {
            factor,
          });
          break;
        default:
          return new ExpressionNode(null, factor, loc);
      }
    }
    return factor;
  }
}

export default TermRule;
