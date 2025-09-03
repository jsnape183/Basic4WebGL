import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import { symbolTypes } from '../../symbolTypes';
import InNode from '../../nodes/InNode';
import ToNode from '../../nodes/ToNode';
import builtInTypes from '../../builtInTypes';

@RegisterParserRule('ForExpression')
class ForExpressionRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();
    const forSymbol = symbolTable.add(
      name,
      symbolTypes.Variable,
      symbolTable.getScope(),
      builtInTypes.Number
    );
    if (check(tokens.In, tokenStream.current())) {
      matchAndMove(tokens.In, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const iterator = tokenStream.prev().text;
      return new InNode({ var: name, iterator }, []);
    }
    matchAndMove(tokens.Equals, tokenStream);
    const startExpr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    matchAndMove(tokens.To, tokenStream);
    const endExpr = getParserRule('BoolExpression').parse(
      tokenStream,
      symbolTable,
      undefined
    );
    return new ToNode(forSymbol, [startExpr, endExpr]);
  }
}

export default ForExpressionRule;
