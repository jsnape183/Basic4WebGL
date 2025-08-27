import { matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import tokens from '../tokens';
import { getParserRule } from '../../parser/ruleFactory';
import CallNode from '../nodes/CallNode';
import { newLines } from '../parserConfig';

@RegisterParserRule('Call')
class CallRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.Call, tokenStream);
    matchAndMove(tokens.OpenParen, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(tokens.CloseParen, tokenStream);
    matchAndMove(newLines, tokenStream);
    return new CallNode(null, expr);
  }
}

export default CallRule;
