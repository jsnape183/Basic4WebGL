import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { symbolTypes } from '../symbolTypes';
import tokens from '../tokens';
import { getParserRule } from '../../parser/ruleFactory';
import ArrayAssignNode from '../nodes/ArrayAssignNode';
import AssignNode from '../nodes/AssignNode';
import { newLines } from '../parserConfig';

@RegisterParserRule('Variable')
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
      return getParserRule('Module').parse(tokenStream, symbolTable, name);
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
      return new ArrayAssignNode(arraySymbol, [dims, expr]);
    }
    const varSymbol = symbolTable.get(name, symbolTypes.Variable);
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    return new AssignNode(varSymbol, expr);
  }
}

export default VariableRule;
