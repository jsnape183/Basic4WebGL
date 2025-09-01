import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import ExpressionNode from '@Basic4WebGL/nodes/ExpressionNode';
import UMinusNode from '@Basic4WebGL/nodes/UMinusNode';
import tokens from '@Basic4WebGL/tokens';

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
