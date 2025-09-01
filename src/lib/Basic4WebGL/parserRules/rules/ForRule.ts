import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import { newLines } from '../../parserConfig';
import ForNode from '../../nodes/ForNode';

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
