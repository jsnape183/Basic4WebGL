import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import EmptyNode from '../../nodes/EmptyNode';

@RegisterParserRule('SoftNewLine')
class SoftNewLineRule implements IParserRule {
  parse(tokenStream: TokenStream): Tree {
    matchAndMove(tokens.SoftNewLine, tokenStream);
    return new EmptyNode();
  }
}

export default SoftNewLineRule;
