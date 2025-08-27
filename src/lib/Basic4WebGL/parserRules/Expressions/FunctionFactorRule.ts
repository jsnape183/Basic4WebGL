import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import FunctionTermNode from '../../nodes/FunctionTermNode';

@RegisterRule('FunctionFactor')
class FunctionFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const name = data?.name;
    const expr = getRule('ExpressionList').parse(
      tokenStream,
      symbolTable,
      undefined
    );

    const functionSymbol = symbolTable.get(name, 'Function');
    return new FunctionTermNode(functionSymbol, expr);
  }
}

export default FunctionFactorRule;
