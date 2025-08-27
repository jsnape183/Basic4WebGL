import { check } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import ExpressionNode from '../../nodes/ExpressionNode';
import tokens from '../../tokens';

@RegisterRule('Term')
class TermRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    let factor = getRule('Factor').parse(tokenStream, symbolTable, undefined);
    while (check([tokens.Multiply, tokens.Divide], tokenStream.current())) {
      switch (tokenStream.current().token.value) {
        case tokens.Multiply.value:
          factor = getRule('Multiply').parse(tokenStream, symbolTable, {
            factor,
          });
          break;
        case tokens.Divide.value:
          factor = getRule('Divide').parse(tokenStream, symbolTable, {
            factor,
          });
          break;
        default:
          return new ExpressionNode(null, factor);
      }
    }
    return factor;
  }
}

export default TermRule;
