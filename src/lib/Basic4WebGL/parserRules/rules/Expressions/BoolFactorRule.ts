import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import BoolNode from '@Basic4WebGL/nodes/BoolNode';
import TermNode from '@Basic4WebGL/nodes/TermNode';
import { booleans } from '../../../parserConfig';
import Token from '@CompilerLib/lexer/tokens/Token';
import tokens from '@Basic4WebGL/tokens';
import BoolEqualNode from '@Basic4WebGL/nodes/BoolEqualNode';

@RegisterParserRule('BoolFactor')
class BoolFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    if (check(booleans, tokenStream.current())) {
      matchAndMove(booleans, tokenStream);

      return new TermNode(
        tokenStream.prev().text,
        new BoolNode(tokenStream.prev().text)
      );
    }
    return getParserRule('Relation').parse(tokenStream, symbolTable, undefined);
  }
}

export default BoolFactorRule;
