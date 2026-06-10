import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import PropertyAssignNode from '../../nodes/PropertyAssignNode';
import PropertyMethodCallNode from '../../nodes/PropertyMethodCallNode';
import { newLines } from '../../parserConfig';
import { CompilationError } from '@CompilerLib/errors';
import { scopeTypes, symbolTypes } from '../../symbolTypes';

function assertInsideClass(symbolTable: Symbols): void {
  const scopeType = symbolTable.getScopeType();
  if (scopeType !== scopeTypes.Function && scopeType !== scopeTypes.Constructor) {
    throw new CompilationError("'self' can only be used inside a class method or constructor");
  }
  const fullScope = symbolTable.getFullScopeName();
  const topName = fullScope.split('.')[0];
  if (!topName || !symbolTable.check(topName, symbolTypes.Class)) {
    throw new CompilationError("'self' can only be used inside a class");
  }
}

@RegisterParserRule('Self')
class SelfRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    assertInsideClass(symbolTable);

    matchAndMove(tokens.Self, tokenStream);
    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const memberName = tokenStream.prev().text.toLowerCase();

    if (check(tokens.OpenParen, tokenStream.current())) {
      // self.method(args)
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      matchAndMove(newLines, tokenStream);
      return new PropertyMethodCallNode(`this.${memberName}`, args, loc);
    }

    // self.property = expr
    matchAndMove(tokens.Equals, tokenStream);
    const expr = getParserRule('BoolExpression').parse(tokenStream, symbolTable, undefined);
    matchAndMove(newLines, tokenStream);
    return new PropertyAssignNode({ chain: `this.${memberName}` }, expr, loc);
  }
}

export default SelfRule;
