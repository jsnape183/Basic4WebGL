import { check, matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../parser/ParserRule';
import { getParserRule } from '../../../parser/parserRuleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import NotNode from '../../nodes/NotNode';
import tokens from '../../tokens';

@RegisterParserRule('Not')
class NotRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    if (check(tokens.Not, tokenStream.current())) {
      matchAndMove(tokens.Not, tokenStream);
      return new NotNode(
        null,
        getParserRule('BoolFactor').parse(tokenStream, symbolTable, undefined)
      );
    }

    return getParserRule('BoolTerm').parse(tokenStream, symbolTable, undefined);
  }
}

export default NotRule;
