import { check, matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { symbolTypes } from '../symbolTypes';
import tokens from '../tokens';
import VariableListNode from '../nodes/VariableLIstNode';
import TermNode from '../nodes/TermNode';

@RegisterParserRule('VariableList')
class VariableListRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const list = new Array<Tree>();
    while (check(tokens.Variable, tokenStream.current())) {
      matchAndMove(tokens.Variable, tokenStream);
      const paramSymbol = symbolTable.add(
        tokenStream.prev().text,
        symbolTypes.Parameter
      );
      list.push(new TermNode(paramSymbol, undefined));
      if (!check(tokens.Comma, tokenStream.current())) break;
      matchAndMove(tokens.Comma, tokenStream);
    }

    return new VariableListNode(null, list);
  }
}

export default VariableListRule;
