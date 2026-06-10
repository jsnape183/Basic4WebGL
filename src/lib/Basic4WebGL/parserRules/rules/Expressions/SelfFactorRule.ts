import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '@Basic4WebGL/tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import PropertyTermNode from '@Basic4WebGL/nodes/PropertyTermNode';
import PropertyMethodTermNode from '@Basic4WebGL/nodes/PropertyMethodTermNode';
import { assertInsideClass } from '../classGuards';

@RegisterParserRule('SelfFactor')
class SelfFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    assertInsideClass(symbolTable);

    matchAndMove(tokens.Self, tokenStream);
    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const memberName = tokenStream.prev().text.toLowerCase();

    if (check(tokens.OpenParen, tokenStream.current())) {
      // self.method(args) in expression context
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      return new PropertyMethodTermNode(`this.${memberName}`, args, loc);
    }

    // self.property in expression context
    return new PropertyTermNode(`this.${memberName}`, loc);
  }
}

export default SelfFactorRule;
