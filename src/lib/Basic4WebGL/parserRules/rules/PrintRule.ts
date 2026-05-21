import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import PrintNode from '../../nodes/PrintNode';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Print')
class PrintRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Print, tokenStream);
    const printNode = new PrintNode(
      null,
      getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined),
      loc
    );
    matchAndMove(newLines, tokenStream);
    return printNode;
  }
}

export default PrintRule;
