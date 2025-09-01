import { check } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
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
