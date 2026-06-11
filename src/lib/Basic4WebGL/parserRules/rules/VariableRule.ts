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
    // Handle dictionary assignment: dict["key"] = value
    if (symbolTable.check(name, symbolTypes.Dictionary)) {
      const dictSymbol = symbolTable.get(name, symbolTypes.Dictionary);
      matchAndMove(tokens.OpenBracket, tokenStream);
      const keyExpr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.CloseBracket, tokenStream);
      matchAndMove(tokens.Equals, tokenStream);
      const valExpr = getParserRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      if (valExpr.type === nodeTypes.NewObject) {
        const dictClass = (dictSymbol as any).classSymbol?.name;
        const newClass = valExpr.data.classSymbol.name;
        if (dictClass && dictClass !== newClass) {
          throw new CompilationError(
            `Type mismatch: '${name}' holds values of type '${dictClass}' but 'new ${newClass}' was assigned`
          );
        }
      }
      matchAndMove(newLines, tokenStream);
      return new DictionaryAssignNode(dictSymbol, [keyExpr, valExpr], loc);
    }

    // Handle array indexing: arr(i) = v for both Array and Variable (pass-by-ref array param)
    const isArrayLike =
      symbolTable.check(name, symbolTypes.Array) ||
      (check(tokens.OpenParen, tokenStream.current()) &&
        symbolTable.check(name, symbolTypes.Parameter));
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
      const arraySymbol = symbolTable.check(name, symbolTypes.Array)
        ? symbolTable.get(name, 'Array')
        : symbolTable.get(name, symbolTypes.Variable);
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
