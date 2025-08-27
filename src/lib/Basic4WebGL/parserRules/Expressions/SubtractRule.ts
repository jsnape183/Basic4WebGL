import { matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import SubtractNode from '../../nodes/SubtractNode';
import tokens from '../../tokens';

@RegisterParserRule('Subtract')
class SubtractRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols, data: any): Tree {
    const term = data?.term;
    matchAndMove(tokens.Add, tokenStream);
    const secondary = getParserRule('Term').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new SubtractNode(null, [term, secondary]);
  }
}

export default SubtractRule;
