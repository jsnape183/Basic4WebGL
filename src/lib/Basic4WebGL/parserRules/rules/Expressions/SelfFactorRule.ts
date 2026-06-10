import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import tokens from '@Basic4WebGL/tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import PropertyTermNode from '@Basic4WebGL/nodes/PropertyTermNode';
import PropertyMethodTermNode from '@Basic4WebGL/nodes/PropertyMethodTermNode';
import { CompilationError } from '@CompilerLib/errors';
import { scopeTypes, symbolTypes } from '@Basic4WebGL/symbolTypes';

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

@RegisterParserRule('SelfFactor')
class SelfFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();
    assertInsideClass(symbolTable);

    matchAndMove(tokens.Self, tokenStream);
    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const memberName = tokenStream.prev().text.toLowerCase();

    if (check(tokens.OpenParen, tokenStream.current())) {
      // self.method(args) in expression context
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      return new PropertyMethodTermNode(`this.${memberName}`, args, loc);
    }

    // self.property in expression context
    return new PropertyTermNode(`this.${memberName}`, loc);
  }
}

export default SelfFactorRule;
