import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import tokens from '../tokens';
import { getRule } from '../../parser/ruleFactory';
import FunctionReturnNode from '../nodes/FunctionReturnNode';
import { newLines } from '../parserConfig';

@RegisterRule('Return')
class ReturnRule implements IParserRule {
  parse(
    tokenStream: TokenStream,
    symbolTable: Symbols,
    data: any | undefined
  ): Tree {
    matchAndMove(tokens.Return, tokenStream);
    const expr = getRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    return new FunctionReturnNode(null, expr);
  }
}

export default ReturnRule;
