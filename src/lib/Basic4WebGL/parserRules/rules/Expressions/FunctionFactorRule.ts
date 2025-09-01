import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import FunctionTermNode from '@Basic4WebGL/nodes/FunctionTermNode';

@RegisterParserRule('FunctionFactor')
class FunctionFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const name = data?.name;
    const expr = getParserRule('ExpressionList').parse(
      tokenStream,
      symbolTable,
      undefined
    );

    const functionSymbol = symbolTable.get(name, 'Function');
    return new FunctionTermNode(functionSymbol, expr);
  }
}

export default FunctionFactorRule;
