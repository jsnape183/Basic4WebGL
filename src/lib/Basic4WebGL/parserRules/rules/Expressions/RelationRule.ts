import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import RelationNode from '@Basic4WebGL/nodes/RelationNode';
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
