import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import ArrayAssignNode from '../../nodes/ArrayAssignNode';
import AssignNode from '../../nodes/AssignNode';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Variable')
class VariableRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
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
