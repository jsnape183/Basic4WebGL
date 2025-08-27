import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import tokens from '../tokens';
import { getParserRule } from '../../parser/ruleFactory';
import { newLines } from '../parserConfig';
import ForNode from '../nodes/ForNode';

@RegisterParserRule('For')
class ForRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.For, tokenStream);
    const expr = getParserRule('ForExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    const block = getParserRule('Block').parse(tokenStream, symbolTable, {
      endToken: tokens.Next,
    });
    matchAndMove(tokens.Next, tokenStream);
    matchAndMove(newLines, tokenStream);

    return new ForNode(null, [expr, block]);
  }
}

export default ForRule;
