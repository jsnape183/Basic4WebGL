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
import PropertyAssignNode from '../../nodes/PropertyAssignNode';
import { newLines } from '../../parserConfig';

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
    if (symbolTable.check(name, symbolTypes.Array)) {
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
      matchAndMove(newLines, tokenStream);
      const arraySymbol = symbolTable.get(name, 'Array');
      return new ArrayAssignNode(arraySymbol, [dims, expr], loc);
    }
    const varSymbol = symbolTable.get(name, symbolTypes.Variable);
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    if (isInstancePropertyAccess(varSymbol, symbolTable)) {
      return new PropertyAssignNode({ chain: `this.${name}` }, expr, loc);
    }
    return new AssignNode(varSymbol, expr, loc);
  }
}

export default VariableRule;
