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

    // Bare `self` — object reference passed as a value, e.g. stage.add(self)
    if (!check(tokens.Dot, tokenStream.current())) {
      return new PropertyTermNode('this', loc);
    }

    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const memberName = tokenStream.prev().text.toLowerCase();
    let chain = `this.${memberName}`;

    if (check(tokens.OpenParen, tokenStream.current())) {
      // self.method(args) in expression context
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      return new PropertyMethodTermNode(chain, args, loc);
    }

    // self.prop.sub.method(args) — chained call through a sub-object in expression context
    while (check(tokens.Dot, tokenStream.current())) {
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      chain += `.${tokenStream.prev().text.toLowerCase()}`;

      if (check(tokens.OpenParen, tokenStream.current())) {
        const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
        return new PropertyMethodTermNode(chain, args, loc);
      }
    }

    // self.property in expression context — look up symbol type from class scope so arithmetic
    // type-checks pass correctly even when a local variable shadows the class property name.
    // Walk up the inheritance chain so inherited properties resolve to the correct type.
    const className = symbolTable.getFullScopeName().split('.')[0];
    let dataType;
    let searchClass: string | undefined = className;
    while (searchClass !== undefined && dataType === undefined) {
      try {
        dataType = symbolTable.getInScope(memberName, symbolTypes.Variable, searchClass).dataType;
      } catch {
        try {
          searchClass = symbolTable.get(searchClass, symbolTypes.Class).parentClassName;
        } catch {
          searchClass = undefined;
        }
      }
    }
    return new PropertyTermNode(chain, loc, dataType);
  }
}

export default SelfFactorRule;
