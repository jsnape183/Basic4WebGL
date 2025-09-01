import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import VariableListNode from '../../nodes/VariableLIstNode';
import TermNode from '../../nodes/TermNode';
import VariableNode from '../../nodes/VariableNode';

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
      list.push(new TermNode(paramSymbol, new VariableNode(paramSymbol.name)));
      if (!check(tokens.Comma, tokenStream.current())) break;
      matchAndMove(tokens.Comma, tokenStream);
    }

    return new VariableListNode(null, list);
  }
}

export default VariableListRule;
