import { matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { symbolTypes } from '../../../symbolTypes';
import tokens from '@Basic4WebGL/tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import SuperMethodTermNode from '@Basic4WebGL/nodes/SuperMethodTermNode';
import { CompilationError } from '@CompilerLib/errors';

@RegisterParserRule('SuperFactor')
class SuperFactorRule implements IParserRule {
  parse(tokenStream: TokenStream, symbolTable: Symbols): Tree {
    const loc = tokenStream.current().loc();

    const fullScope = symbolTable.getFullScopeName();
    const className = fullScope.split('.')[0];

    if (!className || !symbolTable.check(className, symbolTypes.Class)) {
      throw new CompilationError("'super' can only be used inside a class");
    }

    const classSymbol = symbolTable.get(className, symbolTypes.Class);
    const parentName = classSymbol.parentClassName;
    if (!parentName) {
      throw new CompilationError(
        `'super' used in class '${className}' which has no parent`
      );
    }

    matchAndMove(tokens.Super, tokenStream);
    matchAndMove(tokens.Dot, tokenStream);
    matchAndMove(tokens.Variable, tokenStream);
    const methodName = tokenStream.prev().text.toLowerCase();

    try {
      symbolTable.getInScope(methodName, symbolTypes.Function, parentName);
    } catch {
      throw new CompilationError(
        `'${methodName}' is not defined on parent class '${parentName}'`
      );
    }

    const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
    return new SuperMethodTermNode({ parentName, methodName }, args, loc);
  }
}

export default SuperFactorRule;
