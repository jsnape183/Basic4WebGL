import { check, matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import ExpressionNode from '../../nodes/ExpressionNode';
import UMinusNode from '../../nodes/UMinusNode';
import tokens from '../../tokens';

@RegisterParserRule('Expression')
class ExpressionRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    let term = null;
    if (check([tokens.Add, tokens.Subtract], tokenStream.current())) {
      matchAndMove([tokens.Add, tokens.Subtract], tokenStream);
      term = new UMinusNode(
        null,
        getParserRule('Term').parse(tokenStream, symbolTable, undefined)
      );
    } else {
      term = getParserRule('Term').parse(tokenStream, symbolTable, undefined);
    }

    while (check([tokens.Add, tokens.Subtract], tokenStream.current())) {
      switch (tokenStream.current().token.value) {
        case tokens.Add.value:
          term = getParserRule('Add').parse(tokenStream, symbolTable, {
            term,
          });
          break;
        case tokens.Subtract.value:
          term = getParserRule('Subtract').parse(tokenStream, symbolTable, {
            term,
          });
          break;
        default:
          return new ExpressionNode(null, term);
      }
    }
    return term;
  }
}

export default ExpressionRule;
