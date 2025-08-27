import { check } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import tokens from '../../tokens';

@RegisterRule('BoolExpression')
class BoolExpressionRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    let term = getRule('Not').parse(tokenStream, symbolTable, undefined);

    while (check([tokens.And, tokens.Or], tokenStream.current())) {
      switch (tokenStream.current().token.value) {
        case tokens.And.value:
          term = getRule('And').parse(tokenStream, symbolTable, {
            term,
          });
          break;
        case tokens.Or.value:
          term = getRule('Or').parse(tokenStream, symbolTable, {
            term,
          });
          break;
        default:
          return term;
      }
    }
    return term;
  }
}

export default BoolExpressionRule;
