import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Symbol } from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import ArrayLookupNode from '@Basic4WebGL/nodes/ArrayLookupNode';
import ConstantRefNode from '@Basic4WebGL/nodes/ConstantRefNode';
import TypedElementAccessNode from '@Basic4WebGL/nodes/TypedElementAccessNode';
import DictionaryLookupNode from '@Basic4WebGL/nodes/DictionaryLookupNode';
import SelfArrayLookupNode from '@Basic4WebGL/nodes/SelfArrayLookupNode';
import SelfDictLookupNode from '@Basic4WebGL/nodes/SelfDictLookupNode';
import TermNode from '@Basic4WebGL/nodes/TermNode';
import VariableNode from '@Basic4WebGL/nodes/VariableNode';
import PropertyTermNode from '@Basic4WebGL/nodes/PropertyTermNode';
import PropertyMethodTermNode from '@Basic4WebGL/nodes/PropertyMethodTermNode';
import FunctionTermNode from '@Basic4WebGL/nodes/FunctionTermNode';
import { symbolTypes, scopeTypes } from '../../../symbolTypes';
import tokens from '@Basic4WebGL/tokens';
import resolveIndexableSymbol from './helpers/resolveIndexableSymbol';
import resolveClassMemberChainType from './helpers/resolveClassMemberChainType';
import { formatSymbol } from '@Basic4WebGL/transpilerRules/jsRules/helpers/transpilerHelpers';
import { CompilationError, SymbolError } from '@CompilerLib/errors';

function isInstancePropertyAccess(symbol: Symbol, symbolTable: Symbols): boolean {
  if (symbol.scope.type !== scopeTypes.Class) return false;
  const execScopeType = symbolTable.getScopeType();
  if (execScopeType !== scopeTypes.Function && execScopeType !== scopeTypes.Constructor) return false;
  return symbolTable.getFullScopeName().startsWith(symbol.scope.name + '.');
}

@RegisterParserRule('VariableFactor')
class VariableFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();

    if (symbolTable.check(name, symbolTypes.Constant)) {
      const constSym = symbolTable.get(name, symbolTypes.Constant) as any;
      return new ConstantRefNode(
        { module: constSym.scope.name, name },
        constSym.valueKind,
        loc
      );
    }

    if (symbolTable.check(name, symbolTypes.Module)) {
      return getParserRule('ModuleFactor').parse(tokenStream, symbolTable, {
        name,
      });
    }

    if (symbolTable.check(name, symbolTypes.Object)) {
      const ownerSymbol = symbolTable.get(name, symbolTypes.Object);
      const ownerFormatted = formatSymbol(ownerSymbol);

      // If next token is '(' this is a method call on a bare object ref (unusual but valid)
      if (!check(tokens.Dot, tokenStream.current())) {
        return new TermNode(ownerSymbol, new VariableNode(name), loc);
      }

      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const memberName = tokenStream.prev().text.toLowerCase();

      // obj.member["key"] — indexed read of a dictionary field declared on
      // the instance's class, accessed from outside the class. `clone()`
      // (DimRule) already flattened every class member — including
      // inherited ones — into a scope keyed by the instance's own bare name
      // at `dim` time, so the same lookup that resolves external method
      // calls below resolves field kind too.
      if (check(tokens.OpenBracket, tokenStream.current())) {
        matchAndMove(tokens.OpenBracket, tokenStream);
        const keyExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
        matchAndMove(tokens.CloseBracket, tokenStream);
        const dictSymbol = symbolTable.getInScope(memberName, symbolTypes.Dictionary, name);
        return new SelfDictLookupNode(
          { chain: `${ownerFormatted}.${memberName}`, symbol: dictSymbol },
          [keyExpr],
          loc
        );
      }

      // Method call: member followed by '('
      // The scope push is only so the method symbol resolves against the
      // instance's cloned members. The *emitted* receiver must come from the
      // instance symbol (ownerFormatted) — the method symbol's fullScope is the
      // lexical declaration chain (e.g. `main.onenter.s`), which is only a valid
      // JS path when the instance is module-scoped. Passing it explicitly keeps
      // this in step with the statement path in ObjectPropertyRule, which has
      // always built its call target from ownerFormatted.
      if (check(tokens.OpenParen, tokenStream.current())) {
        // obj.member(index) — indexed read of an array field, disambiguated
        // against a same-named method the same way self-field access is
        // (issue #13): a method of that name always wins.
        let isMethod = true;
        try {
          symbolTable.getInScope(memberName, symbolTypes.Function, name);
        } catch {
          isMethod = false;
        }
        let arraySymbol: Symbol | undefined;
        if (!isMethod) {
          try {
            arraySymbol = symbolTable.getInScope(memberName, symbolTypes.Array, name);
          } catch {
            arraySymbol = undefined;
          }
        }
        if (arraySymbol) {
          const elementChain = `${ownerFormatted}.${memberName}`;
          const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);

          // obj.bullets(0).getX() — chain a method/property access onto the
          // element read out of a TYPED array field declared on another
          // instance's class (issue #20, the external-instance counterpart
          // of #14c's self.bullets(0).getX()). Mirrors SelfFactorRule's
          // identical branch, reusing the same chain-based
          // TypedElementAccessNode instead of a parallel node.
          if ((arraySymbol as any).classSymbol && check(tokens.Dot, tokenStream.current())) {
            matchAndMove(tokens.Dot, tokenStream);
            matchAndMove(tokens.Variable, tokenStream);
            const innerMember = tokenStream.prev().text.toLowerCase();
            if (check(tokens.OpenParen, tokenStream.current())) {
              const innerArgs = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
              return new TypedElementAccessNode(
                { chain: elementChain, name: memberName, memberName: innerMember, kind: 'array', isStatement: false },
                [args, innerArgs],
                loc
              );
            }
            // obj.enemies(i).transformY — a plain field read off the
            // element, not a method call. Resolve the field's real dataType
            // against the array's own element class (mirrors SelfFactorRule).
            const dataType = resolveClassMemberChainType(
              symbolTable,
              (arraySymbol as any).classSymbol.name,
              [innerMember]
            );
            return new TypedElementAccessNode(
              { chain: elementChain, name: memberName, memberName: innerMember, kind: 'array', isStatement: false, dataType },
              [args],
              loc
            );
          }

          return new SelfArrayLookupNode(
            { chain: elementChain, symbol: arraySymbol },
            [args],
            loc
          );
        }

        // Method call on the instance: obj.method(args) in expression context.
        // Parse the argument list in the CURRENT scope — NOT the instance's
        // member scope — so an argument that shares a name with a zero-arg
        // method on the instance's class (e.g. a parameter `x` where the class
        // also has an `x()` accessor) still resolves to the caller's own
        // local/parameter rather than being parsed as a call to that method
        // ("Expected OpenParen got Comma"). Only the method symbol itself needs
        // to resolve against the instance's cloned members. This mirrors the
        // statement path in ObjectPropertyRule, which has always parsed its
        // args outside the instance scope.
        const args = getParserRule('ExpressionList').parse(
          tokenStream,
          symbolTable,
          undefined
        );
        let methodSymbol;
        symbolTable.setScope(name);
        try {
          methodSymbol = symbolTable.get(memberName, 'Function');
        } finally {
          symbolTable.clearScope();
        }
        return new FunctionTermNode(methodSymbol, args, loc, ownerFormatted);
      }

      // Property chain read: build the full chain. Also track each segment
      // name so a plain field read (no trailing method call) can resolve its
      // real dataType against the instance's own class — e.g. `e.transformY`
      // where `e` is `dim e as Enemy` (a local variable or typed function
      // parameter), or `e.boss.dead` for a further nested field. Without
      // this, the chain's type defaulted to a generic Object type and failed
      // strict boolean/numeric/string type checks (bare `if`, comparisons,
      // `and`/`or`) even though the field's real type is known statically —
      // the non-`self` counterpart of resolveMemberChainType's fix.
      let chain = `${ownerFormatted}.${memberName}`;
      const segments = [memberName];
      while (check(tokens.Dot, tokenStream.current())) {
        matchAndMove(tokens.Dot, tokenStream);
        matchAndMove(tokens.Variable, tokenStream);
        const segment = tokenStream.prev().text.toLowerCase();
        segments.push(segment);
        chain += `.${segment}`;

        // Chained method call: obj.prop.method(args) in expression context
        if (check(tokens.OpenParen, tokenStream.current())) {
          const args = getParserRule('ExpressionList').parse(
            tokenStream,
            symbolTable,
            undefined
          );
          return new PropertyMethodTermNode(chain, args, loc);
        }
      }
      const ownerClassSymbol = (ownerSymbol as any).classSymbol;
      const dataType = ownerClassSymbol
        ? resolveClassMemberChainType(symbolTable, ownerClassSymbol.name, segments)
        : undefined;
      return new PropertyTermNode(chain, loc, dataType);
    }
    if (symbolTable.check(name, symbolTypes.Function)) {
      return getParserRule('FunctionFactor').parse(tokenStream, symbolTable, {
        name,
      });
    }
    // Dictionary lookup in expression context: dict["key"] or dict["key"].member
    if (check(tokens.OpenBracket, tokenStream.current())) {
      const dictSym = resolveIndexableSymbol(symbolTable, name, symbolTypes.Dictionary) as any;
      matchAndMove(tokens.OpenBracket, tokenStream);
      const keyExpr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.CloseBracket, tokenStream);

      if (dictSym.classSymbol && check(tokens.Dot, tokenStream.current())) {
        matchAndMove(tokens.Dot, tokenStream);
        matchAndMove(tokens.Variable, tokenStream);
        const memberName = tokenStream.prev().text.toLowerCase();
        if (check(tokens.OpenParen, tokenStream.current())) {
          const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
          return new TypedElementAccessNode(
            { collectionSymbol: dictSym, memberName, kind: 'dict', isStatement: false },
            [keyExpr, args],
            loc
          );
        }
        // dict["key"].transformY — a plain field read, not a method call.
        const dictDataType = resolveClassMemberChainType(symbolTable, dictSym.classSymbol.name, [memberName]);
        return new TypedElementAccessNode(
          { collectionSymbol: dictSym, memberName, kind: 'dict', isStatement: false, dataType: dictDataType },
          [keyExpr],
          loc
        );
      }

      return new DictionaryLookupNode(dictSym, keyExpr, loc);
    }
    if (!check(tokens.OpenParen, tokenStream.current())) {
      let varSymbol: Symbol;
      try {
        if (symbolTable.check(name, symbolTypes.Array)) {
          varSymbol = symbolTable.get(name, symbolTypes.Array);
        } else if (symbolTable.check(name, symbolTypes.Dictionary)) {
          varSymbol = symbolTable.get(name, symbolTypes.Dictionary);
        } else {
          varSymbol = symbolTable.get(name);
        }
      } catch (e) {
        // symbolTable.get() throws with no loc — by this point the identifier
        // token has already been consumed, so the fallback loc a caller assigns
        // would land on whatever comes next (often the following line). Attach
        // the identifier's own loc here instead.
        if (e instanceof SymbolError && !e.loc) {
          e.loc = loc;
        }
        throw e;
      }
      if (isInstancePropertyAccess(varSymbol, symbolTable)) {
        throw new CompilationError(`'${name}' is a class property — use self.${name}`);
      }
      return new TermNode(varSymbol, new VariableNode(name), loc);
    }
    matchAndMove(tokens.OpenParen, tokenStream);
    const elems = getParserRule('ArrayList').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(tokens.CloseParen, tokenStream);

    const arraySym = resolveIndexableSymbol(symbolTable, name, symbolTypes.Array) as any;

    if (arraySym.classSymbol && check(tokens.Dot, tokenStream.current())) {
      matchAndMove(tokens.Dot, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const memberName = tokenStream.prev().text.toLowerCase();
      if (check(tokens.OpenParen, tokenStream.current())) {
        const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
        return new TypedElementAccessNode(
          { collectionSymbol: arraySym, memberName, kind: 'array', isStatement: false },
          [elems, args],
          loc
        );
      }
      // enemies(i).transformY — a plain field read off the element, not a
      // method call. Resolve the field's real dataType against the array's
      // own element class (mirrors SelfFactorRule's identical case).
      const dataType = resolveClassMemberChainType(symbolTable, arraySym.classSymbol.name, [memberName]);
      return new TypedElementAccessNode(
        { collectionSymbol: arraySym, memberName, kind: 'array', isStatement: false, dataType },
        [elems],
        loc
      );
    }

    return new ArrayLookupNode(arraySym, elems, loc);
  }
}

export default VariableFactorRule;
