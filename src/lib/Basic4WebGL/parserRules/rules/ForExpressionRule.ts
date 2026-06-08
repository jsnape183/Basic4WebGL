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
    const loc = tokenStream.current().loc();
    matchAndMove(tokens.Variable, tokenStream);
    const name = tokenStream.prev().text.toLowerCase();
    const currentScope = symbolTable.getScope();
    const currentFullScope = symbolTable.getFullScopeName();
    const forSymbol = symbolTable.check(name, symbolTypes.Variable, currentScope, currentFullScope)
      ? symbolTable.get(name, symbolTypes.Variable, currentScope, currentFullScope)
      : symbolTable.add(name, symbolTypes.Variable, currentScope, builtInTypes.Number);
    if (check(tokens.In, tokenStream.current())) {
      matchAndMove(tokens.In, tokenStream);
      matchAndMove(tokens.Variable, tokenStream);
      const iterator = tokenStream.prev().text;
      return new InNode({ var: name, iterator }, [], loc);
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
    return new ToNode(forSymbol, [startExpr, endExpr], loc);
  }
}

export default ForExpressionRule;
