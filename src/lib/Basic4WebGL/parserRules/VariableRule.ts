import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { symbolTypes } from '../symbolTypes';
import tokens from '../tokens';
import { getRule } from '../../parser/ruleFactory';
import ArrayAssignNode from '../nodes/ArrayAssignNode';
import AssignNode from '../nodes/AssignNode';
import { newLines } from '../parserConfig';

@RegisterRule('Variable')
class VariableRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: any | undefined
  ): Tree {
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();
    if (
      symbolTable.check(name, symbolTypes.Module) ||
      symbolTable.check(name, symbolTypes.Object)
    ) {
      return getRule('Module').parse(tokenStream, symbolTable, name);
    }

    if (symbolTable.check(name, symbolTypes.Function)) {
      const functionSymbol = symbolTable.get(name, 'Function');
      return getRule('FunctionCall').parse(
        tokenStream,
        symbolTable,
        functionSymbol
      );
    }
    if (symbolTable.check(name, symbolTypes.Array)) {
      const dims = getRule('ExpressionList').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(tokens.Equals, tokenStream);
      const expr = getRule('BoolExpression').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      matchAndMove(newLines, tokenStream);
      const arraySymbol = symbolTable.get(name, 'Array');
      return new ArrayAssignNode(arraySymbol, [dims, expr]);
    }
    const varSymbol = symbolTable.get(name, symbolTypes.Variable);
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    return new AssignNode(varSymbol, expr);
  }
}

export default VariableRule;
