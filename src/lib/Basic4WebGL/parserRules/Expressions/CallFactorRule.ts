import { matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import CallTermNode from '../../nodes/CallTermNode';
import tokens from '../../tokens';

@RegisterParserRule('CallFactor')
class CallFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.Call, tokenStream);
    matchAndMove(tokens.OpenParen, tokenStream);
    const expr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(tokens.CloseParen, tokenStream);
    return new CallTermNode(null, expr);
  }
}

export default CallFactorRule;
