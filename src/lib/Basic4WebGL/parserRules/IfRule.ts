import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import tokens from '../tokens';
import { getRule } from '../../parser/ruleFactory';
import { newLines } from '../parserConfig';
import IfNode from '../nodes/IfNode';

@RegisterRule('If')
class IfRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.If, tokenStream);
    const expr = getRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    const block = getRule('Block').parse(
      tokenStream,
      symbolTable,
      tokens.EndIf
    );
    matchAndMove(tokens.EndIf, tokenStream);
    matchAndMove(newLines, tokenStream);

    return new IfNode(null, [expr, block]);
  }
}

export default IfRule;
