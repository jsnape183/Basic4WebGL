import { check } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { symbolTypes } from '../symbolTypes';
import tokens from '../tokens';
import { getRule } from '../../parser/ruleFactory';
import RootNode from '../nodes/RootNode';

@RegisterRule('Root')
class RootRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: any | undefined
  ): Tree {
    const name = data?.name;
    const children = new Array<Tree>();
    symbolTable.add(name, symbolTypes.Module);

    symbolTable.setScope(name);
    while (!check(tokens.EndOfFile, tokenStream.current())) {
      const child = getRule(tokenStream.current().token.name).parse(
        tokenStream,
        symbolTable,
        undefined
      ) as Tree;

      if (!child) continue;
      children.push(child);
    }
    const returnNode = new RootNode(symbolTable.getScopeName(), children);
    symbolTable.clearScope();
    return returnNode;
  }
}

export default RootRule;
