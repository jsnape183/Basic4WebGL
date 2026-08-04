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
    const loc = tokenStream.current().loc();
    const name = data?.name;
    const expr = getParserRule('ExpressionList').parse(
      tokenStream,
      symbolTable,
      undefined
    );

    const functionSymbol = symbolTable.get(name, 'Function');
    // `data.receiver` is set when the caller is dispatching through an object
    // instance and has already resolved the instance's JS name. Plain function
    // calls leave it undefined and keep resolving via the symbol.
    return new FunctionTermNode(functionSymbol, expr, loc, data?.receiver);
  }
}

export default FunctionFactorRule;
