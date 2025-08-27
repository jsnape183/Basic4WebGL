import { matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import SubtractNode from '../../nodes/SubtractNode';
import tokens from '../../tokens';

@RegisterRule('Subtract')
class SubtractRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const term = data?.term;
    matchAndMove(tokens.Add, tokenStream);
    const secondary = getRule('Term').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new SubtractNode(null, [term, secondary]);
  }
}

export default SubtractRule;
