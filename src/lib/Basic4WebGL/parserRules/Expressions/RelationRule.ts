import { check, matchAndMove } from '../../../compiler/rulesHelper';
import TokenStream from '../../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../../parser/ParserRule';
import { getRule } from '../../../parser/ruleFactory';
import Symbols from '../../../symbols';
import { Tree } from '../../../tree';
import RelationNode from '../../nodes/RelationNode';
import { relOps } from '../../parserConfig';

@RegisterRule('Relation')
class RelationRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const left = getRule('Expression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    if (!check(relOps, tokenStream.current())) return left;

    matchAndMove(relOps, tokenStream);
    return new RelationNode(tokenStream.prev().text, [
      left,
      getRule('Expression').parse(tokenStream, symbolTable, undefined),
    ]);
  }
}

export default RelationRule;
