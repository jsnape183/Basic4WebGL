import { check, matchAndMove } from '../../compiler/rulesHelper';
import TokenStream from '../../compiler/tokenStream';
import IParserRule, { RegisterRule } from '../../parser/ParserRule';
import Symbols from '../../symbols';
import { Tree } from '../../tree';
import tokens from '../tokens';
import { getRule } from '../../parser/ruleFactory';
import { symbolTypes } from '../symbolTypes';
import InNode from '../nodes/InNode';
import ToNode from '../nodes/ToNode';

@RegisterRule('ForExpression')
class ForExpressionRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();
    symbolTable.add(name, symbolTypes.Variable);
    if (check(tokens.In, tokenStream.current())) {
      matchAndMove(tokens.In, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const iterator = tokenStream.prev().text;
      return new InNode({ var: name, iterator }, []);
    }
    matchAndMove(tokens.Equals, tokenStream);
    const startExpr = getRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(tokens.To, tokenStream);
    const endExpr = getRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new ToNode(name, [startExpr, endExpr]);
  }
}

export default ForExpressionRule;
