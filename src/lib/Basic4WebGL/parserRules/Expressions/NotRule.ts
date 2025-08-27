import { check, matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import NotNode from '../../nodes/NotNode';
import tokens from '../../tokens';

@RegisterRule('Not')
class NotRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    if (check(tokens.Not, tokenStream.current())) {
      matchAndMove(tokens.Not, tokenStream);
      return new NotNode(
        null,
        getRule('BoolFactor').parse(tokenStream, symbolTable, undefined)
      );
    }

    return getRule('BoolTerm').parse(tokenStream, symbolTable, undefined);
  }
}

export default NotRule;
