import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import NotNode from '@Basic4WebGL/nodes/NotNode';
import tokens from '@Basic4WebGL/tokens';

@RegisterParserRule('Not')
class NotRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    if (check(tokens.Not, tokenStream.current())) {
      matchAndMove(tokens.Not, tokenStream);
      return new NotNode(
        null,
        getParserRule('BoolFactor').parse(tokenStream, symbolTable, undefined)
      );
    }
    return getParserRule('BoolTerm').parse(tokenStream, symbolTable, undefined);
  }
}

export default NotRule;
