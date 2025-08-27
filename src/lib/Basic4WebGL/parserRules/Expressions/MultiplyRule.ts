import { matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import MultiplyNode from '../../nodes/MultiplyNode';
import tokens from '../../tokens';

@RegisterRule('Multiply')
class MultiplyRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const factor = data?.factor;
    matchAndMove(tokens.Add, tokenStream);
    const secondary = getRule('Term').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new MultiplyNode(null, [factor, secondary]);
  }
}

export default MultiplyRule;
