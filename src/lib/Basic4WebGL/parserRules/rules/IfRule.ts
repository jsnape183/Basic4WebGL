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
import IfNode from '../../nodes/IfNode';

@RegisterParserRule('If')
class IfRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.If, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(newLines, tokenStream);
    const block = getParserRule('Block').parse(tokenStream, symbolTable, {
      endTokens: tokens.EndIf,
    });
    matchAndMove(tokens.EndIf, tokenStream);
    matchAndMove(newLines, tokenStream);

    return new IfNode(null, [expr, block], loc);
  }
}

export default IfRule;
