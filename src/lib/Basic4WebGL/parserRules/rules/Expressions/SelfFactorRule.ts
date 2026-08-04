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
import SelfArrayLookupNode from '@Basic4WebGL/nodes/SelfArrayLookupNode';
import { assertInsideClass } from '../classGuards';
import { symbolTypes } from '../../../symbolTypes';
import resolveSelfMember from './helpers/resolveSelfMember';

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
      // `self.name(...)` is genuinely ambiguous: softBASIC spells array indexing
      // and method calls identically. The statement form (SelfRule) can settle it
      // syntactically, because only an array write can be followed by `=`. Here
      // there is no such token, so the only way to tell them apart is to ask the
      // symbol table what kind of member this actually is.
      //
      // A method of that name always wins, so no call that compiles today can
      // change meaning; we divert to indexing only when the member is provably a
      // declared array field and provably not a method.
      const isMethod =
        resolveSelfMember(symbolTable, memberName, symbolTypes.Function) !== undefined;
      const arraySymbol = isMethod
        ? undefined
        : resolveSelfMember(symbolTable, memberName, symbolTypes.Array);

      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);

      if (arraySymbol) {
        // self.arr(i) / self.grid(i, j) — indexed read of a class array field
        return new SelfArrayLookupNode({ chain, symbol: arraySymbol }, [args], loc);
      }
      // self.method(args) in expression context
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
    // Walk up the inheritance chain so inherited properties resolve to the correct type,
    // skipping any ancestor declaration that carried no type of its own.
    const dataType = resolveSelfMember(
      symbolTable,
      memberName,
      symbolTypes.Variable,
      (symbol) => symbol.dataType !== undefined
    )?.dataType;
    return new PropertyTermNode(chain, loc, dataType);
  }
}

export default SelfFactorRule;
