import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '@Basic4WebGL/tokens';

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
      node = getParserRule('FunctionFactor').parse(
        tokenStream,
        symbolTable,
        {
          name: functionName,
        }
      );
    } finally {
      symbolTable.clearScope();
    }
    return node;
  }
}

export default ModuleFactorRule;
