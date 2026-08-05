import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Symbol } from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { symbolTypes, scopeTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import ArrayAssignNode from '../../nodes/ArrayAssignNode';
import AssignNode from '../../nodes/AssignNode';
import DictionaryAssignNode from '../../nodes/DictionaryAssignNode';
import PropertyAssignNode from '../../nodes/PropertyAssignNode';
import { newLines } from '../../parserConfig';
import { CompilationError } from '@CompilerLib/errors';
import nodeTypes from '../../nodeTypes';
import TypedElementAccessNode from '../../nodes/TypedElementAccessNode';
import resolveIndexableSymbol from './Expressions/helpers/resolveIndexableSymbol';

function isInstancePropertyAccess(symbol: Symbol, symbolTable: Symbols): boolean {
  if (symbol.scope.type !== scopeTypes.Class) return false;
  const execScopeType = symbolTable.getScopeType();
  if (execScopeType !== scopeTypes.Function && execScopeType !== scopeTypes.Constructor) return false;
  return symbolTable.getFullScopeName().startsWith(symbol.scope.name + '.');
}

@RegisterParserRule('Variable')
class VariableRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();
    if (symbolTable.check(name, symbolTypes.Module)) {
      return getParserRule('Module').parse(tokenStream, symbolTable, name);
    }

    if (symbolTable.check(name, symbolTypes.Object)) {
      // Dot access → property/method on the instance
      if (check(tokens.Dot, tokenStream.current())) {
        return getParserRule('ObjectProperty').parse(tokenStream, symbolTable, name);
      }
      // No dot → plain assignment to an object-typed variable (e.g. result = myCar.carKey)
      const objSymbol = symbolTable.get(name, symbolTypes.Object);
      matchAndMove(tokens.Equals, tokenStream);
      const expr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      if (expr.type === nodeTypes.NewObject) {
        const objClass = (objSymbol as any).classSymbol?.name;
        const newClass = expr.data.classSymbol.name;
        if (objClass && objClass !== newClass) {
          throw new CompilationError(
            `Type mismatch: '${name}' is typed as '${objClass}' but 'new ${newClass}' was assigned`
          );
        }
      }
      matchAndMove(newLines, tokenStream);
      if (isInstancePropertyAccess(objSymbol, symbolTable)) {
        return new PropertyAssignNode({ chain: `this.${name}` }, expr, loc);
      }
      return new AssignNode(objSymbol, expr, loc);
    }

    if (symbolTable.check(name, symbolTypes.Function)) {
      const functionSymbol = symbolTable.get(name, 'Function');
      return getParserRule('FunctionCall').parse(
        tokenStream,
        symbolTable,
        functionSymbol
      );
    }
    // Handle dictionary access/assignment: dict["key"].method() or dict["key"] = value.
    // A Dictionary-kind symbol is always followed by '[' by construction (dim x[]
    // only ever parses that way) so no lookahead is needed for it. A plain
    // Variable-kind symbol only takes this branch when '[' is actually next,
    // so ordinary `x = 5` assignment is unaffected.
    const isDictLike =
      symbolTable.check(name, symbolTypes.Dictionary) ||
      (check(tokens.OpenBracket, tokenStream.current()) &&
        symbolTable.check(name, symbolTypes.Variable));
    if (isDictLike) {
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
          matchAndMove(newLines, tokenStream);
          return new TypedElementAccessNode(
            { collectionSymbol: dictSym, memberName, kind: 'dict', isStatement: true },
            [keyExpr, args],
            loc
          );
        }
        matchAndMove(newLines, tokenStream);
        return new TypedElementAccessNode(
          { collectionSymbol: dictSym, memberName, kind: 'dict', isStatement: false },
          [keyExpr],
          loc
        );
      }

      // Regular dict assignment
      matchAndMove(tokens.Equals, tokenStream);
      const valExpr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      if (valExpr.type === nodeTypes.NewObject) {
        const dictClass = dictSym.classSymbol?.name;
        const newClass = valExpr.data.classSymbol.name;
        if (dictClass && dictClass !== newClass) {
          throw new CompilationError(
            `Type mismatch: '${name}' holds values of type '${dictClass}' but 'new ${newClass}' was assigned`
          );
        }
      }
      matchAndMove(newLines, tokenStream);
      return new DictionaryAssignNode(dictSym, [keyExpr, valExpr], loc);
    }

    // ── Typed array element: enemies(0).method() or enemies(0) = new Enemy() ──
    if (symbolTable.check(name, symbolTypes.Array)) {
      const arraySym = symbolTable.get(name, symbolTypes.Array) as any;
      if (arraySym.classSymbol) {
        // Note: ExpressionList is used here (not ArrayList) because ArrayAssignNode expects
        // that format. TypedElementAccessRule puts dims directly in [idx], which means
        // multi-dimensional typed arrays would generate incorrect JS (arr[0,1] not arr[0][1]).
        // In practice, typed object arrays are always 1D, so this is not a current concern.
        const dims = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
        if (check(tokens.Dot, tokenStream.current())) {
          matchAndMove(tokens.Dot, tokenStream);
          matchAndMove(tokens.Variable, tokenStream);
          const memberName = tokenStream.prev().text.toLowerCase();
          if (check(tokens.OpenParen, tokenStream.current())) {
            const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
            matchAndMove(newLines, tokenStream);
            return new TypedElementAccessNode(
              { collectionSymbol: arraySym, memberName, kind: 'array', isStatement: true },
              [dims, args],
              loc
            );
          }
          matchAndMove(newLines, tokenStream);
          return new TypedElementAccessNode(
            { collectionSymbol: arraySym, memberName, kind: 'array', isStatement: false },
            [dims],
            loc
          );
        }
        // No dot → typed array element assignment: enemies(0) = new Enemy()
        matchAndMove(tokens.Equals, tokenStream);
        const valExpr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
        if (valExpr.type === nodeTypes.NewObject) {
          const arrClass = arraySym.classSymbol?.name;
          const newClass = valExpr.data.classSymbol.name;
          if (arrClass && arrClass !== newClass) {
            throw new CompilationError(
              `Type mismatch: '${name}' holds elements of type '${arrClass}' but 'new ${newClass}' was assigned`
            );
          }
        }
        matchAndMove(newLines, tokenStream);
        return new ArrayAssignNode(arraySym, [dims, valExpr], loc);
      }
    }

    // Handle array indexing: arr(i) = v for Array-kind symbols, and for
    // Variable-kind symbols (covers both pass-by-ref array parameters and a
    // plain dim holding an array returned from a function call) when '(' is
    // actually next — `check(name, Variable)` already matches Parameter-kind
    // symbols too (see isMatchingType in transpilerRules/symbolRules.ts), so
    // this single check covers both cases.
    const isArrayLike =
      symbolTable.check(name, symbolTypes.Array) ||
      (check(tokens.OpenParen, tokenStream.current()) &&
        symbolTable.check(name, symbolTypes.Variable));
    if (isArrayLike) {
      const dims = getParserRule('ExpressionList').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.Equals, tokenStream);
      const expr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      const arraySymbol = resolveIndexableSymbol(symbolTable, name, symbolTypes.Array, true);
      if (expr.type === nodeTypes.NewObject) {
        const arrClass = (arraySymbol as any).classSymbol?.name;
        const newClass = expr.data.classSymbol.name;
        if (arrClass && arrClass !== newClass) {
          throw new CompilationError(
            `Type mismatch: '${name}' holds elements of type '${arrClass}' but 'new ${newClass}' was assigned`
          );
        }
      }
      matchAndMove(newLines, tokenStream);
      return new ArrayAssignNode(arraySymbol, [dims, expr], loc);
    }
    const varSymbol = symbolTable.get(name, symbolTypes.Variable);
    if (isInstancePropertyAccess(varSymbol, symbolTable)) {
      throw new CompilationError(`'${name}' is a class property — use self.${name}`);
    }
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    if (expr.type === nodeTypes.NewObject) {
      throw new CompilationError(
        `Cannot assign object to variant variable '${name}'. Declare it as 'dim ${name} as ${expr.data.classSymbol.name}'.`
      );
    }
    matchAndMove(newLines, tokenStream);
    return new AssignNode(varSymbol, expr, loc);
  }
}

export default VariableRule;
