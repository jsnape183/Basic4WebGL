import { check, matchAndMove } from '../../../../compiler/rulesHelper';
import TokenStream from '../../../../compiler/tokenStream';
import IParserRule, { RegisterParserRule } from '../../../../parser/ParserRule';
import { getParserRule } from '../../../../parser/parserRuleFactory';
import Symbols from '../../../../symbols';
import { Tree } from '../../../../tree';
import RelationNode from '../../../nodes/RelationNode';
import { relOps } from '../../../parserConfig';

@RegisterParserRule('Relation')
class RelationRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const left = getParserRule('Expression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    if (!check(relOps, tokenStream.current())) return left;

    matchAndMove(relOps, tokenStream);
    return new RelationNode(tokenStream.prev().text, [
      left,
      getParserRule('Expression').parse(tokenStream, symbolTable, undefined),
    ]);
  }
}

export default RelationRule;
