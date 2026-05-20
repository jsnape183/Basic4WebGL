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
import Token from '@CompilerLib/lexer/tokens/Token';
import tokens from '@Basic4WebGL/tokens';
import BoolEqualNode from '@Basic4WebGL/nodes/BoolEqualNode';
import BoolNotEqualNode from '@Basic4WebGL/nodes/BoolNotEqualNode';
import BoolGreaterThanNode from '@Basic4WebGL/nodes/BoolGreaterThanNode';
import BoolGreaterThanEqualToNode from '@Basic4WebGL/nodes/BoolGreaterThanEqualToNode';
import BoolLessThanNode from '@Basic4WebGL/nodes/BoolLessThanNode';
import BoolLessThanEqualToNode from '@Basic4WebGL/nodes/BoolLessThanEqualToNode';
import { CompilationError } from '@CompilerLib/errors';

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
    return this.getRelationNode(
      tokenStream.prev(),
      left,
      getParserRule('Expression').parse(tokenStream, symbolTable, undefined)
    );
  }

  getRelationNode(token: Token, left, right): Tree {
    switch (token.token.value) {
      case tokens.Equals.value:
        return new BoolEqualNode(left, right);
      case tokens.NotEquals.value:
        return new BoolNotEqualNode(left, right);
      case tokens.GreaterThan.value:
        return new BoolGreaterThanNode(left, right);
      case tokens.GreaterThanEqualTo.value:
        return new BoolGreaterThanEqualToNode(left, right);
      case tokens.LessThan.value:
        return new BoolLessThanNode(left, right);
      case tokens.LessThanEqualTo.value:
        return new BoolLessThanEqualToNode(left, right);
      default:
        throw new CompilationError(
          `Expected =, <>, <, >, <= or >= found ${token.token.value}`
        );
    }
  }
}

export default RelationRule;
