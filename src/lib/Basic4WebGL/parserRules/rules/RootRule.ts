import { check } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import RootNode from '../../nodes/RootNode';
import ObjectType from '../../builtInTypes/definitions/ObjectType';

@RegisterParserRule('Root')
class RootRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: any | undefined
  ): Tree {
    const name = data?.name;
    const children = new Array<Tree>();
    symbolTable.add(
      name,
      symbolTypes.Module,
      symbolTable.getScope(),
      new ObjectType(`${symbolTable.getFullScopeName()}.${name}`)
    );

    symbolTable.setScope(name);
    let returnNode: RootNode;
    try {
      while (!check(tokens.EndOfFile, tokenStream.current())) {
        const child = getParserRule(tokenStream.current().token.name).parse(
          tokenStream,
          symbolTable,
          undefined
        ) as Tree;

        if (!child) continue;
        children.push(child);
      }
      returnNode = new RootNode(symbolTable.getScopeName(), children);
    } finally {
      symbolTable.clearScope();
    }
    return returnNode;
  }
}

export default RootRule;
