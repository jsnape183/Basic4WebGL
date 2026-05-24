import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import EmptyNode from '../../nodes/EmptyNode';
import { newLines } from '../../parserConfig';

@RegisterParserRule('EndClass')
class EndClassRule implements IParserRule {
  parse(tokenStream: TokenStream, _symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.EndClass, tokenStream);
    if (check(newLines, tokenStream.current())) {
      matchAndMove(newLines, tokenStream);
    }
    return new EmptyNode(loc);
  }
}

export default EndClassRule;
