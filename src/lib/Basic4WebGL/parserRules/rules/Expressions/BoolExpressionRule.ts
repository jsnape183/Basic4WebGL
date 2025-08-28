import { check } from '../../../../compiler/rulesHelper';
import TokenStream from '../../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../../parser/ParserRule';
import { getParserRule } from '../../../../parser/parserRuleFactory';
import Symbols from '../../../../symbols';
import { Tree } from '../../../../tree';
import tokens from '../../../tokens';

@RegisterParserRule('BoolExpression')
class BoolExpressionRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    let term = getParserRule('Not').parse(tokenStream, symbolTable, undefined);

    while (check([tokens.And, tokens.Or], tokenStream.current())) {
      switch (tokenStream.current().token.value) {
        case tokens.And.value:
          term = getParserRule('And').parse(tokenStream, symbolTable, {
            term,
          });
          break;
        case tokens.Or.value:
          term = getParserRule('Or').parse(tokenStream, symbolTable, {
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
