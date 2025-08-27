import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../parser/ParserRule';
import { Tree } from '../../tree';
import tokens from '../tokens';
import EmptyNode from '../nodes/EmptyNode';

@RegisterRule('NewLine')
class NewLineRule implements IParserRule {
  parse(tokenStream: TokenStream): Tree {
    matchAndMove(tokens.NewLine, tokenStream);
    return new EmptyNode();
  }
}

export default NewLineRule;
