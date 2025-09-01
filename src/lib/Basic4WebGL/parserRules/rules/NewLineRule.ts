import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import EmptyNode from '../../nodes/EmptyNode';

@RegisterParserRule('NewLine')
class NewLineRule implements IParserRule {
  parse(tokenStream: TokenStream): Tree {
    matchAndMove(tokens.NewLine, tokenStream);
    return new EmptyNode();
  }
}

export default NewLineRule;
