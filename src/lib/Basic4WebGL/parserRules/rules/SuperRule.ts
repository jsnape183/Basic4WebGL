import { check, matchAndMove } from '@CompilerLib/parser/rulesHelper';
import TokenStream from '@CompilerLib/lexer/tokens/tokenStream';
import IParserRule, {
  RegisterParserRule,
} from '@CompilerLib/parser/ParserRule';
import Symbols from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import { scopeTypes, symbolTypes } from '../../symbolTypes';
import tokens from '../../tokens';
import { getParserRule } from '@CompilerLib/parser/parserRuleFactory';
import SuperConstructorCallNode from '../../nodes/SuperConstructorCallNode';
import SuperMethodCallNode from '../../nodes/SuperMethodCallNode';
import { CompilationError } from '@CompilerLib/errors';
import { newLines } from '../../parserConfig';

@RegisterParserRule('Super')
class SuperRule implements IParserRule {
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

    if (check(tokens.OpenParen, tokenStream.current())) {
      // super(args) — constructor call
      const scopeType = symbolTable.getScopeType();
      if (scopeType !== scopeTypes.Constructor) {
        throw new CompilationError("super() can only be called in a constructor");
      }
      // '__supercall__' is a parse-phase sentinel — never emitted, only prevents duplicate super() calls
      if (symbolTable.check('__supercall__', symbolTypes.Variable)) {
        throw new CompilationError('super() called more than once in constructor');
      }
      symbolTable.add('__supercall__', symbolTypes.Variable);
      const args = getParserRule('ExpressionList').parse(tokenStream, symbolTable, undefined);
      matchAndMove(newLines, tokenStream);
      return new SuperConstructorCallNode({ parentName }, args, loc);
    }

    if (check(tokens.Dot, tokenStream.current())) {
      // super.method(args)
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
      matchAndMove(newLines, tokenStream);
      return new SuperMethodCallNode({ parentName, methodName }, args, loc);
    }

    throw new CompilationError("Expected '(' or '.' after 'super'");
  }
}

export default SuperRule;
