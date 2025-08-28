import { matchAndMove } from '../../../../compiler/rulesHelper';
import TokenStream from '../../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../../parser/ParserRule';
import { getParserRule } from '../../../../parser/parserRuleFactory';
import Symbols from '../../../../symbols';
import { Tree } from '../../../../tree';
import tokens from '../../../tokens';

@RegisterParserRule('ModuleFactor')
class ModuleFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const name = data?.name;
    matchAndMove(tokens.Dot, tokenStream);
    symbolTable.setScope(name);
    matchAndMove(tokens.Variable, tokenStream);
    const functionName = tokenStream.prev().text;

    const node = getParserRule('FunctionFactor').parse(
      tokenStream,
      symbolTable,
      {
        name: functionName,
      }
    );
    symbolTable.clearScope();
    return node;
  }
}

export default ModuleFactorRule;
