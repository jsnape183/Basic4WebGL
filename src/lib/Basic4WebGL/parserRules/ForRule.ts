import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import tokens from '../tokens';
import { getRule } from '../../parser/ruleFactory';
import { newLines } from '../parserConfig';
import ForNode from '../nodes/ForNode';

@RegisterRule('For')
class ForRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.For, tokenStream);
    const expr = getRule('ForExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    const block = getRule('Block').parse(tokenStream, symbolTable, {
      endToken: tokens.Next,
    });
    matchAndMove(tokens.Next, tokenStream);
    matchAndMove(newLines, tokenStream);

    return new ForNode(null, [expr, block]);
  }
}

export default ForRule;
