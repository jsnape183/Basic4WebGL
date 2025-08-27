import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { symbolTypes } from '../symbolTypes';
import tokens from '../tokens';
import { getRule } from '../../parser/ruleFactory';

@RegisterRule('Module')
class ModuleRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: any | undefined
  ): Tree {
    const name = data?.name;
    matchAndMove(tokens.Dot, tokenStream);
    symbolTable.setScope(name);
    matchAndMove(tokens.Variable, tokenStream);
    const functionName = tokenStream.prev().text;
    const functionSymbol = symbolTable.get(functionName, symbolTypes.Function);

    const node = getRule('FunctionCall').parse(
      tokenStream,
      symbolTable,
      functionSymbol
    );
    symbolTable.clearScope();
    return node;
  }
}

export default ModuleRule;
