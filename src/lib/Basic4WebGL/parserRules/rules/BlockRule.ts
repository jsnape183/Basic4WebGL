import { check } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import { getParserRule } from '../../../parser/parserRuleFactory';
import BlockNode from '../../nodes/BlockNode';

@RegisterParserRule('Block')
class BlockRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: any | undefined
  ): Tree {
    const children = new Array<Tree>();
    const endTokens = data?.endTokens;
    while (!check(endTokens, tokenStream.current())) {
      const child = getParserRule(tokenStream.current().token.name).parse(
        tokenStream,
        symbolTable,
        undefined
      ) as Tree;
      if (!child) continue;
      children.push(child);
    }
    return new BlockNode(null, children);
  }
}

export default BlockRule;
