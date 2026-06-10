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
import { symbolTypes } from '../../../symbolTypes';

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

    // self.property in expression context — look up symbol type from class scope so arithmetic
    // type-checks pass correctly even when a local variable shadows the class property name
    const className = symbolTable.getFullScopeName().split('.')[0];
    let dataType;
    try {
      dataType = symbolTable.getInScope(memberName, symbolTypes.Variable, className).dataType;
    } catch {
      dataType = undefined;
    }
    return new PropertyTermNode(`this.${memberName}`, loc, dataType);
  }
}

export default SelfFactorRule;
