import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import FunctionCallNode from '../../nodes/FunctionCallNode';
import { newLines } from '../../parserConfig';

@RegisterParserRule('FunctionCall')
class FunctionCallRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: any | undefined
  ): Tree {
    const functionSymbol = data?.functionSymbol as Symbol;
    const expressions = getParserRule('ExpressionList').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    return new FunctionCallNode(functionSymbol, expressions);
  }
}

export default FunctionCallRule;
