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
import SelfDictLookupNode from '@Basic4WebGL/nodes/SelfDictLookupNode';
import TypedElementAccessNode from '@Basic4WebGL/nodes/TypedElementAccessNode';
import { assertInsideClass } from '../classGuards';
import { CompilationError } from '@CompilerLib/errors';
import { symbolTypes } from '../../../symbolTypes';
import resolveSelfMember from './helpers/resolveSelfMember';
import resolveMemberChainType from './helpers/resolveMemberChainType';
import resolveClassMemberChainType from './helpers/resolveClassMemberChainType';

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

    if (check(tokens.OpenBracket, tokenStream.current())) {
      // self.member["key"] — indexed read of a class dictionary field.
      // Unlike `(...)`, brackets are unambiguous (never a method call), so no
      // symbol lookup is needed to decide *whether* to branch here — only to
      // recover the field's dataType for the type checker.
      matchAndMove(tokens.OpenBracket, tokenStream);
      const keyExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
      matchAndMove(tokens.CloseBracket, tokenStream);
      const dictSymbol = resolveSelfMember(symbolTable, memberName, symbolTypes.Dictionary);
      if (!dictSymbol) {
        throw new CompilationError(`'${memberName}' is not a declared dictionary field`);
      }
      return new SelfDictLookupNode({ chain, symbol: dictSymbol }, [keyExpr], loc);
    }

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
        // self.bullets(0).getX() — chain a method/property access onto the
        // element read out of a TYPED array field (dim bullets(3) as Bullet).
        // Mirrors the non-self shape already handled by TypedElementAccessNode
        // in VariableFactorRule, reusing the same node with a pre-built
        // `this.`-based chain instead of a formatSymbol-derived one.
        if ((arraySymbol as any).classSymbol && check(tokens.Dot, tokenStream.current())) {
          matchAndMove(tokens.Dot, tokenStream);
          matchAndMove(tokens.Variable, tokenStream);
          const innerMember = tokenStream.prev().text.toLowerCase();
          if (check(tokens.OpenParen, tokenStream.current())) {
            const innerArgs = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
            return new TypedElementAccessNode(
              { chain, name: memberName, memberName: innerMember, kind: 'array', isStatement: false },
              [args, innerArgs],
              loc
            );
          }
          // self.enemies(i).transformY — a plain field read off the element,
          // not a method call. Resolve the field's real dataType against the
          // array's own element class, walking its inheritance chain, so
          // strict type checks (bare `if`, comparisons, `and`/`or`) see the
          // field's actual type instead of the generic default.
          const dataType = resolveClassMemberChainType(
            symbolTable,
            (arraySymbol as any).classSymbol.name,
            [innerMember]
          );
          return new TypedElementAccessNode(
            { chain, name: memberName, memberName: innerMember, kind: 'array', isStatement: false, dataType },
            [args],
            loc
          );
        }
        // self.arr(i) / self.grid(i, j) — indexed read of a class array field
        return new SelfArrayLookupNode({ chain, symbol: arraySymbol }, [args], loc);
      }
      // self.method(args) in expression context
      return new PropertyMethodTermNode(chain, args, loc);
    }

    // self.prop.sub.method(args) — chained call through a sub-object in expression context.
    // Track every segment name (not just the first), since a chain that ends
    // without a method call needs to resolve the FINAL segment's type by
    // walking into each intermediate class-typed field's own class — see
    // resolveMemberChainType for why looking up only the first segment
    // against the outer class was wrong.
    const segments = [memberName];
    while (check(tokens.Dot, tokenStream.current())) {
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const segment = tokenStream.prev().text.toLowerCase();
      segments.push(segment);
      chain += `.${segment}`;

      if (check(tokens.OpenParen, tokenStream.current())) {
        const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
        return new PropertyMethodTermNode(chain, args, loc);
      }
    }

    // self.property[.sub.sub...] in expression context — look up the final
    // segment's type by walking the chain through each intermediate
    // class-typed field, so arithmetic/boolean/string type-checks pass
    // correctly even when a local variable shadows the class property name.
    // Walks up inheritance chains along the way, skipping any ancestor
    // declaration that carried no type of its own.
    const dataType = resolveMemberChainType(symbolTable, segments);
    return new PropertyTermNode(chain, loc, dataType);
  }
}

export default SelfFactorRule;
