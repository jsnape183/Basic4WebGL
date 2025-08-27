import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import { getRule } from '../../parser/ruleFactory';
import FunctionCallNode from '../nodes/FunctionCallNode';
import { newLines } from '../parserConfig';

@RegisterRule('FunctionCall')
class FunctionCallRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: any | undefined
  ): Tree {
    const functionSymbol = data?.functionSymbol as Symbol;
    const expressions = getRule('ExpressionList').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    return new FunctionCallNode(functionSymbol, expressions);
  }
}

export default FunctionCallRule;
