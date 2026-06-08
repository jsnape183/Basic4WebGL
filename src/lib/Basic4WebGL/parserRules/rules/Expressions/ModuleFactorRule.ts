import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '@Basic4WebGL/tokens';
import FunctionTermNode from '@Basic4WebGL/nodes/FunctionTermNode';
import { symbolTypes } from '@Basic4WebGL/symbolTypes';

@RegisterParserRule('ModuleFactor')
class ModuleFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const name = data?.name;
    matchAndMove(tokens.Dot, tokenStream);
    symbolTable.setScope(name);
    let node: Tree;
    try {
      matchAndMove(tokens.Variable, tokenStream);
      const functionName = tokenStream.prev().text;
      // Use getInScope so that a same-named function in an outer scope does not
      // shadow this module's function (scope-priority search would pick outer first).
      const functionSymbol = symbolTable.getInScope(functionName, symbolTypes.Function, name);
      const expr = getParserRule('ExpressionList').parse(
        tokenStream,
        symbolTable,
        undefined
      );
      node = new FunctionTermNode(functionSymbol, expr, tokenStream.current().loc());
    } finally {
      symbolTable.clearScope();
    }
    return node;
  }
}

export default ModuleFactorRule;
